# Mystik - Application de messagerie anonyme

Mystik est une application de messagerie anonyme qui permet aux utilisateurs de recevoir des messages anonymes et de découvrir qui se cache derrière ces messages de manière ludique.

![Logo Mystik](public/logo.svg)

## Fonctionnalités

- Création de compte avec numéro de téléphone
- Lien unique personnalisé pour recevoir des messages anonymes
- Envoi de messages anonymes avec filtres émotionnels
- Indices et devinettes pour deviner l'identité de l'expéditeur
- Profil émotionnel basé sur les messages reçus
- "Hall of Fame" pour partager publiquement les meilleurs messages
- Système de clés pour révéler l'identité des expéditeurs

## Technologies utilisées

- **Frontend** : Next.js, React, TailwindCSS, Framer Motion
- **Backend** : Express.js, MongoDB avec Mongoose
- **Authentification** : JWT
- **Autres** : Axios, React Icons, React Hot Toast

## Installation

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/yourusername/mystik.git
   cd mystik
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configuration des variables d'environnement :
   - Créez un fichier `.env` dans le dossier backend :
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/mystik
     JWT_SECRET=votre_secret_jwt_tres_securise
     NODE_ENV=development
     ```

4. Démarrez MongoDB localement ou utilisez MongoDB Atlas.

## Démarrage

Pour démarrer le projet en mode développement (frontend + backend) :

```bash
npm run dev
```

Pour démarrer uniquement le frontend :

```bash
npm run dev:frontend
```

Pour démarrer uniquement le backend :

```bash
npm run dev:backend
```

Le frontend sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)
L'API backend sera accessible à l'adresse : [http://localhost:5000](http://localhost:5000)

## Déploiement

### Frontend (Next.js)

1. Construisez l'application :
   ```bash
   npm run build
   ```

2. Démarrez le serveur de production :
   ```bash
   npm start
   ```

### Backend

Pour démarrer le serveur backend en production :

```bash
npm run start:backend
```

## Structure du projet

```
mystik/
├── backend/                # API Express.js
│   ├── models/             # Modèles Mongoose
│   ├── routes/             # Routes API
│   ├── middleware/         # Middleware (auth, etc.)
│   └── server.js           # Point d'entrée du serveur
├── public/                 # Fichiers statiques
├── src/                    # Code source frontend
│   └── app/                # Application Next.js
└── ...
```

## Auteur

Charles - Projet d'Internship
