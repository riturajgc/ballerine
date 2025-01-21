import { useCallback } from 'react';
import { useCurrentCaseQuery } from '@/pages/Entity/hooks/useCurrentCaseQuery/useCurrentCaseQuery';
import { apiClient } from '@/common/api-client/api-client';
import { Method } from '@/common/enums';
import { z } from 'zod';
import { handleZodError } from '@/common/utils/handle-zod-error/handle-zod-error';

// 1. File Upload
export interface FileUploadResponse {
  id: string;
}

export interface FileUploadFormData {
  file: File;
  workflowRunTimeId: string;
}

// 2. Case Management
export interface CaseManagementRequest {
  workflowId: string;
  context: {
    id: string;
    entity: {
      type: string;
      data: {
        [key: string]: any;
      };
      ballerineEntityId: string;
      id: string;
    };
    documents: Array<any>;
  };
  metadata: {
    token: string;
    webUiSDKUrl: string;
    collectionFlowUrl: string;
  };
}

export interface CaseManagementResponse {}

// 3. Workflow Update
export interface WorkflowUpdateBody {
  state: string;
  tags: string[];
}

export interface WorkflowUpdateResponse {}

export const useEntityLogic = () => {
  const { data: workflow } = useCurrentCaseQuery();
  const selectedEntity = workflow?.entity;

  const baseUrl = import.meta.env.VITE_API_URL_COMMON;

  console.log('Base URL', baseUrl);

  const uploadFile = useCallback(
    async (formData: FileUploadFormData) => {
      const url = `collection-flow/files`;

      const newFormData = new FormData();
      newFormData.append('file', formData.file);
      newFormData.append('workflowRuntimeId', formData.workflowRunTimeId);

      console.log('formData: ', formData);

      const FileUploadSchema = z.object({
        id: z.string(),
      });

      const [data, error] = await apiClient({
        endpoint: url,
        method: Method.POST,
        schema: FileUploadSchema,
        body: newFormData,
        options: {
          headers: {},
        },
      });

      const response = handleZodError(error, data);

      return response;
    },
    [baseUrl],
  );

  /**
   * 2. Case Management Function
   */
  const createCase = useCallback(
    async (caseData: CaseManagementRequest) => {
      const url = `${baseUrl}/case-management`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
        credentials: 'include',
      });

      // const FileUploadSchema = z.object({
      //   workflowDefinitionId: z.string(),
      //   workflowRuntimeId: z.string(),
      //   ballerineEntityId: z.string(),
      //   workflowToken: z.string().optional(),
      // });

      // const [data, error] = await apiClient({
      //   endpoint: url,
      //   method: Method.POST,
      //   schema: FileUploadSchema,
      //   body: caseData,
      // });

      // const response = handleZodError(error, data);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Workflow update failed: ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
    [baseUrl],
  );

  /**
   * 3. Workflow Update Function
   */
  const updateWorkflow = useCallback(
    async (runtimeId: string, updateData: WorkflowUpdateBody) => {
      const url = `${baseUrl}/external/workflows/${runtimeId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Workflow update failed: ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
    [baseUrl],
  );

  return {
    selectedEntity,
    workflow,
    uploadFile,
    createCase,
    updateWorkflow,
  };
};
