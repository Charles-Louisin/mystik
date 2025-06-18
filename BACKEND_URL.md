# Configuration de l'URL du backend en ligne

Ce document explique comment configurer votre application Mystik pour utiliser exclusivement l'URL du backend en ligne.

## Pourquoi cette configuration ?

Par défaut, l'application était configurée pour utiliser une logique conditionnelle qui déterminait l'URL du backend en fonction de l'environnement :
- En local (`localhost`), elle utilisait `http://localhost:5000`
- En production, elle utilisait l'origine de la fenêtre (`window.location.origin`)

Maintenant, l'application est configurée pour utiliser **uniquement** l'URL définie dans la variable d'environnement `NEXT_PUBLIC_API_URL`.

## Comment configurer l'URL du backend

1. Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```
# URL du backend en ligne
NEXT_PUBLIC_API_URL=https://votre-backend-en-ligne.com
```

2. Remplacez `https://votre-backend-en-ligne.com` par l'URL réelle de votre backend déployé (par exemple sur Railway).

3. Pour faciliter cette configuration, vous pouvez utiliser le script `setup-env.sh` qui créera automatiquement ce fichier :

```bash
./setup-env.sh
```

## Vérification de la configuration

Pour vérifier que votre configuration est correcte :

1. Démarrez l'application en mode développement :

```bash
npm run dev:frontend
```

2. Ouvrez la console du navigateur et vérifiez les requêtes réseau pour confirmer qu'elles sont bien dirigées vers l'URL du backend en ligne.

## Remarques importantes

- Assurez-vous que votre backend en ligne est correctement configuré pour accepter les requêtes CORS depuis votre frontend local.
- Si vous souhaitez revenir à une configuration locale, vous devrez modifier manuellement le code pour réintroduire la logique conditionnelle.
- N'oubliez pas d'ajouter `.env.local` à votre fichier `.gitignore` pour éviter de partager vos configurations spécifiques. 