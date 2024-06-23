var formid = document.getElementById('formid');
formid.insertAdjacentHTML('beforeend', returnHTMLformid());

function returnHTMLformid() {
    return `
    <P>selecciona alguna opcion para crer el documento</P>
    `;
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
            formMemorandum();
            break;
        case 3:
            formMemorandumSecreto();
            break;
        default:
            break;
    }

}


async function formMinuta() {
    formid.innerHTML = `
    <form id="minuteForm">
      <label for="meetingTitle">Meeting Title:</label>
      <input type="text" id="meetingTitle" name="meetingTitle" required>
  
      <label for="attendees">Attendees:</label>
      <div id="selectedAttendees"></div>
      <select id="attendees" name="attendees" required>
        <option value="0">Select an attendee</option>
      </select>
      <button type="button" onclick="addAttendee()">Add Attendee</button>

      <label for="minutesContent">Minutes Content:</label>
      <textarea id="minutesContent" name="minutesContent" rows="10" required></textarea>
  
      <button type="submit" onclick="enviarMinuta()">Submit</button>
    </form>
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
        return emails;
    } catch (error) {
        console.error("Error al obtener la lista de correos:", error);
        return [];
    }
}




function formMemorandum(){
    formid.innerHTML = `
    <form id="memoForm">
      <label for="memoRecipient">Recipient:</label>
      <input type="text" id="memoRecipient" name="memoRecipient" required>
    
      <label for="memoSubject">Subject:</label>
      <input type="text" id="memoSubject" name="memoSubject" required>
    
      <label for="memoContent">Content:</label>
      <textarea id="memoContent" name="memoContent" rows="8" required></textarea>
    
      <button type="submit">Submit</button>
    </form>
    `;

}

function formMemorandumSecreto(){
    formid.innerHTML = `
    <form id="confidentialMemoForm">
      <label for="confidentialMemoRecipient">Recipient:</label>
      <input type="text" id="confidentialMemoRecipient" name="confidentialMemoRecipient" required>
    
      <label for="confidentialMemoAuthorizedViewers">Authorized Viewers (comma-separated):</label>
      <input type="text" id="confidentialMemoAuthorizedViewers" name="confidentialMemoAuthorizedViewers" required>
    
      <label for="confidentialMemoSubject">Subject:</label>
      <input type="text" id="confidentialMemoSubject" name="confidentialMemoSubject" required>
    
      <label for="confidentialMemoContent">Content:</label>
      <textarea id="confidentialMemoContent" name="confidentialMemoContent" rows="8" required></textarea>
    
      <button type="submit">Submit</button>
    </form>
    `;

}





