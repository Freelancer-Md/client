import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'super_admin'
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password, formData.role);
      showToast('Login successful!', 'success');
      
      // Redirect based on role
      switch (user.role) {
        case 'super_admin':
          navigate('/super-admin');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'tl':
          navigate('/tl');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      showToast(error, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-center">Sales Dashboard</h1>
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${formData.role === 'super_admin' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('super_admin')}
            >
              Super Admin
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'admin' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'tl' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('tl')}
            >
              Team Lead
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="spinner"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* <div className="mt-2 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
          <p><strong>Demo Credentials:</strong></p>
          <p>Super Admin: superadmin1@example.com / password123</p>
          <p>Admin: admin1@example.com / password123</p>
          <p>Team Lead: tl1@example.com / password123</p>
        </div> */}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;