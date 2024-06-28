async function descifrar(myPassword64, arrayBufferDec, doc, iv, firma, card) {
    console.log('descifrar');
    console.log('descifrarfun --> myPassword64', myPassword64);
    console.log('descifrarfun --> arrayBufferDec', arrayBufferDec);
    console.log('descifrarfun --> doc.id_documento', doc.id_documento);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    // Escuchar el evento 'change' del input
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {

            const fileContent = event.target.result;
            let jsonData;
            try {
                jsonData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Error al parsear el archivo', error);
            }

            const rsaOAEPprivateKey = jsonData.rsaOAEPprivateKey;
            console.log('jsonData.rsaOAEPprivateKey-->', rsaOAEPprivateKey);

            const privateKeyBuffer = await window.crypto.subtle.importKey(
                'jwk',
                rsaOAEPprivateKey,
                {
                    name: 'RSA-OAEP',
                    hash: {name: 'SHA-256'}
                },
                false,
                ['decrypt']
            );

            // 2. Decodificar la clave AES cifrada desde Base64
            const encryptedKeyArrayBuffer = Uint8Array.from(atob(myPassword64), c => c.charCodeAt(0));

            // 3. Descifrar la clave AES
            const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'RSA-OAEP'
                },
                privateKeyBuffer,
                encryptedKeyArrayBuffer
            );

            // 4. Convertir el ArrayBuffer a una cadena de texto y luego analizar como JSON
            const decryptedKeyString = new TextDecoder().decode(decryptedKeyBuffer);  // Conversión a string
            const decryptedAESKey = JSON.parse(decryptedKeyString);  // Análisis JSON

            console.log('Clave AES descifrada:', decryptedAESKey);


            // 5. Crear un objeto CryptoKey a partir de la clave descifrada
            const aesKey = await window.crypto.subtle.importKey(
                'jwk',
                decryptedAESKey,
                {
                    name: 'AES-GCM'
                },
                true,
                ['decrypt']
            );

            //const iv2 = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

            const algorithm = {
                name: 'AES-GCM',
                iv: iv
            };

            const key = await window.crypto.subtle.importKey(
                'jwk',
                decryptedAESKey,
                algorithm,
                false,
                ['decrypt']
            );


            const decryptedData = await window.crypto.subtle.decrypt(
                algorithm,
                key,
                arrayBufferDec
            );

            const decryptedBase64String = new TextDecoder().decode(decryptedData);

            console.log('decryptedBase64String', decryptedBase64String);

            const decryptedArrayBuffer = Uint8Array.from(atob(decryptedBase64String), c => c.charCodeAt(0));
            const decryptedBlob = new Blob([decryptedArrayBuffer], {type: 'application/pdf'});
            const decryptedBlobUrl = URL.createObjectURL(decryptedBlob);

            const pdfContainer = document.getElementById(`my-pdf-${doc.id_documento}`);
            pdfContainer.innerHTML = '';
            PDFObject.embed(decryptedBlobUrl, `#my-pdf-${doc.id_documento}`);


            let hash;
            hash = await generateHash(decryptedArrayBuffer);
            console.log('Hash del pdf desencriptado: ', hash);

            const publicKey64 = await getPublicKeyByIdUsuario(firma.id_usuario);
            let resVerify;
            resVerify = await verifySignature(hash, firma.firma64, publicKey64);
            console.log('correo:', firma.usuario_email, 'id_usu:', firma.id_usuario, 'firma', firma.firma64, 'clave publica de usu', firma.id_usuario, publicKey64);
            console.log('resVerify doc cifrado:', resVerify);

            // Inside the loop where you create the firmaDiv:
            const firmaDiv = document.createElement('div');
            firmaDiv.classList.add('firmaDiv');

            firmaDiv.textContent = `Correo: ${firma.usuario_email} - Verificada: ${resVerify} - Firma: ${firma.firma64}`;

            // Tooltip container
            const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip'); // Add a class for styling
            tooltip.textContent = `Correo: ${firma.usuario_email} - Verificada: ${resVerify} - Firma: ${firma.firma64} `; // Set full signature content
            tooltip.style.display = 'none'; // Hide by default

            // Append tooltip to the firmaDiv
            firmaDiv.appendChild(tooltip);

            // Event listeners for hover (mouseenter and mouseleave)
            firmaDiv.addEventListener('mouseenter', () => {
                tooltip.style.display = 'block'; // Show tooltip on hover
            });

            firmaDiv.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none'; // Hide tooltip on mouseleave
            });

            card.appendChild(firmaDiv);
        };

        reader.readAsText(file); // Leer el archivo como texto
    });

    // Simular un click en el input para abrir el selector de archivos
    fileInput.click();
}

