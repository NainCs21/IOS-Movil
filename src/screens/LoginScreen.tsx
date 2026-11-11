import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';

interface LoginProps {
  correo: string;
  setCorreo: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onLogin: () => void;
  loading: boolean;
}

export default function LoginScreen({
  correo,
  setCorreo,
  password,
  setPassword,
  onLogin,
  loading,
}: LoginProps) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Encabezado Marca */}
      <View style={styles.brandRow}>
        <View style={styles.brandIconContainer}>
          <Text style={styles.brandIcon}>⛽</Text>
        </View>
        <View style={styles.brandCol}>
          <Text style={styles.appName}>Órdenes de Combustible</Text>
          <Text style={styles.accessBadge}>ACCESO SEGURO</Text>
        </View>
      </View>

      {/* Tarjeta Hero (bg_tarjeta_hero) */}
      <View style={styles.heroCard}>
        <Text style={styles.heroPre}>ADMINISTRACIÓN MÓVIL</Text>
        <Text style={styles.heroTitle}>Control de combustible.{"\n"}Desde tu móvil.</Text>
        <Text style={styles.heroSubtitle}>Asigna, consulta y gestiona en un solo lugar.</Text>
      </View>

      {/* Formulario */}
      <Text style={styles.titleInicia}>Inicia sesión</Text>

      <Text style={styles.inputLabel}>Correo electrónico</Text>
      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="usuario@empresa.com"
        placeholderTextColor="#9ca3af"
      />

      <Text style={styles.inputLabel}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity style={styles.forgotPass}>
        <Text style={styles.forgotPassText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <Text style={styles.accessNote}>Acceso exclusivo para personal autorizado.</Text>

      <TouchableOpacity style={styles.btnIngresar} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.blanco} /> : <Text style={styles.btnIngresarText}>Ingresar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.fondo },
  container: { padding: 20, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  brandIconContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  brandIcon: { fontSize: 24 },
  brandCol: { marginLeft: 12 },
  appName: { fontSize: 21, fontWeight: '700', color: colors.textoPrincipal },
  accessBadge: { fontSize: 10, fontWeight: '800', color: colors.marca, letterSpacing: 0.5 },
  heroCard: {
    backgroundColor: colors.marcaOscuro,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    elevation: 2,
  },
  heroPre: { color: '#D8C9F4', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  heroTitle: { color: colors.blanco, fontSize: 24, fontWeight: '700', marginTop: 10, lineHeight: 30 },
  heroSubtitle: { color: '#E5DAF7', fontSize: 14, marginTop: 10 },
  titleInicia: { fontSize: 24, fontWeight: '700', color: colors.textoPrincipal, marginTop: 24, marginBottom: 8 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textoPrincipal, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.textoPrincipal,
  },
  forgotPass: { alignSelf: 'flex-end', marginTop: 12 },
  forgotPassText: { color: colors.marca, fontWeight: '700', fontSize: 13 },
  accessNote: { color: colors.textoSecundario, fontSize: 12, textAlign: 'center', marginTop: 16 },
  btnIngresar: {
    backgroundColor: colors.marca,
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  btnIngresarText: { color: colors.blanco, fontSize: 15, fontWeight: '700' },
});