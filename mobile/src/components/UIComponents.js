// src/components/UIComponents.js
import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, Modal, ScrollView, Alert,
} from 'react-native';
import { COLORS } from '../utils/constants';

// =====================================================
// BOUTON PRINCIPAL
// =====================================================
export const Button = ({ title, onPress, loading, disabled, variant = 'primary', style, textStyle }) => {
  const bgColor = {
    primary: COLORS.primary,
    secondary: COLORS.accent,
    danger: COLORS.danger,
    outline: 'transparent',
    ghost: 'transparent',
  }[variant] || COLORS.primary;

  const txtColor = variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white;
  const borderColor = variant === 'outline' ? COLORS.primary : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 1.5 : 0 },
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={txtColor} size="small" />
        : <Text style={[styles.buttonText, { color: txtColor }, textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

// =====================================================
// CHAMP DE TEXTE
// =====================================================
export const InputField = ({ label, error, style, inputStyle, ...props }) => (
  <View style={[styles.inputContainer, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        inputStyle,
      ]}
      placeholderTextColor={COLORS.placeholder}
      {...props}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// =====================================================
// CARTE
// =====================================================
export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// =====================================================
// BADGE D'ÉTAT
// =====================================================
export const Badge = ({ label, color, textColor }) => (
  <View style={[styles.badge, { backgroundColor: color || COLORS.accent }]}>
    <Text style={[styles.badgeText, { color: textColor || COLORS.white }]}>{label}</Text>
  </View>
);

// =====================================================
// HEADER DE SECTION
// =====================================================
export const SectionHeader = ({ title, action, actionLabel }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sectionAction}>{actionLabel || 'Voir tout'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// =====================================================
// CHARGEMENT
// =====================================================
export const LoadingScreen = ({ message }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    {message && <Text style={styles.loadingText}>{message}</Text>}
  </View>
);

// =====================================================
// MESSAGE D'ERREUR
// =====================================================
export const ErrorMessage = ({ message, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorMessage}>{message}</Text>
    {onRetry && (
      <Button title="Reessayer" onPress={onRetry} variant="outline" style={{ marginTop: 12 }} />
    )}
  </View>
);

// =====================================================
// ÉTAT VIDE
// =====================================================
export const EmptyState = ({ icon, title, subtitle, action, actionLabel }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon || '📋'}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <Button title={actionLabel || 'Ajouter'} onPress={action} style={{ marginTop: 16 }} />
    )}
  </View>
);

// =====================================================
// MODAL DE CONFIRMATION
// =====================================================
export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, danger }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModal}>
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>
        <View style={styles.confirmButtons}>
          <Button title="Annuler" onPress={onCancel} variant="outline" style={{ flex: 1, marginRight: 8 }} />
          <Button
            title="Confirmer"
            onPress={onConfirm}
            variant={danger ? 'danger' : 'primary'}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  </Modal>
);

// =====================================================
// SÉLECTEUR (Picker simple)
// =====================================================
export const SelectField = ({ label, value, options, onSelect, placeholder, error }) => {
  const [visible, setVisible] = React.useState(false);
  const selected = options?.find(o => (o.value || o) === value);
  const displayLabel = selected ? (selected.label || selected) : (placeholder || 'Choisir...');

  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selectButton, error && styles.inputError]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.selectText, !value && { color: COLORS.placeholder }]}>
          {displayLabel}
        </Text>
        <Text style={styles.selectArrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.selectModal}>
            <Text style={styles.selectModalTitle}>{label || 'Choisir une option'}</Text>
            <ScrollView>
              {(options || []).map((opt, idx) => {
                const val = opt.value !== undefined ? opt.value : opt;
                const lbl = opt.label || opt;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.selectOption, val === value && styles.selectOptionSelected]}
                    onPress={() => { onSelect(val); setVisible(false); }}
                  >
                    <Text style={[styles.selectOptionText, val === value && { color: COLORS.primary, fontWeight: '600' }]}>
                      {lbl}
                    </Text>
                    {val === value && <Text style={{ color: COLORS.primary }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// =====================================================
// STAT CARD (pour dashboard)
// =====================================================
export const StatCard = ({ icon, value, label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderLeftColor: color || COLORS.primary }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.8 : 1}
  >
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color: color || COLORS.primary }]}>{value ?? '-'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// =====================================================
// STYLES
// =====================================================
const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  badge: {
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sectionAction: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 15 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorMessage: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 50, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  confirmModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 380,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: COLORS.textLight, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row' },

  selectButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  selectText: { fontSize: 15, color: COLORS.text, flex: 1 },
  selectArrow: { fontSize: 12, color: COLORS.gray },
  selectModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxHeight: '70%',
  },
  selectModalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12, textAlign: 'center' },
  selectOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight, flexDirection: 'row', justifyContent: 'space-between' },
  selectOptionSelected: { backgroundColor: '#E8F5E9' },
  selectOptionText: { fontSize: 15, color: COLORS.text },

  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});
