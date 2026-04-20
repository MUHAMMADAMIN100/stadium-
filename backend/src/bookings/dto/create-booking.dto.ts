import { IsISO8601, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  customerName!: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, { message: 'Invalid phone number' })
  phone!: string;

  @IsISO8601()
  startAt!: string;
}
