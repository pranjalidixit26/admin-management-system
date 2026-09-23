import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
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
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import CustomerProfile from './pages/CustomerProfile';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import OrdersPage from './pages/Orders/OrdersPage';

function App() {
    return (
    <BrowserRouter>
      <CartProvider>
      <WishlistProvider>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/account" element={<CustomerProfile />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="manage-orders" element={<OrdersPage />} />
          </Route>
        </Route>
        </Routes>
      </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;