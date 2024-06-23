const {getAllEmailUsersExceptBD, getUsersByIDBD, createMinuteBD, guardarDocUsuario} = require('../tools/peticiones');
const {createPDF} = require('../tools/createPDF');


const { json } = require('body-parser');
const { stat } = require('fs');
const jwt = require('jsonwebtoken');
require('dotenv').config();


// funcion para verificar el id_usuario del token
function getIdUsuario(jsonToken) {
    let idUsuario = 0;
    jwt.verify(jsonToken, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return -1;
        } else {
            idUsuario = decoded.idUsuario;
            console.log('idUsuario: ' + idUsuario);
        }
    });
    return idUsuario;
}



async function emails(req, res) {
    try {
        const idUsuario = getIdUsuario(req.session.jwt);
        console.log('-->idUsuario: ' + idUsuario);
        const users = await getAllEmailUsersExceptBD(idUsuario);
        res.status(200).json(users);

    }
    catch (error) {
        console.log(error);
    }
}

async function CreateMinute(req, res) {
    try {
        const idUsuario = getIdUsuario(req.session.jwt);
        const {meetingTitle, minutesContent, selectedAttendees} = req.body;


        // crear pdf
        let participantes = [];

       const duenio = await getUsersByIDBD(idUsuario);
        participantes.push({
            email: duenio.email,
            nombre: duenio.nombre,
            apellido_paterno: duenio.apellido_paterno
        });

        for (let i = 0; i < selectedAttendees.length; i++) {
            const usuario = await getUsersByIDBD(selectedAttendees[i]);
            participantes.push({
                email: usuario.email,
                nombre: usuario.nombre,
                apellido_paterno: usuario.apellido_paterno
            });
        }

        // console.log('participantes en la minuta: ', participantes);




        // crear pdf
        const ruta = await createPDF('name', meetingTitle, minutesContent, participantes, idUsuario);
        console.log('ruta del pdf: ', ruta);

        // guardar en la bd
        const fechaActual = new Date();
        const fecha =  fechaActual.getFullYear().toString() + "_" + (fechaActual.getMonth() + 1).toString() + "_" +fechaActual.getDate().toString();

        const pdfBuffer = Buffer.from(ruta);
        let hashHex = '';
        try {
            hashHex = await hashDocument(pdfBuffer);
            console.log('Hash del documento:', hashHex);
        } catch (error) {
            console.error('Error al calcular el hash:', error);
        }

        console.log('fecha para createMinuteBD: ', fecha);
        const minutitaId = await createMinuteBD(1, ruta, hashHex, fecha);
        console.log('minutitaId creada: ', minutitaId);


        const peticionGuardar1 = await guardarDocUsuario(minutitaId, idUsuario, 0);
        console.log('peticionGuardar1: ', peticionGuardar1);
        for (let i = 0; i < selectedAttendees.length; i++) {
            const peticionGuardar = await guardarDocUsuario(minutitaId, selectedAttendees[i], 0);
            console.log('peticionGuardar: ', peticionGuardar);
        }

        res.status(200).json({message: 'Minuta creada exitosamente'});
        

    } catch (error) {
        console.log(error);
    }
}

async function hashDocument(pdfBuffer) {
    try {
        // 1. Convertir el buffer a ArrayBuffer
        const arrayBuffer = pdfBuffer.buffer.slice(
            pdfBuffer.byteOffset,
            pdfBuffer.byteOffset + pdfBuffer.byteLength
        );

        // 2. Calcular el hash utilizando SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

        // 3. Convertir el hash a formato hexadecimal
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hexHash;
    } catch (error) {
        console.error('Error al calcular el hash:', error);
        throw error; // Propagar el error para manejarlo adecuadamente
    }
}





module.exports = {
    emails,
    CreateMinute
};
