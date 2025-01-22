import { CaseManagementService } from '@/case-management/case-management.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import  { PrismaClient } from '@prisma/client';

@Injectable()
export class KafkaMessageService {
  constructor(
    private readonly caseManagementService: CaseManagementService,
    private readonly prismaClient: PrismaClient
  ) {}

  async handleMessage(messageValue: any, messageKey: any) {
    console.log('Handling message:', messageValue);
    if (!this.validateMessage(messageValue)) {
      console.error('Invalid message:', messageValue);
      return;
    }
    console.log('Valid message:', messageValue);
    switch (messageValue.type) {
      case 'sr-onboarding':
        console.log('Handling sr-onboarding message:', messageValue);
        break;
      case 'sr-transaction':
        console.log('Handling sr-transaction message:', messageValue);
        break;
      default:
        console.log('Other cases handling');
        break;
    }
  }

  async handleOnboardingMessages(messageValue: any) {
    const workflowDefinitionId = 'sr-onboarding';
    const entityId = messageValue.identifier;
    const projectId = 'project-1';
    const files = messageValue.files;
    const data = messageValue.data;
    const existingRunTime = await this.prismaClient.workflowRuntimeData.findUnique({
      where: {
        endUserId: entityId,
        workflowDefinitionId,
        projectId,
      },
    });

    //let workflowRunDto = {
    //  workflowId: workflowDefinitionId,
    //  context: {
    //    id: entityId,
    //    entity: {
    //      id: entityId,
    //      type: 'individual',
    //      data: data ? data : {},
    //    },
    //    documents: files ? files : [],
    //  },
    //  metadata: {},
    //};

    //if (existingRunTime) {
    //  workflowRunDto = {
    //    ...existingRunTime!,
    //    context: {
    //      ...existingRunTime.context!,
    //      entity: {
    //        ...existingRunTime.context.entity!,
    //        data: {
    //          ...existingRunTime.context.entity.data!,
    //          ...(data && data),
    //        },
    //      },
    //      documents: [...existingRunTime.context.documents!, ...(files && files)],
    //    },
    //    metadata: {},
    //  };
    //}

    //try {
    //  const result = await this.caseManagementService.create(
    //    workflowRunDto,
    //    [projectId],
    //    projectId,
    //  );
    //} catch (err) {
    //  console.error('Error while creating workflow:', err);
    //}
  }

  validateMessage(messageValue: any) {
    let isValid = true;
    if (!messageValue.identifier) {
      isValid = false;
    }
    if (!messageValue.type) {
      isValid = false;
    }
    return isValid;
  }
}
