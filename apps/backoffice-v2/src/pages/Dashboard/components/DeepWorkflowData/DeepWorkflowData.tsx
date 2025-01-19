import React, { FunctionComponent } from 'react';
import { useWorkflowStatisticsLogic } from '@/pages/Statistics/components/WorkflowStatistics/hooks/useWorkflowStatisticsLogic/useWorkflowStatisticsLogic';
import { CasesPendingManualReview } from '@/pages/Statistics/components/WorkflowStatistics/components/CasesPendingManualReview/CasesPendingManualReview';
import { ResolvedCasesByMonth } from '@/pages/Statistics/components/WorkflowStatistics/components/ResolvedCasesByMonth/ResolvedCasesByMonth';
import { ActiveCases } from '@/pages/Statistics/components/WorkflowStatistics/components/ActiveCases/ActiveCases';
import { AssignedCasesByUser } from '@/pages/Statistics/components/WorkflowStatistics/components/AssignedCasesByUser/AssignedCasesByUser';
import { DailyTickets } from '../DailyTickets/DailyTickets';
import { HSL_PIE_COLORS } from '@/pages/Statistics/constants';
import { WorkflowDeepDataCard } from '../WorkflowDeepDataCard/WorkflowDeepDataCard';

interface IDeepWorkflowDataProps {
  dailyTickets?: {
    date: string;
    count: number;
  }[];
  countByWorkflow: {
    workflowDefinitionId: string;
    count: number;
    status: string;
  }[];
}

export const DeepWorkflowData: FunctionComponent<IDeepWorkflowDataProps> = (
  props: IDeepWorkflowDataProps,
) => {
  const { dailyTickets, countByWorkflow } = props;

  const onboardingFilters = [
    {
      id: 'completed',
      name: 'Completed',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'completed' && workflow.workflowDefinitionId === 'sr-onboarding',
        )?.count ?? 0,
    },
    {
      id: 'active',
      name: 'Active',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'active' && workflow.workflowDefinitionId === 'sr-onboarding',
        )?.count ?? 0,
    },
    {
      id: 'failed',
      name: 'Failed',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'failed' && workflow.workflowDefinitionId === 'sr-onboarding',
        )?.count ?? 0,
    },
  ];

  const transactionFilters = [
    {
      id: 'completed',
      name: 'Completed',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'completed' && workflow.workflowDefinitionId === 'sr-transaction',
        )?.count ?? 0,
    },
    {
      id: 'active',
      name: 'Active',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'active' && workflow.workflowDefinitionId === 'sr-transaction',
        )?.count ?? 0,
    },
    {
      id: 'failed',
      name: 'Failed',
      value:
        countByWorkflow.find(
          workflow =>
            workflow.status === 'failed' && workflow.workflowDefinitionId === 'sr-transaction',
        )?.count ?? 0,
    },
  ];

  const transactionFiltersWithColor = transactionFilters.map((filter, index) => ({
    ...filter,
    color: HSL_PIE_COLORS[index] ?? HSL_PIE_COLORS[0],
  }));

  const onboardingFiltersWithColor = onboardingFilters.map((filter, index) => ({
    ...filter,
    color: HSL_PIE_COLORS[index] ?? HSL_PIE_COLORS[0],
  }));

  return (
    <div>
      <div className={'grid grid-cols-3 gap-6'}>
        <DailyTickets dailyTickets={dailyTickets} />
        <div className={'grid grid-cols-2 gap-3'}>
          <WorkflowDeepDataCard
            filtersWithColor={onboardingFiltersWithColor}
            title="Onboarding Tickets"
            total={33}
          />
          <WorkflowDeepDataCard
            filtersWithColor={transactionFiltersWithColor}
            title="Transaction Tickets"
            total={33}
          />
        </div>
        {/*<AssignedCasesByUser assignees={assignees} />*/}
      </div>
    </div>
  );
};
