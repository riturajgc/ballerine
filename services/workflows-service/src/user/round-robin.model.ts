import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class UserDetails {
  @ApiProperty({
    description: 'The unique identifier of the user.',
    type: String,
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'The serial number assigned to the user.',
    type: Number,
  })
  @IsNumber()
  serialNumber!: number;
}

export class RoundRobinModel {
  @ApiProperty({
    description: 'The type of round-robin entry.',
    enum: ['lead', 'ticket'],
    required: true,
  })
  @IsString()
  @IsEnum(['lead', 'ticket'])
  type!: 'lead' | 'ticket';

  @ApiProperty({
    description: 'The unique identifier of the user.',
    type: String,
    required: true,
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'The serial number for the round-robin entry.',
    type: Number,
    required: true,
  })
  @IsNumber()
  serialNumber!: number;

  @ApiProperty({
    description: 'A list of user details associated with the round-robin.',
    type: [UserDetails],
  })
  @IsArray()
  @Type(() => UserDetails)
  userList!: UserDetails[];

  @ApiProperty({
    description: 'The total number of entries in the round-robin.',
    type: Number,
    required: true,
  })
  @IsNumber()
  total!: number;
}
