import axios from 'axios';

const customerApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer');
      window.location.href = '/customer-login';
    }
    return Promise.reject(error);
  },
);

export default customerApi;