import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface LoginProps {
  correo: string;
  setCorreo: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onLogin: () => void;
  loading: boolean;
}

export default function LoginScreen({ correo, setCorreo, password, setPassword, onLogin, loading }: LoginProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SISTEMA FLOTA</Text>
      <Text style={styles.subtitle}>Inicio de Sesión</Text>

      <Text style={styles.label}>Correo Electrónico</Text>
      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ingresar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, backgroundColor: '#f1f5f9' },
  title: { fontSize: 26, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 14 },
  btn: { backgroundColor: '#0284c7', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});