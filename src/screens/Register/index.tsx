import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Register() {
  const navigation = useNavigation<any>();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Preencha seus dados abaixo</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} placeholder="Seu nome completo" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} keyboardType="email-address" placeholder="exemplo@email.com" />

        <Text style={styles.label}>Senha</Text>
        <TextInput style={styles.input} secureTextEntry placeholder="Digite uma senha" />

        <Text style={styles.label}>Tipo de usuário</Text>
        <TextInput style={styles.input} placeholder="Admin ou UserComum" />

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
        >
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b7ed7',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    elevation: 4
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666'
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15
  },
  button: {
    backgroundColor: '#2b7ed7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },
  linkText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#2b7ed7',
    fontWeight: '500'
  }
});
