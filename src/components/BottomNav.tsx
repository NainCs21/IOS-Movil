import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface BottomNavProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
}

export default function BottomNav({ currentScreen, setScreen }: BottomNavProps) {
  const items = [
    { id: 'home', icon: '🏠', label: 'Inicio' },
    { id: 'ordenes', icon: '📋', label: 'Órdenes' },
    { id: 'solicitudes', icon: '📩', label: 'Solicitudes' },
    { id: 'perfil', icon: '👤', label: 'Perfil' },
  ];

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <TouchableOpacity key={item.id} style={styles.item} onPress={() => setScreen(item.id)}>
            <Text style={[styles.icon, isActive && styles.active]}>{item.icon}</Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 8 },
  item: { flex: 1, alignItems: 'center' },
  icon: { fontSize: 18, color: '#64748b' },
  label: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '600' },
  active: { transform: [{ scale: 1.15 }] },
  activeLabel: { color: '#0284c7' },
});