// src/screens/agent/ConsultationsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { consultationsApi } from '../../api/api';
import { localConsultationsDb } from '../../database/localDb';
import { Card, EmptyState, LoadingScreen } from '../../components/UIComponents';
import { COLORS, formatDate } from '../../utils/constants';

export default function ConsultationsScreen({ navigation }) {
  const [consultations, setConsultations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await consultationsApi.getAll();
      setConsultations(data); setFiltered(data);
    } catch (_) {
      const local = localConsultationsDb.getAll();
      setConsultations(local); setFiltered(local);
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(consultations); return; }
    const q = search.toLowerCase();
    setFiltered(consultations.filter(c =>
      (c.patientName || c.patient_name || '').toLowerCase().includes(q) ||
      (c.diagnosis || '').toLowerCase().includes(q)
    ));
  }, [search, consultations]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => {
    const symptoms = typeof item.symptoms === 'string'
      ? JSON.parse(item.symptoms || '[]')
      : (item.symptoms || []);

    return (
      <Card>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 22 }}>🩺</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.patient}>{item.patientName || item.patient_name || 'Patient inconnu'}</Text>
            <Text style={styles.date}>📅 {formatDate(item.date)}</Text>
            <Text style={styles.diagnosis} numberOfLines={2}>📋 {item.diagnosis}</Text>
            {symptoms.length > 0 && (
              <Text style={styles.symptoms} numberOfLines={1}>
                🔸 {Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}
              </Text>
            )}
            {item.treatment && <Text style={styles.treatment} numberOfLines={1}>💊 {item.treatment}</Text>}
          </View>
        </View>
        {item.synced === 0 && <Text style={styles.unsync}>⏳ Non synchronisé</Text>}
      </Card>
    );
  };

  if (loading) return <LoadingScreen message="Chargement consultations..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>🔍</Text>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Rechercher patient ou diagnostic..." placeholderTextColor={COLORS.placeholder} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text>✕</Text></TouchableOpacity> : null}
      </View>
      <Text style={styles.count}>{filtered.length} consultation(s)</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.id || i).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="🩺" title="Aucune consultation"
            action={() => navigation.navigate('AddConsultation')} actionLabel="Nouvelle consultation" />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddConsultation')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 10, marginLeft: 8 },
  count: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: COLORS.textLight },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { flexDirection: 'row' },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  patient: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  date: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  diagnosis: { fontSize: 14, color: COLORS.text, marginTop: 4 },
  symptoms: { fontSize: 13, color: '#E65100', marginTop: 2 },
  treatment: { fontSize: 13, color: '#2E7D32', marginTop: 2 },
  unsync: { fontSize: 11, color: '#E65100', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#0277BD', justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
