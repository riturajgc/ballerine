import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/common/components/atoms/Button/Button';
import { ScrollArea } from '@/common/components/molecules/ScrollArea/ScrollArea';
import { Modal } from '@/common/components/organisms/Modal/Modal';
import { MultiDocuments } from '@/lib/blocks/components/MultiDocuments/MultiDocuments';
import { Edit2 } from 'lucide-react';
import { Input } from '@/common/components/atoms/Input/Input';
import FileUploadSection from './FileUploadSection';
import RenderForm from './RenderForm';
import Tabs from './Tabs';
import {
  CaseManagementRequest,
  CaseManagementResponse,
  FileUploadFormData,
  FileUploadResponse,
  WorkflowUpdateBody,
  WorkflowUpdateResponse,
} from '../../hooks/useEntityLogic/useEntityLogic';

interface RenderObjectProps {
  obj: Record<string, any>;
}

const camelToTitleCase = (input: string): string => {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Adds space between camelCase words
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalizes first letter of each word
};

const RenderObject: React.FC<RenderObjectProps> = ({ obj }) => {
  return (
    <>
      {Object.entries(obj).map(([key, value]) => {
        if (typeof value !== 'object' || value === null) {
          return (
            <div className="space-y-2" key={key}>
              <label className="text-sm font-medium">{camelToTitleCase(key)}:</label>
              <div className="flex w-full max-w-[30ch] items-center break-all rounded-md p-1 pl-[0.3rem] pt-1.5 text-sm">
                {`${value}`}
              </div>
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

interface EditableCaseProps {
  workflow: Workflow;
}

interface WorkflowState {
  tags: string[];
  type?: 'final' | string;
  on?: {
    [event: string]: string;
  };
}

interface WorkflowStateDefinition {
  id: string;
  states: {
    [stateName: string]: WorkflowState;
  };
  initial: string;
}

interface DocumentRequirement {
  name: string;
  category: string;
  specific: boolean;
}

interface WorkflowConfig {
  failedStates: string[];
  documentsRequired: {
    [key: string]: DocumentRequirement[];
  };
}

interface WorkflowDefinition {
  id: string;
  name: string;
  config: WorkflowConfig;
  variant: string;
  version: number;
  definition: WorkflowStateDefinition;
}

interface Document {
  id: string;
  category: string;
  type: string;
  properties: Record<string, any>;
  pages: Page[];
}

interface Page {
  uri: string;
  metadata: {
    title?: string;
  };
  type: string;
  ballerineFileId: string;
}

interface Workflow {
  context: {
    id: string;
    entity: {
      data: Record<string, any>;
      id: string;
      type: string;
      ballerineEntityId: string;
    };
    documents?: Document[];
  };
  metadata: any;
  state: string;
  id: string;
  workflowDefinition: WorkflowDefinition;
}

interface EditableCaseProps {
  workflow: Workflow;
  uploadFile: (formData: FileUploadFormData) => Promise<FileUploadResponse>;
  createCase: (caseData: CaseManagementRequest) => Promise<CaseManagementResponse>;
  updateWorkflow: (
    runtimeId: string,
    updateData: WorkflowUpdateBody,
  ) => Promise<WorkflowUpdateResponse>;
}

const EditableCase: React.FC<EditableCaseProps> = ({
  workflow,
  uploadFile,
  createCase,
  updateWorkflow,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [currentState, setCurrentState] = useState(workflow?.state);
  const [uploadedFiles, setUploadedFiles] = useState<
    { category: string; ballerineFileId: string; name: string }[]
  >([]);
  const isFailedState =
    workflow.state && workflow.workflowDefinition.config.failedStates?.includes(workflow.state);

  const failedDocuments = isFailedState
    ? workflow.workflowDefinition.config.documentsRequired[workflow.state]?.filter(
        doc => doc.specific === false,
      )
    : [];

  const requiredDocuments = workflow.workflowDefinition.config.documentsRequired[
    currentState
  ]?.filter(
    doc =>
      doc.specific === false &&
      !workflow.context.documents?.find(dc => dc.category === doc.category),
  );

  console.log('requiredDocuments: ', requiredDocuments);

  useEffect(() => {
    if (openModal && workflow?.context?.entity?.data) {
      setFormData({ ...workflow.context.entity.data, state: workflow.state });
    }
  }, [openModal, workflow?.context?.entity?.data, workflow.state]);

  // Handle text / input changes in the modal form
  const handleInputChange = (key: string, value: string | boolean | number) => {
    setFormData(prevData => ({
      ...prevData,
      [key]: value,
    }));
  };

  // Capture file changes from <FileUploadSection />
  const handleFileChange = (docName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docName]: file }));
  };

  // For demonstration only
  const handleSave = () => {
    updateWorkflowData(formData, files);
    setOpenModal(false);

    console.log('---formData: ', formData);

    const data = {
      workflowId: workflow.workflowDefinition.id,
      context: {
        id: workflow.context.id,
        entity: {
          type: workflow.context.entity.type,
          data: formData,
          ballerineEntityId: workflow.context.entity.ballerineEntityId,
          id: workflow.context.entity.id,
        },
        documents: uploadedFiles.map(file => ({
          id: file.ballerineFileId,
          category: file.category,
          type: file.category,
          version: 1,
          issuingVersion: 1,
          pages: [
            {
              ballerineFileId: file.ballerineFileId,
            },
          ],
          properties: {},
          metadata: {},
        })),
      },
      metadata: workflow.metadata,
    };
    createCase(data);
    updateWorkflow(workflow.id, { state: currentState, tags: [currentState] });
  };

  // Replace with your real API call or logic to store updated data
  const updateWorkflowData = (
    updatedData: Record<string, any>,
    updatedFiles: Record<string, File | null>,
  ) => {
    console.log('Updated Data:', updatedData);
    console.log('Updated Files:', updatedFiles);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Example tabs
  const tabs = [
    { id: 'summary', label: 'Summary', contentId: 'content-summary' },
    { id: 'documents', label: 'Documents', contentId: 'content-documents' },
  ];

  return (
    <div className="px-3">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <ScrollArea orientation="vertical" className="h-[73vh]">
        {activeTab === 'summary' && (
          <div className="me-4 rounded-lg border bg-card text-card-foreground shadow-[0_4px_4px_0_rgba(174,174,174,0.0625)]">
            <div className="grid gap-2 p-6 pt-0">
              <div>
                <h2 className="ml-1 mt-6 flex items-center px-2 text-2xl font-bold">
                  Individual Information{' '}
                  <Edit2
                    onClick={() => setOpenModal(true)}
                    className="ml-3 h-5 w-5 cursor-pointer"
                  />
                  <Modal
                    isOpen={openModal}
                    onIsOpenChange={() => setOpenModal(false)}
                    title="Edit Information"
                    className="overflow-y-hidden"
                  >
                    <form
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        handleSave();
                      }}
                      className="mt-4 space-y-4 px-4"
                    >
                      <RenderForm
                        obj={formData}
                        onChange={handleInputChange}
                        setCurrentState={setCurrentState}
                      />

                      <FileUploadSection
                        documentsRequired={requiredDocuments ?? []}
                        onFileChange={handleFileChange}
                        uploadFile={uploadFile}
                        workflowRunTimeId={workflow.id}
                        uploadedFiles={uploadedFiles}
                        setUploadedFiles={setUploadedFiles}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                          Cancel
                        </Button>

                        <Button type="submit" variant="success">
                          Save
                        </Button>
                      </div>
                    </form>
                  </Modal>
                </h2>
                <h3 className="ml-[5px] px-2 text-sm font-bold">User-Provided Data</h3>
              </div>
              <div className="m-2 rounded p-1 pt-4">
                <div className="flex h-full flex-col">
                  <div className="grid grid-cols-3 gap-4 gap-y-6">
                    {workflow?.context?.entity?.data && (
                      <RenderObject obj={workflow.context.entity.data} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="flex h-full flex-col gap-4">
            {workflow?.context.documents?.map((doc: Document, index: number) => {
              return (
                <div
                  key={doc.id}
                  className="me-4 rounded-lg border bg-card text-card-foreground shadow-[0_4px_4px_0_rgba(174,174,174,0.0625)]"
                >
                  <div className="grid grid-cols-2 gap-2 p-6 pt-0">
                    <div className="col-span-full grid grid-cols-2 items-start">
                      <h2 className="ml-1 mt-6 px-2 text-2xl font-bold">
                        {`${camelToTitleCase(doc.category)} - ${camelToTitleCase(doc.type)}`}
                      </h2>
                      {/* Example: If you also want to show 'Re-upload' or 'Accept' 
                          only if doc is required or if the state is failed, adapt this logic. */}
                    </div>

                    {/* Document's properties */}
                    <div>
                      <div className="m-2 rounded p-1">
                        <div className="flex h-full flex-col">
                          <div className="grid grid-cols-2 gap-4 gap-y-6">
                            <RenderObject obj={doc.properties} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Document's pages or images */}
                    <MultiDocuments
                      value={{
                        isLoading: !!doc,
                        data: doc.pages.map((item: Page) => ({
                          imageUrl: item.ballerineFileId,
                          title: '',
                          fileType: item.type,
                        })),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default EditableCase;
