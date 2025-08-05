import React, { useState } from 'react';
import {
  Text,
  TextInput,
  Button,
  Switch,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const paleteSchema = yup.object().shape({
  rota: yup.number().typeError('Informe o número da rota').required(),
  numeroPalete: yup.string().required('Informe o número ou "sem bandeira"'),
  tipologia: yup.string().required('Informe a tipologia'),
  remontado: yup.boolean(),
  conferido: yup.boolean()
});

export default function Paletes() {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(paleteSchema),
    defaultValues: {
      rota: 0,
      numeroPalete: '',
      tipologia: '',
      remontado: false,
      conferido: false
    }
  });

  const [open, setOpen] = useState(false);
  const [items] = useState([
    { label: 'Resfriado', value: 'resfriado' },
    { label: 'Congelado', value: 'congelado' },
    { label: 'Seco', value: 'seco' }
  ]);

  const onSubmit = (data: any) => {
    console.log('Palete:', data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Cadastro de Paletes</Text>
          <Text>Data: {new Date().toLocaleDateString()}</Text>

          <Text>Rota</Text>
          <Controller
            control={control}
            name="rota"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={value !== undefined ? String(value) : ''}
                onChangeText={text => onChange(Number(text))}
              />
            )}
          />
          {errors.rota && <Text style={styles.error}>{errors.rota.message}</Text>}

          <Text>Palete (número ou "sem bandeira")</Text>
          <Controller
            control={control}
            name="numeroPalete"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder='Ex: 123 ou "sem bandeira"'
              />
            )}
          />
          {errors.numeroPalete && <Text style={styles.error}>{errors.numeroPalete.message}</Text>}

          <Text>Tipologia</Text>
          <Controller
            control={control}
            name="tipologia"
            render={({ field: { onChange, value } }) => (
              <DropDownPicker
                open={open}
                setOpen={setOpen}
                items={items}
                value={value}
                setValue={onChange}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                placeholder="Selecione a tipologia"
                zIndex={1000}
              />
            )}
          />
          {errors.tipologia && <Text style={styles.error}>{errors.tipologia.message}</Text>}

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

          <Button title="Salvar Palete" onPress={handleSubmit(onSubmit)} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  keyboard: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40
  },
  title: {
    fontSize: 20,
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
    borderRadius: 6
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    height: 40,
    marginBottom: 10
  },
  dropdownContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 10,
    zIndex: 999
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  error: {
    color: 'red',
    marginBottom: 10
  }
});
