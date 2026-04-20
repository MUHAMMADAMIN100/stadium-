import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Post('cancel')
  cancel(@Body() dto: CancelBookingDto) {
    return this.bookings.cancel(dto);
  }
}
