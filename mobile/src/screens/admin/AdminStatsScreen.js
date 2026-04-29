// src/screens/admin/AdminStatsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { adminApi, statsApi } from '../../api/api';
import { Card, LoadingScreen, SectionHeader, StatCard } from '../../components/UIComponents';
import { COLORS, currentMonth } from '../../utils/constants';

export default function AdminStatsScreen() {
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, m] = await Promise.all([
        adminApi.getStats(),
        statsApi.getMonthly(currentMonth()),
      ]);
      setStats(s);
      setMonthlyStats(m);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <LoadingScreen message="Calcul des statistiques..." />;

  const byRegion = stats?.byRegion || {};
  const bySex = stats?.bySex || {};
  const byVaccine = monthlyStats?.byVaccine || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Stats globales */}
      <View style={styles.section}>
        <SectionHeader title="Chiffres clés" />
        <View style={styles.row}>
          <StatCard icon="👥" value={stats?.totalPatients} label="Patients" color={COLORS.primary} />
          <StatCard icon="👤" value={stats?.totalAgents} label="Agents" color="#7B1FA2" />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <StatCard icon="🩺" value={stats?.totalConsultations} label="Consultations" color="#0277BD" />
          <StatCard icon="💉" value={stats?.totalVaccinations} label="Vaccinations" color="#2E7D32" />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <StatCard icon="🤰" value={stats?.totalPregnancies} label="Grossesses" color="#C62828" />
          <StatCard icon=" " value="" label="" color="transparent" />
        </View>
      </View>

      {/* Par sexe */}
      {(bySex.M !== undefined || bySex.F !== undefined) && (
        <View style={styles.section}>
          <SectionHeader title="Répartition par sexe" />
          <Card>
            <View style={styles.sexRow}>
              <View style={styles.sexItem}>
                <Text style={[styles.sexValue, { color: '#1565C0' }]}>{bySex.M || 0}</Text>
                <Text style={styles.sexLabel}>♂ Hommes</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.sexItem}>
                <Text style={[styles.sexValue, { color: '#AD1457' }]}>{bySex.F || 0}</Text>
                <Text style={styles.sexLabel}>♀ Femmes</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Par région */}
      {Object.keys(byRegion).length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Patients par région" />
          <Card>
            {Object.entries(byRegion)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([region, count], i) => (
                <View key={i} style={styles.regionRow}>
                  <Text style={styles.regionName}>📍 {region}</Text>
                  <View style={styles.regionBar}>
                    <View style={[styles.regionBarFill, {
                      width: `${Math.min((count / Math.max(...Object.values(byRegion))) * 100, 100)}%`
                    }]} />
                  </View>
                  <Text style={styles.regionCount}>{count}</Text>
                </View>
              ))}
          </Card>
        </View>
      )}

      {/* Vaccins ce mois */}
      {Object.keys(byVaccine).length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`Vaccinations ce mois`} />
          <Card>
            {Object.entries(byVaccine).sort(([, a], [, b]) => b - a).map(([vaccine, count], i) => (
              <View key={i} style={styles.vaccineRow}>
                <Text style={styles.vaccineName}>💉 {vaccine}</Text>
                <Text style={styles.vaccineCount}>{count} dose(s)</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { padding: 16, paddingBottom: 4 },
  row: { flexDirection: 'row' },
  sexRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  sexItem: { alignItems: 'center', flex: 1 },
  sexValue: { fontSize: 32, fontWeight: '800' },
  sexLabel: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  divider: { width: 1, backgroundColor: COLORS.border, marginVertical: 4 },
  regionRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  regionName: { fontSize: 13, color: COLORS.text, width: 120 },
  regionBar: { flex: 1, height: 8, backgroundColor: COLORS.grayLight, borderRadius: 4, marginHorizontal: 8 },
  regionBarFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  regionCount: { fontSize: 13, fontWeight: '700', color: COLORS.primary, width: 30, textAlign: 'right' },
  vaccineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  vaccineName: { fontSize: 14, color: COLORS.text },
  vaccineCount: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
