import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  ordenId: number;
  token: string;
  user: any;
  onBack: () => void;
  onOpenQr: () => void;
}

export default function OrdenDetalleScreen({ ordenId, token, user, onBack, onOpenQr }: Props) {
  const [orden, setOrden] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState<string>('--:--');
  const [evidenciasLocales, setEvidenciasLocales] = useState<Record<number, string[]>>({});

  const fetchOrden = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes/${ordenId}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrden(data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchOrden();
  }, [ordenId]);

  // Contador de 15 minutos exacto al fragment_orden_detalle.xml de Android
  useEffect(() => {
    if (orden?.vence_apertura && (orden.estado === 'abierta' || orden.estado === 'rehabilitada')) {
      const interval = setInterval(() => {
        const vence = new Date(orden.vence_apertura.replace(' ', 'T')).getTime();
        const diff = vence - Date.now();
        if (diff <= 0) {
          setMinutosRestantes('00:00 (Agotado)');
          clearInterval(interval);
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setMinutosRestantes(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [orden]);

  // Subida simulada/real de evidencia fotográfica
  const subirFoto = async (detalleId: number, tipoFoto: string) => {
    setActionLoading(true);
    try {
      // Form Data multipart como exige tu método en Laravel
      const formData = new FormData();
      formData.append('tipo', tipoFoto);
      // Simula archivo para pruebas móviles si no hay expo-image-picker instalado
      formData.append('foto', {
        uri: 'https://placehold.co/600x400/png',
        name: `evidencia_${tipoFoto}_${detalleId}.png`,
        type: 'image/png',
      } as any);

      const res = await fetch(`${API_URL}/detalle-ordenes/${detalleId}/evidencia`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir fotografía.');

      Alert.alert('Evidencia Registrada', `Foto de ${tipoFoto.toUpperCase()} guardada exitosamente.`);
      setEvidenciasLocales((prev) => ({
        ...prev,
        [detalleId]: [...(prev[detalleId] || []), tipoFoto],
      }));
      fetchOrden();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const rehabilitar = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes/${orden.id}/rehabilitar`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo rehabilitar la orden.');
      Alert.alert('Éxito', 'La orden ha sido rehabilitada con nueva vigencia.');
      fetchOrden();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !orden) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.marca} />
      </View>
    );
  }

  const isPendiente = orden.estado === 'pendiente';
  const isOpen = orden.estado === 'abierta' || orden.estado === 'rehabilitada';
  const isVencida = orden.estado === 'vencida';
  const lineas = orden.detalles || [];
  const montoTotal = lineas.reduce((acc: number, l: any) => acc + (parseFloat(l.monto) || 0), 0);

  return (
    <View style={styles.flex}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Detalle de orden</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.orderNumber}>{orden.numero_orden}</Text>
        <View style={[styles.badge, { backgroundColor: isPendiente ? colors.pendienteFondo : isOpen ? colors.abiertaFondo : colors.completadaFondo }]}>
          <Text style={[styles.badgeText, { color: isPendiente ? colors.pendiente : isOpen ? colors.abierta : colors.completada }]}>
            {(orden.estado || '').toUpperCase()}
          </Text>
        </View>

        {/* 1. VISTA DE ORDEN PROTEGIDA (PENDIENTE) */}
        {isPendiente && (
          <View style={styles.protectedCard}>
            <Text style={{ fontSize: 44, marginBottom: 8 }}>🔒</Text>
            <Text style={styles.protectedTitle}>Orden protegida</Text>
            <Text style={styles.protectedSubtitle}>
              El monto y la gasolinera se revelan tras escanear el código QR en la estación.
            </Text>
            <Text style={styles.protectedPlazo}>Plazo de retiro: {orden.vence_asignacion || 'En espera'}</Text>
            {user?.rol === 'conductor' && (
              <TouchableOpacity style={styles.btnPrimaryPill} onPress={onOpenQr}>
                <Text style={styles.btnPrimaryPillText}>📷 Escanear QR de gasolinera</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 2. VISTA REVELADA TRAS ESCANEO (ABIERTA O COMPLETADA) */}
        {!isPendiente && (
          <>
            {/* Tarjeta Cuenta Regresiva de 15 Minutos */}
            {isOpen && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTimer}>{minutosRestantes}</Text>
                <Text style={styles.warningSub}>Tiempo restante (Máx. 15 minutos)</Text>
                <Text style={styles.warningSub}>Al llegar a 00:00 la orden vencerá automáticamente.</Text>
              </View>
            )}

            {/* Gasolinera */}
            <View style={styles.infoRow}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>📍</Text>
              <View>
                <Text style={styles.stationTitle}>{orden.gasolinera?.nombre || 'General'}</Text>
                <Text style={styles.stationDir}>{orden.gasolinera?.direccion || 'Sin dirección'}</Text>
              </View>
            </View>

            {/* Monto Total */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>MONTO TOTAL AUTORIZADO</Text>
              <Text style={styles.totalNumber}>L. {montoTotal.toFixed(2)}</Text>
              <Text style={styles.totalSub}>Distribuido en {lineas.length} líneas de despacho</Text>
            </View>

            {/* Líneas de Combustible y Evidencias */}
            <Text style={styles.sectionTitle}>Líneas de Combustible</Text>
            {lineas.map((linea: any) => {
              const fotosTomadas = evidenciasLocales[linea.id] || [];
              return (
                <View key={linea.id} style={styles.lineaCard}>
                  <Text style={styles.lineaTitle}>
                    {linea.tipo_destino === 'vehiculo'
                      ? `Vehículo: ${linea.vehiculo?.placa || '#' + linea.vehiculo_id}`
                      : `MGP: ${linea.descripcion_mgp || 'Planta'}`}{' '}
                    ({linea.tipo_combustible})
                  </Text>
                  <Text style={styles.lineaMonto}>L. {Number(linea.monto).toFixed(2)}</Text>

                  {/* Acciones de Evidencia (Conductor) */}
                  {user?.rol === 'conductor' && isOpen && (
                    <View style={styles.evidenciasGrid}>
                      {['bomba', 'tablero', 'tanque', 'factura'].map((tipoFoto) => {
                        const listo = fotosTomadas.includes(tipoFoto) || !!linea.url_evidencia;
                        return (
                          <TouchableOpacity
                            key={tipoFoto}
                            style={[styles.btnFoto, listo && styles.btnFotoListo]}
                            onPress={() => subirFoto(linea.id, tipoFoto)}
                            disabled={actionLoading}
                          >
                            <Text style={[styles.btnFotoText, listo && styles.btnFotoTextListo]}>
                              {listo ? `✓ ${tipoFoto}` : `+ Foto ${tipoFoto}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Botón Rehabilitar (Admin) */}
        {isVencida && user?.rol === 'admin' && (
          <TouchableOpacity style={styles.btnRehabilitar} onPress={rehabilitar} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator color={colors.blanco} /> : <Text style={styles.btnPrimaryPillText}>Rehabilitar Orden</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  topHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blanco, padding: 18, borderBottomWidth: 1, borderBottomColor: colors.borde },
  backBtn: { marginRight: 12, padding: 4 },
  topHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal },
  orderNumber: { fontSize: 22, fontWeight: '800', color: colors.textoPrincipal },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  protectedCard: { backgroundColor: colors.blanco, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 18, borderWidth: 1, borderColor: colors.borde },
  protectedTitle: { fontSize: 18, fontWeight: '800', color: colors.textoPrincipal },
  protectedSubtitle: { fontSize: 13, color: colors.textoSecundario, textAlign: 'center', marginTop: 6 },
  protectedPlazo: { fontSize: 14, fontWeight: '700', color: colors.marca, marginTop: 14 },
  warningCard: { backgroundColor: colors.advertenciaFondo, borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 16 },
  warningTimer: { fontSize: 36, fontWeight: '900', color: colors.advertenciaTexto },
  warningSub: { fontSize: 12, color: colors.advertenciaTextoSecundario, textAlign: 'center', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  stationTitle: { fontSize: 18, fontWeight: '700', color: colors.textoPrincipal },
  stationDir: { fontSize: 13, color: colors.textoSecundario },
  totalBox: { backgroundColor: colors.marcaClaro, padding: 18, borderRadius: 16, marginTop: 16 },
  totalLabel: { fontSize: 11, fontWeight: '800', color: colors.marcaOscuro, letterSpacing: 0.5 },
  totalNumber: { fontSize: 32, fontWeight: '900', color: colors.textoPrincipal, marginTop: 2 },
  totalSub: { fontSize: 12, color: colors.textoSecundario, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal, marginTop: 20, marginBottom: 10 },
  lineaCard: { backgroundColor: colors.blanco, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.borde, marginBottom: 12 },
  lineaTitle: { fontSize: 15, fontWeight: '700', color: colors.textoPrincipal },
  lineaMonto: { fontSize: 18, fontWeight: '800', color: colors.marca, marginTop: 4 },
  evidenciasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  btnFoto: { flexBasis: '48%', backgroundColor: colors.fondo, borderWidth: 1, borderColor: colors.borde, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnFotoListo: { backgroundColor: colors.completadaFondo, borderColor: colors.completada },
  btnFotoText: { fontSize: 12, fontWeight: '700', color: colors.textoPrincipal },
  btnFotoTextListo: { color: colors.completada },
  btnPrimaryPill: { backgroundColor: colors.marca, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 18 },
  btnPrimaryPillText: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  btnRehabilitar: { backgroundColor: colors.marca, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
});