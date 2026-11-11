import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  token: string;
  user: any;
  onAsignar: (solicitud: any) => void;
}

export default function SolicitudesScreen({ token, user, onAsignar }: Props) {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isAdmin = user?.rol === 'admin';

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/solicitudes`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSolicitudes(Array.isArray(data) ? data : data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitudes();
  }, [token]);

  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Solicitudes pendientes</Text>
      </View>

      <FlatList
        data={solicitudes}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={fetchSolicitudes}
        refreshing={loading}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <View style={styles.row}>
              <Text style={styles.codeText}>Solicitud #{item.id}</Text>
              <Text style={styles.dateText}>{item.created_at?.substring(0, 10)}</Text>
            </View>

            <Text style={styles.conductorName}>
              {item.conductor?.usuario?.name || 'Conductor #' + item.conductor_id}
            </Text>

            <View style={styles.destinationBadge}>
              <Text style={styles.destinationText}>{(item.tipo_destino || 'VEHICULO').toUpperCase()}</Text>
            </View>

            <Text style={styles.activityText}>{item.descripcion_actividad || 'Sin detalle de actividad'}</Text>

            {isAdmin && item.estado === 'pendiente' && (
              <TouchableOpacity onPress={() => onAsignar(item)}>
                <Text style={styles.assignLink}>Asignar monto →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No hay solicitudes pendientes</Text> : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  topHeader: { backgroundColor: colors.blanco, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 21, fontWeight: '700', color: colors.textoPrincipal },
  list: { padding: 20 },
  cardItem: { backgroundColor: colors.blanco, borderRadius: 16, padding: 17, borderWidth: 1, borderColor: colors.borde, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeText: { fontSize: 15, fontWeight: '700', color: colors.textoPrincipal },
  dateText: { fontSize: 12, color: colors.textoSecundario },
  conductorName: { fontSize: 18, fontWeight: '700', color: colors.textoPrincipal, marginTop: 6 },
  destinationBadge: { backgroundColor: colors.marcaClaro, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, marginTop: 8 },
  destinationText: { color: colors.marcaOscuro, fontWeight: '700', fontSize: 12 },
  activityText: { fontSize: 14, color: colors.textoSecundario, marginTop: 10 },
  assignLink: { color: colors.marca, fontWeight: '700', fontSize: 14, alignSelf: 'flex-end', marginTop: 12 },
  emptyText: { textAlign: 'center', color: colors.textoSecundario, marginTop: 40 },
});