import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { api, type Pagination, type Post } from '../api/client';
import { PostCard } from '../components/PostCard';

interface PageResult {
  page: number;
  posts: Post[];
  pagination: Pagination | null;
  error: string;
}

export function PostsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const [result, setResult] = useState<PageResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listPosts(page)
      .then((res) => !cancelled && setResult({ page, posts: res.data, pagination: res.pagination, error: '' }))
      .catch((err) => !cancelled && setResult({ page, posts: [], pagination: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [page]);

  // loading until the response for the *current* page arrives
  const loading = result?.page !== page;
  const posts = result?.posts ?? [];
  const pagination = result?.pagination;
  const error = result?.error;

  return (
    <section>
      <h1>Latest posts</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {loading && !posts.length && <p className="muted">Loading…</p>}
      {!loading && !error && !posts.length && <p className="muted">No posts yet — be the first to write one.</p>}
      <div className="stack" aria-busy={loading}>
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
            ← Newer
          </button>
          <span className="muted">
            Page {page} of {pagination.totalPages}
          </span>
          <button disabled={page >= pagination.totalPages} onClick={() => setParams({ page: String(page + 1) })}>
            Older →
          </button>
        </nav>
      )}
    </section>
  );
}
