// Code corrigé pour l'envoi avec audio dans src/app/send/page.js
// Remplacer le bloc existant par celui-ci

// Vérifier si nous avons un message vocal
if (formData.voiceMessage) {
  // Utiliser FormData pour l'envoi avec un fichier audio
  const messageData = new FormData();
  
  // Ajouter les données de base
  messageData.append('recipientLink', recipient.uniqueLink);
  messageData.append('content', formData.content);
  messageData.append('emotionalFilter', formData.emotionalFilter);
  
  // Ajouter les informations cachées
  messageData.append('nickname', formData.nickname || 'Anonyme');
  messageData.append('hint', formData.hint || '');
  messageData.append('emoji', formData.emoji || '');
  
  // Ajouter la devinette - CORRECTION POUR LE PROBLÈME AUDIO
  if (formData.riddleQuestion && formData.riddleAnswer) {
    console.log('Ajout de la devinette au FormData - CORRECTION');
    
    // Ajouter les champs séparément
    messageData.append('riddleQuestion', formData.riddleQuestion);
    messageData.append('riddleAnswer', formData.riddleAnswer);
    
    // Ajouter aussi en tant qu'objet JSON stringifié
    const riddle = {
      question: formData.riddleQuestion,
      answer: formData.riddleAnswer
    };
    messageData.append('riddle', JSON.stringify(riddle));
    
    // Logs détaillés pour déboguer
    console.log('Devinette - Question:', formData.riddleQuestion);
    console.log('Devinette - Réponse:', formData.riddleAnswer);
    console.log('Devinette - JSON:', JSON.stringify(riddle));
  }
  
  // Ajouter les conditions de révélation
  if (formData.revealCondition) {
    messageData.append('revealCondition', JSON.stringify(formData.revealCondition));
  }
  
  // Ajouter le message vocal
  messageData.append('voiceMessage', formData.voiceMessage);
  messageData.append('voiceFilter', formData.voiceFilter);
  
  // Ajouter le masque personnalisé s'il est sélectionné
  if (formData.customMask) {
    messageData.append('customMask', formData.customMask);
  }
  
  // Ajouter la date programmée si définie
  if (formData.scheduledDate) {
    messageData.append('scheduledDate', formData.scheduledDate);
  }
  
  // Ajouter l'authentification 
  const headers = {};
  if (isAuthenticated && sendAsAuthenticated && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
    messageData.append('sendAsAuthenticated', 'true');
    if (authUser && authUser._id) {
      messageData.append('realUserId', authUser._id);
    }
  }
  
  // Afficher les données pour débogage
  console.log('URL API:', `${apiBaseUrl}/api/messages/send`);
  console.log('En-têtes:', headers);
  console.log('Envoi de FormData avec fichier audio');
  
  // Vérifier le type du fichier audio
  if (formData.voiceMessage instanceof Blob || formData.voiceMessage instanceof File) {
    console.log('Type de fichier audio:', formData.voiceMessage.type);
    console.log('Taille du fichier audio:', formData.voiceMessage.size, 'bytes');
  } else {
    console.error('Le fichier audio n\'est pas un Blob ou File valide:', typeof formData.voiceMessage);
  }
  
  // Envoyer le message - Ne pas définir Content-Type pour FormData
  // Axios le définira automatiquement avec la boundary correcte
  const response = await axios.post(`${apiBaseUrl}/api/messages/send`, messageData, {
    headers
  });
} 