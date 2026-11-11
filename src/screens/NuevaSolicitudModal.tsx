import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

type Destino = 'vehiculo' | 'mgp' | 'ambos';

export default function NuevaSolicitudModal({ visible, onClose, token, onSuccess }: Props) {
  const [destino, setDestino] = useState<Destino>('vehiculo');
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [descripcionMgp, setDescripcionMgp] = useState('');
  const [actividad, setActividad] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetch(`${API_URL}/vehiculos`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          const list = Array.isArray(d) ? d : d.data || [];
          setVehiculos(list);
          if (list.length > 0) setVehiculoId(list[0].id);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, token]);

  const enviar = async () => {
    if ((destino === 'vehiculo' || destino === 'ambos') && !vehiculoId) {
      Alert.alert('Aviso', 'Debes seleccionar un vehículo.');
      return;
    }
    if ((destino === 'mgp' || destino === 'ambos') && !descripcionMgp.trim()) {
      Alert.alert('Aviso', 'Ingresa la descripción de la planta generadora (MGP).');
      return;
    }
    if (!actividad.trim()) {
      Alert.alert('Aviso', 'Describe la actividad para la cual requieres combustible.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/solicitudes`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tipo_destino: destino,
          vehiculo_id: destino === 'mgp' ? null : vehiculoId,
          descripcion_mgp: destino === 'vehiculo' ? null : descripcionMgp.trim(),
          descripcion_actividad: actividad.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.message || 'Error al crear solicitud');

      Alert.alert('Éxito', 'Solicitud enviada correctamente a revisión.');
      setActividad('');
      setDescripcionMgp('');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>¿Para qué necesitas combustible?</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de Destino */}
            <Text style={styles.label}>Destino del combustible</Text>
            <View style={styles.destinosRow}>
              {(['vehiculo', 'mgp', 'ambos'] as Destino[]).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.destinoChip, destino === opt && styles.destinoChipActive]}
                  onPress={() => setDestino(opt)}
                >
                  <Text style={[styles.destinoChipText, destino === opt && styles.destinoChipTextActive]}>
                    {opt === 'vehiculo' ? 'Vehículo' : opt === 'mgp' ? 'Planta (MGP)' : 'Ambos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selector de Vehículo */}
            {(destino === 'vehiculo' || destino === 'ambos') && (
              <>
                <Text style={styles.label}>Selecciona el Vehículo</Text>
                {loading ? (
                  <ActivityIndicator color={colors.marca} style={{ marginVertical: 10 }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiculosList}>
                    {vehiculos.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.vehiculoCard, vehiculoId === v.id && styles.vehiculoCardActive]}
                        onPress={() => setVehiculoId(v.id)}
                      >
                        <Text style={[styles.vehiculoPlaca, vehiculoId === v.id && styles.whiteText]}>
                          {v.placa}
                        </Text>
                        <Text style={[styles.vehiculoModelo, vehiculoId === v.id && styles.whiteSubText]}>
                          {v.marca} {v.modelo}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            )}

            {/* Descripción MGP */}
            {(destino === 'mgp' || destino === 'ambos') && (
              <>
                <Text style={styles.label}>Descripción de la Planta (MGP)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Generador portatil de emergencia 5KW"
                  placeholderTextColor="#9ca3af"
                  value={descripcionMgp}
                  onChangeText={setDescripcionMgp}
                />
              </>
            )}

            {/* Actividad */}
            <Text style={styles.label}>Descripción de la actividad</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="¿Qué trabajo o recorrido realizarás?"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={actividad}
              onChangeText={setActividad}
            />

            <TouchableOpacity style={styles.btnSubmit} onPress={enviar} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={colors.blanco} />
              ) : (
                <Text style={styles.btnSubmitText}>Enviar solicitud</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.blanco,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  content: { padding: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal, flex: 1 },
  closeBtn: { fontSize: 20, color: colors.textoSecundario, padding: 4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textoPrincipal, marginTop: 14, marginBottom: 6 },
  destinosRow: { flexDirection: 'row', gap: 8 },
  destinoChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borde,
    alignItems: 'center',
    backgroundColor: colors.fondo,
  },
  destinoChipActive: { backgroundColor: colors.marca, borderColor: colors.marca },
  destinoChipText: { fontSize: 13, fontWeight: '600', color: colors.textoSecundario },
  destinoChipTextActive: { color: colors.blanco, fontWeight: '700' },
  vehiculosList: { flexDirection: 'row', marginBottom: 6 },
  vehiculoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.fondo,
    marginRight: 8,
    minWidth: 120,
  },
  vehiculoCardActive: { backgroundColor: colors.marca, borderColor: colors.marca },
  vehiculoPlaca: { fontWeight: '800', fontSize: 14, color: colors.textoPrincipal },
  vehiculoModelo: { fontSize: 11, color: colors.textoSecundario, marginTop: 2 },
  whiteText: { color: colors.blanco },
  whiteSubText: { color: '#E5DAF7' },
  input: {
    backgroundColor: colors.fondo,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: colors.textoPrincipal,
  },
  textArea: { height: 75, textAlignVertical: 'top' },
  btnSubmit: {
    backgroundColor: colors.marca,
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  btnSubmitText: { color: colors.blanco, fontSize: 15, fontWeight: '700' },
});