// client/src/components/layout/AppLayout.tsx

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar/>
      <div style={{ flex: 1 }}>
        <Header/>
        <main style={{ padding: '20px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}