import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  workflowRunTimeId!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  createdBy!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  description!: string;

  @ApiProperty({
    required: true,
    type: String,
  })
  @IsString()
  title!: string;

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
    type: String,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    required: false,
    type: Array,
  })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
