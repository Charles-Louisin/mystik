#!/bin/bash

# Vérifier si une clé est fournie
if [ -z "$1" ]; then
  echo "Usage: ./add-openai-key.sh votre-cle-openai"
  echo "Exemple: ./add-openai-key.sh sk-abcdef123456"
  exit 1
fi

# Récupérer la clé
OPENAI_KEY=$1

# Vérifier si le fichier .env existe
if [ ! -f "backend/.env" ]; then
  echo "Erreur: Le fichier backend/.env n'existe pas."
  exit 1
fi

# Vérifier si la clé OpenAI existe déjà dans le fichier
if grep -q "OPENAI_API_KEY" "backend/.env"; then
  # Remplacer la clé existante
  sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" "backend/.env"
  echo "La clé OpenAI a été mise à jour dans backend/.env"
else
  # Ajouter la clé à la fin du fichier
  echo "OPENAI_API_KEY=$OPENAI_KEY" >> "backend/.env"
  echo "La clé OpenAI a été ajoutée à backend/.env"
fi

echo "Redémarrez le serveur pour appliquer les changements." 