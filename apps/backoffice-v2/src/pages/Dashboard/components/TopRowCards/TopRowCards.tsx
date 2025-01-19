import React, { FunctionComponent, useMemo } from 'react';
import { Card } from '@/common/components/atoms/Card/Card';
import { CardHeader } from '@/common/components/atoms/Card/Card.Header';
import { CardContent } from '@/common/components/atoms/Card/Card.Content';
import { CardFooter } from '@/common/components/atoms/Card/Card.Footer';
import { useUserStatisticsLogic } from '@/pages/Statistics/components/UserStatistics/hooks/useUserStatisticsLogic/useUserStatisticsLogic';
import { TextWithNAFallback } from '@ballerine/ui';
import { Cell, Pie, PieChart } from 'recharts';
import { ctw } from '@/common/utils/ctw/ctw';
import { HSL_PIE_COLORS } from '@/pages/Statistics/constants';

interface ITopRowCardProps {
  countBycategory: Array<{
    name: string;
    count: number;
    category: string;
  }>;
  countByStatus: Array<{
    count: number;
    status: string;
  }>;
  tat: number;
}

interface IFilter {
  id: string;
  name: string;
  value: number;
}

export const CardContentLogic = (filters: IFilter[], assignedFilters: any) => {
  const filtersWithColors = useMemo(
    () =>
      filters
        ?.slice()
        ?.sort((a, b) => b.value - a.value)
        ?.map((filter, index) => ({
          ...filter,
          color: HSL_PIE_COLORS[index],
        })),
    [filters],
  );
  return (
    <div className={'flex items-center space-x-5 pt-3'}>
      <PieChart width={70} height={70}>
        <text
          x={35}
          y={37}
          textAnchor="middle"
          dominantBaseline="middle"
          className={ctw('font-bold', {
            'text-sm': assignedFilters?.toString().length >= 5,
          })}
        >
          {assignedFilters}
        </text>
        <Pie
          data={filters}
          cx={30}
          cy={30}
          innerRadius={28}
          outerRadius={35}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          cornerRadius={9999}
        >
          {filtersWithColors?.map(filter => {
            return (
              <Cell
                key={filter.id}
                className={'outline-none'}
                style={{
                  fill: filter.color,
                }}
              />
            );
          })}
        </Pie>
      </PieChart>
      <ul className={'w-full max-w-sm'}>
        {filtersWithColors?.map(({ name, color, value }) => {
          return (
            <li key={name} className={'flex items-center space-x-4 text-xs'}>
              <span
                className="flex h-2 w-2 rounded-full"
                style={{
                  backgroundColor: color,
                }}
              />
              <div className={'flex w-full justify-between'}>
                <span className={'text-slate-500'}>{name}</span>
                <span>{value}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const TopRowCards: FunctionComponent<ITopRowCardProps> = (props: ITopRowCardProps) => {
  const { countByStatus, countBycategory, tat } = props;

  const byCategoryTotal = useMemo(
    () => countBycategory.reduce((acc, { count }) => acc + count, 0),
    [countBycategory],
  );
  const byStatusTotal = useMemo(
    () => countByStatus.reduce((acc, { count }) => acc + count, 0),
    [countByStatus],
  );

  const categoryFilters = [
    {
      id: 'ckl1y5e0x0000wxrmsgft7bf0',
      name: 'Onboarding',
      value: countBycategory.find(({ category }) => category === 'sr-onboarding')?.count || 0,
    },
    {
      id: 'ckl1y5e0x0002wxrmnd8j9rb7',
      name: 'Transactions',
      value: countBycategory.find(({ category }) => category === 'sr-transactions')?.count || 0,
    },
    {
      id: 'ckl1y5e0x0002wxrmnd8j9rb7',
      name: 'Others',
      value: countBycategory.find(({ category }) => category === 'sr-others')?.count || 0,
    },
  ];

  const statusFilters = [
    {
      id: 'ckl1y5e0x0000wxrmsgft7bf0',
      name: 'Active',
      value: countByStatus.find(({ status }) => status === 'active')?.count || 0,
    },
    {
      id: 'ckl1y5e0x0002wxrmnd8j9rb7',
      name: 'Completed',
      value: countByStatus.find(({ status }) => status === 'completed')?.count || 0,
    },
    {
      id: 'ckl1y5e0x0002wxrmnd8j9rb7',
      name: 'Failed',
      value: countByStatus.find(({ status }) => status === 'failed')?.count || 0,
    },
  ];

  return (
    <div>
      <TextWithNAFallback as={'h5'} className={'mb-4 font-bold'}>
        Welcome Back
      </TextWithNAFallback>
      <div className={'grid grid-cols-3 gap-6'}>
        <div key={'tat'} className={'min-h-[10.125rem] rounded-xl bg-[#F6F6F6] p-2'}>
          <Card className={'flex h-full flex-col px-3'}>
            <CardHeader className={'pb-1'}>Average TAT for closing Tickets</CardHeader>
            <CardContent>
              <span className={'text-2xl font-bold'}>{tat}</span>
            </CardContent>
          </Card>
        </div>
        <div key={'category'} className={'min-h-[10.125rem] rounded-xl bg-[#F6F6F6] p-2'}>
          <Card className={'flex h-full flex-col px-3'}>
            <CardHeader className={'pb-1'}>Tickets by category</CardHeader>
            <CardContent>{CardContentLogic(categoryFilters, byCategoryTotal)}</CardContent>
          </Card>
        </div>
        <div key={'status'} className={'min-h-[10.125rem] rounded-xl bg-[#F6F6F6] p-2'}>
          <Card className={'flex h-full flex-col px-3'}>
            <CardHeader className={'pb-1'}>Tickets by Status</CardHeader>
            <CardContent>{CardContentLogic(statusFilters, byStatusTotal)}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
