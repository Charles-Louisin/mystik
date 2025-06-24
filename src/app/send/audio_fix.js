// Utilitaires pour la gestion audio dans Mystik
// Ce fichier contient des fonctions réutilisables pour la gestion des fichiers audio

/**
 * Charge un fichier audio avec authentification
 * @param {string} url - URL du fichier audio
 * @returns {Promise<string>} - URL objet du fichier audio
 */
export const loadAudioWithAuth = async (url) => {
  try {
    // Récupérer l'URL de base de l'API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    
    // Extraire l'URL de base sans le token ou les paramètres
    let cleanUrl = url;
    if (url.includes('?')) {
      cleanUrl = url.split('?')[0];
    }
    
    // Si l'URL ne commence pas par http, ajouter l'URL de base de l'API
    if (!cleanUrl.startsWith('http')) {
      // S'assurer que le chemin commence par un slash
      if (!cleanUrl.startsWith('/')) {
        cleanUrl = '/' + cleanUrl;
      }
      
      // Vérifier si le chemin est relatif à /api
      if (!cleanUrl.startsWith('/api/')) {
        // Si le chemin est pour un message vocal mais ne commence pas par /api
        if (cleanUrl.includes('voice-message') && !cleanUrl.startsWith('/api/')) {
          // Ajouter le préfixe /api si nécessaire
          if (!cleanUrl.startsWith('/api/messages/')) {
            cleanUrl = cleanUrl.replace(/^\/messages\//, '/api/messages/');
            if (!cleanUrl.startsWith('/api/')) {
              cleanUrl = '/api' + cleanUrl;
            }
          }
        }
      }
      
      cleanUrl = `${apiBaseUrl}${cleanUrl}`;
    }
    
    console.log("Chargement audio depuis URL:", cleanUrl);
    
    // Récupérer le token d'authentification
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const headers = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Effectuer la requête avec les en-têtes appropriés
    console.log("En-têtes de requête:", headers);
    
    // Ajouter un timestamp pour éviter la mise en cache
    const urlWithTimestamp = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    const response = await fetch(urlWithTimestamp, { 
      headers,
      // Utiliser 'cors' pour les requêtes cross-origin
      mode: 'cors',
      // Ajouter cache: 'no-store' pour éviter la mise en cache
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error("Réponse HTTP non valide:", response.status, response.statusText);
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    // Vérifier le type de contenu
    const contentType = response.headers.get('content-type');
    console.log("Type de contenu reçu:", contentType);
    
    // Convertir en blob avec le bon type MIME
    const arrayBuffer = await response.arrayBuffer();
    console.log("Taille des données audio reçues:", arrayBuffer.byteLength, "octets");
    
    // Déterminer le type MIME approprié
    let mimeType = contentType || 'audio/mpeg';
    
    // Si le type de contenu n'est pas spécifié ou n'est pas un type audio reconnu,
    // essayer de déterminer le type en fonction de l'URL ou utiliser un type par défaut
    if (!mimeType || !mimeType.startsWith('audio/')) {
      if (cleanUrl.endsWith('.mp3')) {
        mimeType = 'audio/mpeg';
      } else if (cleanUrl.endsWith('.wav')) {
        mimeType = 'audio/wav';
      } else if (cleanUrl.endsWith('.ogg')) {
        mimeType = 'audio/ogg';
      } else if (cleanUrl.endsWith('.m4a')) {
        mimeType = 'audio/mp4';
      } else if (cleanUrl.endsWith('.webm')) {
        mimeType = 'audio/webm';
      } else {
        // Essayer de détecter le format en fonction des premiers octets
        const view = new Uint8Array(arrayBuffer.slice(0, 12));
        
        // Détection de format basée sur les signatures de fichier
        if (view[0] === 0x52 && view[1] === 0x49 && view[2] === 0x46 && view[3] === 0x46) {
          // Format RIFF/WAV
          mimeType = 'audio/wav';
        } else if (view[0] === 0x49 && view[1] === 0x44 && view[2] === 0x33) {
          // Format MP3 avec en-tête ID3
          mimeType = 'audio/mpeg';
        } else if (view[0] === 0xFF && (view[1] & 0xE0) === 0xE0) {
          // Format MP3 sans en-tête ID3
          mimeType = 'audio/mpeg';
        } else if (view[0] === 0x4F && view[1] === 0x67 && view[2] === 0x67 && view[3] === 0x53) {
          // Format OGG
          mimeType = 'audio/ogg';
        } else {
          // Type par défaut
          mimeType = 'audio/mpeg';
        }
      }
    }
    
    console.log("Type MIME utilisé pour le blob:", mimeType);
    
    const blob = new Blob([arrayBuffer], { type: mimeType });
    
    // Créer une URL objet
    const objectUrl = URL.createObjectURL(blob);
    console.log("URL objet créée:", objectUrl);
    
    return objectUrl;
  } catch (error) {
    console.error("Erreur lors du chargement audio avec authentification:", error);
    throw error;
  }
};

/**
 * Configure un élément audio avec gestion des erreurs
 * @param {HTMLAudioElement} audioElement - Élément audio à configurer
 * @param {Object} options - Options de configuration
 * @param {Function} options.onError - Fonction à appeler en cas d'erreur
 * @param {Function} options.onSuccess - Fonction à appeler en cas de succès
 * @param {Function} options.onEnded - Fonction à appeler à la fin de la lecture
 * @param {Function} options.onProgress - Fonction à appeler pour mettre à jour la progression
 */
export const setupAudioElement = (audioElement, options = {}) => {
  const { onError, onSuccess, onEnded, onProgress } = options;
  
  if (!audioElement) return;
  
  // Événement de fin de lecture
  if (onEnded) {
    audioElement.onended = onEnded;
  }
  
  // Événement d'erreur
  if (onError) {
    audioElement.onerror = (e) => {
      console.error("Erreur de lecture audio:", e);
      console.error("Code d'erreur:", audioElement.error ? audioElement.error.code : "inconnu");
      console.error("Message d'erreur:", audioElement.error ? audioElement.error.message : "inconnu");
      onError(e);
    };
  }
  
  // Événement de mise à jour du temps
  if (onProgress) {
    audioElement.ontimeupdate = () => {
      if (!isNaN(audioElement.currentTime) && !isNaN(audioElement.duration) && isFinite(audioElement.duration)) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        onProgress(progress, audioElement.currentTime, audioElement.duration);
      }
    };
  }
  
  // Événements de chargement
  audioElement.addEventListener('loadedmetadata', () => {
    if (!isNaN(audioElement.duration) && isFinite(audioElement.duration) && onProgress) {
      onProgress(0, 0, audioElement.duration);
    }
  });
  
  audioElement.addEventListener('canplaythrough', () => {
    console.log("Audio prêt à être lu sans interruption");
    if (onSuccess) onSuccess();
  });
  
  audioElement.addEventListener('loadeddata', () => {
    console.log("Audio chargé, tentative de lecture");
    if (onSuccess) onSuccess();
  });
}; 