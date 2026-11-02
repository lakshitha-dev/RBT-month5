import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { api, type Comment, type Post } from '../api/client';
import { useAuth } from '../useAuth';
import { formatDate } from '../format';

export function PostPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

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

  if (error && !post) return <p className="error" role="alert">{error}</p>;
  if (!post) return <p className="muted">Loading…</p>;

  return (
    <article>
      <Link to="/" className="muted">
        ← All posts
      </Link>
      <h1>{post.title}</h1>
      <p className="meta">
        {post.author_name} · {formatDate(post.created_at)}
      </p>
      <div className="content">{post.content}</div>

      <section className="comments">
        <h2>Comments ({comments.length})</h2>
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <p className="meta">
              {c.author_name} · {formatDate(c.created_at)}
            </p>
            <p>{c.content}</p>
          </div>
        ))}
        {user ? (
          <form onSubmit={submit} className="form">
            <label htmlFor="comment">Add a comment</label>
            <textarea id="comment" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} required />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={sending || !draft.trim()}>
              {sending ? 'Posting…' : 'Post comment'}
            </button>
          </form>
        ) : (
          <p className="muted">
            <Link to="/login">Log in</Link> to comment.
          </p>
        )}
      </section>
    </article>
  );
}
