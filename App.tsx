import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Alert } from 'react-native';
import { API_URL } from './src/api/config';
import { colors } from './src/theme/colors';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrdenesScreen from './src/screens/OrdenesScreen';
import SolicitudesScreen from './src/screens/SolicitudesScreen';
import CatalogosScreen from './src/screens/CatalogosScreen';
import PerfilScreen from './src/screens/PerfilScreen';

import BottomNav from './src/components/BottomNav';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [loading, setLoading] = useState(false);

  const [correo, setCorreo] = useState('cmendoza@empresa.com');
  const [password, setPassword] = useState('password');

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), contrasena: password, nombre_dispositivo: 'iPhone' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al iniciar sesión');

      setToken(data.token);
      setUser(data.usuario);
      setCurrentScreen('home');
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
            {currentScreen === 'home' && <HomeScreen user={user} setScreen={setCurrentScreen} token={token} />}
            {currentScreen === 'solicitudes' && <SolicitudesScreen token={token} />}
            {currentScreen === 'ordenes' && <OrdenesScreen token={token} />}
            {currentScreen === 'catalogos' && <CatalogosScreen token={token} />}
            {currentScreen === 'perfil' && <PerfilScreen user={user} onLogout={handleLogout} />}
          </View>
          <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} rol={user?.rol} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.fondo },
  flex: { flex: 1 },
});