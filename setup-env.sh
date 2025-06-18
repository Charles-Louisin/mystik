#!/bin/bash

# Script pour configurer le fichier .env.local avec l'URL du backend en ligne

echo "Configuration de l'environnement pour utiliser uniquement le backend en ligne..."

# Créer ou écraser le fichier .env.local
cat > .env.local << 'EOL'
# URL du backend en ligne
# Remplacez cette URL par l'URL de votre backend déployé
NEXT_PUBLIC_API_URL=https://mystik-backend.railway.app

# Note: Assurez-vous que cette URL est accessible et que le backend est correctement configuré
# avec les paramètres CORS appropriés pour accepter les requêtes depuis votre frontend local
EOL

echo "Fichier .env.local créé avec succès."
echo "URL du backend configurée : https://mystik-backend.railway.app"
echo ""
echo "Pour utiliser une autre URL de backend, modifiez le fichier .env.local" 