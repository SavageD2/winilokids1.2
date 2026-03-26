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
- Auth parent: local JWT + Google Identity Services stabilises sur la branche `login`
- Planning: synchronisation unidirectionnelle `app -> Google Calendar` sur la branche `scheduling`
- Documentation API: Swagger sur `/docs`

## Ce qui est deja en place

### Frontend public

- page d'accueil avec hero, blocs de valeur et mise en avant des ateliers
- listing des ateliers publies
- page detail d'un atelier
- page FAQ publique
- assistant chatbot integre au layout public avec fermeture de nouveau accessible sur tous les ecrans
- formulaire d'inscription a un atelier
- page compte parent avec inscription locale, connexion locale, bouton Google et activation optionnelle d un mot de passe local apres premier login Google
- formulaire de contact
- systeme d apparence global avec modes `default`, `light`, `dark` et `system`
- routage public propre avec layout dedie

### Frontend admin

- page de connexion admin
- session admin stockee localement
- guard d'acces et interception du token
- systeme d apparence partage avec le site public
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
- module auth parent
  - register local
  - login local
  - profil courant
  - mise a jour du profil
  - login Google via verification d ID token cote serveur
  - activation d un mot de passe local pour un compte cree via Google
- module ateliers
  - endpoints publics
  - endpoints admin CRUD
  - synchronisation optionnelle des ateliers publies vers Google Calendar
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
- extension `ParentAccount` ajoutee pour auth hybride local + Google :
  - `passwordHash` nullable
  - `googleSubject`
  - `googleEmailVerified`
  - `googleLinkedAt`
- extension `Workshop` ajoutee pour suivi Google Calendar :
  - `googleCalendarEventId`
  - `googleCalendarEventUrl`
  - `googleCalendarSyncedAt`
  - `googleCalendarSyncError`
- migration initiale presente
- migration `20260326103000_add_parent_google_auth` ajoutee et appliquee
- migration `20260326170500_add_workshop_google_calendar_sync` ajoutee et appliquee
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
- `npm run prisma:generate` dans `backend/` apres extension Google : OK
- `npm run prisma:migrate:deploy` dans `backend/` avec la migration Google : OK
- `docker compose -f docker-compose.prod.yml --env-file .env.prod.example config` : OK
- backend lance sur `http://localhost:3000`
- frontend lance sur `http://127.0.0.1:4200`
- verification HTTP backend : `GET /api/health` retourne `{"status":"ok","service":"winilo-kids-api"}`
- verification HTTP frontend : reponse `200 OK`
- validation manuelle du parcours parent local + Google sur la branche `login` : OK
- validation du systeme de theme frontend (`default`, `light`, `dark`, `system`) : OK
- correctif UX chatbot pour conserver un bouton de fermeture accessible : OK
- validation reelle de la sync `app -> Google Calendar` sur la branche `scheduling` : OK
- creation d un atelier publie via API admin avec statut `googleCalendarSyncStatus = SYNCED` : OK
- correction UX du formulaire atelier admin avec slug auto-genere et messages de validation explicites : OK
- installation Playwright + Chromium : OK
- execution E2E Playwright dans cet environnement : bloquee par dependances systeme manquantes du navigateur
- commit de cloture de la branche `login` :
  - `2b3dcd0` `feat: add parent google auth and global theme system`
  - `fd3226d` `login w/ OAuth 2.0 & themes`

## Apercu du rendu actuel

Le rendu implementé suit deja une direction claire :

- cote public: ton chaleureux, hero editorial, cartes ateliers, CTA vers ateliers et contact
- cote admin: interface plus utilitaire, sidebar, dashboard, cartes de gestion et formulaires lisibles

Je n'ai pas pu produire de capture d'ecran graphique directement depuis ce terminal car aucun navigateur headless n'est installe dans l'environnement courant. En revanche, le frontend est bien servi localement et peut etre ouvert sur `http://127.0.0.1:4200`.

## Points d'attention

- pour activer Google login, il faut renseigner `GOOGLE_CLIENT_ID` cote backend et `googleClientId` cote frontend runtime local ou `WINILO_GOOGLE_CLIENT_ID` en deploiement Docker
- pour activer la sync agenda, il faut aussi renseigner `GOOGLE_CALENDAR_ID` et un compte de service Google cote backend
- la synchronisation planning actuelle est unidirectionnelle `app -> Google Calendar` : une creation directe dans Google Calendar ne remonte pas encore dans l app
- la branche `login` est consideree comme stabilisee et prete a servir de base a la suite
- le stockage de session parent reste en bearer token local pour limiter le risque de regression MVP
- la couverture frontend couvre maintenant plusieurs parcours publics et admins, y compris le systeme de theme et la fermeture du chatbot, mais reste encore partielle
- les E2E sont poses, mais leur execution depend encore des bibliotheques systeme requises par Chromium selon l environnement
- il reste a valider le rendu plus finement avec davantage de cas de contenu si l on vise une preproduction
- la cle du compte de service Google utilisee localement doit etre regeneree si elle a ete exposee hors du cadre de travail

## Prochaines suites logiques

1. Reporter la configuration Google validee localement vers les variables de prod (`GOOGLE_CLIENT_ID`, `GOOGLE_CALENDAR_ID`, compte de service, `WINILO_GOOGLE_CLIENT_ID`).
2. Decider si le planning doit rester en mode `app -> Google Calendar` ou evoluer vers une synchronisation bidirectionnelle / une source de verite Google Calendar.
3. Finir la validation E2E sur une machine disposant des dependances systeme Chromium.
4. A moyen terme, preparer une persistance serveur des preferences d apparence si l experience parent/admin devient multi-appareil.
