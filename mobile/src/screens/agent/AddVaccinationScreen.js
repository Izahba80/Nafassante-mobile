// src/screens/agent/AddVaccinationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { vaccinationsApi, patientsApi } from '../../api/api';
import { localVaccinationsDb, localPatientsDb } from '../../database/localDb';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, SelectField } from '../../components/UIComponents';
import { COLORS, VACCINES } from '../../utils/constants';

export default function AddVaccinationScreen({ navigation, route }) {
  const { user } = useAuth();
  const prefillPatient = route?.params?.patient;
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: prefillPatient?.id || prefillPatient?.local_id || '',
    patientLocalId: prefillPatient?.local_id || '',
    vaccineName: '',
    doseNumber: '1',
    dateAdministered: new Date().toISOString().slice(0, 10),
    nextDoseDate: '',
    batchNumber: '',
    location: user?.region || '',
    observations: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await patientsApi.getAll();
        setPatients(data);
      } catch (_) {
        setPatients(localPatientsDb.getAll());
      }
    };
    loadPatients();
  }, []);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.patientId) e.patientId = 'Patient requis';
    if (!form.vaccineName) e.vaccineName = 'Vaccin requis';
    if (!form.dateAdministered) e.dateAdministered = 'Date requise';
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
        vaccineName: form.vaccineName,
        doseNumber: parseInt(form.doseNumber) || 1,
        dateAdministered: form.dateAdministered,
        nextDoseDate: form.nextDoseDate || null,
        batchNumber: form.batchNumber || null,
        location: form.location || null,
        observations: form.observations || null,
      };

      try {
        await vaccinationsApi.create(payload);
        Alert.alert('Succès !', 'Vaccination enregistrée', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (_) {
        // Offline fallback
        localVaccinationsDb.create({
          patient_local_id: form.patientLocalId || form.patientId,
          agent_id: user?.id,
          vaccine_name: form.vaccineName,
          dose_number: parseInt(form.doseNumber) || 1,
          date_administered: form.dateAdministered,
          next_dose_date: form.nextDoseDate || null,
          batch_number: form.batchNumber || null,
          location: form.location || null,
          observations: form.observations || null,
        });
        Alert.alert('Sauvegardé localement', 'Vaccination enregistrée. Synchronisation au prochain accès réseau.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const patientOptions = patients.map(p => ({
    label: `${p.name} (${p.locality || p.region || '-'})`,
    value: p.id || p.local_id,
    localId: p.local_id,
  }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>💉 Nouvelle Vaccination</Text>
        </View>

        <View style={styles.form}>
          <SelectField
            label="Patient *"
            value={form.patientId}
            options={patientOptions}
            onSelect={(v) => {
              const found = patients.find(p => (p.id || p.local_id) === v);
              update('patientId', v);
              update('patientLocalId', found?.local_id || v);
            }}
            placeholder="Choisir le patient"
            error={errors.patientId}
          />

          <SelectField
            label="Vaccin *"
            value={form.vaccineName}
            options={VACCINES.map(v => ({ label: v, value: v }))}
            onSelect={v => update('vaccineName', v)}
            placeholder="Choisir le vaccin"
            error={errors.vaccineName}
          />

          <SelectField
            label="Numéro de dose *"
            value={form.doseNumber}
            options={['1','2','3','4','5'].map(n => ({ label: `Dose ${n}`, value: n }))}
            onSelect={v => update('doseNumber', v)}
            placeholder="Dose 1"
          />

          <InputField
            label="Date d'administration *"
            value={form.dateAdministered}
            onChangeText={v => update('dateAdministered', v)}
            placeholder="AAAA-MM-JJ"
            keyboardType="numeric"
            error={errors.dateAdministered}
          />

          <InputField
            label="Date prochaine dose"
            value={form.nextDoseDate}
            onChangeText={v => update('nextDoseDate', v)}
            placeholder="AAAA-MM-JJ (optionnel)"
            keyboardType="numeric"
          />

          <InputField
            label="Numéro de lot (batch)"
            value={form.batchNumber}
            onChangeText={v => update('batchNumber', v)}
            placeholder="Ex: LOT-2024-001"
          />

          <InputField
            label="Lieu d'administration"
            value={form.location}
            onChangeText={v => update('location', v)}
            placeholder="Centre de santé, village..."
          />

          <InputField
            label="Observations"
            value={form.observations}
            onChangeText={v => update('observations', v)}
            placeholder="Réactions, remarques..."
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <Button title="Enregistrer la vaccination" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 50 },
  backBtn: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  form: {
    backgroundColor: COLORS.white, borderRadius: 20, margin: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
});
