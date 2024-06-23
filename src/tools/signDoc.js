const forge = require('forge');


async function createDigitalSignature(pdfBuffer, privateKeyPem) {
    try {
        // 1. Generar el hash del PDF
        const md = forge.md.sha256.create();
        md.update(pdfBuffer);
        const pdfHash = md.digest().toHex();

        // 2. Cargar la clave privada RSA desde PEM
        const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

        // 3. Firmar el hash con la clave privada
        const signature = privateKey.sign(md);

        // 4. Codificar la firma en base64
        const base64Signature = forge.util.encode64(signature);

        return base64Signature;
    } catch (error) {
        console.error('Error al crear la firma digital:', error);
        throw error; // Propagar el error para manejarlo adecuadamente
    }
}

module.exports = {
    createDigitalSignature
};
