import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';
import type { InputJsonValue } from '../../types';
import { UserStatus } from '@prisma/client';

export class UserUpdateDto {
  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    required: false,
    type: UserStatus,
  })
  @IsString()
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: InputJsonValue;
}
