# Point d'avancement Winiko Kids

Date du point: 26 mars 2026

## Vision du projet

Winiko Kids est un MVP web pour presenter des ateliers enfants de facon claire et rassurante pour les parents, avec :

- un site public pour consulter les ateliers, s'inscrire et poser des questions
- un back-office admin pour piloter les ateliers, suivre les inscriptions et lire les messages

## Stack actuelle

- Frontend: Angular 21 standalone
- Backend: NestJS 11
- Base de donnees: PostgreSQL 16 via Docker
- ORM: Prisma
- Auth admin: JWT
- Documentation API: Swagger sur `/docs`

## Ce qui est deja en place

### Frontend public

- page d'accueil avec hero, blocs de valeur et mise en avant des ateliers
- listing des ateliers publies
- page detail d'un atelier
- page FAQ publique
- assistant chatbot integre au layout public
- formulaire d'inscription a un atelier
- formulaire de contact
- routage public propre avec layout dedie

### Frontend admin

- page de connexion admin
- session admin stockee localement
- guard d'acces et interception du token
- dashboard admin
- gestion des ateliers
  - liste
  - creation
  - modification
  - suppression
  - publication / brouillon
- gestion des inscriptions
  - lecture par atelier
  - filtre par recherche
  - filtre par statut
  - mise a jour du statut
- gestion des messages de contact
  - consultation des messages recus
  - recherche rapide
  - liens directs mail / telephone
  - statuts de suivi
  - notes internes
- gestion de la FAQ
  - liste
  - creation
  - modification
  - suppression
  - publication / brouillon
- suivi chatbot
  - statistiques simples
  - liste des messages
  - filtres et pagination
- layout admin avec navigation dediee

### Backend

- endpoint de healthcheck
- configuration d'environnement avec validation
- CORS, validation globale et prefixe `/api`
- Swagger genere automatiquement
- module auth admin
  - login
  - profil courant
- module ateliers
  - endpoints publics
  - endpoints admin CRUD
- module inscriptions
  - endpoint public de creation
  - endpoints admin de lecture et changement de statut
- module contacts
  - endpoint public de creation
  - endpoint admin de consultation
  - endpoint admin de mise a jour du suivi
- module FAQ
  - endpoint public des reponses publiees
  - endpoints admin CRUD
- module chatbot public
  - endpoint de reponse conversationnelle controlee
  - appui sur FAQ publiee et ateliers publies
- journalisation chatbot
  - historique des messages
  - stats d'usage simples pour l'admin
- module dashboard admin
  - nombre d'ateliers
  - nombre d'inscriptions
  - nombre de messages contact
  - repartition des statuts d'inscription
  - ateliers publies / brouillons
  - prochains ateliers

### Donnees et infra

- schema Prisma avec `Admin`, `ParentAccount`, `Workshop`, `Registration`, `Contact`, `FaqEntry`
- migration initiale presente
- seed admin present
- seed de demonstration enrichi present
- seed FAQ de demonstration present
- `docker-compose.yml` pour Postgres local
- `docker-compose.prod.yml` pour une base de deploiement
- `Dockerfile` backend et frontend presents
- `.env` backend local deja configure

## Validation faite aujourd'hui

- `docker compose up -d postgres` : OK
- `npm run prisma:migrate:deploy` dans `backend/` : OK
- `npm run seed:admin` dans `backend/` : OK
- `npm run build` dans `frontend/` : OK
- `npm test -- --watch=false` dans `frontend/` : OK
- `npm run build` dans `backend/` : OK
- `npm test -- --watch=false` dans `backend/` : OK
- `docker compose -f docker-compose.prod.yml --env-file .env.prod.example config` : OK
- backend lance sur `http://localhost:3000`
- frontend lance sur `http://127.0.0.1:4200`
- verification HTTP backend : `GET /api/health` retourne `{"status":"ok","service":"winilo-kids-api"}`
- verification HTTP frontend : reponse `200 OK`
- installation Playwright + Chromium : OK
- execution E2E Playwright dans cet environnement : bloquee par dependances systeme manquantes du navigateur

## Apercu du rendu actuel

Le rendu implementé suit deja une direction claire :

- cote public: ton chaleureux, hero editorial, cartes ateliers, CTA vers ateliers et contact
- cote admin: interface plus utilitaire, sidebar, dashboard, cartes de gestion et formulaires lisibles

Je n'ai pas pu produire de capture d'ecran graphique directement depuis ce terminal car aucun navigateur headless n'est installe dans l'environnement courant. En revanche, le frontend est bien servi localement et peut etre ouvert sur `http://127.0.0.1:4200`.

## Points d'attention

- la couverture frontend couvre maintenant plusieurs parcours publics et admins, mais reste encore partielle
- les E2E sont poses, mais leur execution depend encore des bibliotheques systeme requises par Chromium selon l environnement
- il reste a valider le rendu plus finement avec davantage de cas de contenu si l on vise une preproduction

## Prochaines suites logiques

1. Finir la validation E2E sur une machine disposant des dependances systeme Chromium.
2. Etendre encore les tests admin aux inscriptions et au dashboard si besoin.
3. Affiner la strategie de deploiement ciblee selon l hebergeur retenu.
4. Ajouter des donnees de demonstration encore plus riches si besoin pour les recettes produit.
