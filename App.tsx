import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';

const IP_PC = '192.168.1.4';
const API_URL = `http://${IP_PC}:8000/api`;

type Modulo = 'ordenes' | 'solicitudes' | 'vehiculos' | 'gasolineras' | 'conductores' | 'caja-chica';

const MODULOS: { id: Modulo; label: string }[] = [
  { id: 'ordenes', label: 'Órdenes' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'vehiculos', label: 'Vehículos' },
  { id: 'gasolineras', label: 'Gasolineras' },
  { id: 'conductores', label: 'Conductores' },
  { id: 'caja-chica', label: 'Caja Chica' },
];

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [moduloActivo, setModuloActivo] = useState<Modulo>('ordenes');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Credenciales por defecto
  const [correo, setCorreo] = useState('admin@test.com');
  const [contrasena, setContrasena] = useState('password123');

  // Login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: correo.trim(),
          contrasena: contrasena,
          nombre_dispositivo: 'iPhone-Dev',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');

      setToken(data.token);
      setUsuario(data.usuario);
      consultarTabla('ordenes', data.token);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Consulta a endpoints de la API
  const consultarTabla = async (modulo: Modulo, authToken: string) => {
    setModuloActivo(modulo);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/${modulo}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const registros = Array.isArray(data) ? data : (data.data || []);
      setItems(registros);
    } catch (error: any) {
      Alert.alert('Error', `No se pudo obtener ${modulo}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUsuario(null);
    setItems([]);
  };

  // Renderizado seguro contra valores undefined / null
  const renderItem = ({ item }: { item: any }) => {
    switch (moduloActivo) {
      case 'ordenes': {
        const estado = (item.estado || 'pendiente').toUpperCase();
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.numero_orden || 'Sin código'}</Text>
              <View style={[styles.badge, estado === 'ABIERTA' ? styles.badgeGreen : styles.badgeBlue]}>
                <Text style={styles.badgeText}>{estado}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>Gasolinera: {item.gasolinera?.nombre || 'No asignada'}</Text>
            <Text style={styles.cardSub}>Conductor: {item.conductor?.usuario?.name || 'Asignado'}</Text>
            <Text style={styles.cardDetail}>Asignada: {item.fecha_asignacion || 'N/A'}</Text>
            <Text style={styles.cardDetail}>Vence: {item.vence_asignacion || 'N/A'}</Text>
          </View>
        );
      }

      case 'solicitudes': {
        const estado = (item.estado || 'pendiente').toUpperCase();
        const destino = (item.tipo_destino || 'No especificado').toUpperCase();
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Solicitud #{item.id ?? '---'}</Text>
              <View style={[styles.badge, estado === 'APROBADA' ? styles.badgeGreen : styles.badgeYellow]}>
                <Text style={styles.badgeText}>{estado}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>Destino: {destino}</Text>
            <Text style={styles.cardDetail}>{item.descripcion_actividad || 'Sin descripción de actividad'}</Text>
            {item.descripcion_mgp ? (
              <Text style={styles.cardDetail}>MGP: {item.descripcion_mgp}</Text>
            ) : null}
          </View>
        );
      }

      case 'vehiculos':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.marca || ''} {item.modelo || 'Vehículo'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.placa || 'SIN PLACA'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>
              Año: {item.anio || 'N/A'} • Combustible: {item.tipo_combustible || 'N/A'}
            </Text>
          </View>
        );

      case 'gasolineras':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.nombre || 'Gasolinera'}</Text>
              <View style={[styles.badge, item.activo ? styles.badgeGreen : styles.badgeYellow]}>
                <Text style={styles.badgeText}>{item.activo ? 'ACTIVA' : 'INACTIVA'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.direccion || 'Sin dirección registrada'}</Text>
            <Text style={styles.cardDetail}>Código QR: {item.codigo_qr || 'N/A'}</Text>
          </View>
        );

      case 'conductores':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.usuario?.name || `Conductor #${item.id}`}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.cargo || 'CONDUCTOR'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>Teléfono: {item.telefono || 'Sin teléfono'}</Text>
            <Text style={styles.cardDetail}>Correo: {item.usuario?.email || 'N/A'}</Text>
          </View>
        );

      case 'caja-chica':
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                L. {item.monto ? Number(item.monto).toFixed(2) : '0.00'}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.fecha_entrega || 'N/A'}</Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.descripcion || 'Sin descripción'}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {!token ? (
        <View style={styles.loginBox}>
          <Text style={styles.title}>Control de Flota</Text>
          <Text style={styles.subtitle}>Conectado a {IP_PC}:8000</Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Iniciar Sesión</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flex}>
          {/* Encabezado */}
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.userName}>{usuario?.nombre || 'Usuario'}</Text>
              <Text style={styles.userRole}>ROL: {(usuario?.rol || '').toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Text style={styles.btnLogoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          {/* Selector de pestañas */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {MODULOS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabBtn, moduloActivo === tab.id && styles.tabBtnActive]}
                  onPress={() => consultarTabla(tab.id, token)}
                >
                  <Text style={[styles.tabBtnText, moduloActivo === tab.id && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Contenido principal */}
          {loading && items.length === 0 ? (
            <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
              onRefresh={() => consultarTabla(moduloActivo, token)}
              refreshing={loading}
              contentContainerStyle={styles.list}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={styles.empty}>No hay registros en la sección {moduloActivo}.</Text>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  loginBox: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 14 },
  btnPrimary: { backgroundColor: '#0284c7', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  userName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  userRole: { fontSize: 12, fontWeight: '700', color: '#0284c7' },
  btnLogout: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnLogoutText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  tabsContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f1f5f9' },
  tabBtnActive: { backgroundColor: '#0284c7' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tabBtnTextActive: { color: '#ffffff' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  badge: { backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeBlue: { backgroundColor: '#e0f2fe' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeYellow: { backgroundColor: '#fef9c3' },
  badgeText: { color: '#0f172a', fontWeight: '700', fontSize: 11 },
  cardSub: { fontSize: 13, color: '#334155', fontWeight: '500', marginBottom: 2 },
  cardDetail: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' },
});