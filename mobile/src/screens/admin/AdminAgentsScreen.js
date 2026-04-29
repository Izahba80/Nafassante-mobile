// src/screens/admin/AdminAgentsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  TextInput, Modal, ScrollView, RefreshControl,
} from 'react-native';
import { adminApi } from '../../api/api';
import { Card, Button, InputField, SelectField, LoadingScreen, EmptyState } from '../../components/UIComponents';
import { COLORS, REGIONS } from '../../utils/constants';

export default function AdminAgentsScreen() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', region: '', password: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addErrors, setAddErrors] = useState({});

  const load = useCallback(async () => {
    try {
      const data = await adminApi.getAgents();
      setAgents(data);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleToggle = async (agent) => {
    const newStatus = !agent.active;
    Alert.alert(
      newStatus ? 'Activer' : 'Désactiver',
      `${newStatus ? 'Activer' : 'Désactiver'} l'agent ${agent.full_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await adminApi.toggleAgent(agent.id, newStatus);
              setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, active: newStatus } : a));
            } catch (err) {
              Alert.alert('Erreur', err.message);
            }
          }
        }
      ]
    );
  };

  const updateAdd = (field, value) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
    if (addErrors[field]) setAddErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateAdd = () => {
    const e = {};
    if (!addForm.full_name.trim()) e.full_name = 'Nom requis';
    if (!addForm.email.trim() || !addForm.email.includes('@')) e.email = 'Email valide requis';
    if (!addForm.password || addForm.password.length < 6) e.password = 'Mot de passe: min 6 caractères';
    if (!addForm.region) e.region = 'Région requise';
    setAddErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddAgent = async () => {
    if (!validateAdd()) return;
    setAddLoading(true);
    try {
      await adminApi.createAgent(addForm);
      Alert.alert('Succès !', 'Agent créé avec succès');
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', region: '', password: '' });
      await load();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const renderAgent = ({ item }) => (
    <Card>
      <View style={styles.agentRow}>
        <View style={[styles.avatar, { backgroundColor: item.active ? COLORS.primary : COLORS.gray }]}>
          <Text style={styles.avatarText}>{item.full_name?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.agentName}>{item.full_name}</Text>
          <Text style={styles.agentEmail}>{item.email}</Text>
          <Text style={styles.agentDetail}>
            📍 {item.region || '-'} • {item.patientsCount || 0} patients • {item.consultationsCount || 0} consultations
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: item.active ? '#E8F5E9' : '#FFEBEE' }]}
          onPress={() => handleToggle(item)}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.active ? '#2E7D32' : '#C62828' }}>
            {item.active ? '✓ Actif' : '✗ Inactif'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <LoadingScreen message="Chargement agents..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={agents}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAgent}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.count}>{agents.length} agent(s)</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="👤" title="Aucun agent" action={() => setShowAddModal(true)} actionLabel="Créer un agent" />
        }
      />

      {/* FAB Ajouter */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal ajout agent */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Créer un agent</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <InputField label="Nom complet *" value={addForm.full_name}
              onChangeText={v => updateAdd('full_name', v)} placeholder="Prénom Nom"
              autoCapitalize="words" error={addErrors.full_name} />
            <InputField label="Email *" value={addForm.email}
              onChangeText={v => updateAdd('email', v)} placeholder="email@exemple.com"
              keyboardType="email-address" autoCapitalize="none" error={addErrors.email} />
            <InputField label="Mot de passe *" value={addForm.password}
              onChangeText={v => updateAdd('password', v)} placeholder="Min 6 caractères"
              secureTextEntry error={addErrors.password} />
            <SelectField label="Région *" value={addForm.region}
              options={REGIONS.map(r => ({ label: r, value: r }))}
              onSelect={v => updateAdd('region', v)} placeholder="Choisir la région" error={addErrors.region} />
            <Button title="Créer l'agent" onPress={handleAddAgent} loading={addLoading} style={{ marginTop: 8, marginBottom: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, paddingBottom: 100 },
  header: { marginBottom: 4 },
  count: { fontSize: 13, color: COLORS.textLight, paddingHorizontal: 4, marginBottom: 8 },
  agentRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  agentEmail: { fontSize: 13, color: COLORS.textLight, marginTop: 1 },
  agentDetail: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  toggleBtn: { borderRadius: 20, paddingVertical: 6, paddingHorizontal: 10 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#1A237E', justifyContent: 'center', alignItems: 'center', elevation: 6,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  modalContainer: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#1A237E',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  closeBtn: { fontSize: 22, color: COLORS.white, padding: 4 },
  modalContent: { padding: 20 },
});
