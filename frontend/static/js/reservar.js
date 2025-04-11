document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const servicio_id = params.get("servicioId");

    // Establecer fecha mínima como hoy
    const fechaInput = document.getElementById("fecha");
    const hoy = new Date().toISOString().split("T")[0];
    fechaInput.min = hoy;

    // Verificar si se encontró el servicio
    if (!servicio_id) {
        window.location.href = "servicios.html";
        return;
    }

    const selectBarbero = document.getElementById("barbero");
    const mensajeElement = document.getElementById("mensaje");

    document.getElementById("botonconfirmar").addEventListener("click", function () {
        const fecha = document.getElementById("fecha").value;
        const hora = document.getElementById("hora").value;
        const barbero_id = document.getElementById("barbero").value;
    
        if (hora < "09:00" || hora > "21:00") {
            mensajeElement.textContent = "La hora debe estar entre 09:00 a.m y 9:00 p.m";
            return;
        }
    
        if (!fecha || !hora || !barbero_id || !servicio_id) {
            mensajeElement.textContent = "Por favor, complete todos los campos.";
            return;
        }
    
        fetch('/crear_cita', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fecha, hora, barbero_id, servicio_id }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    mensajeElement.textContent = data.error;
                } else {
                    mensajeElement.textContent = data.mensaje;
                    window.location.href = "/inicio.html";
                }
            })
            .catch(error => {
                mensajeElement.textContent = "Error al crear la cita. Inténtelo de nuevo.";
                console.error("Error al crear la cita:", error);
            });
    });

    fetch("/obtener_barberos")
        .then(response => response.json())
        .then(barberos => {
            barberos.forEach(barbero => {
                const option = document.createElement("option");
                option.value = barbero.id;
                option.textContent = barbero.nombre + " " + barbero.apellido;
                selectBarbero.appendChild(option);
            });
        })
        .catch(error => console.error("Error al obtener barberos:", error));
});