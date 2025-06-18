#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Fonction pour afficher un message d'erreur
error() {
  echo -e "${RED}ERROR: $1${NC}"
}

# Afficher un message de début
echo "=========================================="
echo "  Arrêt des serveurs Mystik en cours..."
echo "=========================================="

# Vérifier les processus sur les ports 3000, 3002 et 5000
info "Vérification des ports utilisés..."

# Port 3000 (frontend)
PORT_3000=$(lsof -i :3000 -t 2>/dev/null)
if [ -n "$PORT_3000" ]; then
  warning "Port 3000 utilisé par PID: $PORT_3000"
else
  info "Port 3000 libre"
fi

# Port 3002 (frontend alternatif)
PORT_3002=$(lsof -i :3002 -t 2>/dev/null)
if [ -n "$PORT_3002" ]; then
  warning "Port 3002 utilisé par PID: $PORT_3002"
else
  info "Port 3002 libre"
fi

# Port 5000 (backend)
PORT_5000=$(lsof -i :5000 -t 2>/dev/null)
if [ -n "$PORT_5000" ]; then
  warning "Port 5000 utilisé par PID: $PORT_5000"
else
  info "Port 5000 libre"
fi

# Tuer les processus liés au projet Mystik
info "Arrêt des processus liés au projet Mystik..."

# Arrêter les processus spécifiques avec SIGKILL (-9) directement
pkill -9 -f "nodemon backend/server.js" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null
pkill -9 -f "node server.js" 2>/dev/null

# Attendre un peu pour que les processus se terminent
sleep 1

# Vérifier si des processus persistent sur les ports
REMAINING_PROCESSES=$(lsof -i :3000,3002,5000 -t 2>/dev/null)
if [ -n "$REMAINING_PROCESSES" ]; then
  warning "Certains processus sont toujours actifs. Tentative de fermeture forcée..."
  
  # Tuer avec force
  for pid in $REMAINING_PROCESSES; do
    kill -9 $pid 2>/dev/null
    if [ $? -eq 0 ]; then
      info "Processus $pid terminé avec force"
    fi
  done
fi

# Vérification finale
FINAL_CHECK=$(lsof -i :3000,3002,5000 -t 2>/dev/null)
if [ -n "$FINAL_CHECK" ]; then
  error "Impossible de libérer tous les ports. Processus restants: $FINAL_CHECK"
  echo "Vous pouvez essayer de les terminer manuellement avec:"
  echo "kill -9 $FINAL_CHECK"
  exit 1
else
  success "Tous les serveurs ont été arrêtés avec succès!"
  echo ""
  echo "Pour redémarrer les serveurs, utilisez:"
  echo "./restart-server.sh"
fi

exit 0 