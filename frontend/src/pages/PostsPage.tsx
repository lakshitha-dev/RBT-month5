import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api, type Pagination, type Post } from '../api/client';
import { ancestorFor, ANCESTORS, GROUP_ORDER, type AncestorKey } from '../ancestors';
import { useStage, useStageControls } from '../stage-context';
import { shortDate } from '../format';
import { Colophon } from '../components/Colophon';
import { useFitWidth } from '../useFitWidth';

const PAGE_SIZE = 30;

interface PageResult {
  page: number;
  posts: Post[];
  pagination: Pagination | null;
  error: string;
}

function Contents({ posts }: { posts: Post[] }) {
  const { setPreview } = useStageControls();
  const groups = new Map<AncestorKey, Post[]>();
  for (const p of posts) {
    const key = ancestorFor(p.title).key;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  let row = 0;

  return (
    <div className="contents" onPointerLeave={() => setPreview(null)}>
      {GROUP_ORDER.filter((k) => groups.has(k)).map((key) => (
        <section key={key} className="contents__group" aria-labelledby={`group-${key}`}>
          <h3 id={`group-${key}`} className="contents__label" data-reveal>
            {ANCESTORS[key].group}
          </h3>
          <ul className="rows">
            {groups.get(key)!.map((p) => (
              <li key={p.id} data-reveal style={{ '--i': row++ % 8 } as React.CSSProperties}>
                <Link
                  to={`/posts/${p.id}`}
                  className="row"
                  onPointerEnter={() => setPreview(key)}
                  onFocus={() => setPreview(key)}
                  onBlur={() => setPreview(null)}
                >
                  <span className="row__text">
                    <span className="row__title">{p.title}</span>
                    <span className="row__meta">
                      {p.author_name ?? 'Unknown author'}
                      {p.comment_count !== undefined && ` · ${p.comment_count} comment${p.comment_count === 1 ? '' : 's'}`}
                      {/* narrow screens: the date joins this line instead of sitting alone at the far edge */}
                      <span className="row__date-inline"> · {shortDate(p.created_at)}</span>
                    </span>
                  </span>
                  <time className="row__date" dateTime={p.created_at}>
                    {shortDate(p.created_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function PostsPage() {
  useStage('press');
  const markRef = useRef<HTMLHeadingElement>(null);
  useFitWidth(markRef);
  const [params, setParams] = useSearchParams();
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const [result, setResult] = useState<PageResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listPosts(page, PAGE_SIZE)
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
    <>
      <section className="hero" aria-labelledby="title">
        <p className="hero__lead" data-reveal>
          Engineering notes on building, shipping and running Node apps.
        </p>
        <h1 id="title" className="hero__mark" ref={markRef}>
          <span>blogflow</span>
        </h1>
      </section>

      <section className="section" aria-labelledby="contents-title" aria-busy={loading}>
        <h2 id="contents-title" className="section__title" data-reveal>
          Contents
        </h2>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {loading && !posts.length && <p className="note">Loading the contents…</p>}
        {!loading && !error && !posts.length && (
          <p className="note">
            Nothing published yet. <Link to="/new">Write the first post</Link>.
          </p>
        )}
        <Contents posts={posts} />
        {pagination && pagination.totalPages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button type="button" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>
              Newer
            </button>
            <span className="note">
              Page {page} of {pagination.totalPages}
            </span>
            <button type="button" disabled={page >= pagination.totalPages} onClick={() => setParams({ page: String(page + 1) })}>
              Older
            </button>
          </nav>
        )}
      </section>

      <Colophon />
    </>
  );
}
