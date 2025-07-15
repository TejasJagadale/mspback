import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://makalukaga-prod.mpeoplesnet.com/api/login', formData);
      console.log(response.data);
      
      // Check if login was successful based on the response structure
      if (response.data.message === "Login successful") {
        // Store user data and token
        localStorage.setItem('authToken', response.data.data.AuthToken);
        localStorage.setItem('userData', JSON.stringify(response.data.data.system_user));
        
        // Update authentication state
        setIsAuthenticated(true);
        
        // Route to dashboard
        navigate('/dashboard');
      } else {
        // Handle unsuccessful login
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      // Handle errors
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'An error occurred during login';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  );
};

export default Login;