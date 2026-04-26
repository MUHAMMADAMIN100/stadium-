import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

const SLOT_MS = 60 * 60 * 1000;
const TJ_OFFSET_MS = 5 * 60 * 60 * 1000; // Asia/Dushanbe UTC+5

// Returns midnight of the given date in Tajikistan time, expressed as UTC
function startOfTjDay(date: Date): Date {
  const tjMs = date.getTime() + TJ_OFFSET_MS;
  const tjMidnightMs = Math.floor(tjMs / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  return new Date(tjMidnightMs - TJ_OFFSET_MS);
}

function alignToHourUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

function generateCancelCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export type BookingEvent =
  | { type: 'created'; booking: { id: string; customerName: string; startAt: string; endAt: string } }
  | { type: 'cancelled'; booking: { id: string; startAt: string; endAt: string } };

@Injectable()
export class BookingsService {
  private readonly events$ = new Subject<BookingEvent>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  get stream() {
    return this.events$.asObservable();
  }

  async listRange(fromIso: string, toIso: string) {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      throw new BadRequestException('Invalid date range');
    }
    const rows = await this.prisma.booking.findMany({
      where: { startAt: { gte: from, lt: to } },
      orderBy: { startAt: 'asc' },
    });
    return rows.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
    }));
  }

  async listToday() {
    const start = startOfTjDay(new Date());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return this.listRange(start.toISOString(), end.toISOString());
  }

  async listWeek() {
    const start = startOfTjDay(new Date());
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.listRange(start.toISOString(), end.toISOString());
  }

  async create(dto: CreateBookingDto) {
    const startAt = alignToHourUtc(new Date(dto.startAt));
    const now = new Date();
    if (startAt.getTime() < now.getTime() - SLOT_MS) {
      throw new BadRequestException('Cannot book a past hour');
    }
    const endAt = new Date(startAt.getTime() + SLOT_MS);
    const cancelCode = generateCancelCode();

    try {
      const booking = await this.prisma.booking.create({
        data: {
          customerName: dto.customerName.trim(),
          phone: dto.phone.trim(),
          startAt,
          endAt,
          cancelCode,
        },
      });

      this.telegram
        .notifyNewBooking({
          customerName: booking.customerName,
          phone: booking.phone,
          startAt: booking.startAt,
          endAt: booking.endAt,
          cancelCode: booking.cancelCode,
        })
        .catch(() => undefined);

      this.events$.next({
        type: 'created',
        booking: {
          id: booking.id,
          customerName: booking.customerName,
          startAt: booking.startAt.toISOString(),
          endAt: booking.endAt.toISOString(),
        },
      });

      return {
        id: booking.id,
        customerName: booking.customerName,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
        cancelCode: booking.cancelCode,
      };
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException('This time slot is already booked');
      }
      throw err;
    }
  }

  async cancel(dto: CancelBookingDto) {
    const normalizedPhone = dto.phone.trim();
    const booking = await this.prisma.booking.findFirst({
      where: { cancelCode: dto.cancelCode, phone: normalizedPhone },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found or code/phone do not match');
    }

    await this.prisma.booking.delete({ where: { id: booking.id } });

    this.telegram
      .notifyCancellation({
        customerName: booking.customerName,
        phone: booking.phone,
        startAt: booking.startAt,
        endAt: booking.endAt,
      })
      .catch(() => undefined);

    this.events$.next({
      type: 'cancelled',
      booking: {
        id: booking.id,
        startAt: booking.startAt.toISOString(),
        endAt: booking.endAt.toISOString(),
      },
    });

    return { ok: true };
  }
}
