import { MetricsRepository } from '@/metrics/repository/metrics.repository';
import { MetricsService } from '@/metrics/service/metrics.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { MetricsController } from './metrics.controller';
import { PrismaClient } from '@prisma/client';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [MetricsController],
  imports: [PrismaModule, HttpModule],
  providers: [
    MetricsRepository,
    MetricsService,
    PrismaClient
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
