// Imports
const express = require('express');
const bodyParser = require('body-parser');
const apiRouter = require('./apiRouter').router;


// Instanciate server
const server = express();

// Body Parser configuration
server.use(bodyParser.urlencoded({ extended:true }));
server.use(bodyParser.json());

// Configure route
server.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Et revoila le server...</h1>');
});

server.use('/api/', apiRouter);

// Launch server
server.listen(8080, function() {
    console.log('Server ok :)');
});