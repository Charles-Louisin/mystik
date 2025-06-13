#!/bin/bash

echo "Redémarrage du serveur Mystik avec les nouvelles configurations CORS..."

# Arrêter les processus Node.js existants (optionnel, à adapter selon votre environnement)
# pkill -f node

# Nettoyer le cache
echo "Nettoyage du cache..."
rm -rf .next/cache

# Installer les dépendances si nécessaire
echo "Vérification des dépendances..."
npm install

# Redémarrer le serveur backend
echo "Redémarrage du serveur backend..."
cd backend
node server.js &
cd ..

# Redémarrer le frontend (Next.js)
echo "Redémarrage du frontend..."
npm run dev &

echo "Serveur redémarré avec succès!"
echo "Les configurations CORS ont été mises à jour pour résoudre les problèmes audio."
echo "Vérifiez les logs pour vous assurer que tout fonctionne correctement." 