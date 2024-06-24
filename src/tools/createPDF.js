var pdf = require("pdf-node");
var fs = require("fs");
const path = require('path');


const ShortUniqueId = require('short-unique-id');



async function createPDF(name, meetingTitle, minutesContent, participantes, idUsuario) {
    try {

        var path = require('path');
        var htmlPath = path.join(__dirname, 'template.html');
        var html = fs.readFileSync(htmlPath, "utf8");

        var options = {
            format: "A3",
            orientation: "portrait",
            border: "10mm",
            header: {
                height: "45mm",
                contents: '<div style="text-align: center;">Author: Shyam Hajare</div>'
            },
            footer: {
                height: "28mm",
                contents: {
                    first: 'Cover page',
                    2: 'Second page', // Any page number is working. 1-based index
                    default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                    last: 'Last Page'
                }
            }
        };


        const uid = new ShortUniqueId();

        let path_return = "./public/pdfs/"+uid.rnd()+".pdf";

        var document = {
            html: html,
            data: {
                participantes: participantes,
                meetingTitle: meetingTitle,
                minutesContent: minutesContent
            },
            path: path_return,
            type: "pdf",
        };

        try {
            const res = await pdf(document, options);
            console.log(res);
        } catch (error) {
            console.error(error);
        }


        console.log("PDF creado");
        const rutaJSON = await generateBIN(path_return);
        console.log('rutaJSON con firmas: ', rutaJSON);

        return rutaJSON;
    }
    catch (err){
        console.log('error en crear pdf: ', err);
        return -1;
    }


}

async function crearBin(path2, json){
    try{
        fs.writeFileSync(path2, json);
        return 1;
    }
    catch (err) {
        console.log('error en crear bin: ', err);
        return -1;
    }
}

async function createMemoPDF(name, memoTitle, memoContent, participantes, idUsuario) {
    try {

        var path = require('path');
        var htmlPath = path.join(__dirname, 'templateMemoNormal.html');
        var html = fs.readFileSync(htmlPath, "utf8");

        var options = {
            format: "A3",
            orientation: "portrait",
            border: "10mm",
            header: {
                height: "45mm",
                contents: '<div style="text-align: center;">Author: Shyam Hajare</div>'
            },
            footer: {
                height: "28mm",
                contents: {
                    first: 'Cover page',
                    2: 'Second page', // Any page number is working. 1-based index
                    default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
                    last: 'Last Page'
                }
            }
        };

        const uid = new ShortUniqueId();

        let path_return = "./public/pdfs/" + uid.rnd() + ".pdf";

        var document = {
            html: html,
            data: {
                participantes: participantes,
                memoTitle: memoTitle,
                memoContent: memoContent
            },
            path: path_return,
            type: "pdf",
        };

        try {
            const res = await pdf(document, options);
            console.log(res);
        } catch (error) {
            console.error(error);
        }


        console.log("PDF creado");
        const rutaJSON = await generateBIN(path_return);
        console.log('rutaJSON con firmas: ', rutaJSON);

        return rutaJSON;

    }
    catch (err){
        console.log('error en crear memo pdf: ', err);
        return -1;
    }

}



async function generateBIN(path_return) {
    const pdfPath = path_return;
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

// 2. Crear un objeto que contenga el PDF en Base64 y el arreglo de firmas
    const firmas = []; // Reemplaza esto con tu arreglo de firmas
    const data = {
        pdf: pdfBase64,
        firmas: firmas
    };

// 3. Convertir ese objeto a JSON
    const json = JSON.stringify(data);

// 4. Guardar el JSON en un archivo con la extensión ".zjf
    const uid = new ShortUniqueId();
    let path2 = "./public/docs/"+uid.rnd()+".zen";

    fs.writeFileSync(path2, json);

    return path2;

}


async function modyfySignatures(path_zen, firma) {
    try{
        const fileContent = await fs.promises.readFile(path_zen, 'utf-8');
        const pdfData = JSON.parse(fileContent);
        pdfData.firmas = pdfData.firmas.concat(firma);

        const json = JSON.stringify(pdfData);
        fs.writeFileSync(path_zen, json);
        return 1;
    }
    catch (err){
        console.log('error en modificar firmas: ', err);
        return -1;
    }
}


module.exports = {
    createPDF,
    modyfySignatures,
    createMemoPDF,
    crearBin
};