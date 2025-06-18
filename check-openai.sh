#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message d'erreur et quitter
error_exit() {
  echo -e "${RED}ERROR: $1${NC}" >&2
  exit 1
}

# Fonction pour afficher un message d'information
info() {
  echo -e "${BLUE}INFO: $1${NC}"
}

# Fonction pour afficher un message de succès
success() {
  echo -e "${GREEN}SUCCESS: $1${NC}"
}

# Fonction pour afficher un message d'avertissement
warning() {
  echo -e "${YELLOW}WARNING: $1${NC}"
}

# Vérifier si le fichier .env existe
ENV_FILE="backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  error_exit "Le fichier $ENV_FILE n'existe pas. Exécutez d'abord ./fix-env.sh pour créer le fichier .env"
fi

# Vérifier si la clé OpenAI existe dans le fichier .env
if grep -q "OPENAI_API_KEY" "$ENV_FILE"; then
  OPENAI_KEY=$(grep "OPENAI_API_KEY" "$ENV_FILE" | head -n 1 | cut -d '=' -f 2-)
  
  # Vérifier si la clé est vide ou factice
  if [ -z "$OPENAI_KEY" ] || [ "$OPENAI_KEY" = "sk-votreCleOpenAI" ]; then
    warning "Une clé OpenAI factice ou vide a été trouvée dans $ENV_FILE"
    echo ""
    echo "Vous devez ajouter une clé OpenAI valide pour utiliser les fonctionnalités d'analyse IA."
    echo "Utilisez la commande suivante pour ajouter votre clé:"
    echo "./add-openai-key.sh votre-cle-openai"
    exit 1
  fi
  
  # Vérifier si la clé commence par sk- ou sk-proj-
  if [[ ! "$OPENAI_KEY" =~ ^sk-[a-zA-Z0-9] ]]; then
    warning "La clé OpenAI trouvée ne semble pas être au format valide (doit commencer par 'sk-')"
    echo ""
    echo "Utilisez la commande suivante pour mettre à jour votre clé:"
    echo "./add-openai-key.sh votre-cle-openai"
    exit 1
  fi
  
  # Afficher les informations sur la clé
  info "Clé OpenAI trouvée dans $ENV_FILE"
  echo "Clé: ${OPENAI_KEY:0:10}..."
  
  # Demander à l'utilisateur s'il veut tester la clé
  echo ""
  read -p "Voulez-vous tester la clé OpenAI ? (o/n) " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Oo]$ ]]; then
    info "Test de la clé OpenAI en cours..."
    
    # Exécuter le script de test
    node backend/utils/testOpenAI.js
    
    if [ $? -eq 0 ]; then
      success "La clé OpenAI fonctionne correctement !"
    else
      error_exit "Le test de la clé OpenAI a échoué. Vérifiez les erreurs ci-dessus."
    fi
  fi
else
  warning "Aucune clé OpenAI n'a été trouvée dans $ENV_FILE"
  echo ""
  echo "Vous devez ajouter une clé OpenAI pour utiliser les fonctionnalités d'analyse IA."
  echo "Utilisez la commande suivante pour ajouter votre clé:"
  echo "./add-openai-key.sh votre-cle-openai"
  exit 1
fi

# Afficher les options disponibles
echo ""
echo "Options disponibles:"
echo "1. Tester l'analyse d'un message personnalisé"
echo "2. Mettre à jour la clé OpenAI"
echo "3. Quitter"
echo ""
read -p "Choisissez une option (1-3): " option

case $option in
  1)
    echo ""
    read -p "Entrez le message à analyser: " message
    echo ""
    read -p "Entrez l'émotion associée (joie, tristesse, colère, admiration, regret, amour, neutre): " emotion
    
    if [ -z "$emotion" ]; then
      emotion="neutre"
    fi
    
    info "Analyse du message avec l'émotion '$emotion'..."
    node backend/utils/testOpenAI.js "$message" "$emotion"
    ;;
  2)
    echo ""
    read -p "Entrez votre nouvelle clé OpenAI: " new_key
    
    if [ -z "$new_key" ]; then
      error_exit "La clé ne peut pas être vide."
    fi
    
    # Mettre à jour la clé
    ./add-openai-key.sh "$new_key"
    
    if [ $? -eq 0 ]; then
      success "La clé OpenAI a été mise à jour avec succès !"
      
      # Demander à l'utilisateur s'il veut tester la nouvelle clé
      echo ""
      read -p "Voulez-vous tester la nouvelle clé ? (o/n) " -n 1 -r
      echo ""
      
      if [[ $REPLY =~ ^[Oo]$ ]]; then
        info "Test de la nouvelle clé OpenAI en cours..."
        node backend/utils/testOpenAI.js
      fi
    else
      error_exit "La mise à jour de la clé OpenAI a échoué."
    fi
    ;;
  3)
    info "Au revoir !"
    exit 0
    ;;
  *)
    error_exit "Option invalide."
    ;;
esac

exit 0 