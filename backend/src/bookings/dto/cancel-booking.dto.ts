import { IsString, Matches, MinLength } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'cancelCode must be 6 digits' })
  cancelCode!: string;

  @IsString()
  @MinLength(6)
  phone!: string;
}
