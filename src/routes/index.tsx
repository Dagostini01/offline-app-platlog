// src/routes/index.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppRoutes from './app.routes';
import AuthRoutes from './auth.routes';
import { useAuth } from '../context/AuthContext';

export default function Routes() {
  const { isLogged, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // 👇 Remonta o container ao trocar de auth → zera histórico e evita “ficar no Login”
  return (
    <NavigationContainer key={isLogged ? 'app' : 'auth'}>
      {isLogged ? <AppRoutes /> : <AuthRoutes />}
    </NavigationContainer>
  );
}
