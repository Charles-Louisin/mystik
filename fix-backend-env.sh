#!/bin/bash

# Chemin vers le fichier .env du backend
ENV_FILE="backend/.env"

# Récupérer la clé OpenAI existante
OPENAI_KEY=$(grep "OPENAI_API_KEY" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-)

# Si la clé n'est pas trouvée dans le fichier backend/.env, essayer de la trouver dans le fichier racine
if [ -z "$OPENAI_KEY" ] && [ -f ".env" ]; then
  OPENAI_KEY=$(grep "OPENAI_API_KEY" ".env" | head -n 1 | cut -d '=' -f 2-)
fi

# Créer un nouveau fichier .env propre
cat > "$ENV_FILE" << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mystik
JWT_SECRET=f8b5a62d9e7c3a1d4b6e8f0a2c5d9b7e4f1a3c6d8b5a2e9f7
NODE_ENV=development
OPENAI_API_KEY=$OPENAI_KEY
EOF

echo "Le fichier $ENV_FILE a été corrigé."
echo "Redémarrez le serveur pour appliquer les changements."

# Ajouter un log pour vérifier la clé OpenAI
echo "Ajout d'un log pour vérifier la clé OpenAI dans backend/routes/messages.js"

# Ajouter un log au début du fichier routes/messages.js
TMP_FILE=$(mktemp)
cat > "$TMP_FILE" << 'EOF'
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { processImage } = require('../utils/imageProcessor');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { processVoice } = require('../utils/voiceProcessor');
const mongoose = require('mongoose');

// Log pour déboguer les variables d'environnement
console.log('OPENAI_API_KEY disponible:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY commence par:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'non défini');

EOF

# Lire le reste du fichier messages.js à partir de la ligne 14
tail -n +14 backend/routes/messages.js >> "$TMP_FILE"

# Remplacer le fichier original
mv "$TMP_FILE" backend/routes/messages.js

echo "Logs de débogage ajoutés. Redémarrez le serveur pour voir les logs." 