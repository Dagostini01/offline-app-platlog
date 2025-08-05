import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const notaSchema = yup.object().shape({
  rota: yup.number().typeError('Informe o número da rota').required(),
  nota: yup.number().typeError('Informe o número da nota').required(),
  tipologia: yup.string().required('Selecione a tipologia'),
  conferido: yup.boolean(),
  conferente: yup.string().when('conferido', {
    is: true,
    then: schema => schema.required('Informe quem conferiu'),
    otherwise: schema => schema.optional()
  }),
  avaria: yup.boolean(),
  tipoErro: yup.string().when('avaria', {
    is: true,
    then: schema => schema.required('Informe o tipo de erro')
  }),
  codigoProduto: yup.string().when('avaria', {
    is: true,
    then: schema => schema.required('Informe o código do produto')
  }),
  descricaoProduto: yup.string().when('avaria', {
    is: true,
    then: schema => schema.required('Informe a descrição')
  }),
  quantidade: yup.number().when('avaria', {
    is: true,
    then: schema => schema.required('Informe a quantidade')
  }),
  tipologiaAvaria: yup.string().when('avaria', {
    is: true,
    then: schema => schema.required('Informe a tipologia da avaria')
  })
});

export default function Notas() {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(notaSchema),
    defaultValues: {
      rota: 0,
      nota: 0,
      tipologia: '',
      conferido: false,
      conferente: '',
      avaria: false,
      tipoErro: '',
      codigoProduto: '',
      descricaoProduto: '',
      quantidade: 0,
      tipologiaAvaria: ''
    }
  });

  const conferido = useWatch({ control, name: 'conferido' });
  const avaria = useWatch({ control, name: 'avaria' });

  const [openTipologia, setOpenTipologia] = useState(false);
  const [openAvariaTipo, setOpenAvariaTipo] = useState(false);

  const [tipologiaItems] = useState([
    { label: 'Resfriado', value: 'resfriado' },
    { label: 'Congelado', value: 'congelado' },
    { label: 'Seco', value: 'seco' }
  ]);

  const onSubmit = (data: any) => {
    console.log('Dados da Nota:', data);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={styles.title}>Cadastro de Notas</Text>
          <Text>Data: {new Date().toLocaleDateString()}</Text>

          <Text>Rota</Text>
          <Controller
            control={control}
            name="rota"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(value)}
                onChangeText={text => onChange(Number(text))}
              />
            )}
          />
          {errors.rota && <Text style={styles.error}>{errors.rota.message}</Text>}

          <Text>Nota</Text>
          <Controller
            control={control}
            name="nota"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(value)}
                onChangeText={text => onChange(Number(text))}
              />
            )}
          />
          {errors.nota && <Text style={styles.error}>{errors.nota.message}</Text>}

          <Text>Tipologia</Text>
          <Controller
            control={control}
            name="tipologia"
            render={({ field: { onChange, value } }) => (
              <DropDownPicker
                open={openTipologia}
                setOpen={setOpenTipologia}
                items={tipologiaItems}
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
            <Text>Conferido?</Text>
            <Controller
              control={control}
              name="conferido"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>

          {conferido && (
            <>
              <Text>Quem conferiu?</Text>
              <Controller
                control={control}
                name="conferente"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} />
                )}
              />
              {errors.conferente && <Text style={styles.error}>{errors.conferente.message}</Text>}
            </>
          )}

          <View style={styles.switchContainer}>
            <Text>Avaria?</Text>
            <Controller
              control={control}
              name="avaria"
              render={({ field: { onChange, value } }) => (
                <Switch value={value} onValueChange={onChange} />
              )}
            />
          </View>

          {avaria && (
            <>
              <Text>Tipo do erro</Text>
              <Controller
                control={control}
                name="tipoErro"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} placeholder="ex: embalagem" value={value} onChangeText={onChange} />
                )}
              />
              {errors.tipoErro && <Text style={styles.error}>{errors.tipoErro.message}</Text>}

              <Text>Código do produto</Text>
              <Controller
                control={control}
                name="codigoProduto"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} />
                )}
              />
              {errors.codigoProduto && <Text style={styles.error}>{errors.codigoProduto.message}</Text>}

              <Text>Descrição do produto</Text>
              <Controller
                control={control}
                name="descricaoProduto"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} />
                )}
              />
              {errors.descricaoProduto && <Text style={styles.error}>{errors.descricaoProduto.message}</Text>}

              <Text>Quantidade</Text>
              <Controller
                control={control}
                name="quantidade"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} keyboardType="numeric" value={String(value)} onChangeText={text => onChange(Number(text))} />
                )}
              />
              {errors.quantidade && <Text style={styles.error}>{errors.quantidade.message}</Text>}

              <Text>Tipologia da Avaria</Text>
              <Controller
                control={control}
                name="tipologiaAvaria"
                render={({ field: { onChange, value } }) => (
                  <DropDownPicker
                    open={openAvariaTipo}
                    setOpen={setOpenAvariaTipo}
                    items={tipologiaItems}
                    value={value ?? null}
                    setValue={onChange}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                    placeholder="Selecione a tipologia"
                    zIndex={900}
                  />
                )}
              />
              {errors.tipologiaAvaria && <Text style={styles.error}>{errors.tipologiaAvaria.message}</Text>}
            </>
          )}

          <Button title="Salvar Nota" onPress={handleSubmit(onSubmit)} />
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
