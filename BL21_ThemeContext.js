// =====================================================
// FILE: BL21_ThemeContext.js
// =====================================================
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Цвета для светлой темы
export const lightTheme = {
  // Основные цвета
  primary: '#20A0A0',
  secondary: '#45B7D1',
  
  // Фоновые цвета
  background: '#FFFFFF',
  surface: '#F8F9FA',
  card: '#FFFFFF',
  
  // Цвета текста
  text: '#333333',
  textSecondary: '#666666',
  textHint: '#999999',
  textDisabled: '#CCCCCC',
  
  // Цвета границ
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Цвета статусов
  error: '#FF4444',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Цвета иконок
  icon: '#666666',
  iconActive: '#20A0A0',
  
  // Тени
  shadow: '#000000',
  
  // Статус бар
  statusBar: 'dark-content',
};

// Цвета для тёмной темы
export const darkTheme = {
  // Основные цвета
  primary: '#40C0C0',
  secondary: '#6B8C8C',
  
  // Фоновые цвета
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  
  // Цвета текста
  text: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textHint: '#808080',
  textDisabled: '#555555',
  
  // Цвета границ
  border: '#333333',
  divider: '#2C2C2C',
  
  // Цвета статусов
  error: '#FF6B6B',
  success: '#66BB6A',
  warning: '#FFB74D',
  info: '#64B5F6',
  
  // Цвета иконок
  icon: '#B0B0B0',
  iconActive: '#40C0C0',
  
  // Тени
  shadow: '#000000',
  
  // Статус бар
  statusBar: 'light-content',
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка сохраненной темы
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@theme_mode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('@theme_mode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const setTheme = async (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('@theme_mode', isDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme,
        toggleTheme,
        setTheme,
        isLoading,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
