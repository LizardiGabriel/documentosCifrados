function makeDoc() {
    var opcion1 = document.getElementById("opcion1").checked;
    var opcion2 = document.getElementById("opcion2").checked;
    var opcion3 = document.getElementById("opcion3").checked;
    let opc = 0;
    var doc = "";
    if (opcion1) {
        doc = "minuta";
        opc = 1;
    } else if (opcion2) {
        doc = "memorandum";
        opc = 2;
    } else if (opcion3) {
        doc = "memorandum confidencial";
        opc = 3;
    }
    console.log("Se ha creado un documento de tipo " + doc);

    mostrarForm(opc);
}

var formid = document.getElementById('formid');
formid.insertAdjacentHTML('beforeend', returnHTMLformid());

function returnHTMLformid() {
    return `
<P>selecciona alguna opcion para crer el documento</P>
`;
}

let emailsAdded = [];

function insertAttendees(correos) {
    console.log('insertAttendees');
    let select = document.getElementById('attendees');
    correos.forEach(correo => {
        let option = document.createElement('option');
        option.value = correo.id_usuario;
        option.text = correo.email;
        option.publicOAEPKey = correo.RSAOAEPpublicKey;

        select.appendChild(option);
    });
}


function addAttendee() {
    console.log('addAttendee');
    const attendees = document.getElementById('attendees');
    if (!attendees) {
        console.log('No se encontró el elemento con id "attendees"');
        return;
    }
    const selectedAttendee = attendees.options[attendees.selectedIndex];
    console.log('selectedAttendee:', selectedAttendee.value);
    if (selectedAttendee.value === '0') {
        console.log('El valor del asistente seleccionado es "0", no se agregará ningún asistente');
        return;
    }

    const selectedAttendeesDiv = document.getElementById('selectedAttendees');
    const newAttendee = document.createElement('div');
    newAttendee.textContent = selectedAttendee.text;
    newAttendee.dataset.id_usuario = selectedAttendee.value;
    const removeButton = document.createElement('button');
    removeButton.textContent = ' Remove';
    removeButton.onclick = () => removeAttendee(removeButton);
    newAttendee.appendChild(removeButton);
    selectedAttendeesDiv.appendChild(newAttendee);
    attendees.remove(attendees.selectedIndex);


}

function removeAttendee(button) {
    const attendeeDiv = button.parentNode;
    const id_usuario = attendeeDiv.dataset.id_usuario;

    // Agregar de nuevo al select
    const select = document.getElementById('attendees');
    const option = document.createElement('option');
    option.value = id_usuario;
    option.text = attendeeDiv.textContent.split(' ')[0]; // Obtener el email sin el botón
    option.dataset.id_usuario = id_usuario;
    select.appendChild(option);

    attendeeDiv.remove();
}

