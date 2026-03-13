import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={`nav-item${pathname === '/dashboard' ? ' active' : ''}`}>
        🏠
      </Link>
      <Link to="/add" className="fab">+</Link>
      <Link to="/profile" className={`nav-item${pathname === '/profile' ? ' active' : ''}`}>
        👤
      </Link>
    </nav>
  );
}
