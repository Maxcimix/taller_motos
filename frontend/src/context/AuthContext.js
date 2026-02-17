import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    authAPI.getMe()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, logout]);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);

    const { token: newToken, user: userData } = data;

    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isMecanico = () => user?.role === 'MECANICO';

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
    isMecanico,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return context;
};

export default AuthContext;