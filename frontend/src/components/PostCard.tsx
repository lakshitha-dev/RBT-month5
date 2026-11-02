import { Link } from 'react-router';
import type { Post } from '../api/client';
import { formatDate } from '../format';

export function PostCard({ post }: { post: Post }) {
  const excerpt = post.content.length > 160 ? `${post.content.slice(0, 160).trimEnd()}…` : post.content;
  return (
    <article className="card">
      <h2 className="card-title">
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <p className="meta">
        {post.author_name ?? 'Unknown author'} · {formatDate(post.created_at)}
        {post.comment_count !== undefined && ` · ${post.comment_count} comment${post.comment_count === 1 ? '' : 's'}`}
      </p>
      <p>{excerpt}</p>
    </article>
  );
}
