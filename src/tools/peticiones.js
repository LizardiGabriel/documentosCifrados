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
                id_usuario: Number(ID),
            },
        });
        return usuario;
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        return null;
    }
}



async function createUserBD({ email, password, nombre, apellido_paterno, RSApublicKey, RSAOAEPpublicKey }) {
    try {
        const createdUser = await prisma.usuario.create({
            data: {
                email,
                password,
                nombre,
                apellido_paterno,
                RSApublicKey,
                RSAOAEPpublicKey

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


async function getAllEmailUsersExceptBD(idUsuario){
    console.log('peticion a la bd de getAllUsers');
    try {
        const allUsers = await prisma.usuario.findMany({
            where: {
                id_usuario: {
                    not: Number(idUsuario)
                }
            },
            select: {
                id_usuario: true,
                email: true,
                nombre: true,
                apellido_paterno: true,
                RSApublicKey: true,
                RSAOAEPpublicKey: true
            }
        });

        console.log('allUsers:', allUsers);
        return allUsers;

    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        return null;
    }
}


async function createMinuteBD(tipo, url, hash, fecha_modificacion) {
    try {
        const createdMinute = await prisma.documento.create({
            data: {
                tipo: Number(tipo),
                url,
                hash,
                fecha_modificacion
            },
        });

        // After successful creation, return the created minute's ID
        return createdMinute.id_documento;
    } catch (error) {
        console.error('Error creating minute:', error);
        throw new Error('Error creating minute');
    }
}



async function guardarDocUsuario(idDocumento, idUsuario, status, owner) {
    try {
        const createdDocUser = await prisma.documentoUsuario.create({
            data: {
                id_documento: Number(idDocumento),
                id_usuario: Number(idUsuario),
                status: Number(status),
                owner: Number(owner)
            },
        });

        return createdDocUser.id_documento_usuario;
    } catch (error) {
        console.error('Error creating document-user:', error);
        throw new Error('Error creating document-user');
    }
}


async function getDocsBD(idUsuario) {
    console.log('peticion a la bd de getDocsBD');
    try {
        const docs = await prisma.documentoUsuario.findMany({
            where: {
                id_usuario: Number(idUsuario),
            },
            select: {
                id_documento: true,
                status: true,
                documento: {
                    select: {
                        url: true,
                        hash: true,
                        fecha_modificacion: true,
                        tipo: true
                    }
                }
            }
        });

        const result = docs.map(doc => {
            return {
                id_documento: doc.id_documento,
                status_personal: doc.status,
                url: doc.documento.url,
                hash: doc.documento.hash,
                fecha_modificacion: doc.documento.fecha_modificacion,
                tipo: doc.documento.tipo
            };
        });



        const tipo1 = result.filter(doc => doc.tipo === 1);
        const tipo2 = result.filter(doc => doc.tipo === 2);
        const tipo3 = result.filter(doc => doc.tipo === 3);

        const resultRet = {
            tipo1: tipo1,
            tipo2: tipo2,
            tipo3: tipo3
        };


        console.log('resultRet:', resultRet);


        // Devolver el objeto JSON
        return resultRet;


    } catch (error) {
        console.error('Error al obtener todos los documentos:', error);
        return null;
    }
}

async function getDocumentoUsuarioByIds(id_documento, id_usuario) {
    try {
        const docUser = await prisma.documentoUsuario.findFirst({
            where: {
                id_documento: Number(id_documento),
                id_usuario: Number(id_usuario)
            },
        });

        return docUser;
    } catch (error) {
        console.error('Error al obtener documento-usuario por IDs:', error);
        return null;
    }
}

async function getUrlDocumentoById(id_documento) {
    try {
        const doc = await prisma.documento.findFirst({
            where: {
                id_documento: Number(id_documento),
            },
            select: {
                url: true
            }
        });

        return doc.url;
    } catch (error) {
        console.error('Error al obtener documento por ID:', error);
        return null;
    }
}


async function putSignatureDocumentoUsuario(id_documento_usuario, status, firma, fecha_firma) {
    try {
        const updatedDocUser = await prisma.documentoUsuario.update({
            where: {
                id_documento_usuario: Number(id_documento_usuario),
            },
            data: {
                status: Number(status),
                firma,
                fecha_firma
            },
        });

        return updatedDocUser.id_documento_usuario;
    } catch (error) {
        console.error('Error updating document-user:', error);
        throw new Error('Error updating document-user');
    }
}



module.exports = {
    getUsersByEmailBD,
    getUsersByIDBD,
    createUserBD,
    getAllEmailUsersExceptBD,
    createMinuteBD,
    guardarDocUsuario,
    getDocsBD,

    getDocumentoUsuarioByIds,
    getUrlDocumentoById,
    putSignatureDocumentoUsuario

};
