const {getAllEmailUsersExceptBD, getUsersByIDBD} = require('../tools/peticiones');
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
        /*
        model Documento {
          id_documento       Int                @id @default(autoincrement())
          tipo               Int
          url                String
          hash               String
          fecha_modificacion String
          DocumentoUsuario   DocumentoUsuario[]
        }
        * */
        const fechaActual = new Date();
        const fecha =  fechaActual.getFullYear().toString() + "_" + (fechaActual.getMonth() + 1).toString() + "_" +fechaActual.getDate().toString();

        console.log('fechaHora: ', fechaHora);
        const minutita = await createMinuteBD(1, ruta, 'hash', fecha);



    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    emails,
    CreateMinute
};
