#!/bin/bash

# Script pour remplacer toutes les occurrences de l'URL conditionnelle par l'URL unique
# dans tous les fichiers du projet

echo "Mise à jour des URLs du backend..."

# Remplacer l'URL fixe dans login/page.js
sed -i 's|const apiBaseUrl = "http://localhost:5000";|const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;|g' src/app/login/page.js

# Remplacer toutes les occurrences de l'URL conditionnelle
find src -type f -name "*.js" -exec sed -i 's|const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === '\''localhost'\'' || window.location.hostname === '\''127.0.0.1'\'' \?'\''http://localhost:5000'\'' \: window.location.origin);|const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;|g' {} \;

# Mettre à jour les commentaires
find src -type f -name "*.js" -exec sed -i 's|// Utiliser la variable d'\''environnement en priorité|// Utiliser uniquement l'\''URL du backend en ligne|g' {} \;

echo "Mise à jour terminée." 