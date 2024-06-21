const {getUsersByEmailBD} = require('../tools/peticiones');
const { hashPassword, comparePassword } = require('../tools/cipher');

const { json } = require('body-parser');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateAccessToken(email, idUsuario, rolNum, nombre, apellido, foto) {
    return jwt.sign({ email: email, idUsuario: idUsuario, rol: rolNum, nombre: nombre, apellido: apellido, foto: foto }, process.env.SECRET_KEY, { expiresIn: '20m' });
}

function generateTokenInvitado(email, idInvitado, rolNum, newCount, changeFirstPass, idSeleccionado) {
    return jwt.sign({ email: email, idInvitado: idInvitado, rol: rolNum, newCount: newCount, changeFirstPass: changeFirstPass, idSeleccionado: -1 }, process.env.SECRET_KEY, { expiresIn: '60m' });
}


async function login(req, res) {
    try {
        console.log('mensaje --> login');
        const email = req.body.email;
        const password = req.body.password;

        //console.log(req.body);
        
        
        const usuario = await getUsersByEmailBD(email);

        if (usuario == null) {
            const invitado = await getInvitadoByIdEmailBD(email);
            
            return res.status(404).json({ error: 'Usuario no encontrado ooo', status: 404});
        }

        const isMatch = await comparePassword(password, usuario.password_usuario);
        //console.log('es la contrasena?: ' + isMatch);
        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta', status: 401});
        }
        const rol = usuario.rol_usuario;

        let rolNum = 0;
        let ruta = '';
    
        switch (rol) {
            case 'SuperAdmin':
                rolNum = 1;
                ruta = '/admin/admin.html';
                break;
            case 'Anfitrion':
                rolNum = 2;
                ruta = '/anfitrion/anfitrion.html';
                break;
            case 'Seguridad':
                rolNum = 3;
                ruta = '/seguridad/seguridad.html';
                //req.session.rol = 3;
                //res.status(200).json({ ruta: '/seguridad/seguridad.html',   status: 200});
                break;
            default:
                res.status(401).json({ error: 'Rol no encontrado', status: 401});
                break;
        }
        const token = generateAccessToken(email, usuario.id_usuario, rolNum, usuario.nombre_usuario, usuario.apellido_paterno_usuario, usuario.foto_usuario);
        console.log('token: ' + token);
        req.session.jwt = token;
        res.status(200).json({
            ruta: ruta,
            status: 200,
            message: 'Inicio de sesión exitoso'
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor', status: 500});
    }
}
