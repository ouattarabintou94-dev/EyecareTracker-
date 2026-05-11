import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAPI, setToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('token'),
        ]);
        if (savedUser && savedToken) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = async (phone, password) => {
    const res = await loginAPI(phone, password);
    const { token, user: userData } = res.data;
    setToken(token);
    setUser(userData);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    clearToken();
    setUser(null);
    await AsyncStorage.multiRemove(['token', 'user']);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
