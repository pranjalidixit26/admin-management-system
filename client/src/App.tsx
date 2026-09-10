import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users/UsersPage';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import RolesPage from './pages/Roles/RolesPage';
import PermissionsPage from './pages/Permissions/PermissionsPage';
import GuestRoute from './components/GuestRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute/>}>
        <Route path="/login" element={<Login/>}/>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage/>}/>
            <Route path="permissions" element={<PermissionsPage/>}/>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;