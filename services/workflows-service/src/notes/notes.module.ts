import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaClient } from '@prisma/client';
import { WorkflowRuntimeDataRepository } from '@/workflow/workflow-runtime-data.repository';

@Module({
  providers: [NotesService, PrismaClient],
  controllers: [NotesController]
})
export class NotesModule {}
