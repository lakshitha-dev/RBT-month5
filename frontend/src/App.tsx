import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './useAuth';
import { Stage, StageProvider } from './components/Stage';
import { Footer } from './components/Footer';
import { AuthPage } from './pages/AuthPage';
import { NewPostPage } from './pages/NewPostPage';
import { PostPage } from './pages/PostPage';
import { PostsPage } from './pages/PostsPage';
import { StatusPage } from './pages/StatusPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Header({ home }: { home: boolean }) {
  const { user, logout } = useAuth();
  return (
    <header className="header" data-reveal>
      {/* on the home page the name is the monument at the foot of the first screen instead */}
      {!home && (
        <Link to="/" className="header__mark">
          blogflow
        </Link>
      )}
      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          Posts
        </NavLink>
        <NavLink to="/status">Status</NavLink>
        {user ? (
          <>
            <button type="button" className="link" onClick={logout}>
              Log out ({user.name})
            </button>
            <NavLink to="/new" className="button">
              Write a post
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register" className="button">
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const home = pathname === '/';

  return (
    <StageProvider>
      <div className={`split${home ? ' split--home' : ''}`}>
        <Header home={home} />
        <Stage />
        <main className="column">
          <Routes>
            <Route path="/" element={<PostsPage />} />
            <Route path="/posts/:id" element={<PostPage />} />
            <Route path="/new" element={<NewPostPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </StageProvider>
  );
}
