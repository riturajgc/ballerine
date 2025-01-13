import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ensure PrismaService is set up
import { Prisma } from '@prisma/client';
import { WorkflowRuntimeDataRepository } from '@/workflow/workflow-runtime-data.repository';

@Injectable()
export class WorkflowRunTimeHistoryService {
  constructor(
    private prisma: PrismaService,
  ) {
  }

  async create(data: Prisma.WorkflowRunTimeHistoryCreateInput) {
    return this.prisma.workflowRunTimeHistory.create({ data });
  }

  async findAll() {
    return this.prisma.workflowRunTimeHistory.findMany();
  }

  async findOne(id: string) {
    return this.prisma.workflowRunTimeHistory.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.WorkflowRunTimeHistoryUpdateInput) {
    return this.prisma.workflowRunTimeHistory.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.workflowRunTimeHistory.delete({ where: { id } });
  }
}
