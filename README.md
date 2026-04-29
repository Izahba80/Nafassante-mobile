# NafasSante — Guide de Déploiement Complet
## Système de Suivi Médical Numérique pour les Zones Rurales
### Projet de Fin d'Études — Génie Logiciel

---

## 📁 Structure du Projet

```
nafas_projet_complet/
├── backend/                    ← Serveur Node.js + MySQL
│   ├── config/
│   │   └── database.js         ← Connexion MySQL + migrations
│   ├── database/
│   │   ├── init.sql            ← Schéma complet de la base
│   │   └── migrations/         ← Migrations SQL
│   ├── middleware/
│   │   ├── auth.js             ← Authentification JWT
│   │   └── admin.js            ← Autorisation admin
│   ├── routes/
│   │   ├── auth.js             ← Login, register, refresh token
│   │   ├── admin.js            ← Gestion agents, stats admin
│   │   ├── consultationsRoutes.js
│   │   ├── pregnanciesRoutes.js
│   │   ├── vaccinationRoutes.js
│   │   ├── stockRoutes.js      ← Gestion stock vaccins
│   │   ├── statsRoutes.js
│   │   ├── chatRoutes.js       ← IA prédiction stock
│   │   └── sync.js             ← Synchronisation hors-ligne
│   ├── .env                    ← Variables d'environnement
│   ├── server.js               ← Point d'entrée serveur
│   └── package.json
│
└── mobile/                     ← Application Android (Expo)
    ├── App.js                  ← Point d'entrée Expo
    ├── app.json                ← Configuration Expo
    ├── eas.json                ← Configuration build APK
    ├── babel.config.js
    ├── package.json
    └── src/
        ├── api/
        │   └── api.js          ← Tous les appels HTTP
        ├── context/
        │   └── AuthContext.js  ← Gestion session utilisateur
        ├── database/
        │   └── localDb.js      ← SQLite hors-ligne
        ├── navigation/
        │   └── AppNavigator.js ← Navigation agent & admin
        ├── components/
        │   └── UIComponents.js ← Composants réutilisables
        ├── utils/
        │   └── constants.js    ← Couleurs, constantes, helpers
        └── screens/
            ├── auth/
            │   ├── LoginScreen.js
            │   └── RegisterScreen.js
            ├── agent/
            │   ├── DashboardScreen.js
            │   ├── PatientsScreen.js
            │   ├── AddPatientScreen.js
            │   ├── VaccinationsScreen.js
            │   ├── AddVaccinationScreen.js
            │   ├── ConsultationsScreen.js
            │   ├── AddConsultationScreen.js
            │   ├── PregnanciesScreen.js
            │   ├── AddPregnancyScreen.js
            │   └── ProfileScreen.js
            └── admin/
                ├── AdminDashboardScreen.js
                ├── AdminAgentsScreen.js
                ├── AdminPatientsScreen.js
                └── AdminStatsScreen.js
```

---

## 🖥️ ÉTAPE 1 — Installer le Backend (Serveur)

### Prérequis
- **Node.js** v18+ → https://nodejs.org
- **MySQL** 8.0+ → https://dev.mysql.com/downloads/mysql/
- **Git** (optionnel)

### Installation

```bash
# 1. Entrer dans le dossier backend
cd nafas_projet_complet/backend

# 2. Installer les dépendances
npm install

# 3. Configurer la base de données
# Ouvrir MySQL et créer la base :
mysql -u root -p
# Puis taper :
# CREATE DATABASE nafassante;
# EXIT;

# 4. Configurer le fichier .env
# Ouvrir .env et modifier DB_PASSWORD si votre MySQL a un mot de passe :
# DB_PASSWORD=votre_mot_de_passe

# 5. Démarrer le serveur
npm start
```

### Résultat attendu :
```
=========================================
  NafasSante Backend v1.0.0
=========================================
  Local:   http://localhost:3000
  Reseau:  http://192.168.X.X:3000   ← NOTEZ CETTE IP
  Ping:    http://192.168.X.X:3000/api/ping
=========================================
```

> ⚠️ **IMPORTANT** : Notez l'adresse IP du réseau (ex: `192.168.1.5:3000`).  
> Vous en aurez besoin pour configurer l'application mobile.

### Compte administrateur par défaut :
- **Email** : `admin@nafassante.td`
- **Mot de passe** : `Admin123!`  
  *(À changer immédiatement en production)*

---

## 📱 ÉTAPE 2 — Installer l'Application Mobile (Android)

### Option A — Développement avec Expo Go (rapide, pour tests)

1. **Installer Node.js et Expo CLI** :
```bash
npm install -g expo-cli eas-cli
```

2. **Installer les dépendances** :
```bash
cd nafas_projet_complet/mobile
npm install
```

3. **Démarrer Expo** :
```bash
npx expo start
```

4. **Sur le téléphone Android** :
   - Téléchargez **Expo Go** sur le Play Store
   - Scannez le QR code affiché dans le terminal
   - L'application s'ouvre