async function getDocs() {

    const myData = await getMyData();
    const response = await fetch('/api/docs');
    const data = await response.json();

    const documentsContainer = document.getElementById('documents-container');

    // Iterar sobre los tipos de documentos (tipo1, tipo2, tipo3)
    for (const tipo in data) {
        const docs = data[tipo];
        console.log('docs in for', docs);

        if (docs.length > 0) {
            // extraer el tipo:
            console.log('tipo:', tipo);

            // Crear un contenedor para este tipo de documento
            const typeContainer = document.createElement('div');
            typeContainer.classList.add('document-type-container');

            // Agregar un título para el tipo de documento
            const typeTitle = document.createElement('h2');
            typeTitle.textContent = `Documentos Tipo ${tipo.slice(-1)}`; // Extraer el número del tipo
            typeContainer.appendChild(typeTitle);

            // Crear una sección para las tarjetas de este tipo
            const cardsSection = document.createElement('section');
            cardsSection.classList.add('document-section');
            typeContainer.appendChild(cardsSection);

            documentsContainer.appendChild(typeContainer);

            // Iterar sobre los documentos de este tipo
            for (const doc of docs) {
                const card = document.createElement('div');
                card.classList.add('document-card');

                const pdfContainer = document.createElement('div');
                pdfContainer.id = `my-pdf-${doc.id_documento}`;
                pdfContainer.classList.add('pdf-viewer');
                card.appendChild(pdfContainer);


                card.innerHTML += `
                    <h3>ID ${doc.id_documento}</h3>
                    <p><a href="${doc.url}">Enlace</a></p>
                `;

                if (tipo === 'tipo1') {
                    if (doc.status_personal == 0) {
                        card.style.backgroundColor = 'lightcoral';
                    }
                } else {
                    card.style.backgroundColor = 'lightblue';
                }


                cardsSection.appendChild(card);

                // Cargar y mostrar el PDF
                console.log('doc.url', doc.url);
                const pdfResponse = await fetch(doc.url);
                const pdfData = await pdfResponse.json();

                let pdfBlob;
                let blobUrl;

                if (tipo === 'tipo1' || tipo === 'tipo2') {
                    pdfBlob = new Blob([Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0))], {type: 'application/pdf'});
                    blobUrl = URL.createObjectURL(pdfBlob);
                }

                let myPassword64;
                let arrayBufferDec;
                let iv;
                if (tipo === "tipo3") {


                    // el pdf en base 64 fue cifrado y guardado en base 64
                    // se debe descifrar y mostrar
                    arrayBufferDec = Uint8Array.from(atob(pdfData.pdf.data), c => c.charCodeAt(0));
                    iv = Uint8Array.from(atob(pdfData.pdf.iv), c => c.charCodeAt(0));



                    // en pdfData.arr_correos hay un arreglo con el correo de cada usuario y la contraseña cifrafa con la clave publica de cada usuario
                    // se debe buscar el correo del usuario actual y descifrar la contraseña con su clave privada

                    const myEmail = myData.data.email;

                    myPassword64 = pdfData.arr_correos.find(c => c.email === myEmail).encryptedKeyBase64;
                    console.log('password', myPassword64);


                    const myPublicRSAKey = myData.data.rsaAOAEPpublicKey;
                    console.log('myPublicRSAKey', myPublicRSAKey);

                    // abir el archivo tipo json con un filechooser en donde este la clave privada
                    // leer el archivo y obtener la clave privada


                }

                PDFObject.embed(blobUrl, `#my-pdf-${doc.id_documento}`);


                //


                let pdfBuffer;
                let arrayBuffer;
                let hash;

                if (tipo === 'tipo1' || tipo === 'tipo2') {
                    pdfBuffer = Uint8Array.from(atob(pdfData.pdf), c => c.charCodeAt(0));
                    arrayBuffer = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);
                    hash = await generateHash(arrayBuffer);
                    console.log('Hash del pdf: ', hash);

                }


                // añadir el boton para firmar


                let signButton;
                signButton = document.createElement('button');
                if (tipo === 'tipo1' || tipo === 'tipo2') {
                    signButton.textContent = 'Firmar';
                    signButton.addEventListener('click', () => {
                        firmarDocumento(doc.id_documento, card, hash);
                    });
                }

                if (tipo === 'tipo3') {
                    signButton.textContent = 'Descifrar';
                    signButton.addEventListener('click', async () => {
                        await descifrar(myPassword64, arrayBufferDec, doc, iv, firmas[0], card);
                    });
                }

                if (tipo === 'tipo1') {
                    if (doc.status_personal === 1) {
                        signButton.disabled = true;
                    }
                }

                if (tipo === 'tipo2') {
                    signButton.style.display = 'none';
                }
                card.appendChild(signButton);


                // ver quienes han firmado el documento
                const firmas = pdfData.firmas;
                console.log('firmas del documento: id_doc', doc.id_documento);
                for (const firma of firmas) {
                    if (firma.usuario_email === myData.data.email) {
                        card.style.backgroundColor = 'lightgreen';
                        if (tipo === 'tipo1')
                            signButton.disabled = true;
                    }
                    const publicKey64 = await getPublicKeyByIdUsuario(firma.id_usuario);
                    let resVerify;
                    if(tipo === 'tipo1' || tipo === 'tipo2') {
                        resVerify = await verifySignature(hash, firma.firma64, publicKey64);
                        console.log('correo:', firma.usuario_email, 'id_usu:', firma.id_usuario, 'firma', firma.firma64, 'clave publica de usu', firma.id_usuario, publicKey64);
                        console.log('resVerify:', resVerify);
                    }

                    // Inside the loop where you create the firmaDiv:
                    const firmaDiv = document.createElement('div');
                    firmaDiv.classList.add('firmaDiv');
                    if (tipo === 'tipo1') {
                        firmaDiv.textContent = `Correo: ${firma.usuario_email} - Verificada: ${resVerify} - Firma: ${firma.firma64}`;
                    } else if (tipo === 'tipo2') {
                        firmaDiv.textContent = `remitente: ${firma.usuario_email} - Verificada: ${resVerify} - Firma: ${firma.firma64}`;
                    }

                    if(tipo === 'tipo1' || tipo === 'tipo2') {
                        // Tooltip container
                        const tooltip = document.createElement('div');
                        tooltip.classList.add('tooltip'); // Add a class for styling
                        tooltip.textContent = `Correo: ${firma.usuario_email} - Verificada: ${resVerify} - Firma: ${firma.firma64} `; // Set full signature content
                        tooltip.style.display = 'none'; // Hide by default

                        // Append tooltip to the firmaDiv
                        firmaDiv.appendChild(tooltip);

                        // Event listeners for hover (mouseenter and mouseleave)
                        firmaDiv.addEventListener('mouseenter', () => {
                            tooltip.style.display = 'block'; // Show tooltip on hover
                        });

                        firmaDiv.addEventListener('mouseleave', () => {
                            tooltip.style.display = 'none'; // Hide tooltip on mouseleave
                        });
                    }

                    card.appendChild(firmaDiv);

                }

                // card.appendChild(signButton);


            }


        }
    }
}

async function getMyData() {
    const response = await fetch('/api/sessionData');
    const data = await response.json();
    console.log('sessionData', data);
    return data;
}

async function generateHash(arrayBuffer) {
    // Generar el hash
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convertir el hash a un array de bytes

    // Convertir el hash a una cadena hexadecimal
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

async function verifySignature(hash, firma64, publicKey64) {

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


async function firmarDocumento(idDocumento, card, hash) {
    // Crear un input de tipo file
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    // Obtener el hash del PDF
    console.log('Hash del pdf: ', hash);

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
                console.log('Doc sign response', data);
                card.style.backgroundColor = 'lightgreen';
            }
            location.reload();
        };

        reader.readAsText(file); // Leer el archivo como texto
    });

    // Simular un click en el input para abrir el selector de archivos
    fileInput.click();


}

function hexStringToArrayBuffer(hexString) {
    const byteArray = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return byteArray.buffer;
}

async function getPublicKeyByIdUsuario(idUsuario) {
    try {
        const response = await fetch("/api/getFirmaByIdUsu", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idUsuario: idUsuario
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const idUsu = await response.json();
        return idUsu;
    } catch (error) {
        console.error("Error al obtener la lista de correos:", error);
        return [];
    }
}


getDocs();