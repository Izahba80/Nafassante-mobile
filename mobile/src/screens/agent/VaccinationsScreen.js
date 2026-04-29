// src/screens/agent/VaccinationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { vaccinationsApi } from '../../api/api';
import { localVaccinationsDb } from '../../database/localDb';
import { Card, EmptyState, LoadingScreen, Badge } from '../../components/UIComponents';
import { COLORS, formatDate } from '../../utils/constants';

export default function VaccinationsScreen({ navigation }) {
  const [vaccinations, setVaccinations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVaccinations = useCallback(async () => {
    try {
      const data = await vaccinationsApi.getAll();
      setVaccinations(data);
      setFiltered(data);
    } catch (_) {
      const local = localVaccinationsDb.getAll();
      setVaccinations(local);
      setFiltered(local);
    }
  }, []);

  useEffect(() => { loadVaccinations().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(vaccinations); return; }
    const q = search.toLowerCase();
    setFiltered(vaccinations.filter(v =>
      v.patientName?.toLowerCase().includes(q) ||
      v.patient_name?.toLowerCase().includes(q) ||
      v.vaccineName?.toLowerCase().includes(q) ||
      v.vaccine_name?.toLowerCase().includes(q)
    ));
  }, [search, vaccinations]);

  const onRefresh = async () => { setRefreshing(true); await loadVaccinations(); setRefreshing(false); };

  const renderItem = ({ item }) => {
    const vaccineName = item.vaccineName || item.vaccine_name || '-';
    const patientName = item.patientName || item.patient_name || 'Patient inconnu';
    const dateAdm = item.dateAdministered || item.date_administered || item.createdAt;
    const dose = item.doseNumber || item.dose_number || 1;

    return (
      <Card>
        <View style={styles.row}>
          <View style={styles.vaccineIcon}>
            <Text style={{ fontSize: 22 }}>💉</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.vaccineName}>{vaccineName}</Text>
            <Text style={styles.patientName}>👤 {patientName}</Text>
            <Text style={styles.detail}>📅 {formatDate(dateAdm)} • Dose {dose}</Text>
            {item.location && <Text style={styles.detail}>📍 {item.location}</Text>}
            {item.nextDoseDate && (
              <Text style={styles.nextDose}>
                ⏭ Prochaine dose: {formatDate(item.nextDoseDate || item.next_dose_date)}
              </Text>
            )}
          </View>
          <Badge label={`D${dose}`} color={COLORS.primary} />
        </View>
        {(item.synced === 0) && (
          <Text style={styles.unsync}>⏳ Non synchronisé</Text>
        )}
      </Card>
    );
  };

  if (loading) return <LoadingScreen message="Chargement vaccinations..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher patient ou vaccin..."
          placeholderTextColor={COLORS.placeholder}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text>✕</Text></TouchableOpacity> : null}
      </View>

      <Text style={styles.count}>{filtered.length} vaccination(s)</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.id || item.local_id || i).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="💉" title="Aucune vaccination" subtitle="Ajoutez une vaccination"
            action={() => navigation.navigate('AddVaccination')} actionLabel="Vacciner" />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddVaccination')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 10, marginLeft: 8 },
  count: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: COLORS.textLight },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  vaccineIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  vaccineName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  patientName: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  nextDose: { fontSize: 13, color: '#0277BD', marginTop: 4, fontWeight: '500' },
  unsync: { fontSize: 11, color: '#E65100', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
