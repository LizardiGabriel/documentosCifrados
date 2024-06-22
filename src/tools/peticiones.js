const { PrismaClient } = require('@prisma/client');
const { json } = require('body-parser');
const prisma = new PrismaClient();

async function getUsersByEmailBD(email) {
    console.log('peticion a la bd de getUsersByEmail param: email: ', email);
    try {
        const usuario = await prisma.usuario.findFirst({
            where: {
                email: email,
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



async function createUserBD({ email, password, nombre, apellido_paterno, RSAn, RSAk }) {
    try {
        const createdUser = await prisma.usuario.create({
            data: {
                email,
                password,
                nombre,
                apellido_paterno,
                RSAn,
                RSAk
            },
        });

        // After successful creation, return the created user's ID
        return createdUser.id_usuario;
    } catch (error) {
        // Enhanced error handling with Prisma error codes
        if (error.code === 'P2002') { // Unique constraint violation (e.g., duplicate email)
            console.error('Error creating user (duplicate email):', error);
        } else {
            console.error('Error creating user:', error);
        }

        // Consider returning an error object with a specific code and message
        throw new Error('Error creating user');
    }
}



module.exports = {
    getUsersByEmailBD,
    getUsersByIDBD,
    createUserBD
};
