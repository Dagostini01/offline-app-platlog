import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../routes/types';

export default function Home() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [totalNotas, setTotalNotas] = useState(0);
  const [totalPaletes, setTotalPaletes] = useState(0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const fetchResumoPorData = (date: Date) => {
    const dia = formatDate(date);

    const mockNotas = [
      { data: '28/07/2025', nota: 123 },
      { data: '28/07/2025', nota: 456 },
      { data: '27/07/2025', nota: 789 }
    ];

    const mockPaletes = [
      { data: '28/07/2025', palete: '001' },
      { data: '27/07/2025', palete: '002' },
      { data: '28/07/2025', palete: '003' }
    ];

    const notasDoDia = mockNotas.filter(n => n.data === dia);
    const paletesDoDia = mockPaletes.filter(p => p.data === dia);

    setTotalNotas(notasDoDia.length);
    setTotalPaletes(paletesDoDia.length);
  };

  useEffect(() => {
    fetchResumoPorData(selectedDate);
  }, [selectedDate]);

  const onDateChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Resumo do Dia</Text>

        <View style={styles.datePicker}>
          <Text style={styles.dateLabel}>Data:</Text>
          <Button title={formatDate(selectedDate)} onPress={() => setShowPicker(true)} />
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

        <View style={styles.box}>
          <Text style={styles.label}>Total de Notas:</Text>
          <Text style={styles.value}>{totalNotas}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Total de Paletes:</Text>
          <Text style={styles.value}>{totalPaletes}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ResumoDoDia', { data: formatDate(selectedDate) })}
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
  box: {
    backgroundColor: '#f1f1f1',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20
  },
  label: { fontSize: 16 },
  value: { fontSize: 24, fontWeight: 'bold', color: '#2b7ed7', marginBottom: 10 },
  button: {
    backgroundColor: '#2b7ed7',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
