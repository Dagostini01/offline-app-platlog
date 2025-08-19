import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function AppHeader() {
  const [nome, setNome] = useState('');
  const { logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('@user');
      if (raw) setNome(JSON.parse(raw)?.nome ?? '');
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            setLeaving(true);
            await logout(); // limpa @logged / @user
            // pronto: Routes vai detectar isLogged=false e renderizar AuthRoutes (Login)
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.header}>
      <Text style={styles.welcome} numberOfLines={1}>
        Seja bem-vindo, {nome}!
      </Text>

      <TouchableOpacity
        style={[styles.logoutBtn, leaving && { opacity: 0.7 }]}
        onPress={handleLogout}
        disabled={leaving}
        activeOpacity={0.85}
      >
        {leaving ? <ActivityIndicator /> : <Text style={styles.logoutText}>Sair</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#2b7ed7', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { color: '#fff', fontSize: 16, fontWeight: '700', width: '70%' },
  logoutBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: '#2b7ed7', fontWeight: '700' },
});
