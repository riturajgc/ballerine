import { Card } from '@/common/components/atoms/Card/Card';
import { CardContent } from '@/common/components/atoms/Card/Card.Content';
import { CardHeader } from '@/common/components/atoms/Card/Card.Header';
import { CustomLegend } from '@/pages/Statistics/components/WorkflowStatistics/components/CustomLegend/CustomLegend';
import { FunctionComponent } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyTicketsProps {
  dailyTickets?: Array<{
    date: string;
    count: number;
  }>;
}

export const DailyTickets: FunctionComponent<DailyTicketsProps> = (props: DailyTicketsProps) => {
  const { dailyTickets } = props;
  return (
    <div className={'col-span-2 min-h-[20rem] rounded-xl bg-[#F6F6F6] p-2'}>
      <Card className={'flex h-full flex-col px-3'}>
        <CardHeader className={'pb-1'}>Daily Tickets</CardHeader>
        <CardContent>
          <p className={'mb-8 text-slate-400'}>Checkout each column for more details</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={dailyTickets}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barSize={46}
            >
              <CartesianGrid vertical={false} strokeDasharray="0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" align={'right'} content={<CustomLegend />} />
              <Bar dataKey="count" fill="rgb(0, 122, 255)" radius={10} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
