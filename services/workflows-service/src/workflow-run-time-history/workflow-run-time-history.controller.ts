import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { WorkflowRunTimeHistoryService } from './workflow-run-time-history.service';
import { Prisma } from '@prisma/client';

@Controller('/workflow-run-time-history')
export class WorkflowRunTimeHistoryController {
  constructor(private readonly service: WorkflowRunTimeHistoryService) {}

  @Post()
  async create(@Body() data: Prisma.WorkflowRunTimeHistoryCreateInput) {
    return this.service.create(data);
  }

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.WorkflowRunTimeHistoryUpdateInput) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
