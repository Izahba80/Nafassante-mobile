// src/screens/agent/AddPatientScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { patientsApi } from '../../api/api';
import { localPatientsDb } from '../../database/localDb';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, SelectField } from '../../components/UIComponents';
import { COLORS, REGIONS, BLOOD_TYPES } from '../../utils/constants';

export default function AddPatientScreen({ navigation, route }) {
  const { user } = useAuth();
  const editingPatient = route?.params?.patient;

  const [form, setForm] = useState({
    name: editingPatient?.name || '',
    sex: editingPatient?.sex || '',
    birth_date: editingPatient?.birth_date || '',
    phone: editingPatient?.phone || '',
    locality: editingPatient?.locality || '',
    region: editingPatient?.region || user?.region || '',
    blood_type: editingPatient?.blood_type || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.sex) e.sex = 'Sexe requis';
    if (!form.birth_date) e.birth_date = 'Date de naissance requise';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth_date)) e.birth_date = 'Format: AAAA-MM-JJ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const patientData = {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        locality: form.locality.trim() || null,
        created_by: user?.id,
      };

      if (editingPatient) {
        await patientsApi.update(editingPatient.id, patientData);
        Alert.alert('Succes', 'Patient mis a jour', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        try {
          await patientsApi.create(patientData);
          Alert.alert('Succes', 'Patient enregistre avec succes !', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (_) {
          // Sauvegarde locale si hors ligne
          localPatientsDb.create({ ...patientData, created_by: user?.id });
          Alert.alert(
            'Sauvegarde locale',
            'Pas de connexion — Patient enregistre localement. Il sera synchronise lors de la prochaine connexion.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editingPatient ? 'Modifier Patient' : 'Nouveau Patient'}</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Nom complet *"
            value={form.name}
            onChangeText={v => update('name', v)}
            placeholder="Prenom et Nom"
            autoCapitalize="words"
            error={errors.name}
          />

          <View style={styles.sexContainer}>
            <Text style={styles.fieldLabel}>Sexe *</Text>
            <View style={styles.sexRow}>
              {[{ label: '♂ Masculin', value: 'M' }, { label: '♀ Feminin', value: 'F' }].map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[styles.sexBtn, form.sex === s.value && styles.sexBtnActive(s.value)]}
                  onPress={() => update('sex', s.value)}
                >
                  <Text style={[styles.sexBtnText, form.sex === s.value && styles.sexBtnTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.sex && <Text style={styles.errorText}>{errors.sex}</Text>}
          </View>

          <InputField
            label="Date de naissance *"
            value={form.birth_date}
            onChangeText={v => update('birth_date', v)}
            placeholder="AAAA-MM-JJ (ex: 1990-06-15)"
            keyboardType="numeric"
            error={errors.birth_date}
          />

          <InputField
            label="Telephone"
            value={form.phone}
            onChangeText={v => update('phone', v)}
            placeholder="+227 XX XX XX XX"
            keyboardType="phone-pad"
          />

          <InputField
            label="Localite / Village"
            value={form.locality}
            onChangeText={v => update('locality', v)}
            placeholder="Village ou quartier"
            autoCapitalize="words"
          />

          <SelectField
            label="Region"
            value={form.region}
            options={REGIONS.map(r => ({ label: r, value: r }))}
            onSelect={v => update('region', v)}
            placeholder="Choisir la region"
          />

          <SelectField
            label="Groupe sanguin"
            value={form.blood_type}
            options={BLOOD_TYPES.map(b => ({ label: b, value: b }))}
            onSelect={v => update('blood_type', v)}
            placeholder="Choisir (optionnel)"
          />

          <View style={styles.offlineNote}>
            <Text style={styles.offlineNoteText}>
              💡 Si vous n'avez pas de connexion internet, le patient sera sauvegarde localement et synchronise plus tard.
            </Text>
          </View>

          <Button
            title={editingPatient ? 'Enregistrer les modifications' : 'Enregistrer le patient'}
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 50,
  },
  backBtn: { marginBottom: 12 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  sexContainer: { marginBottom: 16 },
  sexRow: { flexDirection: 'row', gap: 10 },
  sexBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  sexBtnActive: (sex) => ({
    borderColor: sex === 'M' ? '#1565C0' : '#AD1457',
    backgroundColor: sex === 'M' ? '#E3F2FD' : '#FCE4EC',
  }),
  sexBtnText: { fontSize: 15, color: COLORS.textLight, fontWeight: '500' },
  sexBtnTextActive: { fontWeight: '700', color: COLORS.text },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  offlineNote: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  offlineNoteText: { fontSize: 13, color: COLORS.primaryLight, lineHeight: 18 },
});
