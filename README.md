# CodeAlpha Project Management Tool

Application de gestion de projets avec tableau Kanban, suivi des tâches et notifications en temps réel.

## Fonctionnalités

- Inscription et connexion avec authentification JWT
- Création de projets et gestion des membres
- Tableaux Kanban avec glisser-déposer et colonnes personnalisables
- Tâches avec priorités, dates d'échéance, étiquettes, checklists et commentaires
- Notifications en temps réel avec Socket.IO
- Tableau de bord avec statistiques et progression des projets

## Structure du projet

```text
.
├── client/
│   ├── public/
│   └── src/
│       ├── api/           # Configuration des requêtes HTTP
│       ├── components/    # Composants réutilisables
│       ├── context/       # État global, dont l'authentification
│       ├── pages/         # Pages de l'application
│       ├── styles/        # Thème et styles
│       └── utils/         # Fonctions utilitaires
└── server/
    ├── config/            # Connexion à la base de données
    ├── controllers/       # Logique des API
    ├── middleware/        # Authentification et middleware
    ├── models/            # Modèles MongoDB
    ├── routes/            # Routes Express
    ├── utils/             # Fonctions serveur partagées
    ├── server.js          # Démarrage de l'API
    └── socket.js           # Configuration Socket.IO
```

## Prérequis

- Node.js et npm
- MongoDB local ou une instance MongoDB accessible

## Configuration du serveur

Depuis le dossier `server`, créez un fichier `.env` :

```env
MONGO_URI=mongodb://127.0.0.1:27017/codealpha_project_management
JWT_SECRET=remplacez_par_une_cle_aleatoire_longue
PORT=5000
```

Le serveur lit ce fichier depuis `server/.env`. Ne partagez pas ce fichier et ne commitez pas vos secrets.

Installez les dépendances et démarrez l'API :

```bash
cd server
npm install
npm run dev
```

L'API est disponible sur `http://localhost:5000`.

## Démarrer le client

Dans un autre terminal, à la racine du projet :

```bash
cd client
npm install
npm run dev
```

Ouvrez `http://localhost:5173`. Le client utilise l'API à `http://localhost:5000`.

## Vérifications du client

Depuis le dossier `client` :

```bash
npm run lint
npm run build
```
