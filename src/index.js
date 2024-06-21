const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const methodOverride = require('method-override');

const { log } = require('console');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const home = require('./routes/home');


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


/* */


const rutas = [
    //Recursos de imagen
    

    //Rutas de js para iniciar sesión
    ['/script.js', '../public/js/sesion/sesion.js'],
    

    //Rutas de css de toda la interfaz
    ['/style.css', '../public/css/app.css'],


];



rutas.forEach(([rutaEntrada, rutaArchivo]) => {
    app.get(rutaEntrada, (req, res) => {
        res.status(200).sendFile(path.join(__dirname, rutaArchivo));
    });
});



app.use('/', express.static('./public/sesion'));


/* */

app.post('/login', home.login);




app.get('/not-found', (req, res) => {
    res.status(404).send('Ruta no encontrada');
});

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

