import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  token: string;
}

export default function CajaChicaScreen({ token }: Props) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulario de Registro
  const [conductorId, setConductorId] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const fetchCajaChica = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/caja-chica`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCajaChica();
  }, [token]);

  const registrarMonto = async () => {
    if (!monto || !descripcion) {
      Alert.alert('Faltan datos', 'El monto y la descripción son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/caja-chica`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conductor_id: conductorId ? parseInt(conductorId) : null,
          monto: parseFloat(monto),
          descripcion: descripcion,
          fecha_entrega: new Date().toISOString().split('T')[0]
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar.');

      Alert.alert('Éxito', 'Registro guardado correctamente.');
      setMonto('');
      setDescripcion('');
      setConductorId('');
      fetchCajaChica(); // Recarga la lista
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Caja Chica</Text>
      </View>

      <FlatList
        data={historial}
        keyExtractor={item => item.id.toString()}
        onRefresh={fetchCajaChica}
        refreshing={loading}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.cardRegistro}>
            <Text style={styles.sectionTitle}>Registrar Caja Chica</Text>

            <TextInput
              style={styles.input}
              placeholder="ID Conductor (Opcional)"
              placeholderTextColor="#9ca3af"
              value={conductorId}
              onChangeText={setConductorId}
              keyboardType="number-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Monto en Lempiras (Ej: 500.00)"
              placeholderTextColor="#9ca3af"
              value={monto}
              onChangeText={setMonto}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Descripción del gasto / viático"
              placeholderTextColor="#9ca3af"
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <TouchableOpacity style={styles.btnPrimary} onPress={registrarMonto} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Registrar Monto</Text>}
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <View style={styles.cardHeader}>
              <Text style={styles.montoText}>L. {Number(item.monto).toFixed(2)}</Text>
              <View style={styles.badgeDate}>
                <Text style={styles.badgeDateText}>{item.fecha_entrega}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.descripcion}</Text>
            {item.conductor_id && (
              <Text style={styles.cardDetail}>A conductor ID: {item.conductor_id}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No hay historial de movimientos.</Text> : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  topHeader: { backgroundColor: colors.blanco, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  cardRegistro: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borde,
    marginVertical: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal, marginBottom: 12 },
  input: {
    backgroundColor: colors.fondo,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textoPrincipal,
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: colors.marca,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryText: { color: colors.blanco, fontSize: 14, fontWeight: '700' },
  cardItem: {
    backgroundColor: colors.blanco,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  montoText: { fontSize: 18, fontWeight: '800', color: colors.textoPrincipal },
  badgeDate: { backgroundColor: colors.fondo, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.borde },
  badgeDateText: { fontSize: 11, fontWeight: '600', color: colors.textoSecundario },
  cardSub: { fontSize: 13, color: colors.textoSecundario, marginTop: 6 },
  cardDetail: { fontSize: 12, color: colors.marca, fontWeight: '600', marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.textoSecundario, marginTop: 40 },
});