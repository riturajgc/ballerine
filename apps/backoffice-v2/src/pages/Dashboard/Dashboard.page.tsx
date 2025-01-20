import React, { FunctionComponent } from 'react';
import { UserStatistics } from '@/pages/Statistics/components/UserStatistics/UserStatistics';
import { PortfolioRiskStatistics } from '@/pages/Statistics/components/PortfolioRiskStatistics/PortfolioRiskStatistics';
import { WorkflowStatistics } from '@/pages/Statistics/components/WorkflowStatistics/WorkflowStatistics';
import { Loader2 } from 'lucide-react';
import { useHomeMetricsQuery } from '@/domains/metrics/hooks/queries/useHomeMetricsQuery/useHomeMetricsQuery';
import { useDashboardMetricsQuery } from '@/domains/metrics/hooks/queries/useDashboardMetricsQuery/useDashboardMetricsQuery';
import { TopRowCards } from './components/TopRowCards/TopRowCards';
import { DeepWorkflowData } from './components/DeepWorkflowData/DeepWorkflowData';

export const Dashboard: FunctionComponent = () => {
  const { data, isLoading, error } = useHomeMetricsQuery();
  const { data: dashData } = useDashboardMetricsQuery();

  if (error) {
    throw error;
  }

  if (isLoading || !data) {
    return <Loader2 className={'w-4 animate-spin'} />;
  }

  return (
    <div>
      <h1 className={'pb-5 text-2xl font-bold'}>Dashboard</h1>
      <div className={'flex flex-col space-y-8'}>
        {/*<UserStatistics fullName={'Sofia Johnson'} />*/}
        <TopRowCards
          tat={20}
          countByStatus={dashData?.countByStatus || []}
          countBycategory={dashData?.countByCategory || []}
        />
        <DeepWorkflowData dailyTickets={dashData?.dailyCount || []} countByWorkflow={dashData?.countByWorkflow || []}/>
        {/*<WorkflowStatistics />*/}
      </div>
    </div>
  );
};
