import { apiClient } from '@/common/api-client/api-client';
import { Method } from '@/common/enums';
import { handleZodError } from '@/common/utils/handle-zod-error/handle-zod-error';
import { useIsAuthenticated } from '@/domains/auth/context/AuthProvider/hooks/useIsAuthenticated/useIsAuthenticated';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

export const DashboardMetricsSOutputchema = z.object({
  dailyCount: z
    .array(
      z.object({
        date: z.string(),
        count: z.number(),
      }),
    )
    .optional(),
  countByCategory: z
    .array(
      z.object({
        category: z.string(),
        count: z.number(),
        name: z.string(),
      }),
    )
    .optional(),
  countByStatus: z
    .array(
      z.object({
        status: z.string(),
        count: z.number(),
      }),
    )
    .optional(),
  countByWorkflow: z
    .array(
      z.object({
        workflowDefinitionId: z.string(),
        status: z.string(),
        count: z.number(),
      }),
    )
    .optional(),
});

export const fetchDashboardMetrics = async () => {
  const [homeMetrics, error] = await apiClient({
    endpoint: `../metrics/dashboard`,
    method: Method.GET,
    schema: DashboardMetricsSOutputchema,
  });

  return handleZodError(error, homeMetrics);
};

export const useDashboardMetricsQuery = () => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: ['metrics', 'dashboard'],
    queryFn: () => fetchDashboardMetrics(),
    enabled: isAuthenticated,
    keepPreviousData: true,
  });
};
