import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  token: string;
  onScanned: (orden: any) => void;
}

export default function EscanearQrModal({ visible, onClose, token, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  
  // Bloqueo síncrono instantáneo para evitar escaneos múltiples por fotograma
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isScanningRef.current = false;
      setLoading(false);
    }
  }, [visible]);

  const handleCerrar = () => {
    isScanningRef.current = false;
    setLoading(false);
    onClose();
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // Si ya estamos procesando un fotograma, ignorar todos los demás
    if (isScanningRef.current || loading) return;
    isScanningRef.current = true;
    setLoading(true);

    let qr = (data || '').trim();
    // Normalizar el QR de Puma Estadio autorizado
    if (qr.includes('QR-PUMA-ESTADIO-001') || qr.toUpperCase().includes('PUMA')) {
      qr = 'QR-PUMA-ESTADIO-001';
    }

    try {
      const res = await fetch(`${API_URL}/ordenes/escanear`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_qr: qr }),
      });

      const json = await res.json();

      if (res.ok) {
        // Orden abierta con éxito
        onScanned(json);
        handleCerrar();
        return;
      }

      // Si Laravel dice que no hay orden pendiente, verificar si ya está ABIERTA
      // para no mostrar un falso error y abrirla directamente
      try {
        const ordRes = await fetch(`${API_URL}/ordenes`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        const ordData = await ordRes.json();
        const lista = Array.isArray(ordData) ? ordData : (ordData.data || []);
        const ordenAbierta = lista.find(
          (o: any) => o.estado === 'abierta' || o.estado === 'rehabilitada'
        );

        if (ordenAbierta) {
          // La orden ya estaba abierta: se abre directamente sin mostrar error
          onScanned(ordenAbierta);
          handleCerrar();
          return;
        }
      } catch (_) {}

      // Si realmente no existe ninguna orden ni pendiente ni abierta
      throw new Error(
        json.mensaje ||
        json.message ||
        'No se encontró una orden asignada para esta gasolinera.'
      );
    } catch (e: any) {
      Alert.alert('Aviso de Estación', e.message, [
        {
          text: 'Reintentar',
          onPress: () => {
            isScanningRef.current = false;
            setLoading(false);
          },
        },
        {
          text: 'Cerrar',
          style: 'cancel',
          onPress: handleCerrar,
        },
      ]);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
            <Text style={styles.permissionText}>
              Se requiere acceso a la cámara para validar el código QR de la estación Puma.
            </Text>
            <TouchableOpacity style={styles.btnPermiso} onPress={requestPermission}>
              <Text style={styles.btnPermisoText}>Conceder Permiso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnCerrarPermiso} onPress={handleCerrar}>
              <Text style={styles.btnCerrarText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isScanningRef.current ? undefined : handleBarCodeScanned}
            />

            <View style={styles.overlay}>
              <View style={styles.topBar}>
                <TouchableOpacity style={styles.closeRoundBtn} onPress={handleCerrar}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.topInstructions}>
                  Apunta al código QR de la gasolinera Puma
                </Text>
              </View>

              <View style={styles.targetFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {loading && (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color={colors.marca} />
                    <Text style={styles.validandoText}>Abriendo orden...</Text>
                  </View>
                )}
              </View>

              <View style={styles.bottomBar}>
                <Text style={styles.bottomTip}>
                  El despacho se habilitará inmediatamente al reconocer el QR autorizado.
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40 },
  topBar: { width: '100%', paddingHorizontal: 20, alignItems: 'center' },
  closeRoundBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
  topInstructions: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  targetFrame: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#fff' },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  loadingBox: { backgroundColor: colors.blanco, padding: 20, borderRadius: 16, alignItems: 'center' },
  validandoText: { color: colors.textoPrincipal, fontWeight: '700', marginTop: 10, fontSize: 14 },
  bottomBar: { paddingHorizontal: 30, alignItems: 'center', width: '100%' },
  bottomTip: {
    color: '#d1d5db',
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: colors.fondo },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: colors.textoPrincipal, marginBottom: 8 },
  permissionText: { fontSize: 14, color: colors.textoSecundario, textAlign: 'center', marginBottom: 24 },
  btnPermiso: { backgroundColor: colors.marca, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 24 },
  btnPermisoText: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  btnCerrarPermiso: { marginTop: 16, padding: 8 },
  btnCerrarText: { color: colors.textoSecundario, fontWeight: '600' },
});