5. **Configurer l'adresse IP du serveur** :
   - Sur l'écran de login, appuyez **"Configurer l'adresse du serveur"**
   - Entrez : `http://192.168.X.X:3000` (l'IP de votre serveur)

---

### Option B — Générer un APK installable (pour distribution)

#### Prérequis
- Compte Expo (gratuit) → https://expo.dev
- EAS CLI installé

```bash
# 1. Se connecter à Expo
npx eas login

# 2. Configurer le projet (une seule fois)
cd mobile
npx eas init

# 3. Générer l'APK
npx eas build --platform android --profile apk

# 4. Télécharger l'APK depuis le lien fourni
# 5. Installer sur Android : Activer "Sources inconnues" dans Paramètres > Sécurité
```

> ⏳ La génération prend 10-20 minutes dans le cloud Expo.

---

### Option C — Build local (Android Studio)

```bash
# Prérequis : Android Studio + SDK Android installé

cd mobile

# Générer le build local
npx expo run:android

# Ou via EAS local
npx eas build --platform android --profile apk --local
```

---

## 🔧 ÉTAPE 3 — Configuration de l'IP dans l'application

### Méthode 1 — Interface (recommandé)
1. Ouvrir l'application
2. Sur l'écran de connexion → "Configurer l'adresse du serveur"
3. Entrer : `http://VOTRE_IP:3000`
4. Se connecter normalement

### Méthode 2 — Modifier le code source
Dans `mobile/src/api/api.js`, ligne 6 :
```javascript
export let API_BASE_URL = 'http://192.168.1.100:3000/api';
//                                ^^^^^^^^^^^^^^^^
//                         Remplacez par votre IP
```

---

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@nafassante.td | Admin123! |
| Agent | Créer via inscription ou via admin | |

---

## 📋 Fonctionnalités implémentées

### Application Mobile (Agent de santé)
- ✅ Connexion / Inscription / Déconnexion
- ✅ Tableau de bord avec statistiques
- ✅ Gestion des patients (CRUD + recherche)
- ✅ Enregistrement des consultations médicales
- ✅ Suivi des grossesses (calcul DPA automatique)
- ✅ Gestion des vaccinations (18 vaccins EPI)
- ✅ **Mode hors-ligne** : toutes les données sauvegardées localement (SQLite)
- ✅ **Synchronisation** automatique au retour du réseau
- ✅ Profil utilisateur + changement de mot de passe

### Application Mobile (Administrateur)
- ✅ Tableau de bord global
- ✅ Gestion des agents (créer, activer/désactiver)
- ✅ Visualisation de tous les patients
- ✅ Statistiques par région, sexe, vaccin

### Backend API (Node.js + MySQL)
- ✅ Authentification JWT (access + refresh token)
- ✅ CRUD complet : patients, consultations, grossesses, vaccinations
- ✅ API de synchronisation hors-ligne
- ✅ Gestion du stock de vaccins + prédictions IA
- ✅ Routes admin protégées
- ✅ Uploads de photos profil
- ✅ Migrations automatiques

---

## 🚀 Déploiement en Production

### Backend sur serveur Linux (ex: VPS)
```bash
# Installer PM2 pour garder le serveur actif
npm install -g pm2

cd backend
pm2 start server.js --name nafassante-api
pm2 startup      # Démarrage automatique au boot
pm2 save
```

### Variables .env en production
```env
PORT=3000
DB_HOST=localhost
DB_USER=nafassante_user
DB_PASSWORD=MOT_DE_PASSE_FORT_ICI
DB_NAME=nafassante
JWT_SECRET=CLE_SECRETE_LONGUE_ET_ALEATOIRE_64_CHARS
NODE_ENV=production
```

---

## 🐛 Dépannage courant

| Problème | Solution |
|----------|----------|
| "Network request failed" | Vérifiez l'IP du serveur dans l'app. Serveur et téléphone doivent être sur le même WiFi |
| "ER_BAD_DB_ERROR" | MySQL n'est pas démarré, ou la DB n'existe pas. Lancer MySQL et créer la DB |
| QR code ne fonctionne pas | Désactivez le pare-feu Windows/Mac ou utilisez le tunnel Expo |
| APK ne s'installe pas | Activez "Sources inconnues" sur Android : Paramètres > Sécurité |
| Token expiré | Se reconnecter. Vérifier JWT_SECRET dans .env |

---

## 📞 Architecture Technique

```
Téléphone Android         Réseau WiFi / Mobile        Serveur (PC / VPS)
┌─────────────────┐          ┌─────────┐           ┌────────────────────┐
│  App React      │  HTTP    │         │   HTTP    │  Node.js Express   │
│  Native (Expo)  │◄────────►│ Routeur │◄─────────►│  API REST :3000    │
│                 │          │  WiFi   │           │                    │
│  SQLite local   │          └─────────┘           │  MySQL Database    │
│  (hors ligne)   │                                │  nafassante        │
└─────────────────┘                                └────────────────────┘
```

---

*NafasSante — Projet de Fin d'Études en Génie Logiciel*  
*Système de Suivi Médical Numérique pour les Zones Rurales*
