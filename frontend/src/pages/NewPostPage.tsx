import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { api } from '../api/client';
import { ancestorFor } from '../ancestors';
import { useAuth } from '../useAuth';
import { useStage } from '../stage-context';

export function NewPostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // the stage shows the drawing this post will be filed under, as the title is typed
  const ancestor = ancestorFor(title);
  useStage(ancestor.key);

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
    <section className="page">
      <h1 className="page__title" data-reveal>
        Write a post
      </h1>
      <p className="page__lead" data-reveal>
        {title.trim() ? `It will be filed under ${ancestor.group}.` : 'Give it a title and it finds its place in the contents.'}
      </p>
      <form onSubmit={submit} className="form">
        <label data-reveal style={{ '--i': 1 } as React.CSSProperties} htmlFor="title">Title</label>
        <input data-reveal style={{ '--i': 2 } as React.CSSProperties} id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} />
        <label data-reveal style={{ '--i': 3 } as React.CSSProperties} htmlFor="content">Content</label>
        <textarea data-reveal style={{ '--i': 4 } as React.CSSProperties} id="content" rows={14} value={content} onChange={(e) => setContent(e.target.value)} required />
        <label data-reveal style={{ '--i': 5 } as React.CSSProperties} className="checkbox">
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
