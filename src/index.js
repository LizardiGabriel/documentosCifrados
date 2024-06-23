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
const api = require('./routes/api');

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
    ['/favicon.ico', '../public/img/favicon.ico'],
    ['/apple-touch-icon.png', '../public/img/apple-touch-icon.png'],
    ['/favicon-16x16.png', '../public/img/favicon-16x16.png'],
    ['/favicon-32x32.png', '../public/img/favicon-32x32.png'],
    ['/site.webmanifest', '../public/img/site.webmanifest'],

    

    //Rutas de js para iniciar sesión
    ['/script.js', '../public/js/sesion/sesion.js'],
    ['/home/script.js', '../public/js/home/home.js'],
    ['/getDocs.js', '../public/js/home/getDocs.js'],




    //Rutas de css de toda la interfaz
    ['/style.css', '../public/css/app.css'],
    ['/home/style.css', '../public/css/home.css'],


];



rutas.forEach(([rutaEntrada, rutaArchivo]) => {
    app.get(rutaEntrada, (req, res) => {
        res.status(200).sendFile(path.join(__dirname, rutaArchivo));
    });
});



app.use('/', express.static('./public/sesion'));


app.use('/home', async (req, res, next) => {
    if (req.session.jwt) {
        const token = req.session.jwt;
        jwt.verify(token, process.env.SECRET_KEY, (err, data) => {
            if (err) {
                console.log('err verificar home: ' + err);
                return res.redirect('/login.html');
            }
            res.locals.user = data;
            console.log('data verificar home: ' + data);
            next();
        });
    } else {
        console.log('err verificar home: ');
        res.redirect('/login.html');
    }
}
);

app.use('/api', async (req, res, next) => {
        if (req.session.jwt) {
            const token = req.session.jwt;
            jwt.verify(token, process.env.SECRET_KEY, (err, data) => {
                if (err) {
                    console.log('err verificar home: ' + err);
                    return res.redirect('/login.html');
                }
                res.locals.user = data;
                console.log('data verificar home: ' + data);
                next();
            });
        } else {
            console.log('err verificar home: ');
            res.redirect('/login.html');
        }
    }
);



app.post('/login', home.login);
// app.use('/invitado/invitacion.html', express.static('./public/build2/views/Invitado/RegistrarInformacionPersonal.html'));
app.post('/signup', home.signup);

app.use('/home/minutas.html', express.static('./public/home/minutas.html'));

app.use('/home/makedoc.html', express.static('./public/home/makedoc.html'));

app.use('/home/getDocs.html', express.static('./public/home/getDocs.html'));


app.get('/api/sessionData', home.sessionData);
app.get('/api/emails', api.emails);

app.post('/api/CreateMinute', api.CreateMinute);
app.post('/api/CreateMemorandum', api.CreateMemorandum);


app.get('/api/docs', api.docs);

app.post('/api/docs/sign', api.signDoc);

app.post('/api/getFirmaByIdUsu', api.getFirmaByIdUsu);


app.use('/home/public/docs', (req, res) => {
    console.log('ruta archivo: ', req.path);
    const rutaArchivo = '../public/docs' + req.path;
    res.status(200).sendFile(path.join(__dirname, rutaArchivo));
});


 




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

