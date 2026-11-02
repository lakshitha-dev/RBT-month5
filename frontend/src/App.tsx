import { NavLink, Route, Routes } from 'react-router';
import { useAuth } from './useAuth';
import { AuthPage } from './pages/AuthPage';
import { NewPostPage } from './pages/NewPostPage';
import { PostPage } from './pages/PostPage';
import { PostsPage } from './pages/PostsPage';
import { StatusPage } from './pages/StatusPage';

export default function App() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <NavLink to="/" className="brand">
            BlogFlow
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end>
              Posts
            </NavLink>
            <NavLink to="/status">Status</NavLink>
            {user ? (
              <>
                <NavLink to="/new">Write</NavLink>
                <button className="link" onClick={logout}>
                  Log out ({user.name})
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register">Sign up</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/new" element={<NewPostPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
