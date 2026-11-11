import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  user: any;
  onLogout: () => void;
}

export default function PerfilScreen({ user, onLogout }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.nombre || 'U').charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user?.nombre}</Text>
        <Text style={styles.role}>ROL: {(user?.rol || '').toUpperCase()}</Text>
      </View>

      <TouchableOpacity style={styles.btnDanger} onPress={onLogout}>
        <Text style={styles.btnText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0284c7', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  role: { fontSize: 12, fontWeight: '700', color: '#0284c7', marginTop: 2 },
  btnDanger: { backgroundColor: '#ef4444', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});