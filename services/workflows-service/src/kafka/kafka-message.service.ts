import { CaseManagementService } from '@/case-management/case-management.service';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { KafkaMessage } from './types/kafka-message';
import { KafkaMessageFlow } from './enums/kafka-message-flow.enum';
import { WorkflowActionEvent } from './enums/workflow-action-event.enum';
import { WorkflowService } from '@/workflow/workflow.service';

@Injectable()
export class KafkaMessageService {
  constructor(
    private readonly caseManagementService: CaseManagementService,
    private readonly prismaClient: PrismaClient,
    private readonly workflowService: WorkflowService,
  ) { }

  private async getEndUserByIdentifier(identifier: string) {
    return this.prismaClient.endUser.findFirst({ where: { correlationId: identifier } });
  }

  private async getExistingWorkflowRun(endUserId: string, workflowDefinitionId: string, projectId: string) {
    return this.prismaClient.workflowRuntimeData.findFirst({
      where: { endUserId, workflowDefinitionId, projectId },
    });
  }

  private async handleWorkflowEvent(event: string, workflowId: string, projectId: string) {
    console.log('Changing state:', event);
    await this.workflowService.event({ name: event, id: workflowId }, [projectId], projectId);
  }

  private buildWorkflowDto(
    workflowDefinitionId: string,
    entityId: string,
    data: any,
    existingRunTime?: any
  ): any {
    const baseContext = {
      id: entityId,
      entity: {
        id: entityId,
        type: 'individual',
        data: data || {},
      },
      documents: [],
    };

    if (existingRunTime) {
      return {
        workflowId: workflowDefinitionId,
        ...existingRunTime,
        context: {
          ...existingRunTime.context,
          entity: {
            ...existingRunTime.context.entity,
            data: { ...existingRunTime.context.entity.data, ...data },
          },
          documents: [...existingRunTime.context.documents],
        },
        metadata: {},
      };
    }
    
    return { workflowId: workflowDefinitionId, context: baseContext, metadata: {} };
  }

  async handleMessage(messageValue: KafkaMessage, messageKey: any) {
    messageValue = JSON.parse(messageValue as any) as KafkaMessage;
    if (!this.validateMessage(messageValue)) {
      console.error('Invalid message:', messageValue);
      return;
    }
    console.log('Valid message:', messageValue);
    switch (messageValue.type) {
      case 'sr-onboarding':
        console.log('Handling sr-onboarding message:', messageValue);
        await this.handleOnboardingMessages(messageValue);
        break;
      case 'sr-transaction':
        console.log('Handling sr-transaction message:', messageValue);
        await this.handleTransactionMessages(messageValue);
        break;
      default:
        console.log('Other cases handling');
        break;
    }
  }

  async handleOnboardingMessages(messageValue: KafkaMessage) {
    const workflowDefinitionId = 'sr-onboarding';
    const projectId = 'project-1';
    const entityId = messageValue.identifier;
    const data = messageValue.data;
    
    const endUser = await this.getEndUserByIdentifier(entityId);
    let existingRunTime = endUser ? await this.getExistingWorkflowRun(endUser.id, workflowDefinitionId, projectId) : null;
    
    if (existingRunTime && messageValue.event) {
      await this.handleWorkflowEvent(messageValue.event, existingRunTime.id, projectId);
    }

    const workflowRunDto = this.buildWorkflowDto(workflowDefinitionId, entityId, data, existingRunTime);

    try {
      await this.caseManagementService.create(workflowRunDto, [projectId], projectId);
    } catch (err) {
      console.error('Error while creating workflow:', err);
    }
  }

  async handleTransactionMessages(messageValue: KafkaMessage) {
    const workflowDefinitionId = 'sr-transaction';
    const projectId = 'project-1';
    const entityId = messageValue.identifier;
    const data = messageValue.data;

    const endUser = await this.getEndUserByIdentifier(entityId);
    const existingRunTime = endUser ? await this.getExistingWorkflowRun(endUser.id, workflowDefinitionId, projectId) : null;
    
    if (existingRunTime && messageValue.event) {
      await this.handleWorkflowEvent(messageValue.event, existingRunTime.id, projectId);
    }

    const workflowRunDto = this.buildWorkflowDto(workflowDefinitionId, entityId, data, existingRunTime);

    try {
      await this.caseManagementService.create(workflowRunDto, [projectId], projectId);
    } catch (err) {
      console.error('Error while creating workflow:', err);
    }
  }

  validateMessage(messageValue: KafkaMessage) {
    let isValid = true;
    if (!messageValue.identifier) {
      isValid = false;
    }
    if (!messageValue.type) {
      isValid = false;
    }
    if (!messageValue.flow) {
      isValid = false;
    }
    if (messageValue.flow && !Object.values(KafkaMessageFlow).includes(messageValue?.flow)) {
      isValid = false;
    }
    if (messageValue.files && !Array.isArray(messageValue.files)) {
      isValid = false;
    }
    if (messageValue.event && !Object.values(WorkflowActionEvent).includes(messageValue?.event)) {
      isValid = false;
    }
    return isValid;
  }
}
