import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  token: string;
}

type TabType = 'conductores' | 'vehiculos' | 'gasolineras';

export default function CatalogosScreen({ token }: Props) {
  const [tab, setTab] = useState<TabType>('vehiculos');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalogo = async (currentTab: TabType) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${currentTab}`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalogo(tab);
  }, [tab, token]);

  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Catálogos</Text>
      </View>

      {/* Botones de alternancia MaterialButtonToggleGroup */}
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, tab === 'conductores' && styles.toggleBtnActive]} onPress={() => setTab('conductores')}>
          <Text style={[styles.toggleText, tab === 'conductores' && styles.toggleTextActive]}>Conductores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, tab === 'vehiculos' && styles.toggleBtnActive]} onPress={() => setTab('vehiculos')}>
          <Text style={[styles.toggleText, tab === 'vehiculos' && styles.toggleTextActive]}>Vehículos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, tab === 'gasolineras' && styles.toggleBtnActive]} onPress={() => setTab('gasolineras')}>
          <Text style={[styles.toggleText, tab === 'gasolineras' && styles.toggleTextActive]}>Gasolineras</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            {tab === 'vehiculos' && (
              <>
                <Text style={styles.itemTitle}>{item.marca} {item.modelo}</Text>
                <Text style={styles.itemSubtitle}>Placa: {item.placa} • Año: {item.anio}</Text>
                <Text style={styles.itemDetail}>Combustible: {item.tipo_combustible?.toUpperCase()}</Text>
              </>
            )}
            {tab === 'conductores' && (
              <>
                <Text style={styles.itemTitle}>{item.usuario?.name || 'Conductor #' + item.id}</Text>
                <Text style={styles.itemSubtitle}>Cargo: {item.cargo}</Text>
                <Text style={styles.itemDetail}>Tel: {item.telefono}</Text>
              </>
            )}
            {tab === 'gasolineras' && (
              <>
                <Text style={styles.itemTitle}>{item.nombre}</Text>
                <Text style={styles.itemSubtitle}>{item.direccion}</Text>
                <Text style={styles.itemDetail}>QR: {item.codigo_qr}</Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  topHeader: { backgroundColor: colors.blanco, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 21, fontWeight: '700', color: colors.textoPrincipal },
  toggleRow: { flexDirection: 'row', backgroundColor: colors.blanco, padding: 16, gap: 8 },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: colors.marcaClaro, borderColor: colors.marca },
  toggleText: { fontSize: 13, color: colors.textoSecundario, fontWeight: '600' },
  toggleTextActive: { color: colors.marcaOscuro, fontWeight: '700' },
  list: { padding: 20 },
  cardItem: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: 10,
  },
  itemTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal },
  itemSubtitle: { fontSize: 14, color: colors.textoSecundario, marginTop: 4 },
  itemDetail: { fontSize: 12, color: colors.textoSecundario, marginTop: 2 },
});