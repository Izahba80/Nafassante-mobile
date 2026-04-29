// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';
import { LoadingScreen } from '../components/UIComponents';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Agent Screens
import DashboardScreen from '../screens/agent/DashboardScreen';
import PatientsScreen from '../screens/agent/PatientsScreen';
import AddPatientScreen from '../screens/agent/AddPatientScreen';
import VaccinationsScreen from '../screens/agent/VaccinationsScreen';
import AddVaccinationScreen from '../screens/agent/AddVaccinationScreen';
import ConsultationsScreen from '../screens/agent/ConsultationsScreen';
import AddConsultationScreen from '../screens/agent/AddConsultationScreen';
import PregnanciesScreen from '../screens/agent/PregnanciesScreen';
import AddPregnancyScreen from '../screens/agent/AddPregnancyScreen';
import ProfileScreen from '../screens/agent/ProfileScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminAgentsScreen from '../screens/admin/AdminAgentsScreen';
import AdminPatientsScreen from '../screens/admin/AdminPatientsScreen';
import AdminStatsScreen from '../screens/admin/AdminStatsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// =====================================================
// ICON HELPER
// =====================================================
const TabIcon = ({ emoji, label, focused }) => (
  <View style={tabStyles.iconContainer}>
    <Text style={[tabStyles.emoji, focused && tabStyles.emojiFocused]}>{emoji}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
  </View>
);

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  emoji: { fontSize: 20, opacity: 0.6 },
  emojiFocused: { opacity: 1 },
  label: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  labelFocused: { color: COLORS.primary, fontWeight: '600' },
});

// =====================================================
// AUTH STACK
// =====================================================
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// =====================================================
// AGENT TABS
// =====================================================
function AgentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.white,
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} /> }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Patients" focused={focused} /> }}
      />
      <Tab.Screen
        name="Vaccinations"
        component={VaccinationStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="💉" label="Vaccins" focused={focused} /> }}
      />
      <Tab.Screen
        name="Consultations"
        component={ConsultationStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🩺" label="Consultations" focused={focused} /> }}
      />
      <Tab.Screen
        name="Pregnancies"
        component={PregnancyStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🤰" label="Grossesses" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function PatientsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientsList" component={PatientsScreen} />
      <Stack.Screen name="AddPatient" component={AddPatientScreen} />
      <Stack.Screen name="PatientDetail" component={AddPatientScreen} />
    </Stack.Navigator>
  );
}

function VaccinationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VaccinationsList" component={VaccinationsScreen} />
      <Stack.Screen name="AddVaccination" component={AddVaccinationScreen} />
    </Stack.Navigator>
  );
}

function ConsultationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConsultationsList" component={ConsultationsScreen} />
      <Stack.Screen name="AddConsultation" component={AddConsultationScreen} />
    </Stack.Navigator>
  );
}

function PregnancyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PregnanciesList" component={PregnanciesScreen} />
      <Stack.Screen name="AddPregnancy" component={AddPregnancyScreen} />
    </Stack.Navigator>
  );
}

// =====================================================
// ADMIN TABS
// =====================================================
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 70, paddingBottom: 10, paddingTop: 4,
          borderTopColor: COLORS.border, backgroundColor: COLORS.white, elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Tableau" focused={focused} /> }}
      />
      <Tab.Screen
        name="AdminAgents"
        component={AdminAgentsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Agents" focused={focused} /> }}
      />
      <Tab.Screen
        name="AdminPatients"
        component={AdminPatientsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Patients" focused={focused} /> }}
      />
      <Tab.Screen
        name="AdminConsultations"
        component={AdminConsultationsPlaceholder}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🩺" label="Consultations" focused={focused} /> }}
      />
      <Tab.Screen
        name="AdminStats"
        component={AdminStatsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📈" label="Stats" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AdminConsultationsPlaceholder() {
  const { adminApi } = require('../api/api');
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    adminApi.getAllConsultations().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { FlatList } = require('react-native');
  const { Card } = require('../components/UIComponents');
  const { formatDate } = require('../utils/constants');

  if (loading) return <LoadingScreen message="Chargement..." />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={data}
        keyExtractor={(item, i) => (item.id || i).toString()}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListHeaderComponent={<Text style={{ padding: 8, color: COLORS.textLight, fontSize: 13 }}>{data.length} consultation(s)</Text>}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>{item.patientName || '-'}</Text>
            <Text style={{ fontSize: 13, color: COLORS.textLight, marginTop: 2 }}>📅 {formatDate(item.date)} • 👤 {item.agentName || '-'}</Text>
            <Text style={{ fontSize: 14, color: COLORS.text, marginTop: 4 }}>{item.diagnosis}</Text>
          </Card>
        )}
        ListEmptyComponent={<View style={{ alignItems: 'center', padding: 40 }}><Text style={{ fontSize: 40 }}>🩺</Text><Text>Aucune consultation</Text></View>}
      />
    </View>
  );
}

// =====================================================
// ROOT NAVIGATOR
// =====================================================
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message="NafasSante..." />;

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'admin' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AdminMain" component={AdminTabs} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="AgentMain" component={AgentTabs} />
          {/* Écrans modaux accessibles depuis partout */}
          <Stack.Screen name="AddPatient" component={AddPatientScreen} />
          <Stack.Screen name="AddVaccination" component={AddVaccinationScreen} />
          <Stack.Screen name="AddConsultation" component={AddConsultationScreen} />
          <Stack.Screen name="AddPregnancy" component={AddPregnancyScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
