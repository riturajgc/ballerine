import { CaseCreation } from '@/pages/Entities/components/CaseCreation';
import { ctw } from '@ballerine/ui';
import { FunctionComponent } from 'react';
import { TAssignee } from '@/common/components/atoms/AssignDropdown/AssignDropdown';
import { MotionScrollArea } from '@/common/components/molecules/MotionScrollArea/MotionScrollArea';
import { Pagination } from '@/common/components/organisms/Pagination/Pagination';
import TableComponents from './components/Cases/Cases.Table';
import { useEntities } from './hooks/useEntities/useEntities';
import { NoCases } from '@/pages/Entities/components/NoCases/NoCases';
import { Loader } from 'lucide-react';
import { Cases } from './components/Cases/Cases';

export const Entities: FunctionComponent = () => {
  const {
    onPaginate,
    onSearch,
    onFilter,
    onSortBy,
    onSortDirToggle,
    search,
    cases,
    isLoading,
    page,
    totalPages,
    caseCount,
    skeletonEntities,
    isManualCaseCreationEnabled,
  } = useEntities();

  return (
    <div className="h-full w-full">
      <Cases
        onSearch={onSearch}
        onFilter={onFilter}
        onSortBy={onSortBy}
        onSortDirToggle={onSortDirToggle}
        search={search}
        count={caseCount}
      >
        <MotionScrollArea
          className={ctw({
            'h-[calc(100vh-300px)]': isManualCaseCreationEnabled,
            'h-[calc(100vh-240px)]': !isManualCaseCreationEnabled,
          })}
        >
          <TableComponents.List>
            {isLoading
              ? skeletonEntities.map(index => (
                  <TableComponents.SkeletonItem key={`cases-list-skeleton-${index}`} />
                ))
              : cases?.map(case_ => (
                  <TableComponents.Item
                    key={case_.id}
                    id={case_.id}
                    fullName={case_.entity.name}
                    createdAt={case_.createdAt}
                    assignee={
                      case_.assignee
                        ? ({
                            id: case_.assignee?.id,
                            fullName: `${case_.assignee?.firstName} ${case_.assignee?.lastName}`,
                            avatarUrl: case_.assignee?.avatarUrl,
                          } as TAssignee)
                        : null
                    }
                    tags={case_.tags}
                    entityAvatarUrl={case_.entity?.avatarUrl}
                  />
                ))}
          </TableComponents.List>
        </MotionScrollArea>
        <div className={`divider my-0 px-4`}></div>
        <div className="flex flex-col gap-5 px-4">
          <Pagination onPaginate={onPaginate} page={page} totalPages={totalPages} />
          {isManualCaseCreationEnabled && <CaseCreation />}
        </div>
      </Cases>
      {isLoading && (
        <div className="mt-4">
          <Loader className="animate-pulse" />
        </div>
      )}
      {Array.isArray(cases) && !cases.length && !isLoading ? <NoCases /> : null}
    </div>
  );
};
