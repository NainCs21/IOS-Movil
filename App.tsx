import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Alert } from 'react-native';
import { API_URL } from './src/api/config';
import { colors } from './src/theme/colors';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdenesScreen from './src/screens/OrdenesScreen';
import SolicitudesScreen from './src/screens/SolicitudesScreen';
import CatalogosScreen from './src/screens/CatalogosScreen';
import CajaChicaScreen from './src/screens/CajaChicaScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import OrdenDetalleScreen from './src/screens/OrdenDetalleScreen';

import NuevaSolicitudModal from './src/screens/NuevaSolicitudModal';
import AsignarMontoModal from './src/screens/AsignarMontoModal';
import EscanearQrModal from './src/screens/EscanearQrModal';

import BottomNav from './src/components/BottomNav';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [loading, setLoading] = useState(false);

  // Estados de navegación de Orden
  const [selectedOrdenId, setSelectedOrdenId] = useState<number | null>(null);
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);

  // Estados de Modales
  const [nuevaSolicitudVisible, setNuevaSolicitudVisible] = useState(false);
  const [solicitudParaAsignar, setSolicitudParaAsignar] = useState<any | null>(null);
  const [escanearQrVisible, setEscanearQrVisible] = useState(false);

  const [correo, setCorreo] = useState('cmendoza@empresa.com');
  const [password, setPassword] = useState('password');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), contrasena: password, nombre_dispositivo: 'iPhone-iOS' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');

      setToken(data.token);
      setUser(data.usuario);
      setCurrentScreen('home');
      setSelectedOrdenId(null);
      setSelectedOrden(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentScreen('home');
    setSelectedOrdenId(null);
    setSelectedOrden(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {!token ? (
        <LoginScreen
          correo={correo}
          setCorreo={setCorreo}
          password={password}
          setPassword={setPassword}
          onLogin={handleLogin}
          loading={loading}
        />
      ) : (
        <View style={styles.flex}>
          <View style={styles.flex}>
            {selectedOrdenId ? (
              <OrdenDetalleScreen
                ordenId={selectedOrdenId}
                ordenData={selectedOrden}
                token={token}
                user={user}
                onBack={() => {
                  setSelectedOrdenId(null);
                  setSelectedOrden(null);
                }}
                onOpenQr={() => setEscanearQrVisible(true)}
              />
            ) : (
              <>
                {currentScreen === 'home' && (
                  <HomeScreen
                    user={user}
                    setScreen={setCurrentScreen}
                    token={token}
                    onOpenOrder={(id) => {
                      setSelectedOrden(null);
                      setSelectedOrdenId(id);
                    }}
                    onOpenNuevaSolicitud={() => setNuevaSolicitudVisible(true)}
                    onOpenQr={() => setEscanearQrVisible(true)}
                  />
                )}
                {currentScreen === 'solicitudes' && (
                  <SolicitudesScreen
                    token={token}
                    user={user}
                    onAsignar={(sol) => setSolicitudParaAsignar(sol)}
                  />
                )}
                {currentScreen === 'ordenes' && (
                  <OrdenesScreen
                    token={token}
                    onOpenOrder={(id) => {
                      setSelectedOrden(null);
                      setSelectedOrdenId(id);
                    }}
                  />
                )}
                {currentScreen === 'catalogos' && <CatalogosScreen token={token} />}
                {currentScreen === 'caja_chica' && <CajaChicaScreen token={token} />}
                {currentScreen === 'perfil' && <PerfilScreen user={user} onLogout={handleLogout} />}
              </>
            )}
          </View>

          <NuevaSolicitudModal
            visible={nuevaSolicitudVisible}
            onClose={() => setNuevaSolicitudVisible(false)}
            token={token}
            onSuccess={() => {}}
          />

          <AsignarMontoModal
            solicitud={solicitudParaAsignar}
            onClose={() => setSolicitudParaAsignar(null)}
            token={token}
            onSuccess={() => {}}
          />

          <EscanearQrModal
            visible={escanearQrVisible}
            onClose={() => setEscanearQrVisible(false)}
            token={token}
            onScanned={(orden) => {
              setSelectedOrden(orden);
              setSelectedOrdenId(orden.id);
            }}
          />

          {!selectedOrdenId && (
            <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} rol={user?.rol} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fondo },
  flex: { flex: 1 },
});