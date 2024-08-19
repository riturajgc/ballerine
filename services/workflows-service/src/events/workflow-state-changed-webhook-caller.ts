import { setTimeout } from 'timers/promises';
import { WorkflowEventEmitterService } from '@/workflow/workflow-event-emitter.service';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { AppLoggerService } from '@/common/app-logger/app-logger.service';
import { alertWebhookFailure } from '@/events/alert-webhook-failure';
import { ExtractWorkflowEventData } from '@/workflow/types';
import { getWebhooks, Webhook } from '@/events/get-webhooks';
import { sign } from '@/common/utils/sign/sign';
import { CustomerService } from '@/customer/customer.service';
import type { TAuthenticationConfiguration } from '@/customer/types';

@Injectable()
export class WorkflowStateChangedWebhookCaller {
  #__axios: AxiosInstance;

  constructor(
    private httpService: HttpService,
    workflowEventEmitter: WorkflowEventEmitterService,
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly customerService: CustomerService,
  ) {
    this.#__axios = this.httpService.axiosRef;

    workflowEventEmitter.on('workflow.state.changed', async data => {
      try {
        await this.handleWorkflowEvent(data);
      } catch (error) {
        console.error(error);
        alertWebhookFailure(error);
      }
    });
  }

  async handleWorkflowEvent(data: ExtractWorkflowEventData<'workflow.state.changed'>) {
    this.logger.log('handleWorkflowEvent:: 11 ', {
      state: data.state,
      entityId: data.entityId,
      correlationId: data.correlationId,
      id: data.runtimeData.id,
    });
    console.log('here s 1')
    const webhooks = getWebhooks(
      data.runtimeData.config,
      this.configService.get('ENVIRONMENT_NAME'),
      'workflow.state.changed',
    );
    console.log('here s 2')
    // Add a 5-second delay
    await setTimeout(5000);
    const customer = await this.customerService.getByProjectId(data.runtimeData.projectId, {
      select: {
        authenticationConfiguration: true,
      },
    });
    console.log('here s 3')
    const { webhookSharedSecret } =
      customer.authenticationConfiguration as TAuthenticationConfiguration;
      console.log('here s 4')
    for (const webhook of webhooks) {
      await this.sendWebhook({ data, webhook, webhookSharedSecret });
    }
    console.log('here s 5')
  }

  private async sendWebhook({
    data,
    webhook: { id, url, environment, apiVersion },
    webhookSharedSecret,
  }: {
    data: ExtractWorkflowEventData<'workflow.state.changed'>;
    webhook: Webhook;
    webhookSharedSecret: string;
  }) {
    this.logger.log('Sending webhook', { id, url });

    const payload = {
      id,
      eventName: 'workflow.state.changed',
      state: data.state,
      apiVersion,
      timestamp: new Date().toISOString(),
      workflowCreatedAt: data.runtimeData.createdAt,
      workflowResolvedAt: data.runtimeData.resolvedAt,
      workflowDefinitionId: data.runtimeData.workflowDefinitionId,
      workflowRuntimeId: data.runtimeData.id,
      ballerineEntityId: data.entityId,
      correlationId: data.correlationId,
      environment,
      data: data.runtimeData.context,
    };

    try {
      const res = await this.#__axios.post(url, payload, {
        headers: {
          'X-Authorization': webhookSharedSecret,
          'X-HMAC-Signature': sign({ payload, key: webhookSharedSecret }),
        },
      });

      this.logger.log('Webhook Result:', {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
      });
    } catch (error: Error | any) {
      this.logger.log('Webhook error data::  ', {
        state: data.state,
        entityId: data.entityId,
        correlationId: data.correlationId,
        id: data.runtimeData.id,
      });
      this.logger.error('Failed to send webhook', { id, message: error?.message, error });
      alertWebhookFailure(error);
    }
  }
}
