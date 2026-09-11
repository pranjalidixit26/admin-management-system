import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users/UsersPage';
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import RolesPage from './pages/Roles/RolesPage';
import PermissionsPage from './pages/Permissions/PermissionsPage';
import GuestRoute from './components/GuestRoute';
import CategoriesPage from './pages/Categories/CategoriesPage';
import ProductsPage from './pages/Products/ProductsPage';
import CustomerLogin from './pages/CustomerLogin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route path="/customer-login" element={<CustomerLogin />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;