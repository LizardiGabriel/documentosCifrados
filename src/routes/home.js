const {getUsersByEmailBD} = require('../tools/peticiones');
const { hashPassword, comparePassword } = require('../tools/cipher');

const { json } = require('body-parser');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateAccessToken(email, idUsuario, nombre, apellido) {
    return jwt.sign({ email: email, idUsuario: idUsuario, nombre: nombre, apellido: apellido }, process.env.SECRET_KEY, { expiresIn: '20m' });
}




async function login(req, res) {
    try {
        console.log('mensaje --> login');
        const email = req.body.email;
        const password = req.body.password;

        //console.log(req.body);
        
        
        const usuario = await getUsersByEmailBD(email);

        if (usuario == null) {
            return res.status(404).json({ error: 'Usuario no encontrado ooo', status: 404});
        }

        const isMatch = await comparePassword(password, usuario.password_usuario);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta', status: 401});
        }
        
        const token = generateAccessToken(email, usuario.id_usuario, usuario.nombre_usuario, usuario.apellido_paterno);
        console.log('token: ' + token);
        req.session.jwt = token;
        res.status(200).json({
            ruta: "ruta de inicio de sesión exitoso",
            status: 200,
            message: 'Inicio de sesión exitoso'
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor', status: 500});
    }
}

module.exports = {
    login
};

