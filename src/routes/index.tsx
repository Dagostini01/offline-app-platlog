import React, { useState } from 'react';
import AuthRoutes from './auth.routes';
import AppRoutes from './app.routes';

export default function Routes() {
  // Simulação de autenticação — troque por AuthContext ou AsyncStorage
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  //const isAuthenticated = true; // Força como se já tivesse logado

  return isAuthenticated ? <AppRoutes /> : <AuthRoutes />;
}
