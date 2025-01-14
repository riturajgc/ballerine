import { Module } from '@nestjs/common';
import { WorkflowRunTimeHistoryService } from './workflow-run-time-history.service';
import { WorkflowRunTimeHistoryController } from './workflow-run-time-history.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [PrismaClient, WorkflowRunTimeHistoryService],
  controllers: [WorkflowRunTimeHistoryController]
})
export class WorkflowRunTimeHistoryModule {}
