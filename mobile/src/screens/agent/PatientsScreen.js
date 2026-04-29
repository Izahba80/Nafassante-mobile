// src/screens/agent/PatientsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { patientsApi } from '../../api/api';
import { localPatientsDb } from '../../database/localDb';
import { useAuth } from '../../context/AuthContext';
import { Card, EmptyState, LoadingScreen, Button, Badge } from '../../components/UIComponents';
import { COLORS, formatDate, calculateAge } from '../../utils/constants';

export default function PatientsScreen({ navigation }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const data = await patientsApi.getAll();
      setPatients(data);
      setFiltered(data);
    } catch (_) {
      // Fallback hors ligne
      const local = localPatientsDb.getAll();
      setPatients(local);
      setFiltered(local);
    }
  }, []);

  useEffect(() => {
    loadPatients().finally(() => setLoading(false));
  }, [loadPatients]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(patients); return; }
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.locality?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    ));
  }, [search, patients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const renderPatient = ({ item }) => (
    <Card onPress={() => navigation.navigate('PatientDetail', { patient: item })}>
      <View style={styles.patientRow}>
        <View style={styles.patientAvatar}>
          <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.patientInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Badge
              label={item.sex === 'M' ? '♂' : '♀'}
              color={item.sex === 'M' ? '#1565C0' : '#AD1457'}
            />
          </View>
          <Text style={styles.patientDetail}>
            📅 {calculateAge(item.birth_date)} • 📍 {item.locality || 'N/A'}
          </Text>
          {item.phone && <Text style={styles.patientPhone}>📞 {item.phone}</Text>}
        </View>
        <View style={styles.arrow}>
          <Text style={{ color: COLORS.gray }}>›</Text>
        </View>
      </View>
      {!item.synced && item.synced !== undefined && item.synced !== 1 && (
        <View style={styles.unsyncBadge}>
          <Text style={styles.unsyncText}>⏳ Non synchronise</Text>
        </View>
      )}
    </Card>
  );

  if (loading) return <LoadingScreen message="Chargement des patients..." />;

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher par nom, localite, telephone..."
          placeholderTextColor={COLORS.placeholder}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.count}>
        {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.id || item.local_id || i).toString()}
        renderItem={renderPatient}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Aucun patient"
            subtitle={search ? 'Aucun resultat pour cette recherche' : 'Ajoutez votre premier patient'}
            action={search ? null : () => navigation.navigate('AddPatient')}
            actionLabel="Ajouter un patient"
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPatient')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text, paddingVertical: 10 },
  clearIcon: { fontSize: 16, color: COLORS.gray, padding: 4 },
  count: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: COLORS.textLight },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  patientRow: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  patientInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  patientName: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  patientDetail: { fontSize: 13, color: COLORS.textLight },
  patientPhone: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  arrow: { paddingLeft: 8 },
  unsyncBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  unsyncText: { fontSize: 11, color: '#E65100' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
