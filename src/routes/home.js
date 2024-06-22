const {getUsersByEmailBD, createUserBD} = require('../tools/peticiones');
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
        const email = req.body.correo;
        const password = req.body.pass;
        
        console.log('mensaje --> login, email: ' + email + ', password: ' + password);      
        
        const usuario = await getUsersByEmailBD(email);

        if (usuario == null) {
            return res.status(404).json({ error: 'Usuario no encontrado ooo', status: 404});
        }

        const isMatch = await comparePassword(password, usuario.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Contraseña incorrecta', status: 401});
        }
        
        const token = generateAccessToken(email, usuario.id_usuario, usuario.nombre, usuario.apellido_paterno);
        console.log('token: ' + token);
        req.session.jwt = token;
        
        console.log('login ok');
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

async function sessionData(req, res) {
    try {
        const token = req.session.jwt;
        if (!token) {
            return res.status(401).json({ error: 'No autorizado', status: 401});
        }
        const data = jwt.verify(token, process.env.SECRET_KEY);
        console.log('sessionData ok');
        res.status(200).json({
            data: data,
            status: 200
        });
    }
    catch (error) {
        console.error('Error al obtener datos de la sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor', status: 500});
    }

}


async function signup(req, res) {
    try {
        const { email, password, firstName, lastName } = req.body;
        const nombre = firstName;
        const apellidoPaterno = lastName;

        console.log('mensaje --> signup, email: ' + email + ', password: ' + password + ', nombre: ' + nombre + ', apellidoPaterno: ' + apellidoPaterno);

        // 1. Input Validation (Crucial!)
        if (!email || !password || !nombre || !apellidoPaterno) {
            return res.status(400).json({ error: 'Faltan campos obligatorios', status: 400 });
        }
        if (!validateEmail(email)) { // Add a helper function to validate email format
            return res.status(400).json({ error: 'Correo electrónico inválido', status: 400 });
        }
        if (password.length < 3) { // Enforce a minimum password length
            return res.status(400).json({ error: 'Contraseña debe tener al menos 3 caracteres', status: 400 });
        }

        // 2. Check for Existing User
        const existingUser = await getUsersByEmailBD(email);
        if (existingUser) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado', status: 409 });
        }

        // 3. Hash Password (Security!)
        const hashedPassword = await hashPassword(password);

        // 4. Create User in Database
        const newUserId = await createUserBD({
            email,
            password: hashedPassword,
            nombre,
            apellido_paterno: apellidoPaterno,
        });


        // 6. Success Response
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            status: 201
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor', status: 500 });
    }
}

// Helper function to validate email format
function validateEmail(email) {
    // You can use a regular expression or a library here
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}



module.exports = {
    login,
    sessionData,
    signup
};

