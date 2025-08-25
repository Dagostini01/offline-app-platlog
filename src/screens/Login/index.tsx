import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { getUserByEmail } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const pwdRef = useRef<TextInput>(null);

  const validarCampos = () => {
    const e = email.trim().toLowerCase();
    const s = senha.trim();
    if (!e || !s) {
      Alert.alert('Atenção', 'Preencha email e senha.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(e)) {
      Alert.alert('Atenção', 'Email inválido.');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (loading) return; // evita toques repetidos
    if (!validarCampos()) return;

    try {
      setLoading(true);
      const e = email.trim().toLowerCase();
      const user = await getUserByEmail(e);

      if (!user) {
        Alert.alert(
          'Usuário não encontrado',
          'O cadastro de novos usuários é realizado apenas via painel Web. Acesse pelo navegador para criar sua conta.'
        );
        return;
      }

      if ((user.senha ?? '') !== senha) {
        Alert.alert('Falha no login', 'Email ou senha incorretos.');
        return;
      }

      await login({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      });

      // ✅ não precisa navigation.reset; <Routes> troca para AppRoutes sozinho
      // console.log('[Login] sucesso'); // debug opcional
    } catch (err: any) {
      console.log('[Login] erro', err?.message || err);
      const m = String(err?.message || '').toLowerCase();
      if (m.includes('aborted') || m.includes('timeout')) {
        Alert.alert('Conexão lenta', 'A API não respondeu a tempo. Verifique o endereço da API.');
      } else if (m.includes('network')) {
        Alert.alert('Sem conexão', 'Não foi possível alcançar o servidor. Confira o API_BASE.');
      } else {
        Alert.alert('Erro', 'Não foi possível validar o usuário agora.');
      }
    } finally {

      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Entre com seu email e senha</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="email@exemplo.com"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => pwdRef.current?.focus()}
          />

          <Text style={styles.label}>Senha</Text>
          <View style={styles.pwdRow}>
            <TextInput
              ref={pwdRef}
              style={[styles.input, styles.pwdInput]}
              secureTextEntry={!showPwd}
              placeholder="••••••••"
              value={senha}
              onChangeText={setSenha}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPwd(v => !v)}
              style={styles.eyeBtn}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#2b7ed7', fontWeight: '700', width: 60, textAlign: 'center' }}>
                {showPwd ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.8 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Cadastro via Web',
                'O cadastro de novos usuários é feito apenas via painel Web. Acesse pelo navegador.'
              )
            }
          >
            <Text style={styles.linkText}>Não tem conta? Cadastre-se (Web)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2b7ed7' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    elevation: 4
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  subtitle: { fontSize: 14, marginBottom: 20, color: '#666' },
  label: { fontSize: 14, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 10, borderRadius: 8, marginBottom: 15
  },
  pwdRow: { flexDirection: 'row', alignItems: 'center' },
  pwdInput: { flex: 1, marginBottom: 0 },
  eyeBtn: { marginLeft: 10, paddingHorizontal: 8, paddingVertical: 6 },
  button: {
    backgroundColor: '#2b7ed7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12
  },
  buttonText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  linkText: { marginTop: 15, textAlign: 'center', color: '#2b7ed7', fontWeight: '500' }
});
