import React, { useState } from 'react';
import { Upload, AlertCircle, FileText, XCircle } from 'lucide-react';
import { Alert } from '@/common/components/atoms/Alert/Alert';
import { AlertTitle } from '@/common/components/atoms/Alert/Alert.Title';
import { AlertDescription } from '@/common/components/atoms/Alert/Alert.Description';
import { statesToTitleCaseData } from '../Case/consts';
import { FileUploadFormData, FileUploadResponse } from '../../hooks/useEntityLogic/useEntityLogic';

interface DocumentRequirement {
  category: string;
  name: string;
  specific: boolean;
}

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type?: string;
}

interface FileUploadSectionProps {
  documentsRequired: DocumentRequirement[];
  onFileChange: (docName: string, file: File | null) => void;
  uploadFile: (formData: FileUploadFormData) => Promise<FileUploadResponse>;
  workflowRunTimeId: string;
  setUploadedFiles: React.Dispatch<
    React.SetStateAction<
      {
        category: string;
        ballerineFileId: string;
        name: string;
      }[]
    >
  >;
  uploadedFiles: {
    category: string;
    ballerineFileId: string;
    name: string;
  }[];
}

interface UploadedFiles {
  [key: string]: UploadedFile;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  documentsRequired,
  onFileChange,
  uploadFile,
  workflowRunTimeId,
  setUploadedFiles: setFiles,
  uploadedFiles: files,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});

  console.log('Document Required: ', documentsRequired);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleFileChange = async (
    docCategory: string,
    docName: string,
    file: File | null,
  ): Promise<void> => {
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [docName]: {
          file,
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type.split('/')[1] ? file.type.split('/')[1]?.toUpperCase() : undefined,
        },
      }));
      onFileChange(docName, file);
      const response = await uploadFile({ file, workflowRunTimeId });

      setFiles([
        ...files.filter(file => file.category !== docName),
        { category: docCategory, ballerineFileId: response.id, name: docName },
      ]);
    }
  };

  const removeFile = (docName: string): void => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[docName];
      return newFiles;
    });
    onFileChange(docName, null);
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Document Verification Failed</AlertTitle>
        <AlertDescription>Please upload the required documents to proceed.</AlertDescription>
      </Alert>

      <div className="space-y-4">
        {documentsRequired.map((doc, index) => {
          const uploadedFile = uploadedFiles[doc.name];
          return (
            <div key={doc.name || index} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{doc.name ?? doc.category}</span>
              </div>

              {!uploadedFile ? (
                <div className="mt-2">
                  <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <Upload className="mb-3 h-6 w-6 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG or JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFileChange(doc.category, doc.name, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {uploadedFile.type} • {uploadedFile.size}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(doc.name)}
                    className="rounded-full p-1 hover:bg-gray-200"
                    type="button"
                  >
                    <XCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileUploadSection;
