#!/bin/bash

# Fichier .env à corriger
ENV_FILE="backend/.env"

# Vérifier si le fichier existe
if [ ! -f "$ENV_FILE" ]; then
  echo "Erreur: Le fichier $ENV_FILE n'existe pas."
  exit 1
fi

# Créer un fichier temporaire
TMP_FILE=$(mktemp)

# Nettoyer le fichier .env en supprimant les doublons et lignes vides
echo "# Configuration Mystik" > "$TMP_FILE"
echo "PORT=5000" >> "$TMP_FILE"
echo "MONGODB_URI=mongodb://localhost:27017/mystik" >> "$TMP_FILE"
echo "JWT_SECRET=f8b5a62d9e7c3a1d4b6e8f0a2c5d9b7e4f1a3c6d8b5a2e9f7" >> "$TMP_FILE"
echo "NODE_ENV=development" >> "$TMP_FILE"

# Ajouter la clé OpenAI si elle existe
if grep -q "OPENAI_API_KEY" "$ENV_FILE"; then
  OPENAI_KEY=$(grep "OPENAI_API_KEY" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-)
  echo "OPENAI_API_KEY=$OPENAI_KEY" >> "$TMP_FILE"
  echo "Clé OpenAI trouvée et ajoutée."
else
  echo "OPENAI_API_KEY=sk-votreCleOpenAI" >> "$TMP_FILE"
  echo "Aucune clé OpenAI trouvée. Une clé factice a été ajoutée."
  echo "Utilisez ./add-openai-key.sh pour ajouter votre vraie clé."
fi

# Remplacer l'ancien fichier par le nouveau
mv "$TMP_FILE" "$ENV_FILE"
echo "Le fichier $ENV_FILE a été nettoyé et corrigé."
echo "Redémarrez le serveur pour appliquer les changements." 