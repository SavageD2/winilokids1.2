# Winilo Kids

Winilo Kids est un site vitrine et de reservation pour des ateliers enfants, avec :

- un site public pour consulter les ateliers, creer un compte parent, reserver et gerer ses reservations
- un espace admin pour gerer les ateliers, suivre les inscriptions et consulter les messages de contact

## Stack

- frontend : Angular 21
- backend : NestJS 11
- base de donnees : PostgreSQL 16
- ORM : Prisma
- auth : JWT

## Livrables couverts

- site fonctionnel en local
- code source
- acces admin
- instructions de lancement

## Prerequis

- Node.js 22+
- npm 10+
- Docker + Docker Compose

## Arborescence

- `frontend/` : application Angular
- `backend/` : API NestJS + Prisma
- `docker-compose.yml` : PostgreSQL local

## Installation

Installer les dependances :

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Configuration

Le backend utilise `backend/.env`.

Le fichier local attendu est deja au format suivant :

```env
PORT=3000
DATABASE_URL="postgresql://winilo_user:winilo_password@localhost:5432/winilo_kids?schema=public"
JWT_SECRET="change-this-super-secret-key"
JWT_EXPIRES_IN="1d"
GOOGLE_CLIENT_ID=""
ADMIN_EMAIL="admin@winilo-kids.fr"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="Winilo"
```

Le modele de reference est dans [backend/.env.example](/home/Savage/git/win1.2/backend/.env.example).

Pour activer la connexion Google parent, il faut renseigner :

- `GOOGLE_CLIENT_ID` dans `backend/.env`
- `googleClientId` dans [frontend/public/app-config.js](/home/Savage/git/win1.2/frontend/public/app-config.js) en local
- `WINILO_GOOGLE_CLIENT_ID` dans [.env.prod.example](/home/Savage/git/win1.2/.env.prod.example) pour le deploiement Docker

Si cette valeur reste vide, le bouton Google reste desactive cote frontend.

Pour activer la synchronisation des ateliers publies vers Google Calendar, il faut aussi renseigner :

- `GOOGLE_CALENDAR_ID` : identifiant du calendrier cible
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` : email du compte de service autorise sur ce calendrier
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` : cle privee du compte de service
- ou `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` : chemin vers le JSON du compte de service, plus simple en local
- `GOOGLE_CALENDAR_TIME_ZONE` : fuseau a utiliser pour les evenements, `Europe/Paris` par defaut

Le flux actuel est unidirectionnel `app -> Google Calendar` :

- un atelier publie cree ou modifie est cree ou mis a jour dans Google Calendar
- un atelier repasse en brouillon tente de retirer son evenement du calendrier
- si l integration n est pas configuree, le CRUD atelier continue de fonctionner et le back-office affiche simplement l etat `Google Calendar non configure`

En local, le plus simple est en general :

```env
GOOGLE_CALENDAR_ID="ton-calendar-id"
GOOGLE_SERVICE_ACCOUNT_KEY_FILE="../google-service-account.json"
GOOGLE_CALENDAR_TIME_ZONE="Europe/Paris"
```

Important :

- le fichier `client_secret_...json` sert au login Google parent
- pour la sync Calendar, il faut un JSON distinct de type `service_account`

## Lancement rapide

### 1. Demarrer PostgreSQL

Depuis la racine du projet :

```bash
docker compose up -d postgres
```

### 2. Appliquer la base

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
```

### 3. Creer l'admin

```bash
cd backend
npm run seed:admin
```

### 4. Charger des ateliers de demonstration

```bash
cd backend
npm run seed:demo
```

Ce seed charge un jeu de donnees de demonstration complet :

- 3 ateliers publies visibles cote public
- 1 atelier en brouillon pour le back-office admin
- 3 comptes parents de test
- 4 reservations avec plusieurs statuts
- 4 messages de contact avec plusieurs statuts de suivi
- 6 entrees FAQ dont 5 publiees

### 5. Lancer le backend

```bash
cd backend
npm run start:dev
```

Backend disponible sur :

- API : `http://localhost:3000/api`
- healthcheck : `http://localhost:3000/api/health`
- Swagger : `http://localhost:3000/docs`

### 6. Lancer le frontend

Dans un autre terminal :

```bash
cd frontend
npm start -- --host 127.0.0.1 --port 4200
```

Frontend disponible sur :

- site : `http://127.0.0.1:4200`

