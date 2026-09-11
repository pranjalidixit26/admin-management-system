import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Tabs, Form, Input, Button, Alert } from 'antd';
import axios from 'axios';
import { theme } from '../theme';
import NetworkBackground from '../components/NetworkBackground';

interface LoginValues {
  email: string;
  password: string;
}

interface SignupValues {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export default function CustomerLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: LoginValues) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await axios.post('http://localhost:3000/customer-auth/login', values);
      localStorage.setItem('customer_access_token', response.data.access_token);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (values: SignupValues) => {
    setSignupError('');
    setSignupSuccess(false);
    setSubmitting(true);
    try {
      await axios.post('http://localhost:3000/customer-auth/signup', values);
      setSignupSuccess(true);
      setMode('login');
    } catch (err: any) {
      if (err?.response?.data?.message) {
        setSignupError(
          Array.isArray(err.response.data.message)
            ? err.response.data.message[0]
            : err.response.data.message,
        );
      } else {
        setSignupError('Failed to create account. Email may already be in use.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.pageBg,
        padding: 24,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <NetworkBackground />
      </div>

      <Card style={{ width: 480, position: 'relative', zIndex: 1 }} styles={{ body: { padding: '48px 48px 40px' } }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${theme.colors.sidebarBg}, #6366f1)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L3 7v6c0 5 4 8.5 9 9 5-.5 9-4 9-9V7l-9-5z"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <Link
            to="/"
            style={{
              fontFamily: theme.font.heading,
              fontWeight: 800,
              fontSize: 22,
              color: theme.colors.sidebarBg,
              textDecoration: 'none',
            }}
          >
            Our Store
          </Link>
          <span style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
            Sign in to start shopping
          </span>
        </div>

        <Tabs
          activeKey={mode}
          onChange={(key) => setMode(key as 'login' | 'signup')}
          centered
          items={[
            {
              key: 'login',
              label: 'Sign In',
              children: (
                <Form layout="vertical" onFinish={handleLogin} style={{ marginTop: 24 }}>
                  {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />}
                  {signupSuccess && (
                    <Alert
                      type="success"
                      message="Account created! You can now sign in."
                      style={{ marginBottom: 16 }}
                      showIcon
                    />
                  )}
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
                  >
                    <Input size="large" placeholder="you@example.com" />
                  </Form.Item>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Enter your password' }]}
                  >
                    <Input.Password size="large" placeholder="••••••••" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={submitting} size="large">
                    Sign in
                  </Button>
                </Form>
              ),
            },
            {
              key: 'signup',
              label: 'Create Account',
              children: (
                <Form layout="vertical" onFinish={handleSignup} style={{ marginTop: 24 }}>
                  {signupError && (
                    <Alert type="error" message={signupError} style={{ marginBottom: 16 }} showIcon />
                  )}
                  <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Enter your name' }]}>
                    <Input size="large" placeholder="Jane Doe" />
                  </Form.Item>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
                  >
                    <Input size="large" placeholder="you@example.com" />
                  </Form.Item>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      { required: true, message: 'Choose a password' },
                      { min: 6, message: 'Password must be at least 6 characters' },
                    ]}
                  >
                    <Input.Password size="large" placeholder="••••••••" />
                  </Form.Item>
                  <Form.Item label="Phone (optional)" name="phone">
                    <Input size="large" placeholder="9876543210" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={submitting} size="large">
                    Create account
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}