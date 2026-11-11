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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  ordenId: number;
  ordenData?: any;
  token: string;
  user: any;
  onBack: () => void;
  onOpenQr: () => void;
}

export default function OrdenDetalleScreen({
  ordenId,
  ordenData,
  token,
  user,
  onBack,
  onOpenQr,
}: Props) {
  const [orden, setOrden] = useState<any | null>(ordenData || null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState<string>('--:--');
  
  // Seguimiento independiente por línea de cada tipo de foto
  const [evidenciasLocales, setEvidenciasLocales] = useState<Record<number, string[]>>({});

  const [fotoModalVisible, setFotoModalVisible] = useState(false);
  const [fotoUrlSeleccionada, setFotoUrlSeleccionada] = useState<string | null>(null);

  const fetchOrden = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes/${ordenId}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrden(data);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cargar la orden: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ordenData && ordenData.id === ordenId) {
      setOrden(ordenData);
    } else {
      fetchOrden();
    }
  }, [ordenId, ordenData]);

  // Contador de 15 minutos en tiempo real
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

  // Subida de evidencias fotográficas
  const tomarYSubirFoto = async (detalleId: number, tipoFoto: string) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso Denegado',
          'Se requiere acceso a la cámara para capturar la evidencia del despacho.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fotoLocal = result.assets[0];
      setActionLoading(true);

      const uploadResponse = await FileSystem.uploadAsync(
        `${API_URL}/detalle-ordenes/${detalleId}/evidencia`,
        fotoLocal.uri,
        {
          httpMethod: 'POST',
          uploadType: ((FileSystem as any).FileSystemUploadType?.MULTIPART ?? 1) as any,
          fieldName: 'foto',
          parameters: {
            tipo: tipoFoto,
          },
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = JSON.parse(uploadResponse.body);

      if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
        throw new Error(
          json.mensaje || json.message || `Error del servidor (${uploadResponse.status})`
        );
      }

      Alert.alert('Éxito', `Evidencia de ${tipoFoto.toUpperCase()} registrada en el servidor.`);

      // Registrar esta foto como tomada para esta línea
      setEvidenciasLocales((prev) => ({
        ...prev,
        [detalleId]: [...(prev[detalleId] || []), tipoFoto],
      }));

      fetchOrden();
    } catch (err: any) {
      Alert.alert('Error al subir evidencia', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const rehabilitarOrden = async () => {
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
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.textoPrincipal }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Detalle de orden</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.orderNumber}>{orden.numero_orden}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isPendiente
                ? colors.pendienteFondo
                : isOpen
                ? colors.abiertaFondo
                : colors.completadaFondo,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: isPendiente
                  ? colors.pendiente
                  : isOpen
                  ? colors.abierta
                  : colors.completada,
              },
            ]}
          >
            {(orden.estado || '').toUpperCase()}
          </Text>
        </View>

        {/* 1. VISTA DE ORDEN PROTEGIDA (PENDIENTE) */}
        {isPendiente && (
          <View style={styles.protectedCard}>
            <Text style={{ fontSize: 48, marginBottom: 10 }}>🔒</Text>
            <Text style={styles.protectedTitle}>Orden protegida</Text>
            <Text style={styles.protectedSubtitle}>
              El monto y la gasolinera se revelan tras escanear el código QR en la estación.
            </Text>
            <Text style={styles.protectedPlazo}>
              Plazo de retiro: {orden.vence_asignacion || 'En espera'}
            </Text>
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
            {isOpen && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTimer}>{minutosRestantes}</Text>
                <Text style={styles.warningSub}>Tiempo restante (Máx. 15 minutos)</Text>
                <Text style={styles.warningSub}>
                  Al llegar a 00:00 la orden vencerá automáticamente.
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stationTitle}>{orden.gasolinera?.nombre || 'General'}</Text>
                <Text style={styles.stationDir}>{orden.gasolinera?.direccion || 'Sin dirección'}</Text>
              </View>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>MONTO TOTAL AUTORIZADO</Text>
              <Text style={styles.totalNumber}>L. {montoTotal.toFixed(2)}</Text>
              <Text style={styles.totalSub}>Distribuido en {lineas.length} líneas de despacho</Text>
            </View>

            <Text style={styles.sectionTitle}>Líneas de Combustible y Evidencias</Text>
            {lineas.map((linea: any) => {
              const fotosTomadas = evidenciasLocales[linea.id] || [];
              const tieneEvidenciaServidor = !!linea.url_evidencia || !!linea.ruta_evidencia;

              return (
                <View key={linea.id} style={styles.lineaCard}>
                  <Text style={styles.lineaTitle}>
                    {linea.tipo_destino === 'vehiculo'
                      ? `Vehículo: ${linea.vehiculo?.placa || '#' + linea.vehiculo_id}`
                      : `MGP: ${linea.descripcion_mgp || 'Planta'}`}{' '}
                    ({linea.tipo_combustible})
                  </Text>
                  <Text style={styles.lineaMonto}>L. {Number(linea.monto).toFixed(2)}</Text>

                  {/* Cada botón de los 4 se controla de forma independiente */}
                  {user?.rol === 'conductor' && (
                    <View style={styles.evidenciasGrid}>
                      {(['bomba', 'tablero', 'tanque', 'factura'] as const).map((tipoFoto) => {
                        const lista = fotosTomadas.includes(tipoFoto);

                        return (
                          <TouchableOpacity
                            key={tipoFoto}
                            style={[styles.btnFoto, lista && styles.btnFotoListo]}
                            onPress={() => tomarYSubirFoto(linea.id, tipoFoto)}
                            disabled={actionLoading}
                          >
                            <Text style={[styles.btnFotoText, lista && styles.btnFotoTextListo]}>
                              {lista ? `✓ ${tipoFoto.toUpperCase()}` : `📷 ${tipoFoto.toUpperCase()}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {tieneEvidenciaServidor && (
                    <TouchableOpacity
                      style={styles.verFotoBtn}
                      onPress={() => {
                        const url =
                          linea.url_evidencia ||
                          `${API_URL.replace('/api', '')}/storage/${linea.ruta_evidencia}`;
                        setFotoUrlSeleccionada(url);
                        setFotoModalVisible(true);
                      }}
                    >
                      <Text style={styles.verFotoText}>👁 Ver evidencia registrada</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {isVencida && user?.rol === 'admin' && (
          <TouchableOpacity
            style={styles.btnRehabilitar}
            onPress={rehabilitarOrden}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.blanco} />
            ) : (
              <Text style={styles.btnPrimaryPillText}>Rehabilitar Orden</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={fotoModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Evidencia Guardada en Servidor</Text>
            {fotoUrlSeleccionada ? (
              <Image source={{ uri: fotoUrlSeleccionada }} style={styles.imagenEvidencia} resizeMode="contain" />
            ) : null}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFotoModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blanco,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  backBtn: { marginRight: 14, padding: 4 },
  topHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal },
  orderNumber: { fontSize: 22, fontWeight: '800', color: colors.textoPrincipal },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  protectedCard: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  protectedTitle: { fontSize: 18, fontWeight: '800', color: colors.textoPrincipal },
  protectedSubtitle: { fontSize: 13, color: colors.textoSecundario, textAlign: 'center', marginTop: 6 },
  protectedPlazo: { fontSize: 14, fontWeight: '700', color: colors.marca, marginTop: 14 },
  warningCard: {
    backgroundColor: colors.advertenciaFondo,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
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
  lineaCard: {
    backgroundColor: colors.blanco,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: 12,
  },
  lineaTitle: { fontSize: 15, fontWeight: '700', color: colors.textoPrincipal },
  lineaMonto: { fontSize: 18, fontWeight: '800', color: colors.marca, marginTop: 4 },
  evidenciasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  btnFoto: {
    flexBasis: '48%',
    backgroundColor: colors.fondo,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnFotoListo: { backgroundColor: colors.completadaFondo, borderColor: colors.completada },
  btnFotoText: { fontSize: 11, fontWeight: '700', color: colors.textoPrincipal },
  btnFotoTextListo: { color: colors.completada },
  verFotoBtn: { marginTop: 12, alignSelf: 'flex-start' },
  verFotoText: { fontSize: 13, color: colors.marca, fontWeight: '700' },
  btnPrimaryPill: {
    backgroundColor: colors.marca,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 18,
  },
  btnPrimaryPillText: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  btnRehabilitar: {
    backgroundColor: colors.marca,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal, marginBottom: 12 },
  imagenEvidencia: { width: '100%', height: 260, borderRadius: 10, backgroundColor: '#eee' },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: colors.marca,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalCloseText: { color: colors.blanco, fontWeight: '700' },
});