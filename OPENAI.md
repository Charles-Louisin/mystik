# Guide d'intégration OpenAI pour Mystik

Ce document explique comment configurer et utiliser l'API OpenAI dans l'application Mystik pour l'analyse des messages.

## Configuration de la clé API

Pour utiliser les fonctionnalités d'analyse IA, vous devez disposer d'une clé API OpenAI valide.

### Obtenir une clé API OpenAI

1. Créez un compte sur [OpenAI](https://platform.openai.com/)
2. Accédez à la section "API Keys" dans votre tableau de bord
3. Cliquez sur "Create new secret key"
4. Copiez la clé générée (elle commence par `sk-` ou `sk-proj-`)

> **Note importante** : OpenAI a récemment mis à jour le format de ses clés API. Les nouvelles clés commencent par `sk-proj-`, tandis que les anciennes commençaient simplement par `sk-`. Notre application prend en charge les deux formats.

### Ajouter la clé API au projet

Il existe deux méthodes pour ajouter votre clé API au projet :

#### Méthode 1 : Utiliser le script `add-openai-key.sh`

```bash
./add-openai-key.sh votre-cle-openai
```

#### Méthode 2 : Modifier manuellement le fichier `.env`

Ouvrez le fichier `backend/.env` et ajoutez ou modifiez la ligne suivante :

```
OPENAI_API_KEY=votre-cle-openai
```

### Vérifier la configuration

Utilisez le script `check-openai.sh` pour vérifier que votre clé API est correctement configurée :

```bash
./check-openai.sh
```

Ce script vous permettra de :
- Vérifier si la clé API est présente et valide
- Tester la connexion à l'API OpenAI
- Analyser un message personnalisé pour tester les fonctionnalités

## Utilisation dans le code

### Analyse de messages

L'analyse des messages est gérée par le service OpenAI dans `backend/utils/openaiTest.js`. Ce service offre plusieurs méthodes :

```javascript
// Importer le service
const openAIService = require('../utils/openaiTest');

// Vérifier si le service est disponible
if (openAIService.isServiceAvailable()) {
  // Analyser un message
  const analysis = await openAIService.analyzeMessage(content, emotion);
  
  // Utiliser les résultats de l'analyse
  console.log(analysis.emotionalIntent);  // Intention émotionnelle
  console.log(analysis.summary);          // Résumé du message
  console.log(analysis.suggestionForReply); // Suggestion de réponse
}
```

### Structure des résultats d'analyse

L'analyse d'un message retourne un objet avec les propriétés suivantes :

```javascript
{
  emotionalIntent: "L'expéditeur semble exprimer de la joie et de l'enthousiasme.",
  summary: "Ce message est une expression de bonheur à l'idée de retrouvailles.",
  suggestionForReply: "Tu pourrais répondre en partageant également ton enthousiasme et en proposant une date précise pour se voir."
}
```

## Dépannage

### La clé API n'est pas reconnue

Si votre clé API n'est pas reconnue, vérifiez que :
- Elle commence bien par `sk-` ou `sk-proj-` (nouveau format)
- Elle est correctement copiée sans espaces supplémentaires
- Le fichier `.env` est bien situé dans le dossier `backend/`

### Erreurs de connexion à l'API

Si vous rencontrez des erreurs de connexion :
- Vérifiez votre connexion internet
- Assurez-vous que votre clé API est active et dispose de crédits suffisants
- Consultez le tableau de bord OpenAI pour vérifier l'état de votre compte

### Problèmes d'analyse

Si l'analyse des messages ne fonctionne pas correctement :
- Vérifiez les logs du serveur pour identifier les erreurs
- Testez votre clé avec le script `check-openai.sh`
- Assurez-vous que le contenu du message est approprié et ne viole pas les politiques d'utilisation d'OpenAI

## Bonnes pratiques

- Ne partagez jamais votre clé API OpenAI
- Surveillez votre consommation d'API pour éviter des coûts inattendus
- Utilisez le mode fallback pour les cas où l'API n'est pas disponible
- Mettez en cache les résultats d'analyse pour les messages fréquemment consultés

## Ressources additionnelles

- [Documentation officielle OpenAI](https://platform.openai.com/docs/api-reference)
- [Modèles disponibles](https://platform.openai.com/docs/models)
- [Bonnes pratiques pour les prompts](https://platform.openai.com/docs/guides/prompt-engineering) 