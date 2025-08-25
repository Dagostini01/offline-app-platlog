import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Button, Platform, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../routes/types';
import { listNotas, listPaletes, toISO, toBR } from '../../services/api';

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [totalNotas, setTotalNotas] = useState(0);
  const [totalPaletes, setTotalPaletes] = useState(0);
  const [itensConferidos, setItensConferidos] = useState(0);
  const [totalAvarias, setTotalAvarias] = useState(0);

  // Deixe a função estável com useCallback para o useFocusEffect não disparar à toa
  const fetchResumoPorData = useCallback(async (date: Date) => {
    const diaISO = toISO(date);

    const [notas, paletes] = await Promise.all([
      listNotas(diaISO),
      listPaletes(diaISO),
    ]);

    const notasArr = Array.isArray(notas) ? notas : [];
    const palsArr  = Array.isArray(paletes) ? paletes : [];

    setTotalNotas(notasArr.length);
    setTotalPaletes(palsArr.length);

    const notasConf   = notasArr.filter((n: any) => (n.conferidoPor ?? '').toString().trim() !== '').length;
    const paletesConf = palsArr.filter((p: any) => p.conferido === 'sim' || p.conferido === true).length;
    setItensConferidos(notasConf + paletesConf);

    const isAvaria = (v: any) => v === 'sim' || v === true || v === 1;
    const notasAvaria   = notasArr.filter((n: any) => isAvaria(n.avaria) || (Array.isArray(n.avarias) && n.avarias.length > 0)).length;
    const paletesAvaria = palsArr.filter((p: any) => isAvaria(p.avaria)).length;
    setTotalAvarias(notasAvaria + paletesAvaria);
  }, []);

  //1-Buscar ao montar
  useEffect(() => {
    fetchResumoPorData(selectedDate).catch(() => {
      setTotalNotas(0); setTotalPaletes(0); setItensConferidos(0); setTotalAvarias(0);
    });
  }, [fetchResumoPorData, selectedDate]);

  //2-Buscar ao focar na tela (toda vez que volta de outra rota)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          await fetchResumoPorData(selectedDate);
        } catch {
          if (!isActive) return;
          setTotalNotas(0); setTotalPaletes(0); setItensConferidos(0); setTotalAvarias(0);
        }
      })();
      return () => { isActive = false; };
    }, [fetchResumoPorData, selectedDate])
  );

  // 3-Pull-to-refresh opcional
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchResumoPorData(selectedDate);
    } finally {
      setRefreshing(false);
    }
  }, [fetchResumoPorData, selectedDate]);

  const onDateChange = (_: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Resumo do Dia</Text>

        <View style={styles.datePicker}>
          <Text style={styles.dateLabel}>Data:</Text>
          <Button title={toBR(selectedDate)} onPress={() => setShowPicker(true)} />
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.grid}>
          <View style={styles.box}>
            <Text style={styles.label}>Total de Notas</Text>
            <Text style={styles.value}>{totalNotas}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Total de Paletes</Text>
            <Text style={styles.value}>{totalPaletes}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Itens Conferidos</Text>
            <Text style={styles.value}>{itensConferidos}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Total de Avarias</Text>
            <Text style={styles.value}>{totalAvarias}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('ResumoDoDia', {
              data: toBR(selectedDate),
              diaISO: toISO(selectedDate),
            } as any)
          }
        >
          <Text style={styles.buttonText}>Ver detalhes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  datePicker: { marginBottom: 20 },
  dateLabel: { fontSize: 16, marginBottom: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  box: { backgroundColor: '#f1f1f1', padding: 20, borderRadius: 10, marginBottom: 20, width: '48%' },
  label: { fontSize: 16 },
  value: { fontSize: 24, fontWeight: 'bold', color: '#2b7ed7', marginTop: 5 },
  button: { backgroundColor: '#2b7ed7', padding: 10, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', width: '100%', textAlign: 'center' },
});
