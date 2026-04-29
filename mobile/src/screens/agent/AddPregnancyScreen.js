// src/screens/agent/AddPregnancyScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { pregnanciesApi, patientsApi } from '../../api/api';
import { localPregnanciesDb, localPatientsDb } from '../../database/localDb';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, SelectField } from '../../components/UIComponents';
import { COLORS, PREGNANCY_STATUS } from '../../utils/constants';

export default function AddPregnancyScreen({ navigation, route }) {
  const { user } = useAuth();
  const prefillPatient = route?.params?.patient;
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: prefillPatient?.id || prefillPatient?.local_id || '',
    patientLocalId: prefillPatient?.local_id || '',
    startDate: new Date().toISOString().slice(0, 10),
    lastMenstrualPeriod: '',
    expectedDeliveryDate: '',
    status: 'active',
    deliveryDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    patientsApi.getAll()
      .then(data => setPatients(data.filter(p => p.sex === 'F')))
      .catch(() => setPatients(localPatientsDb.getAll().filter(p => p.sex === 'F')));
  }, []);

  // Calcul automatique DDAccouchement si DDR renseignée
  const handleDDRChange = (v) => {
    update('lastMenstrualPeriod', v);
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const ddr = new Date(v);
      ddr.setDate(ddr.getDate() + 280); // 40 semaines
      update('expectedDeliveryDate', ddr.toISOString().slice(0, 10));
    }
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.patientId) e.patientId = 'Patiente requise';
    if (!form.startDate) e.startDate = 'Date de début requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        patientId: form.patientId,
        agentId: user?.id,
        startDate: form.startDate,
        lastMenstrualPeriod: form.lastMenstrualPeriod || null,
        expectedDeliveryDate: form.expectedDeliveryDate || null,
        status: form.status,
        deliveryDate: form.deliveryDate || null,
      };

      try {
        await pregnanciesApi.create(payload);
        Alert.alert('Succès !', 'Grossesse enregistrée', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (_) {
        localPregnanciesDb.create({
          patient_local_id: form.patientLocalId || form.patientId,
          agent_id: user?.id,
          start_date: form.startDate,
          last_menstrual_period: form.lastMenstrualPeriod || null,
          expected_delivery_date: form.expectedDeliveryDate || null,
          status: form.status,
          delivery_date: form.deliveryDate || null,
        });
        Alert.alert('Sauvegardé localement', 'Grossesse enregistrée en mode hors ligne.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = patients.map(p => ({
    label: `${p.name} (${p.locality || '-'})`,
    value: p.id || p.local_id,
    localId: p.local_id,
  }));

  const statusOptions = Object.entries(PREGNANCY_STATUS).map(([key, val]) => ({
    label: val.label, value: key,
  }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Retour</Text></TouchableOpacity>
          <Text style={styles.title}>🤰 Suivi Grossesse</Text>
        </View>

        <View style={styles.form}>
          <SelectField
            label="Patiente *"
            value={form.patientId}
            options={patientOptions}
            onSelect={(v) => {
              const found = patients.find(p => (p.id || p.local_id) === v);
              update('patientId', v);
              update('patientLocalId', found?.local_id || v);
            }}
            placeholder="Choisir la patiente (femmes)"
            error={errors.patientId}
          />

          <InputField label="Date de début du suivi *" value={form.startDate}
            onChangeText={v => update('startDate', v)} placeholder="AAAA-MM-JJ" keyboardType="numeric"
            error={errors.startDate} />

          <InputField label="Date des dernières règles (DDR)" value={form.lastMenstrualPeriod}
            onChangeText={handleDDRChange} placeholder="AAAA-MM-JJ" keyboardType="numeric" />

          <InputField label="Date prévue d'accouchement (DPA)" value={form.expectedDeliveryDate}
            onChangeText={v => update('expectedDeliveryDate', v)} placeholder="Auto-calculé ou AAAA-MM-JJ"
            keyboardType="numeric" />

          <SelectField label="Statut" value={form.status} options={statusOptions}
            onSelect={v => update('status', v)} placeholder="Choisir le statut" />

          {(form.status === 'delivered') && (
            <InputField label="Date d'accouchement réel" value={form.deliveryDate}
              onChangeText={v => update('deliveryDate', v)} placeholder="AAAA-MM-JJ" keyboardType="numeric" />
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 La DPA est calculée automatiquement à partir de la DDR (DDR + 280 jours)
            </Text>
          </View>

          <Button title="Enregistrer" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#C62828', padding: 20, paddingTop: 50 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  form: {
    backgroundColor: COLORS.white, borderRadius: 20, margin: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  infoBox: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 12, marginBottom: 16 },
  infoText: { fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },
});
