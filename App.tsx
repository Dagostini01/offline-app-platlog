import React from 'react';
import './src/utils/textPatch';
import './src/utils/textDefaults';
import Routes from './src/routes';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
