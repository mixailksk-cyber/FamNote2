import './BL01_Imports';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppContent from './BL11_AppContent';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}