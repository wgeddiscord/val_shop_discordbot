# Bot Discord Valorant

Bot Discord permettant de lier son compte Riot Games et d'afficher sa boutique Valorant quotidienne.

## Fonctionnalités

- 🔗 **/link-account** : Lier votre compte Riot Games Valorant
- 🛍️ **/boutique** : Afficher votre boutique quotidienne
- ⏰ **Envoi automatique** : Boutique envoyée tous les jours à 2h du matin (heure française)

## Installation

1. Clonez le repository
2. Installez les dépendances :
   ```bash
   npm install
   ```

## Configuration

1. Copiez le fichier `.env` et remplacez les valeurs :
   - `DISCORD_TOKEN` : Token de votre bot Discord
   - `RIOT_API_KEY` : Clé API Riot Games (si nécessaire)
   - `CLIENT_ID` : ID de l'application Discord
   - `GUILD_ID` : ID de votre serveur Discord (optionnel pour les tests)

2. Créez un bot Discord :
   - Allez sur le [Portail Développeur Discord](https://discord.com/developers/applications)
   - Créez une nouvelle application
   - Créez un bot et activez les "Intents" nécessaires
   - Copiez le token dans `.env`

## Démarrage

```bash
npm start
```

Pour le développement :
```bash
npm run dev
```

## Commandes

### /link-account
Permet de lier votre compte Riot Games au bot.

**Options :**
- `username` : Votre nom d'utilisateur Riot Games
- `password` : Votre mot de passe Riot Games
- `region` : Votre région (eu, na, ap, kr)

### /boutique
Affiche votre boutique Valorant quotidienne avec les skins disponibles.

## Sécurité

⚠️ **Important** : Les identifiants Riot Games sont stockés localement dans une base de données SQLite. Pour une utilisation en production, envisagez d'utiliser un système de chiffrement et une base de données sécurisée.

## Structure du projet

```
bot_valo/
├── index.js          # Fichier principal du bot
├── package.json      # Dépendances du projet
├── .env             # Variables d'environnement
├── accounts.db      # Base de données SQLite (créée automatiquement)
└── README.md        # Documentation
```

## Dépendances principales

- `discord.js` : API Discord
- `axios` : Requêtes HTTP
- `node-cron` : Tâches planifiées
- `sqlite3` : Base de données
- `canvas` : Génération d'images
- `dotenv` : Gestion des variables d'environnement

## Notes

- L'authentification Riot Games dans ce code est une simulation. Pour l'utiliser en production, vous devrez implémenter l'authentification OAuth2 officielle de Riot Games.
- Le bot nécessite les permissions "Read Messages/View Channels" et "Send Messages" sur votre serveur Discord.
