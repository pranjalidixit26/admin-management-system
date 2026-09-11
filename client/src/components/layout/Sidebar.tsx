import { Link, useLocation } from 'react-router-dom';
import { theme } from '../../theme';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Roles', path: '/roles' },
  { label: 'Permissions', path: '/permissions' },
  { label: 'Categories', path: '/categories' },
  { label: 'Products', path: '/products' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      style={{
        width: '220px',
        backgroundColor: theme.colors.sidebarBg,
        color: theme.colors.sidebarText,
        padding: theme.spacing(5),
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h2 style={{ marginBottom: theme.spacing(6), color: theme.colors.sidebarTextActive, fontSize: '18px' }}>
        Admin Panel
      </h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: theme.spacing(1) }}>
                <Link
                  to={item.path}
                  style={{
                    display: 'block',
                    padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
                    borderRadius: theme.radius,
                    color: isActive ? theme.colors.sidebarTextActive : theme.colors.sidebarText,
                    backgroundColor: isActive ? theme.colors.sidebarActiveBg : 'transparent',
                    borderLeft: isActive ? `3px solid ${theme.colors.accent}` : '3px solid transparent',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}