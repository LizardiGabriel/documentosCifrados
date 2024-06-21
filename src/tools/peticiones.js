const { PrismaClient } = require('@prisma/client');
const { json } = require('body-parser');
const prisma = new PrismaClient();

async function getUsersByEmailBD(email) {
    console.log('peticion a la bd de getUsersByEmail param: email: ', email);
    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                email_usuario: email,
            },
        });
        //console.log('respuesta de la bd: ', usuario);

        return usuario;

    } catch (error) {
        console.error('Error al obtener usuario por email:', error);
        return null;
    }
}

async function getUsersByIDBD(ID) {
    console.log('peticion a la bd de getUsersByID');
    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                id_usuario: ID,
            },
        });
        return usuario;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return null;
    }
}

async function getUsersByEmailBD(correo) {
    console.log('peticion a la bd de getUsersByCorreo');
    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                email_usuario: correo,
            },
        });
        return usuario;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return null;
    }
}

module.exports = {
    getUsersByEmailBD,
    getUsersByIDBD,
    getUsersByEmailBD,
};
