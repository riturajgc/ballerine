import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowRunTimeHistoryController } from './workflow-run-time-history.controller';

describe('WorkflowRunTimeHistoryController', () => {
  let controller: WorkflowRunTimeHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowRunTimeHistoryController],
    }).compile();

    controller = module.get<WorkflowRunTimeHistoryController>(WorkflowRunTimeHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
