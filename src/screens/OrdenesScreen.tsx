import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  token: string;
}

export default function OrdenesScreen({ token }: Props) {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setOrdenes(Array.isArray(data) ? data : data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrdenes();
  }, [token]);

  const getBadgeStyle = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'abierta': return { bg: colors.abiertaFondo, text: colors.abierta };
      case 'completada': return { bg: colors.completadaFondo, text: colors.completada };
      case 'vencida': return { bg: colors.vencidaFondo, text: colors.vencida };
      default: return { bg: colors.pendienteFondo, text: colors.pendiente };
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Órdenes</Text>
      </View>

      <FlatList
        data={ordenes}
        keyExtractor={item => item.id.toString()}
        onRefresh={fetchOrdenes}
        refreshing={loading}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const badge = getBadgeStyle(item.estado);
          return (
            <View style={styles.cardItem}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{item.numero_orden}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {(item.estado || 'PENDIENTE').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.stationText}>Gasolinera: {item.gasolinera?.nombre || 'General'}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
        !loading ? <Text style={styles.emptyText}>Sin órdenes todavía</Text> : undefined        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  topHeader: { backgroundColor: colors.blanco, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 21, fontWeight: '700', color: colors.textoPrincipal },
  list: { padding: 20 },
  cardItem: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 13 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  stationText: { fontSize: 14, color: colors.textoSecundario, marginTop: 6 },
  emptyText: { textAlign: 'center', color: colors.textoSecundario, marginTop: 40 },
});