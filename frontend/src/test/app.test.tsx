import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, test, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../auth';

function mockFetch(routes: Record<string, { status?: number; body: unknown }>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const match = Object.keys(routes).find((prefix) => url.startsWith(prefix));
    if (!match) throw new Error(`Unexpected fetch ${url}`);
    const { status = 200, body } = routes[match];
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('BlogFlow SPA', () => {
  test('lists published posts from the API', async () => {
    const fetchSpy = mockFetch({
      '/api/posts': {
        body: {
          success: true,
          data: [{ id: 1, title: 'Docker for Node.js', content: 'Containers!', author_name: 'Alice', comment_count: 2, created_at: '2026-10-01T00:00:00Z' }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    });
    renderAt('/');
    expect(await screen.findByText('Docker for Node.js')).toBeInTheDocument();
    expect(screen.getByText(/2 comments/)).toBeInTheDocument();
    const postsCall = fetchSpy.mock.calls.map(([url]) => String(url)).find((url) => url.startsWith('/api/posts'));
    expect(postsCall).toContain('published=true');
  });

  test('shows the API error message when loading fails', async () => {
    mockFetch({ '/api/posts': { status: 500, body: { success: false, error: { message: 'DB unavailable' } } } });
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('DB unavailable');
  });

  test('logging in stores the session and updates the nav', async () => {
    mockFetch({
      '/api/auth/login': { body: { success: true, data: { user: { id: 7, email: 'a@example.com', name: 'Alice' }, token: 'jwt' } } },
      '/api/posts': { body: { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } },
    });
    renderAt('/login');
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Email'), 'a@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('button', { name: /Log out \(Alice\)/ })).toBeInTheDocument();
    expect(localStorage.getItem('blogflow.token')).toBe('jwt');
  });

  test('status page reports a healthy backend', async () => {
    mockFetch({
      '/api/health': {
        body: {
          status: 'healthy',
          timestamp: '2026-10-29T10:00:00Z',
          uptime: 125,
          version: 'sha-abc1234',
          checks: { database: { status: 'up', latency_ms: 3 }, memory: { rss: 52428800, heapUsed: 1, heapTotal: 1 } },
        },
      },
    });
    renderAt('/status');
    expect(await screen.findByText('All systems operational')).toBeInTheDocument();
    expect(screen.getByText('sha-abc1234')).toBeInTheDocument();
  });

  test('writing a post redirects anonymous users to login', async () => {
    renderAt('/new');
    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument();
  });
});
