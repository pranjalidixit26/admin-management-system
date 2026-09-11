import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import NetworkBackground from '../NetworkBackground';
import { theme } from '../../theme';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: theme.colors.pageBg,
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <NetworkBackground />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Header />
          <main style={{ padding: '20px' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}