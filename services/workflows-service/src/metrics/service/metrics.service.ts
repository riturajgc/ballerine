import { MetricsRepository } from '@/metrics/repository/metrics.repository';
import { CasesResolvedInDay } from '@/metrics/repository/models/cases-resolved-daily.model';
import { MetricsUserModel } from '@/metrics/repository/models/metrics-user.model';
import { UserAssignedCasesStatisticModel } from '@/metrics/repository/models/user-assigned-cases-statistic.model';
import { UserResolvedCasesStatisticModel } from '@/metrics/repository/models/user-resolved-cases-statistic.model';
import { WorkflowDefinitionVariantsMetricModel } from '@/metrics/repository/models/workflow-definition-variants-metric.model';
import { WorkflowRuntimeStatisticModel } from '@/metrics/repository/models/workflow-runtime-statistic.model';
import { WorkflowRuntimeStatusCaseCountModel } from '@/metrics/repository/models/workflow-runtime-status-case-count.model';
import { FindUsersAssignedCasesStatisticParams } from '@/metrics/repository/types/find-users-assigned-cases-statistic.params';
import { FindUsersResolvedCasesStatisticParams } from '@/metrics/repository/types/find-users-resolved-cases-statistic.params';
import { GetRuntimeStatusCaseCountParams } from '@/metrics/repository/types/get-runtime-status-case-count.params';
import { ListUserCasesResolvedDailyParams } from '@/metrics/repository/types/list-user-cases-resolved-daily.params';
import { UserWorkflowProcessingStatisticModel } from '@/metrics/service/models/user-workflow-processing-statistic.model';
import { GetUserWorkflowProcessingStatisticParams } from '@/metrics/service/types/get-user-workflow-processing-statistic.params';
import type { TProjectId, TProjectIds } from '@/types';
import { Injectable } from '@nestjs/common';
import { Static } from '@sinclair/typebox';
import { HomeMetricsSchema } from '@/metrics/schemas/home-metrics.schema';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(
    private readonly metricsRepository: MetricsRepository,
    private readonly prismaClient: PrismaClient
  ) {}

  async getRuntimesStatusCaseCount(
    params: GetRuntimeStatusCaseCountParams,
    projectIds: TProjectIds,
  ): Promise<WorkflowRuntimeStatusCaseCountModel> {
    console.log('###projectIds### ', projectIds);
    return await this.metricsRepository.getRuntimeStatusCaseCount(params, projectIds);
  }

  async listRuntimesStatistic(projectIds: TProjectIds): Promise<WorkflowRuntimeStatisticModel[]> {
    console.log('###projectIds### ', projectIds);
    return await this.metricsRepository.findRuntimeStatistic(projectIds);
  }

  async listUsersAssignedCasesStatistic(
    params: FindUsersAssignedCasesStatisticParams,
    projectIds: TProjectIds,
  ): Promise<UserAssignedCasesStatisticModel[]> {
    return await this.metricsRepository.findUsersAssignedCasesStatistic(params, projectIds);
  }

  async listUsersResolvedCasesStatistic(
    params: FindUsersResolvedCasesStatisticParams,
    projectIds: TProjectIds,
  ): Promise<UserResolvedCasesStatisticModel[]> {
    return await this.metricsRepository.findUsersResolvedCasesStatistic(params, projectIds);
  }

  async getUserWorkflowProcessingStatistic(
    params: GetUserWorkflowProcessingStatisticParams,
    projectIds: TProjectIds,
  ): Promise<UserWorkflowProcessingStatisticModel> {
    const commonParams = {
      fromDate: params.fromDate,
    };

    const results = await Promise.all([
      this.metricsRepository.getUserApprovalRate(commonParams, projectIds),
      this.metricsRepository.getUserAverageAssignmentTime(commonParams, projectIds),
      this.metricsRepository.getUserAverageResolutionTime(commonParams, projectIds),
      this.metricsRepository.getUserAverageReviewTime(commonParams, projectIds),
    ]);

    const [
      approvalRateModel,
      averageAssignmentTimeModel,
      averageResolutionTimeModel,
      averageReviewTimeModel,
    ] = results;

    const statisticModel: UserWorkflowProcessingStatisticModel =
      new UserWorkflowProcessingStatisticModel();

    statisticModel.approvalRate = approvalRateModel?.approvalRate || '0';
    statisticModel.averageAssignmentTime = averageAssignmentTimeModel?.time || '0';
    statisticModel.averageResolutionTime = averageResolutionTimeModel?.time || '0';
    statisticModel.averageReviewTime = averageReviewTimeModel?.time || '0';

    return statisticModel;
  }

  async listUserCasesResolvedDaily(
    params: ListUserCasesResolvedDailyParams,
    projectIds: TProjectIds,
  ): Promise<CasesResolvedInDay[]> {
    return await this.metricsRepository.listCasesResolvedDaily(params, projectIds);
  }

  async listActiveUsers(projectIds: TProjectIds): Promise<MetricsUserModel[]> {
    return await this.metricsRepository.listUsers(projectIds);
  }

  async getWorkflowDefinitionVariantsMetric(
    projectIds: TProjectIds,
  ): Promise<WorkflowDefinitionVariantsMetricModel[]> {
    return await this.metricsRepository.getWorkflowDefinitionVariantsMetric(projectIds);
  }

  async getHomeMetrics(currentProjectId: TProjectId): Promise<Static<typeof HomeMetricsSchema>> {
    return {
      riskIndicators: await this.metricsRepository.getRiskIndicators(currentProjectId),
      reports: {
        all: await this.metricsRepository.getReportsByRiskLevel(currentProjectId),
        inProgress: await this.metricsRepository.getInProgressReportsByRiskLevel(currentProjectId),
        approved: await this.metricsRepository.getApprovedBusinessesReportsByRiskLevel(
          currentProjectId,
        ),
      },
    };
  }

  async getDashboardMetrics(currentProjectId: TProjectId, userId: string) {
    const user = await this.prismaClient.user.findUnique({
        where: {
          id: userId,
        },
      });
    if(!user) throw { status: 404, message: 'User not found' };

    const userRoles = user.roles as string[];
    const isManager = userRoles?.includes('manager');
    const metricsRequestAsync = [
        this.getDailyWorkflowRuntimeCount(10, currentProjectId, isManager, userId),
        this.getRuntimeCountByWorkflows(currentProjectId, isManager, userId),
        this.getRuntimeCountByStatus(currentProjectId, isManager, userId),
        this.getWorkflowSpecificCounts(currentProjectId, isManager, userId),
    ]
    const values = await Promise.all(metricsRequestAsync);
    return {
        dailyCount: values[0],
        countByCategory: values[1],
        countByStatus: values[2],
        countByWorkflow: values[3],
    };
  }

  async getDailyWorkflowRuntimeCount(span: number, projectId: string, isManager: boolean, userId: string) {
    const nDaysAgo = new Date();    
    nDaysAgo.setDate(nDaysAgo.getDate() - span);
    const userIdToUse = isManager ? null : userId;
    const runtimes = await this.prismaClient.workflowRuntimeData.groupBy({
        by: ['createdAt'],
        _count: {
          _all: true,
        },
        where: {
          createdAt: {
            gte: nDaysAgo,
          },
          projectId: projectId,
          OR: [
            { assigneeId: userIdToUse },
            { assigneeId: null },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const groupedByDate = runtimes.reduce((acc: Record<string, { date: string; count: number }>, runtime) => {
        const date = runtime.createdAt.toISOString().split('T')[0] as string;
        if (!acc[date]) acc[date!] = { date, count: 0 };
        acc[date]!.count += runtime._count._all;
        return acc;
      }, {});
      
    const finalResults = Object.values(groupedByDate);
    return finalResults;
  }

  async getRuntimeCountByWorkflows(projectId: string, isManager: boolean, userId: string) {
    const workflows = await this.prismaClient.workflowDefinition.findMany({
        where: {
          projectId: projectId,
        },
    });
    const runtimes = await this.prismaClient.workflowRuntimeData.groupBy({
        by: ['workflowDefinitionId'],
        _count: {
          _all: true,
        },
        orderBy: {
          workflowDefinitionId: 'asc',
        },
        where: {
            projectId: projectId,
            assigneeId: isManager ? undefined : userId,

        },
      });
    return runtimes.map((runtime) => {
        return {
            name: workflows.find((workflow)=> workflow.id === runtime.workflowDefinitionId)?.name,
            category: runtime.workflowDefinitionId,
            count: runtime._count._all,
    }});
  }

  async getRuntimeCountByStatus(projectId: string, isManager: boolean, userId: string) {
    const runtimes = await this.prismaClient.workflowRuntimeData.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
        orderBy: {
          status: 'asc',
        },
        where: {
            projectId: projectId,
            assigneeId: isManager ? undefined : userId,
        },
      });
    return runtimes.map((runtime) => {
        return {
            status: runtime.status,
            count: runtime._count._all,
    }});
  }

  async getWorkflowSpecificCounts(projectId: string, isManager: boolean, userId: string) {
    const runtimes = await this.prismaClient.workflowRuntimeData.groupBy({
        by: ['workflowDefinitionId', 'status'],
        _count: {
          _all: true,
        },
        orderBy: [
          { workflowDefinitionId: 'asc' },
          { status: 'asc' },
        ],
        where: {
          projectId: projectId,
          assigneeId: isManager ? undefined : userId,
        },
      });
      
      const formattedRuntimes = runtimes.map(runtime => ({
        workflowDefinitionId: runtime.workflowDefinitionId,
        status: runtime.status,
        count: runtime._count._all,
      }));      
      return formattedRuntimes;
  }
}
