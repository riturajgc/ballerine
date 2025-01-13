import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowRunTimeHistoryService } from './workflow-run-time-history.service';

describe('WorkflowRunTimeHistoryService', () => {
  let service: WorkflowRunTimeHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowRunTimeHistoryService],
    }).compile();

    service = module.get<WorkflowRunTimeHistoryService>(WorkflowRunTimeHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
