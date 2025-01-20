import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/common/components/atoms/Button/Button';
import { ScrollArea } from '@/common/components/molecules/ScrollArea/ScrollArea';
import { Modal } from '@/common/components/organisms/Modal/Modal';
import { MultiDocuments } from '@/lib/blocks/components/MultiDocuments/MultiDocuments';
import { Edit2 } from 'lucide-react';
import { Input } from '@/common/components/atoms/Input/Input';
import FileUploadSection from './FileUploadSection';
import RenderForm from './RenderForm';
import { SelectTrigger } from '@/common/components/atoms/Select/Select.Trigger';
import { Select } from '@/common/components/atoms/Select/Select';
import { Label } from '@/common/components/atoms/Label/Label';
import { SelectContent } from '@/common/components/atoms/Select/Select.Content';
import { SelectItem } from '@/common/components/atoms/Select/Select.Item';
import { SelectGroup } from '@/common/components/atoms/Select/Select.Group';
import { SelectValue } from '@/common/components/atoms/Select/Select.Value';
import { statesToTitleCaseData } from '../Case/consts';

const camelToTitleCase = (input: string): string => {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Adds space between camelCase words
    .replace(/\b\w/g, char => char.toUpperCase()); // Capitalizes first letter of each word
};

interface RenderObjectProps {
  obj: Record<string, any>;
}

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

interface Workflow {
  context: {
    entity: {
      data: Record<string, any>;
    };
    documents?: Document[];
  };
  state: string;
  workflowDefinition: {
    config: {
      documentRequired: {
        [key: string]: { category: string; name: string; specific: boolean };
      };
      failedState: string[];
    };
    definition: {
      id: string;
      initial: string;
      states: Array<{ [key: string]: unknown }>;
    };
  };
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
}

interface Tab {
  id: string;
  label: string;
  contentId: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className="mb-4 inline-flex h-auto flex-wrap items-center justify-center rounded-lg bg-[#F4F6FD] p-1 text-muted-foreground"
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activeTab === tab.id ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
          }`}
          aria-disabled="false"
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={tab.contentId}
          id={`trigger-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const EditableCase: React.FC<EditableCaseProps> = ({ workflow }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({}); // Changed to use string keys based on document name

  useEffect(() => {
    if (openModal && workflow?.context?.entity?.data) {
      setFormData({ ...workflow.context.entity.data });
    }
  }, [openModal, workflow?.context?.entity?.data]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleFileChange = (docName: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docName]: file }));
  };

  const handleSave = () => {
    updateWorkflowData(formData, files);
    setOpenModal(false);
  };

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

  const tabs = [
    { id: 'summary', label: 'Summary', contentId: 'content-summary' },
    { id: 'documents', label: 'Documents', contentId: 'content-documents' },
  ];

  const isFailedState =
    workflow.state && workflow.workflowDefinition.config.failedState?.includes(workflow.state);

  const selectStateOptions = Object.keys(workflow.workflowDefinition.definition.states).map(
    state => {
      return { value: state, label: statesToTitleCaseData[state] || state };
    },
  );

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
                      className="space-y-4 px-4"
                    >
                      <RenderForm obj={formData} onChange={handleInputChange} />
                      <Label>State</Label>
                      <Select
                        onValueChange={value => console.log(value)}
                        defaultValue={workflow.state}
                      >
                        <SelectTrigger aria-label="State">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent className="z-[999999]">
                          <SelectGroup>
                            {selectStateOptions.map(item => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      {isFailedState && (
                        <FileUploadSection
                          documentRequired={workflow.workflowDefinition.config?.documentRequired}
                          onFileChange={handleFileChange}
                        />
                      )}
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
              const docRequirements =
                workflow.workflowDefinition.config.documentRequired?.[doc.id] || [];
              const renderButton =
                workflow.state &&
                workflow.workflowDefinition.config.failedState?.includes(workflow.state) &&
                docRequirements.specific === true;

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
                      {renderButton && (
                        <div className="mt-6 flex justify-end space-x-4 rounded p-2">
                          {/* Add Buttons */}
                          <Button size="sm" variant="warning" className="py-1">
                            Re-upload the document
                          </Button>
                          <Button size="sm" variant="success" className="py-1">
                            Accept
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="m-2 rounded p-1">
                        <div className="flex h-full flex-col">
                          <div className="grid grid-cols-2 gap-4 gap-y-6">
                            <RenderObject obj={doc.properties} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <MultiDocuments
                      value={{
                        isLoading: !!doc,
                        data: doc.pages.map((item: Page) => ({
                          imageUrl: item.uri,
                          title: item.metadata.title || '',
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
