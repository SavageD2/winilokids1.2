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
ADMIN_EMAIL="admin@winilo-kids.fr"
ADMIN_PASSWORD="ChangeMe123!"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="Winilo"
```

Le modele de reference est dans [backend/.env.example](/home/Savage/git/win1.2/backend/.env.example).

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
- 3 messages de contact

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

Le parent peut :

- creer son compte
- se connecter
- reserver un atelier
- voir ses reservations
- annuler une reservation selon son statut
- modifier son profil

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
3. Creer un compte parent via `Inscription / Connexion`
4. Reserver un atelier
5. Revenir dans `Mon compte` pour verifier la reservation

### Cote admin

1. Ouvrir `http://127.0.0.1:4200/admin/login`
2. Se connecter avec le compte admin
3. Verifier :
   - dashboard
   - gestion des ateliers
   - gestion des inscriptions
   - messages de contact

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
npm start -- --host 127.0.0.1 --port 4200
```

## Etat actuel

Le projet est fonctionnel en local avec :

- charte publique adaptee a l'univers Winilo Kids
- compte parent
- reservation d'atelier conditionnee a la connexion
- annulation parent
- espace admin complet pour le MVP

## Notes

- l'admin n'apparait dans la navigation publique que si une session admin est active
- les ateliers de demonstration proviennent du seed `seed:demo`
- relancer `npm run seed:demo` reinitialise uniquement les reservations et messages lies aux comptes de demonstration, pour garder un environnement de test propre
- la documentation d'avancement complementaire est dans [POINT_AVANCEMENT_WINIKO_KIDS.md](/home/Savage/git/win1.2/POINT_AVANCEMENT_WINIKO_KIDS.md)
