# Guide de configuration MongoDB Atlas pour Mystik

Ce document explique comment configurer la connexion à MongoDB Atlas pour l'application Mystik.

## Problème de connexion à MongoDB Atlas

Si vous rencontrez l'erreur suivante :
```
Erreur de connexion à MongoDB: MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

Cela signifie que votre adresse IP actuelle n'est pas autorisée à accéder à votre cluster MongoDB Atlas.

## Configuration de la liste blanche d'adresses IP

Pour résoudre ce problème, vous devez ajouter votre adresse IP à la liste blanche de MongoDB Atlas :

1. Connectez-vous à votre compte [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sélectionnez votre projet et votre cluster "mystik"
3. Cliquez sur "Network Access" dans le menu de gauche
4. Cliquez sur le bouton "Add IP Address"

### Option 1 : Ajouter votre adresse IP actuelle (recommandé pour le développement)

1. Cliquez sur "Add Your Current IP Address"
2. MongoDB Atlas détectera automatiquement votre adresse IP et l'ajoutera à la liste
3. Vous pouvez ajouter une description comme "Poste de développement"
4. Cliquez sur "Confirm"

### Option 2 : Autoriser l'accès depuis n'importe où (non recommandé en production)

1. Cliquez sur "Allow Access from Anywhere"
2. Cela ajoutera l'adresse IP `0.0.0.0/0` à la liste blanche
3. Cliquez sur "Confirm"

> **Attention** : Cette option n'est pas recommandée pour un environnement de production car elle permet l'accès à votre base de données depuis n'importe quelle adresse IP.

## Vérification de la connexion

Une fois que vous avez ajouté votre adresse IP à la liste blanche, redémarrez le serveur :

```bash
./restart-server.sh
```

Si tout est correctement configuré, vous devriez voir un message de connexion réussie dans les logs du serveur.

## Configuration de l'URI MongoDB

Si vous devez modifier l'URI de connexion à MongoDB, vous pouvez le faire dans le fichier `backend/.env` :

```
MONGODB_URI=mongodb+srv://votre-utilisateur:votre-mot-de-passe@votre-cluster.mongodb.net/mystik?retryWrites=true&w=majority
```

Assurez-vous de remplacer `votre-utilisateur`, `votre-mot-de-passe` et `votre-cluster` par vos informations de connexion.

## Dépannage

### Erreur d'authentification

Si vous rencontrez une erreur d'authentification, vérifiez que le nom d'utilisateur et le mot de passe dans l'URI MongoDB sont corrects.

### Erreur de connexion persistante

Si l'erreur de connexion persiste après avoir ajouté votre adresse IP à la liste blanche :

1. Vérifiez que vous utilisez la bonne URI de connexion
2. Assurez-vous que votre cluster MongoDB Atlas est actif
3. Vérifiez que vous n'êtes pas derrière un proxy ou un VPN qui pourrait modifier votre adresse IP
4. Essayez de redémarrer votre routeur pour obtenir une nouvelle adresse IP

### Vérification de votre adresse IP

Pour connaître votre adresse IP publique actuelle, vous pouvez utiliser la commande suivante :

```bash
curl ifconfig.me
```

Assurez-vous que cette adresse IP est bien celle qui figure dans la liste blanche de MongoDB Atlas. 