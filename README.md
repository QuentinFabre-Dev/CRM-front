<b>* ========================================================= *
* Projet de développement web - FABRE QUENTIN 2020 M1 MIA.  *
* ========================================================= *<b>

<h2> Context du projet : <br/></h2>
Dans le contexte de chef de projet et dans l'objetif de devenir vice president de l'association Junior MIAGE Concept Nice, j'ai voulu développer un debut de CRM (Customer Relationship Management) afin de pouvoir gérer toutes nos proposition commerciales (PC), ainsi que de pouvoir les ajouter,les rédiger, les éditer, et les supprimer (CRUD) ainsi que télécharger un document en pptx . L'objetif final étant de donner accés à tous les membres de l'association et d'avoir un visuel global sur l'état de la structure (actullement plus commercial) <br/>

<h2> Intro rapide au fonctionnement de Junior MIAGE Concept NICE pour comprendre l'outil : <br/></h2>
L'association à 5 axes : Commercial, Trésorie, RH, Cadre légal, Stratégie & Pilotage <br/>
Des PC sont des "devis" qui doivent être valider par le pôle qualité et notre président avant d'être envoyer au client <br/>
Durant la validation des modifications peuvent etre apportées à la PC <br/>
Le devis peut être convertie en étude pour la suite <br/>

<h2> Points technique : <br/></h2>
=> Projet React JS / NodeJs / MongoDB Atlas <br/>
=> Télécharger un .PPTX avec les données récues (presque fonctionnel)<br/>
=> NodeJS / Express / Bcrypte / UniversalCookie / body-parser / cors / mongoose / docxtemplater pour les packages principales <br/>
=> Pour l'UI : Matéterial UI https://material-ui.com ainsi que TailWindcss https://tailwindcss.com <br/>
=> Utilisation de SCSS <br/>
=> Utiliastion de JWT (JsonWebToken) pour l'identification avec la base de données MongoDB Atlas <br/>

<h2> Points faits : <br/></h2>
<b>La téléchargement des PC : Actuellement un template est present et les données sont modifier. Un nouveau PPTX et générer dans backend. Cependant impossible d'arriver à le faire télécharger actuellement... c'est la seul étape manquante.</b>
Mise en place de la structure React NodeJS Mongo <br/>
Systeme de connexion (User : mic | Pwd : buffa) <br/>
CRUD des PC <br/>
Mise en page de l'accuel la connexion et la partie commercial <br/>
Visualisation des données (seulement le total des PC [Pipeline]) <br/>
 
<h2> A faire :  <br/></h2>
Responsive design <br/>
Inclure Reat Redux pour la gestion d'événement (En cours...) <br/>
Visualisation de toutes les données (manque de temps) <br/>
Ajout de different rôles à la connexion <br/>
Les differents axes (RH,Stratégie...) <br/>
••• <br/>


<h2> | Présention :  <br/> </h2>
Se rendre sur https://crm-jmc.herokuapp.com/ et se connecter avec les identifiant (mic | buffa)  <br/>
Sur la page d'accueil on voit différentes informations (fictive pour le moment, inscrit en brut dans le code) ainsi que les differents axes <br/>
Selectionner la partie "Commercial" <br/>
Visualitation de l'espace commercial, pour ajouter un devis cliquer sur Ajouter une PC <br/>
Completer les informations <br/>
Retour sur la page d'accueil, vous pouvez modifier une devis, le supprimer, et le convertir... <br/>



