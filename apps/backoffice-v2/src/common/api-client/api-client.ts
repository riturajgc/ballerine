import { fetcher } from '../utils/fetcher/fetcher';
import { env } from '../env/env';
import { IApiClient } from './interfaces';
import { handlePromise } from '../utils/handle-promise/handle-promise';

/**
 * @description Prepends the API's base url to an endpoint, and sets options and headers re-used across the API.
 *
 * @param endpoint - The endpoint to append to the API's base url - see {@link endpoints}.
 * @param method - Expects {@link Method} for the HTTP method.
 * @param options - Options to pass into {@link fetcher}.
 * @param schema - A zod schema to validate the response against.
 * @param useCommonEndPoint - Determines whether to use the common base URL or the default base URL.
 * @param rest - Allows overriding any of the defaults set by the API client.
 */
export const apiClient: IApiClient = async ({
  endpoint,
  method,
  options,
  schema,
  useCommonEndPoint,
  body,
  ...rest
}) => {
  // Check if the body is a FormData instance
  const isFormData = body instanceof FormData;
  const headers = isFormData
    ? {
        ...(options?.headers ?? {}),
        // note: do NOT explicitly set 'Content-Type' if body is FormData
      }
    : {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      };

  return handlePromise(
    fetcher({
      url: useCommonEndPoint
        ? `${env.VITE_API_URL_COMMON}/${endpoint}`
        : `${env.VITE_API_URL}/${endpoint}`,
      method,
      options: {
        ...options,
        credentials: 'include',
      },
      headers,
      schema,
      body,
      ...rest,
    }),
  );
};
