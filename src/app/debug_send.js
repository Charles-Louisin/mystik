// Code à modifier dans la fonction handleSubmit de src/app/send/page.js

// Pour le cas avec fichier audio (FormData)
// Remplacer le bloc existant par celui-ci :
if (formData.riddleQuestion && formData.riddleAnswer) {
  console.log('Ajout de la devinette au FormData');
  const riddle = {
    question: formData.riddleQuestion,
    answer: formData.riddleAnswer
  };
  messageData.append('riddleQuestion', formData.riddleQuestion);
  messageData.append('riddleAnswer', formData.riddleAnswer);
  messageData.append('riddle', JSON.stringify(riddle));
}

// Pour le cas sans fichier audio (JSON)
// Remplacer le bloc existant par celui-ci :
if (formData.riddleQuestion && formData.riddleAnswer) {
  console.log('Ajout de la devinette au JSON');
  // Envoyer à la fois comme objet et comme champs séparés pour assurer la compatibilité
  messageData.riddleQuestion = formData.riddleQuestion;
  messageData.riddleAnswer = formData.riddleAnswer;
  messageData.riddle = {
    question: formData.riddleQuestion,
    answer: formData.riddleAnswer
  };
  
  // Ajouter des logs pour déboguer
  console.log('Devinette ajoutée:', messageData.riddle);
} 