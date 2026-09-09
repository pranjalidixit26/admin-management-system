import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const storedUser=localStorage.getItem('user');
  const currentUser=storedUser?JSON.parse(storedUser):null;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    navigate('/login');
  };

  return (
    <header
      style={{
        height: '60px',
        backgroundColor: '#1e293b',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid #334155',
      }}
    >
      <h3 style={{ margin: 0 }}>Welcome, {currentUser?.name ?? 'User'}</h3>
      <button
        onClick={handleLogout}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </header>
  );
}