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
  solicitud: any | null;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export default function AsignarMontoModal({ solicitud, onClose, token, onSuccess }: Props) {
  const [gasolineras, setGasolineras] = useState<any[]>([]);
  const [gasolineraId, setGasolineraId] = useState<number | null>(null);
  const [horasVigencia, setHorasVigencia] = useState('2');
  const [montoVehiculo, setMontoVehiculo] = useState('1000');
  const [montoMgp, setMontoMgp] = useState('500');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tipo = solicitud?.tipo_destino || 'vehiculo';
  const showVehiculo = tipo === 'vehiculo' || tipo === 'ambos';
  const showMgp = tipo === 'mgp' || tipo === 'ambos';

  useEffect(() => {
    if (solicitud) {
      setLoading(true);
      fetch(`${API_URL}/gasolineras`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          const list = Array.isArray(d) ? d : d.data || [];
          const activas = list.filter((g: any) => g.activo);
          setGasolineras(activas);
          if (activas.length > 0) setGasolineraId(activas[0].id);
        })
        .finally(() => setLoading(false));
    }
  }, [solicitud, token]);

  const totalCalculado =
    (showVehiculo ? parseFloat(montoVehiculo) || 0 : 0) +
    (showMgp ? parseFloat(montoMgp) || 0 : 0);

  const asignarOrden = async () => {
    if (!gasolineraId) {
      Alert.alert('Aviso', 'Selecciona una gasolinera autorizada.');
      return;
    }
    const horas = parseInt(horasVigencia);
    if (!horas || horas < 1 || horas > 3) {
      Alert.alert('Aviso', 'Las horas de vigencia deben ser entre 1 y 3.');
      return;
    }

    const detalles = [];
    if (showVehiculo) {
      const val = parseFloat(montoVehiculo);
      if (!val || val <= 0) return Alert.alert('Aviso', 'Ingresa un monto válido para el vehículo.');
      detalles.push({ tipo_destino: 'vehiculo', vehiculo_id: solicitud.vehiculo_id, monto: val });
    }
    if (showMgp) {
      const val = parseFloat(montoMgp);
      if (!val || val <= 0) return Alert.alert('Aviso', 'Ingresa un monto válido para el MGP.');
      detalles.push({ tipo_destino: 'mgp', descripcion_mgp: solicitud.descripcion_mgp, monto: val });
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/ordenes`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          solicitud_id: solicitud.id,
          gasolinera_id: gasolineraId,
          horas_vigencia: horas,
          detalles: detalles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.message || 'Error al generar orden');

      Alert.alert('Éxito', 'Orden de combustible generada y asignada.');
      onSuccess();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const rechazarSolicitud = async () => {
    Alert.alert('Confirmación', '¿Estás seguro de rechazar esta solicitud?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            const res = await fetch(`${API_URL}/solicitudes/${solicitud.id}/rechazar`, {
              method: 'POST',
              headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('No se pudo rechazar la solicitud.');
            Alert.alert('Rechazada', 'La solicitud ha sido rechazada.');
            onSuccess();
            onClose();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (!solicitud) return null;

  return (
    <Modal visible={!!solicitud} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Asignar Monto</Text>
              <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
            </View>

            {/* Resumen */}
            <View style={styles.resumenCard}>
              <Text style={styles.resumenLabel}>SOLICITANTE</Text>
              <Text style={styles.resumenTitle}>{solicitud.conductor?.usuario?.name || 'Conductor #' + solicitud.conductor_id}</Text>
              <Text style={styles.resumenSub}>{solicitud.descripcion_actividad}</Text>
            </View>

            {/* Gasolinera */}
            <Text style={styles.label}>Gasolinera Autorizada</Text>
            {loading ? (
              <ActivityIndicator color={colors.marca} />
            ) : (
              <View style={styles.pickerContainer}>
                {gasolineras.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.gasolineraItem, gasolineraId === g.id && styles.gasolineraItemActive]}
                    onPress={() => setGasolineraId(g.id)}
                  >
                    <Text style={[styles.gasolineraName, gasolineraId === g.id && styles.whiteText]}>{g.nombre}</Text>
                    <Text style={[styles.gasolineraDir, gasolineraId === g.id && styles.whiteSubText]}>{g.direccion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Vigencia */}
            <Text style={styles.label}>Horas de vigencia para canje (1 a 3)</Text>
            <View style={styles.vigenciaRow}>
              {['1', '2', '3'].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.vigenciaChip, horasVigencia === h && styles.vigenciaChipActive]}
                  onPress={() => setHorasVigencia(h)}
                >
                  <Text style={[styles.vigenciaText, horasVigencia === h && styles.whiteText]}>{h} {h === '1' ? 'hora' : 'horas'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monto Vehículo */}
            {showVehiculo && (
              <View style={styles.montoBlock}>
                <Text style={styles.label}>Monto Vehículo (Lempiras)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={montoVehiculo}
                  onChangeText={setMontoVehiculo}
                />
                <View style={styles.quickButtonsRow}>
                  {['500', '1000', '1500'].map((val) => (
                    <TouchableOpacity key={val} style={styles.quickBtn} onPress={() => setMontoVehiculo(val)}>
                      <Text style={styles.quickBtnText}>L. {val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Monto MGP */}
            {showMgp && (
              <View style={styles.montoBlock}>
                <Text style={styles.label}>Monto Planta Eléctrica / MGP (Lempiras)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={montoMgp}
                  onChangeText={setMontoMgp}
                />
                <View style={styles.quickButtonsRow}>
                  {['500', '1000', '1500'].map((val) => (
                    <TouchableOpacity key={val} style={styles.quickBtn} onPress={() => setMontoMgp(val)}>
                      <Text style={styles.quickBtnText}>L. {val}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Total */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>TOTAL A AUTORIZAR</Text>
              <Text style={styles.totalNumber}>L. {totalCalculado.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.btnAssign} onPress={asignarOrden} disabled={submitting}>
              {submitting ? <ActivityIndicator color={colors.blanco} /> : <Text style={styles.btnAssignText}>Generar y Asignar Orden</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnReject} onPress={rechazarSolicitud} disabled={submitting}>
              <Text style={styles.btnRejectText}>Rechazar Solicitud</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.blanco, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  content: { padding: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal },
  closeBtn: { fontSize: 20, color: colors.textoSecundario },
  resumenCard: { backgroundColor: colors.fondo, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.borde },
  resumenLabel: { fontSize: 10, fontWeight: '800', color: colors.marca, letterSpacing: 0.5 },
  resumenTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal, marginTop: 2 },
  resumenSub: { fontSize: 12, color: colors.textoSecundario, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textoPrincipal, marginTop: 14, marginBottom: 6 },
  pickerContainer: { gap: 6 },
  gasolineraItem: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.borde, backgroundColor: colors.fondo },
  gasolineraItemActive: { backgroundColor: colors.marca, borderColor: colors.marca },
  gasolineraName: { fontWeight: '700', fontSize: 14, color: colors.textoPrincipal },
  gasolineraDir: { fontSize: 11, color: colors.textoSecundario, marginTop: 2 },
  vigenciaRow: { flexDirection: 'row', gap: 8 },
  vigenciaChip: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.borde, alignItems: 'center', backgroundColor: colors.fondo },
  vigenciaChipActive: { backgroundColor: colors.marca, borderColor: colors.marca },
  vigenciaText: { fontSize: 13, fontWeight: '700', color: colors.textoSecundario },
  montoBlock: { marginTop: 6 },
  input: { backgroundColor: colors.fondo, borderWidth: 1, borderColor: colors.borde, borderRadius: 10, padding: 12, fontSize: 15, fontWeight: '700', color: colors.textoPrincipal },
  quickButtonsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: { flex: 1, paddingVertical: 6, backgroundColor: colors.marcaClaro, borderRadius: 8, alignItems: 'center' },
  quickBtnText: { color: colors.marcaOscuro, fontWeight: '700', fontSize: 12 },
  totalBox: { backgroundColor: colors.marcaClaro, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 18 },
  totalLabel: { fontSize: 11, fontWeight: '800', color: colors.marcaOscuro, letterSpacing: 0.5 },
  totalNumber: { fontSize: 26, fontWeight: '900', color: colors.marcaOscuro, marginTop: 2 },
  btnAssign: { backgroundColor: colors.marca, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  btnAssignText: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  btnReject: { height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  btnRejectText: { color: colors.vencida, fontWeight: '700', fontSize: 14 },
  whiteText: { color: colors.blanco },
  whiteSubText: { color: '#E5DAF7' },
});