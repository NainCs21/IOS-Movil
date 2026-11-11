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
  Alert,
} from 'react-native';

// IP local de tu PC donde corre Laravel
const IP_PC = '192.168.1.4';
const API_URL = `http://${IP_PC}:8000/api`;

interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo_combustible: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Credenciales predefinidas para pruebas rápidas
  const [correo, setCorreo] = useState<string>('admin@test.com');
  const [contrasena, setContrasena] = useState<string>('password123');

  // Iniciar sesión y obtener token de Laravel Sanctum
  const handleLogin = async () => {
    if (!correo.trim() || !contrasena) {
      Alert.alert('Atención', 'Por favor ingresa correo y contraseña.');
      return;
    }

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

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error en las credenciales.');
      }

      setToken(data.token);
      setUsuario(data.usuario);
      
      // Consultar vehículos protegidos con el nuevo token
      await cargarVehiculos(data.token);
    } catch (error: any) {
      Alert.alert('Error de conexión', error.message || 'No se pudo conectar con Laravel.');
    } finally {
      setLoading(false);
    }
  };

  // Consultar endpoint protegido con Bearer Token
  const cargarVehiculos = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vehiculos`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Error al obtener vehículos.`);
      }

      const data = await response.json();
      // Laravel devuelve paginación (data.data) o array directo
      setVehiculos(Array.isArray(data) ? data : data.data || []);
    } catch (error: any) {
      Alert.alert('Error de API', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (_) {
        // Cierre local si la red falla
      }
    }
    setToken(null);
    setUsuario(null);
    setVehiculos([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {!token ? (
        // FORMULARIO DE ACCESO
        <View style={styles.loginContainer}>
          <Text style={styles.badge}>Laravel 12 + iOS</Text>
          <Text style={styles.title}>Control de Flota</Text>
          <Text style={styles.subtitle}>Conectado a {IP_PC}:8000</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="ejemplo@test.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Contraseña"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        // DASHBOARD DE VEHÍCULOS
        <View style={styles.dashboard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.userName}>{usuario?.nombre}</Text>
              <Text style={styles.userRole}>ROL: {usuario?.rol?.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.listHeaderTitle}>Flota de Vehículos</Text>

          {loading && vehiculos.length === 0 ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#0284c7" />
              <Text style={styles.loadingText}>Consultando base de datos...</Text>
            </View>
          ) : (
            <FlatList
              data={vehiculos}
              keyExtractor={(item) => item.id.toString()}
              onRefresh={() => cargarVehiculos(token)}
              refreshing={loading}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.marca} {item.modelo}</Text>
                    <View style={styles.plateBadge}>
                      <Text style={styles.plateText}>{item.placa}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Año: {item.anio} • Combustible: {item.tipo_combustible}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay vehículos registrados.</Text>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  btnPrimary: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dashboard: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  btnLogout: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnLogoutText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  plateBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  plateText: {
    color: '#0284c7',
    fontWeight: '700',
    fontSize: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94a3b8',
  },
});