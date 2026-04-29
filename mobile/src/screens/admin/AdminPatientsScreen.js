// src/screens/admin/AdminPatientsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { adminApi } from '../../api/api';
import { Card, LoadingScreen, EmptyState, Badge } from '../../components/UIComponents';
import { COLORS, formatDate, calculateAge } from '../../utils/constants';

export default function AdminPatientsScreen() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await adminApi.getAllPatients();
      setPatients(data); setFiltered(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.locality?.toLowerCase().includes(q) ||
      (p.agentName || '').toLowerCase().includes(q)
    ));
  }, [search, patients]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderItem = ({ item }) => (
    <Card>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Badge label={item.sex === 'M' ? '♂' : '♀'} color={item.sex === 'M' ? '#1565C0' : '#AD1457'} />
          </View>
          <Text style={styles.detail}>📅 {calculateAge(item.birth_date)} • 📍 {item.locality || '-'}</Text>
          <Text style={styles.detail}>👤 Agent: {item.agentName || '-'}</Text>
          <Text style={styles.detail}>🕐 Ajouté le {formatDate(item.createdAt || item.created_at)}</Text>
        </View>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen message="Chargement patients..." />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text>🔍</Text>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Rechercher..." placeholderTextColor={COLORS.placeholder} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Text>✕</Text></TouchableOpacity> : null}
      </View>
      <Text style={styles.count}>{filtered.length} patient(s)</Text>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.id || i).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={<EmptyState icon="👥" title="Aucun patient" subtitle="Aucun patient enregistré" />}
      />
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
  list: { paddingHorizontal: 12, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  detail: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
});
