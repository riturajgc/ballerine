import React from 'react';
import dayjs from 'dayjs';
import { Avatar } from '@/common/components/atoms/Avatar';
import { StateTag, valueOrNA } from '@ballerine/common';
import { stringToRGB } from '@/common/utils/string-to-rgb/string-to-rgb';
import { createInitials } from '@/common/utils/create-initials/create-initials';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Badge, ctw } from '@ballerine/ui';
import { tagToBadgeData } from '@/pages/Entity/components/Case/consts';

type Assignee = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

type TableItemProps = {
  id: string;
  fullName: string;
  createdAt: string | Date;
  assignee?: Assignee;
  tags?: string[];
  state?: string[];
  entityAvatarUrl?: string;
  status: string;
};

type TableListProps = {
  children: React.ReactNode;
};

const TableList: React.FC<TableListProps> = ({ children }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-neutral/10">
            <th className="p-4 text-left text-sm font-semibold">Status</th>
            <th className="p-4 text-left text-sm font-semibold">User</th>
            <th className="p-4 text-left text-sm font-semibold">Created At</th>
            <th className="p-4 text-left text-sm font-semibold">Assignee</th>
            <th className="p-4 text-left text-sm font-semibold">Status</th>
            <th className="p-4 text-left text-sm font-semibold">State</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

const TableItem: React.FC<TableItemProps> = ({
  id,
  fullName,
  createdAt,
  assignee,
  tags,
  state,
  entityAvatarUrl,
  status,
}) => {
  const entityInitials = createInitials(fullName);
  const rgb = stringToRGB(fullName);
  const navigate = useNavigate();
  const { search } = useLocation();
  const { locale } = useParams<{ locale: string }>();

  const handleClick = () => {
    navigate(`/${locale}/case-management/entities/${id}${search}`);
  };

  return (
    <tr
      onClick={handleClick}
      className="cursor-pointer border-b border-neutral/10 hover:bg-muted/50"
    >
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Avatar
            src={entityAvatarUrl}
            className="h-8 w-8 text-sm"
            alt={`${fullName}'s avatar`}
            placeholder={entityInitials}
            style={{
              color: `rgb(${rgb})`,
              backgroundColor: `rgba(${rgb}, 0.2)`,
            }}
          />
        </div>
      </td>
      <td className="p-4">
        <div className="font-medium">{valueOrNA(fullName)}</div>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {dayjs(new Date(createdAt)).format('hh:mm A')}
        {', '}
        {dayjs(new Date(createdAt)).format('D MMM YYYY')}
      </td>
      <td className="p-4">{assignee ? `${assignee?.firstName} ${assignee?.lastName}` : ''}</td>
      <td className="p-4">
        <Badge
          variant={status === 'active' ? 'success' : status === 'inactive' ? 'ghost' : 'ghost'}
          size="sm"
        >
          {`${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`}
        </Badge>
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          {state?.map(tag => (
            <Badge
              key={tag}
              variant={tagToBadgeData[tag]?.variant}
              className={ctw(`whitespace-nowrap text-sm font-bold`, {
                'bg-info/20 text-info': tag === StateTag.MANUAL_REVIEW,
                'bg-violet-500/20 text-violet-500': [
                  StateTag.COLLECTION_FLOW,
                  StateTag.DATA_ENRICHMENT,
                ].includes(tag),
              })}
              size="sm"
            >
              {tag
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')}
            </Badge>
          ))}
        </div>
      </td>
    </tr>
  );
};

const TableSkeletonItem: React.FC = () => (
  <tr className="border-b border-neutral/10">
    <td className="p-4">
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
    </td>
    <td className="p-4">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
    </td>
    <td className="p-4">
      <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
    </td>
    <td className="p-4">
      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
    </td>
    <td className="p-4">
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
    </td>
  </tr>
);

const TableComponents = {
  List: TableList,
  Item: TableItem,
  SkeletonItem: TableSkeletonItem,
};

export default TableComponents;
