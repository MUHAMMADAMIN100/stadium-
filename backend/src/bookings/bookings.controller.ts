import { Body, Controller, Get, Post, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval, map, merge } from 'rxjs';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get('today')
  today() {
    return this.bookings.listToday();
  }

  @Get('week')
  week() {
    return this.bookings.listWeek();
  }

  @Get('range')
  range(@Query('from') from: string, @Query('to') to: string) {
    return this.bookings.listRange(from, to);
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    const events$ = this.bookings.stream.pipe(
      map((event) => ({ type: event.type, data: event } as MessageEvent)),
    );
    // Heartbeat every 25s to keep proxies (Vercel/Railway) from closing the connection
    const heartbeat$ = interval(25_000).pipe(
      map(() => ({ type: 'ping', data: { t: Date.now() } } as MessageEvent)),
    );
    return merge(events$, heartbeat$);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Post('cancel')
  cancel(@Body() dto: CancelBookingDto) {
    return this.bookings.cancel(dto);
  }
}
