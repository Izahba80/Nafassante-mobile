// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Button, InputField } from '../../components/UIComponents';
import { COLORS } from '../../utils/constants';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Erreur', 'Veuillez entrer votre email');
    if (!password) return Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');

    setLoading(true);
    try {
      if (serverUrl.trim()) {
        await AsyncStorage.setItem('api_url', serverUrl.trim().replace(/\/$/, '') + '/api');
      }
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      Alert.alert(
        'Connexion echouee',
        error.message || 'Email ou mot de passe incorrect.\nVerifiez aussi l\'adresse IP du serveur.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Titre */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🏥</Text>
          </View>
          <Text style={styles.appName}>NafasSante</Text>
          <Text style={styles.tagline}>Suivi Medical Numerique</Text>
          <Text style={styles.taglineSub}>pour les Zones Rurales</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.welcomeText}>Bienvenue 👋</Text>
          <Text style={styles.subText}>Connectez-vous pour continuer</Text>

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <InputField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              style={{ marginBottom: 0, flex: 1 }}
            />
            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.showPasswordText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          {/* Configuration serveur */}
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Text style={styles.configToggleText}>
              ⚙️ {showConfig ? 'Masquer' : 'Configurer'} l'adresse du serveur
            </Text>
          </TouchableOpacity>

          {showConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configLabel}>
                Entrez l'adresse IP affichee au demarrage du serveur:
              </Text>
              <InputField
                label="URL du serveur (ex: http://192.168.1.5:3000)"
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.5:3000"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.configHint}>
                💡 Laissez vide si l'adresse est deja configuree
              </Text>
            </View>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>
              Pas encore de compte?{' '}
              <Text style={styles.registerLinkBold}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1 },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 44 },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  taglineSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  form: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  welcomeText: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subText: { fontSize: 15, color: COLORS.textLight, marginBottom: 24 },

  passwordContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  showPasswordBtn: { paddingBottom: 14, paddingLeft: 8 },
  showPasswordText: { fontSize: 20 },

  loginButton: { marginBottom: 16 },

  configToggle: { alignItems: 'center', marginBottom: 12 },
  configToggleText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  configBox: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  configLabel: { fontSize: 13, color: COLORS.textLight, marginBottom: 8 },
  configHint: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },

  registerLink: { textAlign: 'center', fontSize: 14, color: COLORS.textLight },
  registerLinkBold: { color: COLORS.primary, fontWeight: '600' },
});
