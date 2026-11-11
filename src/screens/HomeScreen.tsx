import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { API_URL } from '../api/config';
import { colors } from '../theme/colors';

interface Props {
  user: any;
  setScreen: (screen: string) => void;
  token: string;
  onOpenOrder: (id: number) => void;
  onOpenNuevaSolicitud: () => void;
  onOpenQr: () => void;
}

export default function HomeScreen({
  user,
  setScreen,
  token,
  onOpenOrder,
  onOpenNuevaSolicitud,
  onOpenQr,
}: Props) {
  const isAdmin = user?.rol === 'admin';
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/ordenes`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/solicitudes`, { headers }).then((r) => r.json()).catch(() => []),
    ]).then(([ordData, solData]) => {
      setOrdenes(Array.isArray(ordData) ? ordData : ordData.data || []);
      setSolicitudes(Array.isArray(solData) ? solData : solData.data || []);
      setLoading(false);
    });
  }, [token]);

  const pendientesCount = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const abiertasCount = ordenes.filter((o) => o.estado === 'abierta').length;
  const completadasCount = ordenes.filter((o) => o.estado === 'completada').length;
  const vencidasCount = ordenes.filter((o) => o.estado === 'vencida').length;
  const proximaOrden = ordenes.find((o) => o.estado === 'abierta');

  // VISTA CONDUCTOR
  if (!isAdmin) {
    return (
      <View style={styles.flex}>
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderTitle}>Hola, {user?.nombre?.split(' ')[0]}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={onOpenQr}>
              <Text style={{ fontSize: 18 }}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setScreen('perfil')}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>Mis Órdenes de Combustible</Text>
          {ordenes.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => onOpenOrder(item.id)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.numero_orden}</Text>
                <View style={[styles.badge, { backgroundColor: item.estado === 'abierta' ? colors.abiertaFondo : colors.pendienteFondo }]}>
                  <Text style={[styles.badgeText, { color: item.estado === 'abierta' ? colors.abierta : colors.pendiente }]}>
                    {(item.estado || 'PENDIENTE').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardSub}>Gasolinera: {item.gasolinera?.nombre || 'General'}</Text>
              <Text style={styles.cardDetail}>Vence: {item.vence_asignacion || 'En espera'} →</Text>
            </TouchableOpacity>
          ))}
          {ordenes.length === 0 && <Text style={styles.emptyText}>Sin órdenes asignadas todavía</Text>}
        </ScrollView>

        <View style={styles.bottomDock}>
          <TouchableOpacity style={styles.btnPrimaryPill} onPress={onOpenNuevaSolicitud}>
            <Text style={styles.btnPrimaryPillText}>+ Nueva solicitud</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // VISTA ADMINISTRADOR
  return (
    <View style={styles.flex}>
      <View style={styles.topHeader}>
        <View style={styles.rowCenter}>
          <Text style={{ fontSize: 22, marginRight: 8 }}>⛽</Text>
          <View>
            <Text style={styles.topHeaderTitle}>Inicio</Text>
            <Text style={styles.topHeaderRole}>ADMINISTRADOR</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.dateLabel}>HOY EN CURSO</Text>
        <Text style={styles.welcomeTitle}>Hola, {user?.nombre?.split(' ')[0]}</Text>

        <View style={styles.card}>
          <View style={styles.rowCenter}>
            <Text style={styles.bigNumber}>{pendientesCount}</Text>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.cardTitle}>Solicitudes pendientes</Text>
              <Text style={styles.cardSub}>Esperan asignación de monto</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnLightPill} onPress={() => setScreen('solicitudes')}>
            <Text style={styles.btnLightPillText}>Asignar montos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.abierta }]}>{abiertasCount}</Text>
            <Text style={styles.statLabel}>Abiertas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.completada }]}>{completadasCount}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: colors.vencida }]}>{vencidasCount}</Text>
            <Text style={styles.statLabel}>Vencidas</Text>
          </View>
        </View>

        {proximaOrden && (
          <TouchableOpacity style={styles.warningCard} onPress={() => onOpenOrder(proximaOrden.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.warningTitle}>{proximaOrden.numero_orden}</Text>
              <View style={[styles.badge, { backgroundColor: colors.abiertaFondo }]}>
                <Text style={[styles.badgeText, { color: colors.abierta }]}>ABIERTA</Text>
              </View>
            </View>
            <Text style={styles.warningDetail}>Gasolinera: {proximaOrden.gasolinera?.nombre}</Text>
            <View style={styles.warningFooter}>
              <Text style={styles.warningTimer}>⏳ Vence: {proximaOrden.vence_apertura?.substring(11, 16) || 'Hoy'}</Text>
              <Text style={styles.linkText}>Ver orden →</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setScreen('catalogos')}>
            <Text style={styles.outlineBtnText}>Catálogos →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setScreen('ordenes')}>
            <Text style={styles.outlineBtnText}>Todas las órdenes →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.fondo },
  container: { padding: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.blanco, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borde },
  topHeaderTitle: { fontSize: 21, fontWeight: '700', color: colors.textoPrincipal },
  topHeaderRole: { fontSize: 11, fontWeight: '800', color: colors.marca, letterSpacing: 0.5 },
  headerIconBtn: { marginLeft: 12, padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  dateLabel: { fontSize: 12, fontWeight: '800', color: colors.textoSecundario, letterSpacing: 0.8 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: colors.textoPrincipal, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: colors.blanco, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.borde, marginBottom: 16 },
  bigNumber: { fontSize: 40, fontWeight: '800', color: colors.marca },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal },
  cardSub: { fontSize: 13, color: colors.textoSecundario, marginTop: 2 },
  cardDetail: { fontSize: 12, color: colors.marca, marginTop: 4, fontWeight: '600' },
  btnLightPill: { backgroundColor: colors.marcaClaro, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  btnLightPillText: { color: colors.marcaOscuro, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: colors.blanco, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.borde },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textoSecundario, marginTop: 2, fontWeight: '600' },
  warningCard: { backgroundColor: colors.advertenciaFondo, borderRadius: 20, padding: 18, marginBottom: 16 },
  warningTitle: { fontSize: 15, fontWeight: '700', color: colors.textoPrincipal },
  warningDetail: { fontSize: 13, color: colors.advertenciaTextoSecundario, marginTop: 6 },
  warningFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  warningTimer: { fontSize: 14, fontWeight: '700', color: colors.advertenciaTexto },
  linkText: { color: colors.marca, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textoPrincipal, marginTop: 8, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  outlineBtn: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borde, backgroundColor: colors.blanco, justifyContent: 'center', alignItems: 'center' },
  outlineBtnText: { color: colors.marca, fontWeight: '700', fontSize: 13 },
  bottomDock: { backgroundColor: colors.blanco, padding: 20, borderTopWidth: 1, borderTopColor: colors.borde },
  btnPrimaryPill: { backgroundColor: colors.marca, height: 52, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnPrimaryPillText: { color: colors.blanco, fontSize: 15, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  emptyText: { textAlign: 'center', color: colors.textoSecundario, marginTop: 30 },
});