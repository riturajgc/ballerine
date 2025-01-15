import { TWorkflowById } from '@/domains/workflows/fetchers';
import { BlocksVariant } from '@/lib/blocks/variants/BlocksVariant/BlocksVariant';
import { useEntityLogic } from '@/pages/Entity/hooks/useEntityLogic/useEntityLogic';
import { Case } from './components/Case/Case';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelectEntityOnMount } from '@/domains/entities/hooks/useSelectEntityOnMount/useSelectEntityOnMount';
import { Button } from '@ballerine/ui';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const Entity = () => {
  const { workflow, selectedEntity } = useEntityLogic();
  const navigate = useNavigate();
  const { locale } = useParams();
  const { search } = useLocation();

  useSelectEntityOnMount();

  const handleBack = () => {
    navigate(`/${locale}/case-management/entities${search}`);
  };

  useEffect(() => {
    console.log('workflow: ', workflow);
  }, [workflow]);

  return (
    <div className="h-full w-full p-4">
      <Button
        variant="outline"
        onClick={handleBack}
        className="ml-4 flex items-center gap-2 text-blue-500"
      >
        <ArrowLeft className="h-3 w-3" /> Back to Entities
      </Button>
      <Case key={workflow?.id}>
        {/* Reject and approve header */}
        <Case.Actions
          id={workflow?.id}
          fullName={selectedEntity?.name}
          avatarUrl={selectedEntity?.avatarUrl}
          showResolutionButtons={
            workflow?.workflowDefinition?.config?.workflowLevelResolution ??
            workflow?.context?.entity?.type === 'business'
          }
          workflow={workflow as TWorkflowById}
        />
        <Case.Content key={selectedEntity?.id}>
          {workflow?.workflowDefinition && (
            <BlocksVariant
              workflowDefinition={{
                version: workflow?.workflowDefinition?.version,
                variant: workflow?.workflowDefinition?.variant,
                config: workflow?.workflowDefinition?.config,
                name: workflow?.workflowDefinition?.name,
              }}
            />
          )}
        </Case.Content>
      </Case>
    </div>
  );
};
