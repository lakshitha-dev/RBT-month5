import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { api, type Comment, type Post } from '../api/client';
import { ancestorFor } from '../ancestors';
import { useAuth } from '../useAuth';
import { useStage } from '../stage-context';
import { formatDate } from '../format';

export function PostPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const ancestor = ancestorFor(post?.title ?? '');
  useStage(ancestor.key);

  const loadComments = useCallback(() => api.listComments(id).then(setComments), [id]);

  useEffect(() => {
    Promise.all([api.getPost(id).then(setPost), loadComments()]).catch((err) => setError(err.message));
  }, [id, loadComments]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.addComment(id, draft);
      setDraft('');
      await loadComments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (error && !post)
    return (
      <section className="page">
        <h1 className="page__title">This post could not be opened</h1>
        <p className="error" role="alert">
          {error}
        </p>
        <Link to="/">Back to the contents</Link>
      </section>
    );
  if (!post) return <p className="page note">Loading the article…</p>;

  return (
    <article className="page">
      <h1 className="page__title" data-reveal>
        {post.title}
      </h1>
      <p className="byline" data-reveal>
        {post.author_name} · {formatDate(post.created_at)} · filed under {ancestor.group}
      </p>
      <div className="prose">
        {post.content.split(/\n{2,}/).map((para, i) => (
          <p key={i} data-reveal style={{ '--i': i % 6 } as React.CSSProperties}>
            {para}
          </p>
        ))}
      </div>

      <section className="comments" aria-labelledby="comments-title">
        <h2 id="comments-title" className="section__title" data-reveal>
          Comments ({comments.length})
        </h2>
        {comments.length === 0 && <p className="note">No comments yet.</p>}
        <ol className="comments__list">
          {comments.map((c, i) => (
            <li key={c.id} className="comment" data-reveal style={{ '--i': i % 8 } as React.CSSProperties}>
              <p className="comment__who">
                {c.author_name} <span>{formatDate(c.created_at)}</span>
              </p>
              <p>{c.content}</p>
            </li>
          ))}
        </ol>
        {user ? (
          <form onSubmit={submit} className="form">
            <label htmlFor="comment">Add a comment</label>
            <textarea id="comment" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} required />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={sending || !draft.trim()}>
              {sending ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        ) : (
          <p className="note">
            <Link to="/login">Log in</Link> to add a comment.
          </p>
        )}
      </section>
      <Link to="/" className="back" data-reveal>
        Back to the contents
      </Link>
    </article>
  );
}
