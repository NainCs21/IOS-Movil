import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface BottomNavProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  rol?: string;
}

export default function BottomNav({ currentScreen, setScreen, rol }: BottomNavProps) {
  // Los conductores en tu XML usan un diseño limpio con botón flotante,
  // la barra aplica para Administradores y Supervisores.
  if (rol === 'conductor') return null;

  const items = [
    { id: 'home', icon: '🏠', label: 'Inicio' },
    { id: 'solicitudes', icon: '📩', label: 'Solicitudes' },
    { id: 'ordenes', icon: '📋', label: 'Órdenes' },
    { id: 'catalogos', icon: '📑', label: 'Catálogos' },
    { id: 'perfil', icon: '👤', label: 'Perfil' },
  ];

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <TouchableOpacity key={item.id} style={styles.item} onPress={() => setScreen(item.id)}>
            <Text style={[styles.icon, isActive && styles.activeIcon]}>{item.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.blanco,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
  },
  item: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 18, color: colors.textoSecundario },
  activeIcon: { transform: [{ scale: 1.1 }] },
  label: { fontSize: 11, color: colors.textoSecundario, marginTop: 3, fontWeight: '600' },
  activeLabel: { color: colors.marca, fontWeight: '700' },
});