async function getEmails() {
    try {
        const response = await fetch("/api/emails", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const emails = await response.json();
        console.log('fetch /api/emails:', emails)
        return emails;
    } catch (error) {
        console.error("Error al obtener la lista de correos:", error);
        return [];
    }
}




async function mostrarForm(opc) {
    console.log('se muestra el form ' + opc);
    let correos = await getEmails();
    // console.log('correos obtenidos mostrarForm:', correitos);

    switch (opc) {
        case 1:
            await formMinuta();
            insertAttendees(correos);
            break;
        case 2:
            await formMemorandum();
            insertAttendees(correos);
            break;
        case 3:
            await formMemorandumSecreto();
            insertAttendees(correos);
            break;
        default:
            break;
    }

}



async function enviarMinuta() {
    console.log('enviarMinuta');
    event.preventDefault();
    const form = document.getElementById('minuteForm');
    const meetingTitle = form.meetingTitle.value;
    const minutesContent = form.minutesContent.value;
    const selectedAttendeesDiv = document.getElementById('selectedAttendees');
    const selectedAttendees = Array.from(selectedAttendeesDiv.children).map(div => div.dataset.id_usuario);

    console.log('meetingTitle:', meetingTitle);
    console.log('minutesContent:', minutesContent);
    console.log('selectedAttendees:', selectedAttendees);

    const data = {
        meetingTitle,
        minutesContent,
        selectedAttendees
    };

    console.log('data de la minuta a enviar:', data);

    try {
        const response = await fetch('/api/CreateMinute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        alert('Resultado de enviarMinuta: ' + result);
        window.location.href = '/home/minutas.html';
    } catch (error) {
        console.error('Error al enviar la minuta:', error);
    }



}




async function enviarMemoNormal() {
    console.log('enviarMemoNormal');
    event.preventDefault();
    const form = document.getElementById('memoForm');
    const memoTitle = form.memoTitle.value;
    const memoContent = form.memoContent.value;

    const selectedAttendeesDiv = document.getElementById('selectedAttendees');
    const selectedAttendees = Array.from(selectedAttendeesDiv.children).map(div => div.dataset.id_usuario);

    const data = {
        memoTitle,
        memoContent,
        selectedAttendees
    };

    console.log('data del memo a enviar:', data);

    try {
        const response = await fetch('/api/CreateMemorandum', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const resPdfRoute = JSON.stringify(result);
        console.log('Resultado de enviarMemoNormal: ' + resPdfRoute);

        const url = result.url;
        const idDocumento = result.idDocumento;

        console.log('url:', url);
        console.log('idDocumento:', idDocumento);

        // la ruta del pdf es esta: resPdfRoute.url

        // funcion para hacer una peticion al servidor del archivo json, obtener del json el .pdf y luego obtener
        // pasar de base64 a normal,
        await firmalDoc(url, idDocumento);

    } catch (error) {
        console.error('Error al enviar el memorandum:', error);
    }
}

async function generateHash(arrayBuffer) {
    // Generar el hash
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convertir el hash a un array de bytes

    // Convertir el hash a una cadena hexadecimal
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}


async function verifySignature(hash, firma64, publicKey64){

    const hashBuffer = new TextEncoder().encode(hash);

    const signatureArray = Array.from(new Uint8Array(atob(firma64).split('').map(c => c.charCodeAt(0))));
    const signatureBuffer = new Uint8Array(signatureArray).buffer;

    const publicKey = JSON.parse(atob(publicKey64));
    const publicKeyBuffer = await window.crypto.subtle.importKey(
        'jwk', // the format of the key
        publicKey, // the key
        {   // these are the algorithm options
            name: 'RSA-PSS',
            hash: {name: 'SHA-256'}, // or SHA-512
        },
        false, // whether the key is extractable (i.e. can be used in exportKey)
        ['verify'] // can be any combination of "sign" and "verify"
    );

    const signatureVerification = await window.crypto.subtle.verify(
        {
            name: 'RSA-PSS',
            saltLength: 128, // the length of the salt
        },
        publicKeyBuffer, // from generateKey or importKey above
        signatureBuffer, // ArrayBuffer of the signature
        hashBuffer // ArrayBuffer of the data
    );

    //console.log('Verificación de la firma:', signatureVerification);

    return signatureVerification;

}




async function firmalDoc(url, idDocumento){
    try{
        console.log('doc.url', url);
        // fetch al url del server
        const pdfResponse = await fetch(url);
        const pdfData = await pdfResponse.json();
        const pdfBlob = new Blob([Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(pdfBlob);

        // hash

        const pdfBuffer = Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0));
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
        let hash = await generateHash(arrayBuffer);
        console.log('Hash del pdf: ', hash);


        const fileInput = document.createElement('input');
        fileInput.type = 'file';


        // Escuchar el evento 'change' del input
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                // El contenido del archivo está en event.target.result
                const fileContent = event.target.result;
                let jsonData;
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (error) {
                    console.error('Error al parsear el archivo', error);
                }

                console.log('jsonData.rsaPrivateKey-->', jsonData.rsaPrivateKey);
                /*
                *
                * */

                const rsaPrivateKey = jsonData.rsaPrivateKey;
                const hashBuffer = new TextEncoder().encode(hash);

                // Import the private key
                const privateKey = await window.crypto.subtle.importKey(
                    'jwk', // the format of the input key
                    rsaPrivateKey, // this is the JWK format key
                    {   // these are the algorithm options
                        name: 'RSA-PSS',
                        hash: {name: 'SHA-256'}, // or SHA-512
                    },
                    false, // whether the imported key is extractable (i.e. can be used in exportKey)
                    ['sign'] // must contain the "sign" usage
                );

                // Now you can use privateKey with window.crypto.subtle.sign
                const signatureBuffer = await window.crypto.subtle.sign(
                    {
                        name: 'RSA-PSS',
                        saltLength: 128, // the length of the salt
                    },
                    privateKey,
                    hashBuffer
                );

                const signatureArray = Array.from(new Uint8Array(signatureBuffer));
                const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log('Firma:', signatureHex);

                const signature64 = btoa(String.fromCharCode.apply(null, signatureArray));
                console.log('Firma en base64:', signature64);



                // ahora para motivos de pruebas, verifica la firma
                const publicKey64 = btoa(JSON.stringify(jsonData.rsaPublicKey));
                const resVerify = await verifySignature(hash, signature64, publicKey64);
                console.log('resVerify:', resVerify);


                // Enviar la firma al servidor
                const response = await fetch(`/api/docs/sign`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idDocumento: idDocumento,
                        firma64: signature64
                    })
                });
                const data = await response.json();

                if (data.message === 'ok') {
                    console.log('el servidor recibio la firma y guardó el archivo: ', data);
                }
                window.location.href = '/home/minutas.html';
            };

            reader.readAsText(file); // Leer el archivo como texto
        });

        // Simular un click en el input para abrir el selector de archivos
        fileInput.click();

    }
    catch (error){
        console.error('Error al firmar el documento:', error);
    }

}

