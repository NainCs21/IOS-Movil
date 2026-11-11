import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { API_URL } from '../api/config';

interface Props {
  token: string;
}

export default function SolicitudesScreen({ token }: Props) {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/solicitudes`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    cargarSolicitudes();
  }, [token]);

  return (
    <View style={styles.flex}>
      {loading && solicitudes.length === 0 ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={solicitudes}
          keyExtractor={(item) => item.id.toString()}
          onRefresh={cargarSolicitudes}
          refreshing={loading}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>Solicitud #{item.id}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{(item.estado || 'PENDIENTE').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.sub}>Destino: {(item.tipo_destino || '').toUpperCase()}</Text>
              <Text style={styles.detail}>{item.descripcion_actividad || 'Sin detalle'}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No hay solicitudes registradas.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  badge: { backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#854d0e' },
  sub: { fontSize: 13, color: '#334155', marginBottom: 2 },
  detail: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});