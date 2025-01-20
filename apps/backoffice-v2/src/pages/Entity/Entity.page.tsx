import { TWorkflowById } from '@/domains/workflows/fetchers';
import { BlocksVariant } from '@/lib/blocks/variants/BlocksVariant/BlocksVariant';
import { useEntityLogic } from '@/pages/Entity/hooks/useEntityLogic/useEntityLogic';
import { Case } from './components/Case/Case';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelectEntityOnMount } from '@/domains/entities/hooks/useSelectEntityOnMount/useSelectEntityOnMount';
import { Button } from '@ballerine/ui';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import EditableCase from './components/EditableCase/EditableCase';

export const Entity = () => {
  const { workflow, selectedEntity } = useEntityLogic();
  const navigate = useNavigate();
  const { locale } = useParams();
  const { search } = useLocation();

  useSelectEntityOnMount();

  const handleBack = () => {
    navigate(`/${locale}/case-management/entities${search}`);
  };

  const sampleDocumentsData = [
    {
      id: '1',
      category: 'financial',
      type: 'invoice',
      properties: {
        id: '12345',
        vendor: 'ABC Corporation',
        date: '2025-01-15',
        amount: '$5000',
      },
      pages: [
        {
          uri: 'https://placehold.co/600x400',
          metadata: { title: 'Invoice Page 1' },
          type: 'image/jpeg',
        },
        {
          uri: 'https://placehold.co/600x400',
          metadata: { title: 'Invoice Page 2' },
          type: 'image/jpeg',
        },
      ],
    },
    {
      id: '2',
      category: 'legal',
      type: 'contract',
      properties: {
        id: '67890',
        client: 'XYZ Enterprises',
        startDate: '2025-01-01',
        endDate: '2026-01-01',
      },
      pages: [
        {
          uri: 'https://placehold.co/600x400',
          metadata: { title: 'Contract Page 1' },
          type: 'image/jpeg',
        },
        {
          uri: 'https://placehold.co/600x400',
          metadata: { title: 'Contract Page 2' },
          type: 'image/jpeg',
        },
      ],
    },
  ];

  console.log('workflow: ', {
    ...workflow,
    context: {
      ...workflow?.context,
      documents: [...sampleDocumentsData],
    },
    workflowDefinition: {
      ...workflow?.workflowDefinition,
      config: {
        documentRequired: {
          '1': { specific: true, category: 'financial', name: 'name of the document' },
        },
        failedState: ['sign_up'],
      },
    },
  });

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
        <EditableCase
          workflow={{
            ...workflow,
            context: {
              ...workflow?.context,
              documents: [...sampleDocumentsData],
            },
            workflowDefinition: {
              ...workflow?.workflowDefinition,
              config: {
                documentRequired: {
                  '1': { specific: true, category: 'financial', name: 'name of the document' },
                },
                failedState: ['sign_up'],
              },
            },
          }}
        />

        {/* <Case.Content key={selectedEntity?.id}>
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
        </Case.Content> */}
      </Case>
    </div>
  );
};