## Acces utiles

### Admin

- URL : `http://127.0.0.1:4200/admin/login`
- email : `admin@winilo-kids.fr`
- mot de passe : `ChangeMe123!`

### Parent

- URL : `http://127.0.0.1:4200/inscription`
- FAQ publique : `http://127.0.0.1:4200/faq`

Le parent peut :

- creer son compte
- se connecter
- se connecter avec Google
- reserver un atelier
- voir ses reservations
- annuler une reservation selon son statut
- modifier son profil
- activer un mot de passe local apres un premier login Google

Comptes parents de demonstration apres `npm run seed:demo` :

- `camille.martin@example.com`
- `nora.bernard@example.com`
- `julien.robert@example.com`

Mot de passe commun :

- `DemoParent123!`

## Parcours de verification recommande

### Cote public

1. Ouvrir `http://127.0.0.1:4200`
2. Aller dans `Ateliers`
3. Consulter `FAQ`
4. Creer un compte parent via `Inscription / Connexion`
5. Verifier aussi la connexion Google si `GOOGLE_CLIENT_ID` et `googleClientId` sont renseignes
6. Reserver un atelier
7. Revenir dans `Mon compte` pour verifier la reservation

### Cote admin

1. Ouvrir `http://127.0.0.1:4200/admin/login`
2. Se connecter avec le compte admin
3. Verifier :
   - dashboard
   - gestion des ateliers
   - gestion des inscriptions
   - messages de contact
   - gestion de la FAQ

## Commandes utiles

### Backend

```bash
cd backend
npm run build
npm test -- --watch=false
npm run prisma:migrate:deploy
npm run seed:admin
npm run seed:demo
```

### Frontend

```bash
cd frontend
npm run build
npm test -- --watch=false
npm run e2e
npm start -- --host 127.0.0.1 --port 4200
```

## E2E

Les tests E2E utilisent Playwright et couvrent actuellement :

- connexion admin puis suivi d un message de contact
- connexion parent puis reservation d un atelier

Commande standard :

```bash
cd frontend
npm run e2e
```

Si les serveurs tournent deja et que tu veux reutiliser l environnement existant sans relancer le setup automatique :

```bash
cd frontend
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_SKIP_GLOBAL_SETUP=1 npm run e2e
```

## Preparation deploiement

Le depot contient maintenant une base de deploiement Docker :

- [backend/Dockerfile](/home/Savage/git/win1.2/backend/Dockerfile)
- [frontend/Dockerfile](/home/Savage/git/win1.2/frontend/Dockerfile)
- [frontend/nginx/default.conf.template](/home/Savage/git/win1.2/frontend/nginx/default.conf.template)
- [docker-compose.prod.yml](/home/Savage/git/win1.2/docker-compose.prod.yml)
- [.env.prod.example](/home/Savage/git/win1.2/.env.prod.example)

Lancement type :

```bash
cp .env.prod.example .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

## Etat actuel

Le projet est fonctionnel en local avec :

- auth admin par JWT
- auth parent locale et Google validees sur la branche `login`
- synchronisation optionnelle des ateliers publies vers Google Calendar depuis la branche `scheduling`
- possibilite pour un parent cree via Google d activer ensuite un mot de passe local
- reservation d atelier cote parent
- suivi des reservations depuis `Mon compte`
- annulation parent
- charte publique adaptee a l univers Winilo Kids
- assistant conversationnel public base sur la FAQ et les ateliers publies
- back-office admin pour ateliers, inscriptions, contacts, FAQ et suivi chatbot
- espace admin complet pour le MVP
- base E2E Playwright pour les parcours critiques
- configuration runtime de l URL API frontend pour le deploiement
- builds et tests frontend/backend verts dans l environnement courant

## Notes

- l'admin n'apparait dans la navigation publique que si une session admin est active
- les ateliers de demonstration proviennent du seed `seed:demo`
- relancer `npm run seed:demo` reinitialise uniquement les reservations et messages lies aux comptes de demonstration, pour garder un environnement de test propre
- le chatbot MVP ne realise aucune action sensible et n'invente pas de donnees : il s'appuie sur la FAQ publiee, les ateliers publies et des reponses de guidage controlees
- la documentation d'avancement complementaire est dans [POINT_AVANCEMENT_WINIKO_KIDS.md](/home/Savage/git/win1.2/POINT_AVANCEMENT_WINIKO_KIDS.md)
