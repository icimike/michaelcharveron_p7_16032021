//Imports
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require("helmet");

// require('dotenv').config();

// On importe l'API routeur, on précise aussi qu'on veut l'objet .router
const apiRouter = require('./apiRouter').router;

// Instantiate Server
const server = express();
server.use(cors());

// Cette partie configure et autorise les requêtes Multi-Origin; définit les Headers & les Méthodes
server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Body Parser Configuration
server.use(express.urlencoded({extended:true}));
server.use(express.json());

// Helmet
server.use(helmet());

// Configure Routes (with callBack functions)
server.get ('/', function(req, res, next){
    res.setHeader('Content-Type','text/html');                          // Entête de ma réponse HTTP
    res.status(200).send('<h1> Vous êtes connecté au serveur </h1>');   // Message de réponse avec le code 200
});

// Upload des images
server.use('/images', express.static(path.join(__dirname, 'images')));

// Enregistrement du routeur pour toutes les demandes effectuées vers /api/
server.use('/api/', apiRouter);

// Launch Server
server.listen(3000, function(){
    console.log('Server OK');
});

