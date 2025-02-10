import { KafkaMessageFlow } from "../enums/kafka-message-flow.enum";

export type KafkaMessage = {
    identifier: string;
    data: object;
    event?: string;
    files?: string[];
    flow: KafkaMessageFlow;
    type: string;
}