// src/screens/agent/PregnanciesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { pregnanciesApi } from '../../api/api';
import { localPregnanciesDb } from '../../database/localDb';
import { Card, EmptyState, LoadingScreen, Badge } from '../../components/UIComponents';
import { COLORS, formatDate, PREGNANCY_STATUS } from '../../utils/constants';

export default function PregnanciesScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await pregnanciesApi.getAll();
      setData(res); setFiltered(res);
    } catch (_) {
      const local = localPregnanciesDb.getAll();
      setData(local); setFiltered(local);
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(data); return; }
    const q = search.toLowerCase();
    setFiltered(data.filter(p => (p.patientName || p.patient_name || '').toLowerCase().includes(q)));
  }, [search, data]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => {
    const status = item.status || 'active';
    const st = PREGNANCY_STATUS[status] || { label: status, color: COLORS.gray };
    const patientName = item.patientName || item.patient_name || 'Patient inconnu';
    const ddr = item.expectedDeliveryDate || item.expected_delivery_date;
    const dpa = item.lastMenstrualPeriod || item.last_menstrual_period;

    return (
      <Card>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: st.color + '22' }]}>
            <Text style={{ fontSize: 22 }}>🤰</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{patientName}</Text>
              <Badge label={st.label} color={st.color} />
            </View>
            {dpa && <Text style={styles.detail}>📅 DDR: {formatDate(dpa)}</Text>}
            {ddr && <Text style={styles.detail}>🍼 DDAccouchement: {formatDate(ddr)}</Text>}
            <Text style={styles.detail}>🕐 Enregistré: {formatDate(item.created_at)}</Text>
          </View>
        </View>
        {item.synced === 0 && <Text style={styles.unsync}>⏳ Non synchronisé</Text>}
      </Card>
    );
  };

  if (loading) return <LoadingScreen message="Chargement grossesses..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>🔍</Text>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Rechercher patient..." placeholderTextColor={COLORS.placeholder} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text>✕</Text></TouchableOpacity> : null}
      </View>
      <Text style={styles.count}>{filtered.length} grossesse(s)</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.id || i).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState icon="🤰" title="Aucune grossesse suivie"
            action={() => navigation.navigate('AddPregnancy')} actionLabel="Nouveau suivi" />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddPregnancy')}>
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
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  unsync: { fontSize: 11, color: '#E65100', marginTop: 6 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#C62828', justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
