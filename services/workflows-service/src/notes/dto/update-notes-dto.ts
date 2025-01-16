import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    required: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isImportant?: boolean;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    required: false,
    type: Array,
  })
  @IsArray()
  @IsOptional()
  attachments?: string[];

  @ApiProperty({
    required: false,
    type: Array,
  })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  status?: string; // Allow updating the status (e.g., to archive or delete)
}
