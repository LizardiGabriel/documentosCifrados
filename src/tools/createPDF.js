var pdf = require("pdf-node");
var fs = require("fs");
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

        let path_return = "./public/uploads/"+uid.rnd()+".pdf";

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

        pdf(document, options)
            .then((res) => {
                console.log(res);
            })
            .catch((error) => {
                console.error(error);
            });



        console.log("PDF creado");
        return path_return;
    }
    catch (err){
        console.log('error en crear pdf: ', err);
        return -1;
    }


}

module.exports = {
    createPDF
};