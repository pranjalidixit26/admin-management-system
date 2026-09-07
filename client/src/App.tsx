import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users/UsersPage';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;