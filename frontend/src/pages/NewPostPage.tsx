import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { api } from '../api/client';
import { useAuth } from '../useAuth';

export function NewPostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const post = await api.createPost({ title, content, published });
      navigate(`/posts/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section>
      <h1>Write a post</h1>
      <form onSubmit={submit} className="form">
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} />
        <label htmlFor="content">Content</label>
        <textarea id="content" rows={12} value={content} onChange={(e) => setContent(e.target.value)} required />
        <label className="checkbox">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publish now
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Publish'}
        </button>
      </form>
    </section>
  );
}
