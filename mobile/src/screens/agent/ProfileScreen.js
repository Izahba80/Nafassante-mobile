// src/screens/agent/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField, Card } from '../../components/UIComponents';
import { COLORS } from '../../utils/constants';
import { authApi } from '../../api/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPassword) return Alert.alert('Erreur', 'Mot de passe actuel requis');
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) return Alert.alert('Erreur', 'Nouveau mot de passe: min 6 caractères');
    if (pwForm.newPassword !== pwForm.confirmPassword) return Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.currentPassword, pwForm.newPassword);
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
      setChangingPassword(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Échec de la modification');
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    if (!serverUrl.trim()) return;
    const url = serverUrl.trim().replace(/\/$/, '') + '/api';
    await AsyncStorage.setItem('api_url', url);
    Alert.alert('Sauvegardé', `URL du serveur configurée:\n${url}`);
    setShowServerConfig(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Avatar & Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.full_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.full_name}</Text>
        <Text style={styles.role}>{user?.role === 'admin' ? '🔑 Administrateur' : '👤 Agent de santé'}</Text>
        <Text style={styles.region}>📍 {user?.region || 'Région non définie'}</Text>
      </View>

      <View style={styles.content}>
        {/* Infos compte */}
        <Card>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          {[
            { label: 'Email', value: user?.email, icon: '📧' },
            { label: 'Téléphone', value: user?.phone || 'Non renseigné', icon: '📞' },
            { label: 'Région', value: user?.region || 'Non renseignée', icon: '📍' },
            { label: 'Rôle', value: user?.role === 'admin' ? 'Administrateur' : 'Agent de santé', icon: '🏷️' },
          ].map((info, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{info.icon}</Text>
              <View>
                <Text style={styles.infoLabel}>{info.label}</Text>
                <Text style={styles.infoValue}>{info.value}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Changer mot de passe */}
        <Card>
          <TouchableOpacity onPress={() => setChangingPassword(!changingPassword)} style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>🔐 Changer le mot de passe</Text>
            <Text style={{ color: COLORS.primary }}>{changingPassword ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {changingPassword && (
            <View style={{ marginTop: 12 }}>
              <InputField label="Mot de passe actuel" value={pwForm.currentPassword}
                onChangeText={v => setPwForm(p => ({ ...p, currentPassword: v }))} secureTextEntry />
              <InputField label="Nouveau mot de passe" value={pwForm.newPassword}
                onChangeText={v => setPwForm(p => ({ ...p, newPassword: v }))} secureTextEntry />
              <InputField label="Confirmer le nouveau" value={pwForm.confirmPassword}
                onChangeText={v => setPwForm(p => ({ ...p, confirmPassword: v }))} secureTextEntry />
              <Button title="Modifier le mot de passe" onPress={handleChangePassword} loading={pwLoading} />
            </View>
          )}
        </Card>

        {/* Config serveur */}
        <Card>
          <TouchableOpacity onPress={() => setShowServerConfig(!showServerConfig)} style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>⚙️ Configuration serveur</Text>
            <Text style={{ color: COLORS.primary }}>{showServerConfig ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showServerConfig && (
            <View style={{ marginTop: 12 }}>
              <InputField
                label="URL du serveur"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.5:3000"
                autoCapitalize="none"
                keyboardType="url"
              />
              <Button title="Sauvegarder l'URL" onPress={handleSaveServerUrl} variant="outline" />
            </View>
          )}
        </Card>

        {/* Version */}
        <Card>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View>
              <Text style={styles.infoLabel}>Version de l'application</Text>
              <Text style={styles.infoValue}>NafasSante v1.0.0</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏥</Text>
            <View>
              <Text style={styles.infoLabel}>Projet de fin d'études</Text>
              <Text style={styles.infoValue}>Génie Logiciel — Système de Suivi Médical Numérique pour les Zones Rurales</Text>
            </View>
          </View>
        </Card>

        {/* Déconnexion */}
        <Button title="🚪 Se déconnecter" onPress={handleLogout} variant="danger" style={{ marginBottom: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, color: COLORS.white, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  role: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  region: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  infoIcon: { fontSize: 20, marginRight: 12, marginTop: 2 },
  infoLabel: { fontSize: 12, color: COLORS.textLight },
  infoValue: { fontSize: 15, color: COLORS.text, fontWeight: '500', marginTop: 2 },
});
