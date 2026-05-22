import type { AdminLoginResponse, AdminUser } from '../types/domain';
import { request } from './client';

interface LoginInput {
  login: string;
  password: string;
}

export function login(input: LoginInput, signal?: AbortSignal): Promise<AdminLoginResponse> {
  return request<AdminLoginResponse>('POST', 'order', '/auth/login', { body: input, signal });
}

export function me(token: string, signal?: AbortSignal): Promise<AdminUser> {
  return request<AdminUser>('GET', 'order', '/auth/me', { authToken: token, signal });
}

export function logout(token: string, signal?: AbortSignal): Promise<void> {
  return request<void>('POST', 'order', '/auth/logout', { authToken: token, signal });
}
