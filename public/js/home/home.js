// alert('ola mundo');

async function displayUserName() {
    const myData = await getMyData();
    console.log('respuesta: ', myData.data);
    const nomP = document.getElementById("nombrecito");
    nomP.innerHTML = myData.data.email;
}

async function getMyData() {
    const response = await fetch('/api/sessionData');
    const data = await response.json();
    console.log('sessionData', data);
    return data;
}

// Call the async function to start the process
displayUserName();

function logout() {
    window.location.href = '/';
}