// All calls go to the same origin under /api — nginx (prod) or the Vite dev proxy forwards
// them to the backend, so the bundle never needs a build-time API URL.

export interface User {
  id: number;
  email: string;
  name: string;
  bio?: string | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  author_id: number;
  author_name?: string;
  comment_count?: number;
  created_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author_name?: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Health {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: { status: string; latency_ms?: number; error?: string };
    memory: { rss: number; heapUsed: number; heapTotal: number };
  };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const TOKEN_KEY = 'blogflow.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const details = body?.error?.details?.map((d: { msg: string }) => d.msg).join(', ');
    throw new ApiError(details || body?.error?.message || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

type Envelope<T> = { success: boolean; data: T };

export const api = {
  listPosts: (page = 1, limit = 10) =>
    request<Envelope<Post[]> & { pagination: Pagination }>(`/api/posts?page=${page}&limit=${limit}&published=true`),
  getPost: (id: string) => request<Envelope<Post>>(`/api/posts/${id}`).then((r) => r.data),
  listComments: (postId: string) => request<Envelope<Comment[]>>(`/api/posts/${postId}/comments`).then((r) => r.data),
  addComment: (postId: string, content: string) =>
    request<Envelope<Comment>>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  createPost: (input: { title: string; content: string; published: boolean }) =>
    request<Envelope<Post>>('/api/posts', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data),
  login: (email: string, password: string) =>
    request<Envelope<{ user: User; token: string }>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((r) => r.data),
  register: (input: { email: string; password: string; name: string }) =>
    request<Envelope<{ user: User; token: string }>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.data),
  // /api/health is rewritten to the backend's /health by nginx and the Vite proxy
  health: async (): Promise<Health> => {
    const res = await fetch('/api/health');
    return res.json();
  },
};
