import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  newPassword!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  confirmNewPassword!: string;
}
