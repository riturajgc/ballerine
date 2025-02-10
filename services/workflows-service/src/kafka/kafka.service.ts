import { env } from '@/env';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { KafkaMessageService } from './kafka-message.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: any;
  private readonly topic = 'test_consumer';
  private readonly groupId = 'test_consumer_group';

  constructor(
    private readonly kafkaMessageService: KafkaMessageService,
  ) {
    console.log('KAFKA_BROKERS:', env.KAFKA_BROKERS);
    console.log('KAFKA_KEY:', env.KAFKA_KEY);
    console.log('KAFKA_SECRET:', env.KAFKA_SECRET);
    this.kafka = new Kafka({
      clientId: 'service-request-server',
      brokers: env.KAFKA_BROKERS ? env.KAFKA_BROKERS.split(",").map((broker: string)=> broker.trim()) : ['localhost:9092'],
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: env.KAFKA_KEY ?? '',
        password: env.KAFKA_SECRET ?? '',
      },
    });
  }

  async onModuleInit() {
    console.log('Connecting to Kafka broker...');
    this.consumer = this.kafka.consumer({ groupId: this.groupId });

    await this.consumer.connect();
    this.logger.log('Kafka consumer connected.');

    await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
    console.log('Subscribed to Kafka topic:', this.topic);

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: any) => {
        console.log('Received message:', message)
        const value = message.value.toString();
        const key = message.key.toString();
        this.handleKafkaMessage(value, key);
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected.');
  }

  handleKafkaMessage(messageValue: any, messageKey: any) {
    if(!messageValue) {
      return;
    }
    return this.kafkaMessageService.handleMessage(messageValue, messageKey);
  }
}
