import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/common/components/atoms/Button/Button';
import { ScrollArea } from '@/common/components/molecules/ScrollArea/ScrollArea';
import { Modal } from '@/common/components/organisms/Modal/Modal';
import { MultiDocuments } from '@/lib/blocks/components/MultiDocuments/MultiDocuments';
import { Edit2 } from 'lucide-react';

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

interface RenderFormProps {
  obj: Record<string, any>;
  onChange: (key: string, value: string) => void;
}

const RenderForm: React.FC<RenderFormProps> = ({ obj, onChange }) => {
  return (
    <>
      {Object.entries(obj).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">{camelToTitleCase(key)}:</label>
              <RenderForm obj={value} onChange={onChange} />
            </div>
          );
        }
        return (
          <div className="space-y-2" key={key}>
            <label className="text-sm font-medium">{camelToTitleCase(key)}:</label>
            <input
              type="text"
              value={value as string}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(key, e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
            />
          </div>
        );
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
}

interface Document {
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

const EditableCase: React.FC<EditableCaseProps> = ({ workflow }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'documents'>('documents');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (openModal && workflow?.context?.entity?.data) {
      setFormData({ ...workflow.context.entity.data });
    }
  }, [openModal, workflow?.context?.entity?.data]);

  const handleToggle = (tab: 'summary' | 'documents') => {
    setActiveTab(tab);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSave = () => {
    updateWorkflowData(formData);
    setOpenModal(false);
  };

  const updateWorkflowData = (updatedData: Record<string, any>) => {
    console.log('Updated Data:', updatedData);
  };

  return (
    <div className="px-3">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="mb-4 inline-flex h-auto flex-wrap items-center justify-center rounded-lg bg-[#F4F6FD] p-1 text-muted-foreground"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        {/* Summary Tab */}
        <button
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activeTab === 'summary'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground'
          }`}
          aria-disabled="false"
          type="button"
          role="tab"
          aria-selected={activeTab === 'summary'}
          aria-controls="content-summary"
          id="trigger-summary"
          tabIndex={activeTab === 'summary' ? 0 : -1}
          onClick={() => handleToggle('summary')}
        >
          Summary
        </button>

        {/* Documents Tab */}
        <button
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
            activeTab === 'documents'
              ? 'bg-background text-foreground shadow'
              : 'text-muted-foreground'
          }`}
          aria-disabled="false"
          type="button"
          role="tab"
          aria-selected={activeTab === 'documents'}
          aria-controls="content-documents"
          id="trigger-documents"
          tabIndex={activeTab === 'documents' ? 0 : -1}
          onClick={() => handleToggle('documents')}
        >
          Documents
        </button>
      </div>

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
                  >
                    <form
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        handleSave();
                      }}
                      className="space-y-4"
                    >
                      <RenderForm obj={formData} onChange={handleInputChange} />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Save</Button>
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
            {workflow?.context.documents?.map((doc: Document, index: number) => (
              <div
                key={index}
                className="me-4 rounded-lg border bg-card text-card-foreground shadow-[0_4px_4px_0_rgba(174,174,174,0.0625)]"
              >
                <div className="grid grid-cols-2 gap-2 p-6 pt-0">
                  <div className="col-span-full grid grid-cols-2 items-start">
                    <h2 className="ml-1 mt-6 px-2 text-2xl font-bold">
                      {`${camelToTitleCase(doc.category)} - ${camelToTitleCase(doc.type)}`}{' '}
                    </h2>
                    <div className="mt-6 flex justify-end space-x-4 rounded p-2">
                      {/* Add Buttons */}
                      <Button size="sm" variant="warning" className="py-1">
                        Re-upload the document
                      </Button>
                      <Button size="sm" variant="destructive" className="py-1">
                        Reject
                      </Button>
                      <Button size="sm" variant="success" className="py-1">
                        Accept
                      </Button>
                    </div>
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
                        title: item.metadata.title || 'Default Title',
                        fileType: item.type,
                      })),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default EditableCase;
