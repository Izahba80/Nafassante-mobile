// src/screens/agent/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { statsApi, stockApi, syncApi } from '../../api/api';
import { localPatientsDb, localConsultationsDb, localPregnanciesDb, localVaccinationsDb } from '../../database/localDb';
import { Card, StatCard, SectionHeader, LoadingScreen, Button } from '../../components/UIComponents';
import { COLORS, formatDate, currentMonth } from '../../utils/constants';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const loadData = useCallback(async () => {
    // Données locales toujours disponibles
    const localPatients = localPatientsDb.getAll();
    const localConsultations = localConsultationsDb.getAll();
    const localPregnancies = localPregnanciesDb.getAll();
    const localVaccinations = localVaccinationsDb.getAll();

    const unsynced =
      localPatientsDb.getUnsynced().length +
      localConsultationsDb.getUnsynced().length +
      localPregnanciesDb.getUnsynced().length +
      localVaccinationsDb.getUnsynced().length;

    setUnsyncedCount(unsynced);

    try {
      const [serverStats, alerts] = await Promise.all([
        statsApi.getAll(),
        stockApi.getAlerts(),
      ]);
      setStats(serverStats);
      setStockAlerts(alerts || []);
      setIsOnline(true);
    } catch (_) {
      // Mode hors ligne : utiliser données locales
      setIsOnline(false);
      setStats({
        global: {
          totalPatients: localPatients.length,
          totalConsultations: localConsultations.length,
          totalPregnancies: localPregnancies.length,
          totalVaccinations: localVaccinations.length,
        }
      });
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (!isOnline) return Alert.alert('Hors ligne', 'Connectez-vous au reseau pour synchroniser.');
    setSyncing(true);
    try {
      const patients = localPatientsDb.getUnsynced();
      const consultations = localConsultationsDb.getUnsynced();
      const pregnancies = localPregnanciesDb.getUnsynced();
      const vaccinations = localVaccinationsDb.getUnsynced();

      if (patients.length + consultations.length + pregnancies.length + vaccinations.length === 0) {
        Alert.alert('Synchronise', 'Toutes les donnees sont deja synchronisees ✓');
        setSyncing(false);
        return;
      }

      const payload = {
        agentId: user?.id,
        patients: patients.map(p => ({
          localId: p.local_id, name: p.name, sex: p.sex, birth_date: p.birth_date,
          phone: p.phone, locality: p.locality, region: p.region,
        })),
        consultations: consultations.map(c => ({
          patientId: c.patient_local_id, agentId: c.agent_id || user?.id,
          date: c.date, symptoms: c.symptoms ? JSON.parse(c.symptoms) : [],
          diagnosis: c.diagnosis, treatment: c.treatment,
          weight: c.weight, temperature: c.temperature, notes: c.notes,
        })),
        pregnancies: pregnancies.map(p => ({
          patientId: p.patient_local_id, agentId: p.agent_id || user?.id,
          startDate: p.start_date, lastMenstrualPeriod: p.last_menstrual_period,
          expectedDeliveryDate: p.expected_delivery_date, status: p.status,
        })),
        vaccinations: vaccinations.map(v => ({
          patientId: v.patient_local_id, agentId: v.agent_id || user?.id,
          vaccineName: v.vaccine_name, doseNumber: v.dose_number,
          dateAdministered: v.date_administered, nextDoseDate: v.next_dose_date,
          batchNumber: v.batch_number, location: v.location,
        })),
      };

      const result = await syncApi.sync(payload);

      // Marquer comme synchronisés
      patients.forEach(p => localPatientsDb.markSynced(p.local_id));
      consultations.forEach(c => localConsultationsDb.markSynced(c.local_id));
      pregnancies.forEach(p => localPregnanciesDb.markSynced(p.local_id));
      vaccinations.forEach(v => localVaccinationsDb.markSynced(v.local_id));

      setUnsyncedCount(0);
      Alert.alert('Succes !', `${result.count || 0} element(s) synchronise(s) avec le serveur.`);
      await loadData();
    } catch (error) {
      Alert.alert('Erreur sync', error.message || 'Synchronisation echouee');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingScreen message="Chargement..." />;

  const globalStats = stats?.global || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.userName}>{user?.full_name || 'Agent'}</Text>
          <Text style={styles.userRegion}>📍 {user?.region || 'Region non definie'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }]}>
            <Text style={styles.statusText}>{isOnline ? '🌐 En ligne' : '📵 Hors ligne'}</Text>
          </View>
        </View>
      </View>

      {/* Alerte sync */}
      {unsyncedCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={handleSync} disabled={syncing}>
          <Text style={styles.syncBannerText}>
            {syncing ? '⏳ Synchronisation...' : `🔄 ${unsyncedCount} element(s) non synchronise(s) — Appuyer pour sync`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats rapides */}
      <View style={styles.section}>
        <SectionHeader title="Vue d'ensemble" />
        <View style={styles.statsRow}>
          <StatCard icon="👥" value={globalStats.totalPatients} label="Patients" color={COLORS.primary} onPress={() => navigation.navigate('Patients')} />
          <StatCard icon="🩺" value={globalStats.totalConsultations} label="Consultations" color="#0277BD" onPress={() => navigation.navigate('Consultations')} />
        </View>
        <View style={[styles.statsRow, { marginTop: 8 }]}>
          <StatCard icon="🤰" value={globalStats.totalPregnancies} label="Grossesses" color="#C62828" onPress={() => navigation.navigate('Pregnancies')} />
          <StatCard icon="💉" value={globalStats.totalVaccinations} label="Vaccinations" color="#2E7D32" onPress={() => navigation.navigate('Vaccinations')} />
        </View>
      </View>

      {/* Alertes stock */}
      {stockAlerts.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="⚠️ Alertes Stock" action={() => navigation.navigate('Stock')} actionLabel="Voir stock" />
          {stockAlerts.slice(0, 3).map((alert, i) => (
            <Card key={i} style={styles.alertCard}>
              <Text style={styles.alertVaccine}>💉 {alert.vaccineName}</Text>
              <Text style={styles.alertRemaining}>
                Reste: <Text style={styles.alertDanger}>{alert.remaining} doses</Text>
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Actions rapides */}
      <View style={styles.section}>
        <SectionHeader title="Actions rapides" />
        <View style={styles.actionsGrid}>
          {[
            { icon: '👤', label: 'Nouveau patient', screen: 'AddPatient' },
            { icon: '🩺', label: 'Nouvelle consultation', screen: 'AddConsultation' },
            { icon: '💉', label: 'Vacciner', screen: 'AddVaccination' },
            { icon: '🤰', label: 'Suivi grossesse', screen: 'AddPregnancy' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton sync manuel */}
      <View style={styles.section}>
        <Button
          title={syncing ? 'Synchronisation...' : '🔄 Synchroniser avec le serveur'}
          onPress={handleSync}
          loading={syncing}
          variant={isOnline ? 'primary' : 'outline'}
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.syncHint}>
          {isOnline
            ? `${unsyncedCount === 0 ? 'Tout est synchronise ✓' : `${unsyncedCount} element(s) en attente`}`
            : 'Connectez-vous au reseau pour synchroniser'}
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginTop: 2 },
  userRegion: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  headerRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  statusText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

  syncBanner: {
    backgroundColor: '#FF9800',
    padding: 12,
    alignItems: 'center',
  },
  syncBannerText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  section: { padding: 16, paddingBottom: 4 },
  statsRow: { flexDirection: 'row' },

  alertCard: { padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#FF9800' },
  alertVaccine: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  alertRemaining: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  alertDanger: { color: COLORS.danger, fontWeight: '700' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: { fontSize: 30, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'center' },

  syncHint: { textAlign: 'center', fontSize: 12, color: COLORS.textLight, marginTop: 4 },
});
