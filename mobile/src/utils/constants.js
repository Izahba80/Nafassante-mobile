// src/utils/constants.js

// Palette de couleurs NafasSante
export const COLORS = {
  primary: '#1B5E20',       // Vert foncé
  primaryLight: '#2E7D32',  // Vert moyen
  primaryDark: '#003300',   // Vert très foncé
  accent: '#4CAF50',        // Vert clair
  secondary: '#81C784',     // Vert pâle
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#212121',
  gray: '#757575',
  grayLight: '#EEEEEE',
  danger: '#C62828',
  warning: '#F57C00',
  info: '#0277BD',
  success: '#2E7D32',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  text: '#212121',
  textLight: '#616161',
  placeholder: '#9E9E9E',
};

// Vaccins disponibles au Tchad / Niger
export const VACCINES = [
  'BCG',
  'Polio 0',
  'Pentavalent 1',
  'Pentavalent 2',
  'Pentavalent 3',
  'Pneumo 1',
  'Pneumo 2',
  'Pneumo 3',
  'Rotavirus 1',
  'Rotavirus 2',
  'Rougeole',
  'Fievre jaune',
  'VAT 1',
  'VAT 2',
  'VAT 3',
  'VAT 4',
  'VAT 5',
  'Meningite A',
];

// Régions du Niger
export const REGIONS_NIGER = [
  'Agadez',
  'Diffa',
  'Dosso',
  'Maradi',
  'Niamey',
  'Tahoua',
  'Tillaberi',
  'Zinder',
];

// Régions du Tchad
export const REGIONS_TCHAD = [
  'Batha',
  'Borkou',
  'Chari-Baguirmi',
  'Guera',
  'Hadjer-Lamis',
  'Kanem',
  'Lac',
  'Logone Occidental',
  'Logone Oriental',
  'Mandoul',
  'Mayo-Kebbi Est',
  'Mayo-Kebbi Ouest',
  'Moyen-Chari',
  'N\'Djamena',
  'Ouaddai',
  'Salamat',
  'Sila',
  'Tandjile',
  'Tibesti',
  'Wadi Fira',
];

export const REGIONS = [...REGIONS_NIGER, ...REGIONS_TCHAD];

// Statuts de grossesse
export const PREGNANCY_STATUS = {
  active: { label: 'En cours', color: '#2196F3' },
  delivered: { label: 'Accouchee', color: '#4CAF50' },
  miscarriage: { label: 'Fausse couche', color: '#F44336' },
  complicated: { label: 'Compliquee', color: '#FF9800' },
};

// Groupes sanguins
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Format date utilitaire
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
};

// Calcul âge
export const calculateAge = (birthDate) => {
  if (!birthDate) return '-';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 1) {
    const months = today.getMonth() - birth.getMonth() + 12 * (today.getFullYear() - birth.getFullYear());
    return `${months} mois`;
  }
  return `${age} ans`;
};

// Mois courant en format YYYY-MM
export const currentMonth = () => new Date().toISOString().slice(0, 7);
