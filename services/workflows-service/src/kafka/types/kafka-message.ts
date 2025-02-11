import { KafkaMessageFlow } from "../enums/kafka-message-flow.enum";
import { WorkflowActionEvent } from "../enums/workflow-action-event.enum";

export type KafkaMessage = {
    identifier: string;
    data: object;
    event?: WorkflowActionEvent;
    files?: string[];
    flow: KafkaMessageFlow;
    type: string;
}