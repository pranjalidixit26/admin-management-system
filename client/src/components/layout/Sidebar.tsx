import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside style={{ width: '220px', backgroundColor: '#1e293b', color: 'white', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Admin Panel</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>Users</Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/roles" style={{ color: 'white', textDecoration: 'none' }}>Roles</Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/permissions" style={{ color: 'white', textDecoration: 'none' }}>Permissions</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}