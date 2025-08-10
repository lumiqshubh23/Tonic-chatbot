import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for persistent login on mount
  useEffect(() => {
    const checkPersistentLogin = () => {
      const authToken = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');

      if (authToken && username) {
        // For JWT tokens, we could validate them here
        // For now, we'll just check if they exist
        setIsAuthenticated(true);
        setUser(username);
      }
      setLoading(false);
    };

    checkPersistentLogin();
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(username, password, rememberMe);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);

        // Store JWT token and user info
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('username', response.user);
        
        if (rememberMe) {
          localStorage.setItem('loginTime', (Date.now() / 1000).toString());
          toast.success('Login successful - You\'ll stay logged in even after page refresh!');
        } else {
          toast.success('Login successful!');
        }

        return true;
      } else {
        toast.error(response.message || 'Invalid username or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('loginTime');
      toast.success('Logged out successfully!');
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
