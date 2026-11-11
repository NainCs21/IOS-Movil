import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  user: any;
  onLogout: () => void;
}

export default function PerfilScreen({ user, onLogout }: Props) {
  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <Text style={styles.topHeaderTitle}>Datos de mi cuenta</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.badgeRol}>
            <Text style={styles.badgeRolText}>{(user?.rol || 'USUARIO').toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.nombre}</Text>
          <Text style={styles.email}>{user?.email || 'usuario@empresa.com'}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
          <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  topHeader: { backgroundColor: colors.blanco, padding: 20, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal },
  container: { flex: 1, padding: 20 },
  card: {
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  badgeRol: {
    backgroundColor: colors.abiertaFondo,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
    alignSelf: 'flex-start',
  },
  badgeRolText: { color: colors.abierta, fontWeight: '700', fontSize: 11 },
  name: { fontSize: 20, fontWeight: '700', color: colors.textoPrincipal, marginTop: 12 },
  email: { fontSize: 14, color: colors.textoSecundario, marginTop: 2 },
  btnLogout: {
    backgroundColor: colors.vencida,
    height: 52,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLogoutText: { color: colors.blanco, fontSize: 15, fontWeight: '700' },
});