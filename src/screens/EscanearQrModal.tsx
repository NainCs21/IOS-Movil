import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  token: string;
  onScanned: (orden: any) => void;
}

export default function EscanearQrModal({ visible, onClose, token, onScanned }: Props) {
  // Código QR por defecto registrado en la base de datos para pruebas rápidas
  const [codigoQr, setCodigoQr] = useState('QR-PUMA-ESTADIO-001');
  const [loading, setLoading] = useState(false);

  const enviarEscaneo = async () => {
    if (!codigoQr.trim()) {
      Alert.alert('Aviso', 'Ingresa o escanea un código QR válido.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ordenes/escanear`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo_qr: codigoQr.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.message || 'Código QR no reconocido o sin órdenes activas.');

      Alert.alert('¡Orden Habilitada!', `Orden #${data.numero_orden || data.id} abierta para canje.`);
      onScanned(data);
      onClose();
    } catch (e: any) {
      Alert.alert('Error de Escaneo', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.qrIconBox}>
            <Text style={{ fontSize: 44 }}>📷</Text>
          </View>

          <Text style={styles.title}>Escanear Código QR</Text>
          <Text style={styles.subtitle}>
            Apunta la cámara al QR de la gasolinera autorizada o confirma el código para abrir la orden.
          </Text>

          <TextInput
            style={styles.input}
            value={codigoQr}
            onChangeText={setCodigoQr}
            placeholder="Código QR"
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.btnScan} onPress={enviarEscaneo} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.blanco} /> : <Text style={styles.btnScanText}>Validar y Abrir Orden</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
            <Text style={styles.btnCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.blanco, borderRadius: 20, padding: 24, alignItems: 'center' },
  qrIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.marcaClaro, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textoPrincipal },
  subtitle: { fontSize: 13, color: colors.textoSecundario, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  input: { width: '100%', backgroundColor: colors.fondo, borderWidth: 1, borderColor: colors.borde, borderRadius: 10, padding: 12, fontSize: 14, fontWeight: '700', textAlign: 'center', color: colors.textoPrincipal, marginBottom: 16 },
  btnScan: { width: '100%', backgroundColor: colors.marca, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  btnScanText: { color: colors.blanco, fontWeight: '700', fontSize: 15 },
  btnCancel: { marginTop: 12, padding: 8 },
  btnCancelText: { color: colors.textoSecundario, fontWeight: '600' },
});