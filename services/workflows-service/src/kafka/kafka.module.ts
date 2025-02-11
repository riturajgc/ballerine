import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaMessageService } from './kafka-message.service';
import { CaseManagementService } from '@/case-management/case-management.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { CaseManagementModule } from '@/case-management/case-management.module';
import { WorkflowModule } from '@/workflow/workflow.module';
import { UserModule } from '@/user/user.module';
import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '@/workflow/workflow.service';

@Module({
  providers: [
    KafkaService,
    KafkaMessageService,
    PrismaClient,
    CaseManagementService,
  ],
  exports: [KafkaService, KafkaMessageService],
  imports: [PrismaModule, CaseManagementModule, WorkflowModule, UserModule]
})
export class KafkaModule {}
