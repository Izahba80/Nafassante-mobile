// src/screens/admin/AdminDashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { adminApi } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader, LoadingScreen, ErrorMessage } from '../../components/UIComponents';
import { COLORS, formatDate } from '../../utils/constants';

export default function AdminDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summary, agentList] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getAgents(),
      ]);
      setStats(summary);
      setAgents(agentList.slice(0, 5));
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <LoadingScreen message="Chargement tableau de bord..." />;
  if (error && !stats) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header Admin */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tableau de Bord Admin</Text>
          <Text style={styles.subtitle}>Bonjour, {user?.full_name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Stats globales */}
      {stats && (
        <View style={styles.section}>
          <SectionHeader title="Statistiques globales" />
          <View style={styles.statsRow}>
            <StatCard icon="👥" value={stats.patients} label="Patients" color={COLORS.primary}
              onPress={() => navigation.navigate('AdminPatients')} />
            <StatCard icon="👤" value={stats.agents} label="Agents" color="#7B1FA2"
              onPress={() => navigation.navigate('AdminAgents')} />
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <StatCard icon="🩺" value={stats.consultations} label="Consultations" color="#0277BD"
              onPress={() => navigation.navigate('AdminConsultations')} />
            <StatCard icon="💉" value={stats.vaccinations} label="Vaccinations" color="#2E7D32" />
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <StatCard icon="🤰" value={stats.pregnancies} label="Grossesses" color="#C62828" />
            <StatCard icon="✅" value={stats.activeAgents} label="Agents actifs" color="#00796B" />
          </View>
        </View>
      )}

      {/* Derniers agents */}
      {agents.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Agents de santé" action={() => navigation.navigate('AdminAgents')} actionLabel="Voir tous" />
          {agents.map((agent, i) => (
            <Card key={i} onPress={() => navigation.navigate('AdminAgents')}>
              <View style={styles.agentRow}>
                <View style={[styles.agentAvatar, { backgroundColor: agent.active ? COLORS.primary : COLORS.gray }]}>
                  <Text style={styles.agentAvatarText}>{agent.full_name?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.full_name}</Text>
                  <Text style={styles.agentDetail}>📍 {agent.region || '-'} • {agent.patientsCount || 0} patients</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: agent.active ? '#4CAF50' : '#F44336' }]} />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Actions rapides */}
      <View style={styles.section}>
        <SectionHeader title="Gestion" />
        <View style={styles.actionsGrid}>
          {[
            { icon: '👤', label: 'Gérer agents', screen: 'AdminAgents' },
            { icon: '👥', label: 'Tous patients', screen: 'AdminPatients' },
            { icon: '🩺', label: 'Consultations', screen: 'AdminConsultations' },
            { icon: '📊', label: 'Statistiques', screen: 'AdminStats' },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)}>
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: '#1A237E',
    padding: 20, paddingTop: 50, paddingBottom: 30,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  logoutText: { color: COLORS.white, fontSize: 13, fontWeight: '500' },
  section: { padding: 16, paddingBottom: 4 },
  statsRow: { flexDirection: 'row' },
  agentRow: { flexDirection: 'row', alignItems: 'center' },
  agentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  agentAvatarText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  agentDetail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, width: '47%',
    alignItems: 'center', elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
