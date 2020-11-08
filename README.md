* ========================================================= *
* Projet de développement web - FABRE QUENTIN 2020 M1 MIA.  *
* ========================================================= *

| Context du projet : 
Dans le contexte de chef de projet et dans l'objetif de devenir vice president de l'association Junior MIAGE Concept Nice, j'ai voulu développer un debut de CRM (Customer Relationship Management) afin de pouvoir gérer toutes nos proposition commerciales (PC), ainsi que de pouvoir les ajouter,les rédiger, les éditer, et les supprimer (CRUD) ainsi que télécharger un document en pptx . L'objetif final étant de donner accés à tous les membres de l'association et d'avoir un visuel global sur l'état de la structure (actullement plus commercial)

| Intro rapide au fonctionnement de Junior MIAGE Concept NICE pour comprendre l'outil :
L'association à 5 axes : Commercial, Trésorie, RH, Cadre légal, Stratégie & Pilotage
Des PC sont des "devis" qui doivent être valider par le pôle qualité et notre président avant d'être envoyer au client
Durant la validation des modifications peuvent etre apportées à la PC
Le devis peut être convertie en étude pour la suite

| Points technique : 
=> Projet React JS / NodeJs / MongoDB Atlas
=> Télécharger un .PPTX avec les données récues (presque fonctionnel)
=> NodeJS / Express / Bcrypte / UniversalCookie / body-parser / cors / mongoose / docxtemplater pour les packages principales 
=> Pour l'UI : Matéterial UI https://material-ui.com ainsi que TailWindcss https://tailwindcss.com 
=> Utilisation de SCSS
=> Utiliastion de JWT (JsonWebToken) pour l'identification avec la base de données MongoDB Atlas

| Points faits : 
Mise en place de la structure React NodeJS Mongo
Systeme de connexion (User : mic | Pwd : buffa)
CRUD des PC
Mise en page de l'accuel la connexion et la partie commercial
Visualisation des données (seulement le total des PC [Pipeline])
 
| A faire : 
Responsive design
Inclure Reat Redux pour la gestion d'événement (En cours...)
Visualisation de toutes les données (manque de temps)
Ajout de different rôles à la connexion
Les differents axes (RH,Stratégie...)
•••



| Présention : 
Se rendre sur https://crm-jmc.herokuapp.com/ et se connecter avec les identifiant (mic | buffa) 
Sur la page d'accueil on voit différentes informations (fictive pour le moment, inscrit en brut dans le code) ainsi que les differents axes
Selectionner la partie "Commercial"
Visualitation de l'espace commercial, pour ajouter un devis cliquer sur Ajouter une PC
Completer les informations
Retour sur la page d'accueil, vous pouvez modifier une devis, le supprimer, et le convertir...