async function getMyData() {
    const response = await fetch('/api/sessionData');
    const data = await response.json();
    console.log('sessionData', data);
    return data;
}

async function generateAesKey() {
    let keyAux, aesKey;
    keyAux = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    aesKey = await crypto.subtle.exportKey("jwk", keyAux);
    console.log("Generated AES key:", aesKey);
    return aesKey;
}




async function enviarMemoConf(){
    console.log('enviarMemoConf');
    event.preventDefault();
    const form = document.getElementById('confidentialMemoForm');
    const memoConfTitle = form.memoConfTitle.value;
    const memoConContent = form.memoConContent.value;

    const selectedAttendeesDiv = document.getElementById('selectedAttendees');
    const selectedAttendees = Array.from(selectedAttendeesDiv.children).map(div => div.dataset.id_usuario);
    const aucEmails = Array.from(selectedAttendeesDiv.children).map(div => div.textContent );
    const selectedEmails = aucEmails.map(email => email.replace(' Remove', ''));

    const myData = await getMyData();
    console.log('myData:', myData);
    const myemail = myData.data.email;
    const myId = myData.data.idUsuario;

    const data = {
        memoConfTitle,
        memoConContent,
        selectedAttendees,
        selectedEmails
    };

    selectedEmails.push(myemail);
    selectedAttendees.push(myId);
    const dataHTML = {
        memoConfTitle,
        memoConContent,
        selectedEmails
    };


    // hacer un pdf con memoConTitle, memoConContent, selectedEmails
    const htmlTemplateResponse = await fetch('./public/docs/templateMemoConfi.html');
    const htmlTemplate = await htmlTemplateResponse.text();

    const template = Handlebars.compile(htmlTemplate);
    const html = template(dataHTML);

    const doc = new jsPDF('p', 'pt', 'letter'); // Portrait, points, letter size
    const options = {
        margin: { top: 80, right: 400, bottom: 60, left: 40 },
        autoPaging: 'text',
        // html2canvas: { scale: 2 } // For higher quality, if needed
    };

    doc.fromHTML(html, options.margin.left, options.margin.top, {
        'width': options.margin.right + options.margin.left,
    }, async () => {
        let base64String = doc.output('datauristring');
        // Remover el prefijo "data:application/pdf;base64,"
        base64String = base64String.replace('data:application/pdf;base64,', '');
        console.log('base64String:', base64String);

        // Download (optional)
        //doc.save('Memorándum Confidencial.pdf');

        // sacar el hash del pdf del base64String
        // sacar la firma
        // encriptar el pdf
        // enviar el pdf encriptado

        const pdfBuffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
        const arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
        let hash = await generateHash(arrayBuffer);
        console.log('Hash del pdf: ', hash);


        const fileInput = document.createElement('input');
        fileInput.type = 'file';


        // Escuchar el evento 'change' del input
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                // El contenido del archivo está en event.target.result
                const fileContent = event.target.result;
                let jsonData;
                try {
                    jsonData = JSON.parse(fileContent);
                } catch (error) {
                    console.error('Error al parsear el archivo', error);
                }

                console.log('jsonData.rsaPrivateKey-->', jsonData.rsaPrivateKey);
                /*
                *
                * */

                const rsaPrivateKey = jsonData.rsaPrivateKey;
                const hashBuffer = new TextEncoder().encode(hash);

                // Import the private key
                const privateKey = await window.crypto.subtle.importKey(
                    'jwk', // the format of the input key
                    rsaPrivateKey, // this is the JWK format key
                    {   // these are the algorithm options
                        name: 'RSA-PSS',
                        hash: {name: 'SHA-256'}, // or SHA-512
                    },
                    false, // whether the imported key is extractable (i.e. can be used in exportKey)
                    ['sign'] // must contain the "sign" usage
                );

                // Now you can use privateKey with window.crypto.subtle.sign
                const signatureBuffer = await window.crypto.subtle.sign(
                    {
                        name: 'RSA-PSS',
                        saltLength: 128, // the length of the salt
                    },
                    privateKey,
                    hashBuffer
                );

                const signatureArray = Array.from(new Uint8Array(signatureBuffer));
                const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log('Firma:', signatureHex);

                const signature64 = btoa(String.fromCharCode.apply(null, signatureArray));
                console.log('Firma en base64:', signature64);


                // ahora para motivos de pruebas, verifica la firma
                const publicKey64 = btoa(JSON.stringify(jsonData.rsaPublicKey));
                const resVerify = await verifySignature(hash, signature64, publicKey64);
                console.log('resVerify:', resVerify);


                // la firma es signature64
                // el pdf en base 64 es base64String

                // encriptar el pdf en base64 con mi llave secreta:

                /*
                "aesKey": {
                    "alg": "A256GCM",
                    "ext": true,
                    "k": "dJ_nHrpnwi_0llCfpHD2LOdK8fn_vucd8FPtV6Z_eTA",
                    "key_ops": [
                      "encrypt",
                      "decrypt"
                    ],
                    "kty": "oct"
                  }
                * */

                const aesKey = await generateAesKey();
                

                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const algorithm = {
                    name: 'AES-GCM',
                    iv: iv
                };

                const key = await window.crypto.subtle.importKey(
                    'jwk',
                    aesKey,
                    algorithm,
                    true,
                    ['encrypt']
                );

                const encrypted = await window.crypto.subtle.encrypt(
                    algorithm,
                    key,
                    new TextEncoder().encode(base64String)
                );

                const encryptedArray = Array.from(new Uint8Array(encrypted));
                const encryptedBase64 = btoa(String.fromCharCode.apply(null, encryptedArray));
                console.log('encryptedBase64:', encryptedBase64);

                const ivAndEncryptedData = {
                    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
                    data: encryptedBase64
                };

                // cifrar la contraseña con la llave publica RSA de los destinatarios

                const arrayEmail_RSAOAEPpublicKey = [];
                // agregar primero mi correo y mi clave
                arrayEmail_RSAOAEPpublicKey.push({email: myemail, publicKey: myData.data.rsaAOAEPpublicKey});

                // lista de todos los correos
                const correos3 = await getEmails();

                data.selectedEmails.forEach(email => {
                    correos3.forEach(correo => {
                        if (correo.email === email) {
                            // buscar ese correo en
                            arrayEmail_RSAOAEPpublicKey.push({email: correo.email, publicKey: correo.RSAOAEPpublicKey});
                        }
                    });
                });

                console.log('arrayEmail_RSAOAEPpublicKey:', arrayEmail_RSAOAEPpublicKey);

                const arr_Email_EKB64 = [];
                for (const email_RSAOAEPpublicKey of arrayEmail_RSAOAEPpublicKey) {
                    const publicKey = email_RSAOAEPpublicKey.publicKey;
                    const email = email_RSAOAEPpublicKey.email;

                    const publicKeyBuffer = await window.crypto.subtle.importKey(
                        'jwk', // the format of the key
                        JSON.parse(atob(publicKey)),
                        {
                            name: 'RSA-OAEP',
                            hash: {name: 'SHA-256'}
                        },
                        true,
                        ['encrypt']
                    );

                    console.log('aesKey.k:', aesKey.k);

                    const aesKeyString = JSON.stringify(aesKey);
                    // Codificar la cadena JSON en un ArrayBuffer
                    const keyBuffer = new TextEncoder().encode(aesKeyString);



                    const encryptedKey = await window.crypto.subtle.encrypt(
                        {
                            name: 'RSA-OAEP'
                        },
                        publicKeyBuffer,
                        keyBuffer
                    );

                    const encryptedKeyArrayBuffer = new Uint8Array(encryptedKey);
                    const encryptedKeyArray = Array.from(encryptedKeyArrayBuffer);
                    const encryptedKeyBase64 = btoa(String.fromCharCode.apply(null, encryptedKeyArray));
                    console.log('encryptedKeyBase64:', encryptedKeyBase64);

                    arr_Email_EKB64.push({email, encryptedKeyBase64});

                }

                // ahora si, mandar al servidor el pdf encriptado en base64, la firma en base64
                // y el array de correos con sus llaves encriptadas

                const response = await fetch(`/api/docs/sendConfidentialMemo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pdf: ivAndEncryptedData,
                        firma: signature64,
                        arr_correos: arr_Email_EKB64,
                        correos: selectedEmails,
                        ids: selectedAttendees
                    })
                });

                const resFetchSendMemoConf = await response.json();
                console.log('resFetchSendMemoConf:', resFetchSendMemoConf);

                if (resFetchSendMemoConf.message === "Memo normal creado exitosamente" ){
                    window.location.href = '/home/minutas.html';
                }


            };

            reader.readAsText(file); // Leer el archivo como texto
        });

            // Simular un click en el input para abrir el selector de archivos
            fileInput.click();

            console.log('data del memo a enviar:', data);


    });
}







