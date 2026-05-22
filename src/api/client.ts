import type { ApiErrorPayload } from '../types/domain';

export type ServiceName = 'product' | 'order';

export class ApiError extends Error {
  code: string;
  httpStatus: number;
  details: unknown;

  constructor(code: string, httpStatus: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  toPayload(): ApiErrorPayload {
    return { code: this.code, message: this.message, details: this.details };
  }
}

const PRODUCT_BASE = import.meta.env.VITE_PRODUCT_API_URL;
const ORDER_BASE = import.meta.env.VITE_ORDER_API_URL;

function baseUrlFor(service: ServiceName): string {
  const url = service === 'product' ? PRODUCT_BASE : ORDER_BASE;
  if (!url) {
    throw new ApiError(
      'CONFIG_ERROR',
      0,
      `Base URL для сервиса ${service} не задан. Проверьте .env.local`,
    );
  }
  return url;
}

interface RequestOptions<TBody> {
  body?: TBody;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
  authToken?: string | null;
}

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

function buildUrl(
  service: ServiceName,
  path: string,
  query?: RequestOptions<unknown>['query'],
): string {
  const url = new URL(baseUrlFor(service) + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: Partial<ApiErrorPayload> | null = null;
  try {
    payload = (await response.json()) as Partial<ApiErrorPayload>;
  } catch {
    // ignore — body может быть пустым или не JSON
  }
  const code = payload?.code ?? `HTTP_${response.status}`;
  const message = payload?.message ?? response.statusText ?? 'Unknown error';
  return new ApiError(code, response.status, message, payload?.details);
}

async function rawRequest<TBody>(
  method: string,
  service: ServiceName,
  path: string,
  options?: RequestOptions<TBody>,
): Promise<Response> {
  const url = buildUrl(service, path, options?.query);
  const headers: Record<string, string> = {};
  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options?.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError('NETWORK_ERROR', 0, 'Сеть недоступна. Проверьте подключение и backend.');
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return response;
}

export async function request<T>(
  method: string,
  service: ServiceName,
  path: string,
  options?: RequestOptions<unknown>,
): Promise<T> {
  const response = await rawRequest(method, service, path, options);
  if (response.status === 204) return undefined as T;
  const payload = (await response.json()) as Envelope<T>;
  return payload.data;
}

export async function requestEnvelope<T>(
  method: string,
  service: ServiceName,
  path: string,
  options?: RequestOptions<unknown>,
): Promise<Envelope<T>> {
  const response = await rawRequest(method, service, path, options);
  if (response.status === 204) {
    return { data: undefined as T };
  }
  return (await response.json()) as Envelope<T>;
}
