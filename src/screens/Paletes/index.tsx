// src/screens/Paletes.tsx
import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  Button,
  Switch,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createPalete } from '../../services/api';

type PaleteForm = {
  rota: number;
  numeroPalete?: string; // pode ficar vazio -> "sem bandeira"
  tipologia: string;
  remontado: boolean; // UI (switch)
  conferido: boolean; // UI (switch)
};

const paleteSchema = yup.object().shape({
  rota: yup
    .number()
    .typeError('Informe o número da rota')
    .required('Informe a rota'),
  // numeroPalete pode ser vazio (vira "sem bandeira" no submit)
  numeroPalete: yup.string().optional(),
  tipologia: yup.string().required('Informe a tipologia'),
  remontado: yup.boolean().required(),
  conferido: yup.boolean().required(),
});

export default function Paletes() {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PaleteForm>({
    resolver: yupResolver(paleteSchema) as any,
    defaultValues: {
      rota: 0,
      numeroPalete: '',
      tipologia: '',
      remontado: false,
      conferido: false,
    },
  });

  const [tipologia, setTipologia] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const items = [
    { label: 'Resfriado', value: 'resfriado' },
    { label: 'Congelado', value: 'congelado' },
    { label: 'Seco', value: 'seco' },
  ];

  // espelha o valor do DropDownPicker em RHF
  useEffect(() => {
    setValue('tipologia', tipologia ?? '');
  }, [tipologia, setValue]);

  const onSubmit = async (data: PaleteForm) => {
    try {
      setSubmitting(true);

      // regra: se vazio -> "sem bandeira"
      const numeroPallet =
        data.numeroPalete && data.numeroPalete.trim() !== ''
          ? data.numeroPalete.trim()
          : 'sem bandeira';

      const payload = {
        // NÃO enviar diaHoje (BD preenche)
        numeroRota: Number(data.rota),
        numeroPallet,
        tipologia: data.tipologia,
        remontado: data.remontado ? ('sim' as const) : ('nao' as const),
        conferido: data.conferido ? ('sim' as const) : ('nao' as const),
      };

      const saved = await createPalete(payload);

      Alert.alert('Sucesso', `Palete "${saved?.numeroPallet}" cadastrado!`); // FIX

      // reset parcial
      setValue('numeroPalete', '');
      setValue('remontado', false);
      setValue('conferido', false);
      setTipologia(null);
      setValue('tipologia', '');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (
        msg.toLowerCase().includes('conflito') ||
        msg.toLowerCase().includes('já existe')
      ) {
        Alert.alert('Atenção', 'Já existe palete para este dia/rota/número.');
      } else {
        Alert.alert('Erro', msg || 'Falha ao salvar palete');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <Text style={styles.title}>Cadastro de Paletes</Text>
            <Text>Data: {new Date().toLocaleDateString('pt-BR')}</Text>

            <Text>Rota</Text>
            <Controller
              control={control}
              name="rota"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder="Informe o número da rota"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(t) => onChange(Number(t))}
                />
              )}
            />
            {errors.rota && (
              <Text style={styles.error}>{String(errors.rota.message)}</Text>
            )}

            <Text>Palete (número ou "sem bandeira")</Text>
            <Controller
              control={control}
              name="numeroPalete"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  placeholder='Deixe em branco se for "sem bandeira"'
                  value={value ?? ''}
                  onChangeText={onChange}
                  onEndEditing={() => {
                    if (!value || value.trim() === '') onChange('sem bandeira');
                  }}
                />
              )}
            />
            {errors.numeroPalete && (
              <Text style={styles.error}>
                {String(errors.numeroPalete.message)}
              </Text>
            )}

            <Text>Tipologia</Text>
            <Controller
              control={control}
              name="tipologia"
              render={({ fieldState: { error } }) => (
                <>
                  <DropDownPicker
                    open={open}
                    setOpen={(v) =>
                      setOpen(typeof v === 'function' ? v(open) : v)
                    }
                    items={items}
                    value={tipologia}
                    setValue={(cb) => {
                      const selected =
                        typeof cb === 'function' ? cb(tipologia) : cb;
                      setTipologia(selected as string | null);
                      return selected as any;
                    }}
                    listMode="SCROLLVIEW"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Selecione a tipologia"
                    zIndex={1000}
                  />
                  {error && (
                    <Text style={styles.error}>{String(error.message)}</Text>
                  )}
                </>
              )}
            />

            <View style={styles.switchContainer}>
              <Text>Remontado?</Text>
              <Controller
                control={control}
                name="remontado"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text>Conferido?</Text>
              <Controller
                control={control}
                name="conferido"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
            </View>

            <Button
              title={submitting ? 'Salvando...' : 'Salvar Palete'}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  keyboard: { flex: 1 },
  container: { flex: 1, padding: 20, paddingBottom: 40 },
  title: { fontSize: 20, marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6,
    borderColor: '#ccc',
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    height: 40,
    marginBottom: 10,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    zIndex: 999,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  error: { color: 'red', marginBottom: 10 },
});
