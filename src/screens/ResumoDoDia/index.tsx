import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../routes/types';

export default function ResumoDoDia() {
  const route = useRoute<RouteProp<RootStackParamList, 'ResumoDoDia'>>();
  const { data } = route.params;

  const [notas, setNotas] = useState<any[]>([]);
  const [paletes, setPaletes] = useState<any[]>([]);

  useEffect(() => {
    const todasNotas = [
      { rota: 1, nota: 123, tipologia: 'resfriado', data: '28/07/2025' },
      { rota: 2, nota: 456, tipologia: 'congelado', data: '28/07/2025' },
      { rota: 3, nota: 789, tipologia: 'seco', data: '27/07/2025' }
    ];

    const todosPaletes = [
      { rota: 1, numeroPalete: '001', tipologia: 'resfriado', data: '28/07/2025' },
      { rota: 2, numeroPalete: '002', tipologia: 'seco', data: '28/07/2025' },
      { rota: 3, numeroPalete: '003', tipologia: 'congelado', data: '27/07/2025' }
    ];

    const filtradasNotas = todasNotas.filter(n => n.data === data);
    const filtradosPaletes = todosPaletes.filter(p => p.data === data);

    setNotas(filtradasNotas);
    setPaletes(filtradosPaletes);
  }, [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resumo detalhado do dia</Text>
        <Text style={styles.subtitle}>Data: {data}</Text>

        <Text style={styles.section}>Notas ({notas.length})</Text>
        {notas.map((n, index) => (
          <View key={index} style={styles.card}>
            <Text>Rota: {n.rota}</Text>
            <Text>Nota: {n.nota}</Text>
            <Text>Tipologia: {n.tipologia}</Text>
          </View>
        ))}

        <Text style={styles.section}>Paletes ({paletes.length})</Text>
        {paletes.map((p, index) => (
          <View key={index} style={styles.card}>
            <Text>Rota: {p.rota}</Text>
            <Text>Palete: {p.numeroPalete}</Text>
            <Text>Tipologia: {p.tipologia}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 20 },
  section: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 8,
    marginTop: 10
  }
});
