const bcrypt = require('bcrypt');


// Función para aplicar hashing a una contraseña
async function hashPassword(password) {
    console.log('entre a cipher');
    try {
        const saltRounds = 11;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('hashed pass local2: ' + hashedPassword);
        return hashedPassword;

    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
    }
}

// Función para comparar una contraseña con su versión hasheada
async function comparePassword(password, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (isMatch) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al comparar la contraseña:', error);
    }
}

module.exports = {
    hashPassword,
    comparePassword
};