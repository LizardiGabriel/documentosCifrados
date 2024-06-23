const {getAllEmailUsersExceptBD, getUsersByIDBD, createMinuteBD, guardarDocUsuario, getDocsBD} = require('../tools/peticiones');
const {createPDF} = require('../tools/createPDF');

const crypto = require('crypto');


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
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
        const hash = await generateHash(arrayBuffer);
        console.log('hash generateHash: ', hash);


        console.log('hash calculado...');

        console.log('fecha para createMinuteBD: ', fecha);
        const minutitaId = await createMinuteBD(1, ruta, hash, fecha);
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


function generateHash(arrayBuffer) {
    const hash = crypto.createHash('sha256');
    hash.update(Buffer.from(arrayBuffer));
    const hashHex = hash.digest('hex');

    return hashHex;
}


async function docs(req, res) {
    try {
        const idUsuario = getIdUsuario(req.session.jwt);
        console.log('-->idUsuario: ' + idUsuario);

        const docsSend = await getDocsBD(idUsuario);

        res.status(200).json(docsSend);
    }
    catch (error) {
        console.log(error);
    }
}


async function signDoc(req, res) {
    try {
        const idUsuario = getIdUsuario(req.session.jwt);
        console.log('-->idUsuario: ' + idUsuario);
        const {idDocumento} = req.body;



        res.status(200).json({message: 'ok'});

    }
    catch (error) {
        console.log(error);
    }
}






module.exports = {
    emails,
    CreateMinute,
    docs,
    signDoc
};
