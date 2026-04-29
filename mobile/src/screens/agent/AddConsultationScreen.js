// src/screens/agent/AddConsultationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { consultationsApi, patientsApi } from '../../api/api';
import { localConsultationsDb, localPatientsDb } from '../../database/localDb';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, SelectField } from '../../components/UIComponents';
import { COLORS } from '../../utils/constants';

const SYMPTOMS_LIST = [
  'Fièvre', 'Toux', 'Maux de tête', 'Douleurs abdominales', 'Diarrhée',
  'Vomissements', 'Fatigue', 'Perte d\'appétit', 'Difficultés respiratoires',
  'Éruption cutanée', 'Paludisme', 'Anémie',
];

export default function AddConsultationScreen({ navigation, route }) {
  const { user } = useAuth();
  const prefillPatient = route?.params?.patient;
  const [patients, setPatients] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [form, setForm] = useState({
    patientId: prefillPatient?.id || prefillPatient?.local_id || '',
    patientLocalId: prefillPatient?.local_id || '',
    date: new Date().toISOString().slice(0, 10),
    diagnosis: '',
    treatment: '',
    weight: '',
    temperature: '',
    bloodPressure: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    patientsApi.getAll().then(setPatients).catch(() => setPatients(localPatientsDb.getAll()));
  }, []);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const validate = () => {
    const e = {};
    if (!form.patientId) e.patientId = 'Patient requis';
    if (!form.date) e.date = 'Date requise';
    if (!form.diagnosis.trim()) e.diagnosis = 'Diagnostic requis';
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
        date: form.date,
        symptoms: selectedSymptoms,
        diagnosis: form.diagnosis.trim(),
        treatment: form.treatment || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        bloodPressure: form.bloodPressure || null,
        notes: form.notes || null,
      };

      try {
        await consultationsApi.create(payload);
        Alert.alert('Succès !', 'Consultation enregistrée', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (_) {
        localConsultationsDb.create({
          patient_local_id: form.patientLocalId || form.patientId,
          agent_id: user?.id,
          date: form.date,
          symptoms: selectedSymptoms,
          diagnosis: form.diagnosis,
          treatment: form.treatment || null,
          weight: form.weight ? parseFloat(form.weight) : null,
          temperature: form.temperature ? parseFloat(form.temperature) : null,
          blood_pressure: form.bloodPressure || null,
          notes: form.notes || null,
        });
        Alert.alert('Sauvegardé localement', 'Consultation enregistrée. Synchronisation ultérieure.',
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Retour</Text></TouchableOpacity>
          <Text style={styles.title}>🩺 Nouvelle Consultation</Text>
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

          <InputField label="Date *" value={form.date} onChangeText={v => update('date', v)}
            placeholder="AAAA-MM-JJ" keyboardType="numeric" error={errors.date} />

          {/* Symptômes */}
          <Text style={styles.sectionLabel}>Symptômes</Text>
          <View style={styles.symptomsGrid}>
            {SYMPTOMS_LIST.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.symptomChip, selectedSymptoms.includes(s) && styles.symptomChipActive]}
                onPress={() => toggleSymptom(s)}
              >
                <Text style={[styles.symptomText, selectedSymptoms.includes(s) && styles.symptomTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField label="Diagnostic *" value={form.diagnosis} onChangeText={v => update('diagnosis', v)}
            placeholder="Ex: Paludisme simple, IRA..." multiline numberOfLines={2}
            inputStyle={{ minHeight: 60, textAlignVertical: 'top' }} error={errors.diagnosis} />

          <InputField label="Traitement prescrit" value={form.treatment} onChangeText={v => update('treatment', v)}
            placeholder="Médicaments et posologie..." multiline numberOfLines={3}
            inputStyle={{ minHeight: 70, textAlignVertical: 'top' }} />

          <View style={styles.vitalsRow}>
            <InputField label="Poids (kg)" value={form.weight} onChangeText={v => update('weight', v)}
              placeholder="Ex: 65" keyboardType="decimal-pad" style={{ flex: 1, marginRight: 8 }} />
            <InputField label="Temp (°C)" value={form.temperature} onChangeText={v => update('temperature', v)}
              placeholder="Ex: 37.5" keyboardType="decimal-pad" style={{ flex: 1 }} />
          </View>

          <InputField label="Tension artérielle" value={form.bloodPressure} onChangeText={v => update('bloodPressure', v)}
            placeholder="Ex: 120/80" />

          <InputField label="Notes" value={form.notes} onChangeText={v => update('notes', v)}
            placeholder="Observations complémentaires..." multiline numberOfLines={3}
            inputStyle={{ minHeight: 70, textAlignVertical: 'top' }} />

          <Button title="Enregistrer la consultation" onPress={handleSave} loading={loading} style={{ marginTop: 8 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#0277BD', padding: 20, paddingTop: 50 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  form: {
    backgroundColor: COLORS.white, borderRadius: 20, margin: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  sectionLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 10 },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  symptomChip: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  symptomChipActive: { borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  symptomText: { fontSize: 13, color: COLORS.textLight },
  symptomTextActive: { color: COLORS.primary, fontWeight: '600' },
  vitalsRow: { flexDirection: 'row' },
});
