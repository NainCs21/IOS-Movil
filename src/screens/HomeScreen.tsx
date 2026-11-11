import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { API_URL } from '../api/config';

interface Props {
  user: any;
  setScreen: (screen: string) => void;
  token: string;
}

export default function HomeScreen({ user, setScreen, token }: Props) {
  const [totalOrdenes, setTotalOrdenes] = useState(0);
  const [totalSolicitudes, setTotalSolicitudes] = useState(0);

  useEffect(() => {
    const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };
    fetch(`${API_URL}/ordenes`, { headers })
      .then(r => r.json())
      .then(d => setTotalOrdenes(Array.isArray(d) ? d.length : (d.data || []).length))
      .catch(() => {});

    fetch(`${API_URL}/solicitudes`, { headers })
      .then(r => r.json())
      .then(d => setTotalSolicitudes(Array.isArray(d) ? d.length : (d.data || []).length))
      .catch(() => {});
  }, [token]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.welcome}>Hola, {user?.nombre || 'Usuario'}</Text>
        <Text style={styles.role}>ROL: {(user?.rol || '').toUpperCase()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Resumen</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.statCard, { borderLeftColor: '#0284c7' }]} onPress={() => setScreen('ordenes')}>
          <Text style={styles.statNum}>{totalOrdenes}</Text>
          <Text style={styles.statLabel}>Órdenes Activas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.statCard, { borderLeftColor: '#eab308' }]} onPress={() => setScreen('solicitudes')}>
          <Text style={styles.statNum}>{totalSolicitudes}</Text>
          <Text style={styles.statLabel}>Solicitudes</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnAction} onPress={() => Alert.alert('Escáner QR', 'Apertura de cámara.')}>
          <Text style={styles.btnActionText}>📷 Escanear QR</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  banner: { backgroundColor: '#0284c7', padding: 18, borderRadius: 12, marginBottom: 16 },
  welcome: { fontSize: 20, fontWeight: '800', color: '#fff' },
  role: { fontSize: 13, color: '#e0f2fe', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 10, borderLeftWidth: 4, elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btnAction: { flex: 1, backgroundColor: '#0284c7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});