import { terminal } from 'virtual:terminal';
import { HttpError } from '../../errors/http-error';
import { handlePromise } from '../handle-promise/handle-promise';
import { isZodError } from '../is-zod-error/is-zod-error';
import { IFetcher } from './interfaces';

export const fetcher: IFetcher = async ({
  url,
  method,
  body,
  headers,
  options,
  timeout = 10000,
  schema,
  isBlob = false,
}) => {
  const controller = new AbortController();
  const { signal } = controller;

  // 1. Detect if it's FormData
  const isFormData = body instanceof FormData;

  // 2. Adjust headers accordingly
  //    - If it's FormData, do NOT set the content-type to JSON
  const finalHeaders = {
    ...(headers || {}),
  };
  if (!isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // 3. Decide how to pass `body`
  //    - If it's FormData, pass it as-is
  //    - Else, if it's not GET and has a body, JSON.stringify it
  const finalBody =
    method !== 'GET' && body
      ? isFormData
        ? body
        : JSON.stringify(body) // normal JSON payload
      : undefined;

  const timeoutRef = setTimeout(() => {
    controller.abort(`Request timed out after ${timeout}ms`);
  }, timeout);

  // 4. Make the request
  const [res, fetchError] = await handlePromise(
    fetch(url, {
      ...options,
      method,
      signal,
      body: finalBody, // pass the properly formatted body
      headers: finalHeaders,
    }),
  );
  clearTimeout(timeoutRef);

  if (fetchError) {
    console.error(fetchError);
    throw fetchError;
  }

  if (!res.ok) {
    let message = `${res.statusText} (${res.status})`;

    if (res.status === 400) {
      const json = await res.json();
      if (Array.isArray(json?.errors)) {
        message = json?.errors?.map(({ message }) => `${message}\n`)?.join('');
      } else if (json.message) {
        message = json.message;
      }
    }

    console.error(message);
    throw new HttpError(res.status, message);
  }

  // 5. Parse the response
  const parseResponse = async () => {
    if (res.status === 204) {
      return [undefined, undefined];
    }
    if (isBlob) {
      return await handlePromise(res.blob());
    }
    if (!res.headers.get('content-length') || res.headers.get('content-length') > '0') {
      return await handlePromise(res.json());
    }
    return [undefined, undefined];
  };
  const [data, jsonError] = await parseResponse();

  if (jsonError) {
    console.error(jsonError);
    throw jsonError;
  }

  // 6. Validate with zod (if schema is provided)
  const [validatedData, validationError] = await handlePromise(schema.parseAsync(data));

  if (validationError) {
    const messages = isZodError(validationError)
      ? validationError.errors.map(({ path, message }) => `${path.join('.')} (${message}),\n`)
      : [validationError];

    terminal.error('❌ Validation error:\n', { messages, url });
    throw validationError;
  }

  return validatedData;
};
