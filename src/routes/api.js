const {getAllEmailUsersExceptBD, getUsersByIDBD, createMinuteBD, guardarDocUsuario, getDocsBD} = require('../tools/peticiones');
const {createPDF, modyfySignatures} = require('../tools/createPDF');

const fs = require('fs').promises;

const {getDocumentoUsuarioByIds,
    getUrlDocumentoById,
    putSignatureDocumentoUsuario} = require('../tools/peticiones');

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





        const fileContent = await fs.readFile(ruta, 'utf-8');
        const pdfData = JSON.parse(fileContent);
        const pdfBuffer = Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0));
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
        let hash = await generateHash(arrayBuffer);
        console.log('Hash del pdf: ', hash);


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


async function generateHash(arrayBuffer) {
    // Generar el hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convertir el hash a un array de bytes

    // Convertir el hash a una cadena hexadecimal
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
        console.log('signDoc');
        const idUsuario = getIdUsuario(req.session.jwt);
        const {idDocumento, firma64} = req.body;
        const id_documento = idDocumento;
        const id_usuario = idUsuario;
        console.log('-->idUsuario: ' + idUsuario);
        console.log('-->idDocumento: ' + idDocumento);
        //console.log('-->firma64: ' + firma64);

        const signatureBuffer = Buffer.from(firma64, 'base64');
        const signatureArray = Array.from(signatureBuffer);
        const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('Firma:', signatureHex);


        const usuario = await getUsersByIDBD(idUsuario);
        const usuario_email = usuario.email;
        console.log('usuario_email: ', usuario_email);

        const usuario_public_key64 = usuario.RSApublicKey;
        const usuario_public_key = Buffer.from(usuario_public_key64, 'base64').toString('utf-8');
        console.log('usuario_public_key: ', usuario_public_key);


        const url = await getUrlDocumentoById(id_documento);
        console.log('url: ', url);


        const fileContent = await fs.readFile(url, 'utf-8');
        const pdfData = JSON.parse(fileContent);
        const pdfBuffer = Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0));
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

        let hash = await generateHash(arrayBuffer);
        console.log('Hash del pdf: ', hash);

        const hashBuffer = new TextEncoder().encode(hash);


        // verificar la firma

        const publicKey = usuario_public_key;
        const signature = await hexStringToArrayBuffer(signatureHex);

        const signatureVerification = await crypto.subtle.verify(
            {
                name: 'RSA-PSS',
                saltLength: 128, // the length of the salt
            },
            await crypto.subtle.importKey(
                'jwk', // the format of the input key
                JSON.parse(publicKey), // this is the JWK format key
                {   // these are the algorithm options
                    name: 'RSA-PSS',
                    hash: {name: 'SHA-256'}, // or SHA-512
                },
                false, // whether the imported key is extractable (i.e. can be used in exportKey)
                ['verify'] // must contain the "verify" usage
            ),
            signature,
            hashBuffer
        );

        console.log('Verificación de la firma:', signatureVerification);

        if (!signatureVerification) {
            res.status(400).json({message: 'Firma inválida'});
            return;
        }

        const relacionDocUser = await getDocumentoUsuarioByIds(id_documento, id_usuario);
        console.log('relacionDocUser.id_documento_usuario: ', relacionDocUser.id_documento_usuario);

        const firma = {
            firma64: firma64,
            usuario_email: usuario_email,
            id_documento_usuario: relacionDocUser.id_documento_usuario,
            id_usuario: id_usuario
        };

        const resSignDoc = await modyfySignatures(url, firma);
        console.log('resultado guardar firmas Doc: ', resSignDoc);



        //const resSignDoc = await putSignatureDocumentoUsuario(url, firma64, usuario_email, id_usuario );


        res.status(200).json({message: 'ok'});

    }
    catch (error) {
        console.log(error);
    }
}
async function getFirmaByIdUsu(req, res) {
    try {
        const {idUsuario} = req.body;
        console.log('-->idUsuario: ' + idUsuario);
        const usuario = await getUsersByIDBD(idUsuario);
        const firma = usuario.RSApublicKey;
        res.status(200).json(firma);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({message: 'Error al obtener la firma'});
    }
}




async function hexStringToArrayBuffer(hexString) {
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return byteArray.buffer;
}







module.exports = {
    emails,
    CreateMinute,
    docs,
    signDoc,
    getFirmaByIdUsu
};
