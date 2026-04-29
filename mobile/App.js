// App.js
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initLocalDb } from './src/database/localDb';

export default function App() {
  useEffect(() => {
    // Initialiser la base de données locale SQLite
    try {
      initLocalDb();
    } catch (error) {
      console.error('Erreur initialisation DB locale:', error);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#1B5E20" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
