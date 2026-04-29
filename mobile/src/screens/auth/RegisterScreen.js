// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, SelectField } from '../../components/UIComponents';
import { COLORS, REGIONS } from '../../utils/constants';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    region: '',
    role: 'agent',
  });
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Nom complet requis';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email valide requis';
    if (!form.password || form.password.length < 6) e.password = 'Mot de passe: minimum 6 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!form.region) e.region = 'Region requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || null,
        region: form.region,
        role: form.role,
      });
    } catch (error) {
      Alert.alert('Erreur inscription', error.message || 'Inscription echouee');
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
          <Text style={styles.title}>Inscription</Text>
          <Text style={styles.subtitle}>Creez votre compte agent de sante</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Nom complet *"
            value={form.fullName}
            onChangeText={v => update('fullName', v)}
            placeholder="Ex: Moussa Ibrahim"
            error={errors.fullName}
            autoCapitalize="words"
          />
          <InputField
            label="Email *"
            value={form.email}
            onChangeText={v => update('email', v)}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <InputField
            label="Mot de passe *"
            value={form.password}
            onChangeText={v => update('password', v)}
            placeholder="Minimum 6 caracteres"
            secureTextEntry
            error={errors.password}
          />
          <InputField
            label="Confirmer le mot de passe *"
            value={form.confirmPassword}
            onChangeText={v => update('confirmPassword', v)}
            placeholder="Repetez le mot de passe"
            secureTextEntry
            error={errors.confirmPassword}
          />
          <InputField
            label="Telephone"
            value={form.phone}
            onChangeText={v => update('phone', v)}
            placeholder="+227 XX XX XX XX"
            keyboardType="phone-pad"
          />
          <SelectField
            label="Region *"
            value={form.region}
            options={REGIONS.map(r => ({ label: r, value: r }))}
            onSelect={v => update('region', v)}
            placeholder="Choisir votre region"
            error={errors.region}
          />

          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleButtons}>
              {['agent', 'admin'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, form.role === role && styles.roleBtnActive]}
                  onPress={() => update('role', role)}
                >
                  <Text style={[styles.roleBtnText, form.role === role && styles.roleBtnTextActive]}>
                    {role === 'agent' ? '👤 Agent de sante' : '🔑 Administrateur'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Creer mon compte"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 16 }}>
            <Text style={styles.loginLink}>
              Deja inscrit? <Text style={styles.loginLinkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingBottom: 40 },
  header: {
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  backBtn: { marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  roleContainer: { marginBottom: 16 },
  roleLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 8 },
  roleButtons: { flexDirection: 'row', gap: 8 },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  roleBtnText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  roleBtnTextActive: { color: COLORS.primary },
  loginLink: { textAlign: 'center', fontSize: 14, color: COLORS.textLight },
  loginLinkBold: { color: COLORS.primary, fontWeight: '600' },
});
