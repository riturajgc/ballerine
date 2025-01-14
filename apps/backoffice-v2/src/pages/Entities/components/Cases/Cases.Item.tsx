import { FunctionComponent } from 'react';
import { Avatar } from '../../../../common/components/atoms/Avatar';
import { IItemProps } from '../../../Entity/components/Case/interfaces';
import { stringToRGB } from '../../../../common/utils/string-to-rgb/string-to-rgb';
import { ApprovedSvg, RejectedSvg } from '../../../../common/components/atoms/icons';
import { UserAvatar } from '../../../../common/components/atoms/UserAvatar/UserAvatar';
import { createInitials } from '../../../../common/utils/create-initials/create-initials';
import { useEllipsesWithTitle } from '../../../../common/hooks/useEllipsesWithTitle/useEllipsesWithTitle';
import dayjs from 'dayjs';
import { StateTag, valueOrNA } from '@ballerine/common';
import { ctw } from '../../../../common/utils/ctw/ctw';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

export const Item: FunctionComponent<IItemProps> = ({
  id,
  fullName,
  createdAt,
  assignee,
  tags,
  entityAvatarUrl,
}) => {
  const entityInitials = createInitials(fullName);
  const { ref, styles } = useEllipsesWithTitle<HTMLDivElement>();
  const { search } = useLocation();
  const { locale } = useParams(); // Extract locale from route params
  const rgb = stringToRGB(fullName);
  const isApproved = tags?.includes(StateTag.APPROVED);
  const isRejected = tags?.includes(StateTag.REJECTED);
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to the Entity page with the current locale and entity ID
    navigate(`/${locale}/case-management/entities/${id}${search}`);
  };

  return (
    <li className="h-[64px] w-full px-4">
      <div
        onClick={handleClick}
        className="flex h-[64px] cursor-pointer items-center gap-x-4 rounded-lg px-5 py-4 outline-none active:bg-muted-foreground/30 active:text-foreground"
      >
        <div className={`indicator`}>
          <div
            className={`indicator-item indicator-bottom h-4 w-4 animate-pulse rounded-full bg-gray-200 theme-dark:bg-neutral-focus`}
          ></div>
          <Avatar
            src={entityAvatarUrl}
            className="text-sm d-8"
            alt={`${fullName}'s avatar`}
            placeholder={entityInitials}
            style={{
              color: `rgb(${rgb})`,
              backgroundColor: `rgba(${rgb}, 0.2)`,
            }}
          />
        </div>
        <div className={`max-w-[115px]`}>
          <div ref={ref} className={`mb-[2px] text-sm font-bold`} style={styles}>
            {valueOrNA(fullName)}
          </div>
          <div className={`text-xs opacity-60`}>
            {dayjs(new Date(createdAt)).format('D MMM YYYY HH:mm')}
          </div>
        </div>
        <div className={`ml-auto mr-1 flex -space-x-2 overflow-hidden`}>
          {assignee && <UserAvatar fullName={assignee.fullName} avatarUrl={assignee.avatarUrl} />}
        </div>
      </div>
    </li>
  );
};
