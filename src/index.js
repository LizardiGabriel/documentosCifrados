const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const methodOverride = require('method-override');


const home = require('./routes/home');
const reuniones = require('./routes/reuniones');

const admin = require('./routes/admin');
const anfitrion = require('./routes/anfitrion');
const seguridad = require('./routes/seguridad');
const externo = require('./routes/externo');
const invitado = require('./routes/invitado');
const { log } = require('console');

const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtFunctions = require('./tools/jwtFunctions');





const app = express();
app.use(express.json({ limit: '50mb' }));
app.locals.appTitle = 'beemeetings';

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride());


app.use(cookieParser('3CCC4ACD-6ED1-4844-9217-82131BDCB239'));

app.use(session({
    secret: '2C44774A-D649-4D44-9535-46E296EF984F',
    resave: true, saveUninitialized: true
}));

app.use(errorHandler());




app.get('/', (req, res) => {
    res.send('Hello World 2');
});

app.all('*', (req, res) => {
    console.log('============================  intento entrar a la ruta: ', req.url);
    res.redirect('/not-found');
});



app.listen(3000, () => {
    console.log('Servidor HTTP listo en localhost:3000');
});

