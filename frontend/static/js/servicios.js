document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const tipoServicioPrincipal = params.get("tipo");
    const titulo = document.getElementById("titulo-servicio");
    
    if (tipoServicioPrincipal) {
        titulo.textContent = `Servicios de ${tipoServicioPrincipal.replace('_', ' ')}`;
    
        // Mostrar/Ocultar Servicios basados en el tipo principal
        document.querySelectorAll(".servicio").forEach(servicio => {
            const tipoSubservicio = servicio.getAttribute("data-tipo").split('_')[0];
            if (tipoSubservicio !== tipoServicioPrincipal) {
                servicio.style.display = "none";
            } else {
                servicio.style.display = "block";
            }
        });
    
        // Mostrar/Ocultar Galerías basadas en el tipo principal
        document.querySelectorAll(".galeria").forEach(galeria => {
            const tipoPrincipalGaleria = galeria.getAttribute("data-tipo-galeria");
            if (tipoPrincipalGaleria == tipoServicioPrincipal) {
                galeria.style.display = "block";
            } else {
                galeria.style.display = "none";
            }
        });
    
    } else {
        titulo.textContent = "Servicio no encontrado";
        document.querySelectorAll(".servicio").forEach(servicio => servicio.style.display = "none");
        document.querySelectorAll(".galeria").forEach(galeria => galeria.style.display = "none");
        console.log("Servicio no encontrado en la URL");
    }

    fetch("/obtener_servicios")
        .then(response => response.json())
        .then(servicios => {
            servicios.forEach((servicio, index) => {
                let nombreId, duracionId, precioId, frecuenteId, calificacionId, comentarioBtnId, calificarBtn;

                if (index === 0) {
                    nombreId = "nameCabello";
                    duracionId = "duracionCabello";
                    precioId = "precioCabello";
                    frecuenteId = "frecuenteCabello";
                    calificacionId = "calificacionCabello";
                    comentarioBtnId = "comentarioCabello";
                } else if (index === 1) {
                    nombreId = "nameNiño";
                    duracionId = "duracionNiño";
                    precioId = "precioNiño";
                    frecuenteId = "frecuenteNiño";
                    calificacionId = "calificacionNiño";
                    comentarioBtnId = "comentarioNiño";
                } else if (index === 2) {
                    nombreId = "nameAfeitado";
                    duracionId = "duracionAfeitado";
                    precioId = "precioAfeitado";
                    frecuenteId = "frecuenteAfeitado";
                    calificacionId = "calificacionAfeitado";
                    comentarioBtnId = "comentarioAfeitado";
                } else if (index === 3) {
                    nombreId = "nameArreglo";
                    duracionId = "duracionArreglo";
                    precioId = "precioArreglo";
                    frecuenteId = "frecuenteArreglo";
                    calificacionId = "calificacionArreglo";
                    comentarioBtnId = "comentarioArreglo";
                }

                const servicioElement = document.querySelectorAll(".servicio")[index];
                calificarBtn = servicioElement.querySelector(".calificar");
                const servicioId = servicio.id;

                // Evento para mostrar el formulario de calificación
                if (calificarBtn) {
                    calificarBtn.addEventListener("click", async () => {
                        const estaLogueado = await verificarSesion();

                        if (estaLogueado) {
                            mostrarFormularioCalificacion(servicioId);
                        } else {
                            window.location.href = "/loguear";
                        }
                    });
                }

                // Mostrar promedio de calificación
                if (document.getElementById(calificacionId)) {
                    cargarPromedioCalificacion(servicioId, calificacionId);
                }

                // Evento para mostrar los comentarios
                const comentariosBtn = document.getElementById(comentarioBtnId);
                if (comentariosBtn) {
                    comentariosBtn.addEventListener("click", () => mostrarComentarios(servicioId));
                }

                if (document.getElementById(nombreId)) {
                    document.getElementById(nombreId).textContent = servicio.nombre;
                }
                if (document.getElementById(duracionId)) {
                    document.getElementById(duracionId).textContent = "Duracion: " + servicio.duracion;
                }
                if (document.getElementById(precioId)) {
                    document.getElementById(precioId).innerHTML = "Precio: $" + servicio.precio;
                }
                if (document.getElementById(frecuenteId)) {
                    document.getElementById(frecuenteId).innerHTML = "Precio para cliente frecuente: $" + servicio.frecuente;
                }
                const botonesAgendar = document.querySelectorAll(".agendar-servicio");
                botonesAgendar[index].dataset.servicioId = servicio.id;
            });
        })
        .catch(error => console.error("Error al obtener servicios:", error));

    const botonesAgendar = document.querySelectorAll(".agendar-servicio");
    botonesAgendar.forEach(boton => {
        boton.addEventListener("click", async function () {
            const servicioId = boton.dataset.servicioId;
            const estaLogueado = await verificarSesion();

            if (estaLogueado) {
                window.location.href = `reservar.html?servicioId=${servicioId}`;
            } else {
                window.location.href = "/loguear";
            }
        });
    });

    // Función para verificar si el usuario está logueado
    async function verificarSesion() {
        try {
            const response = await fetch("/check_session");
            const data = await response.json();
            return data.esta_logueado;
        } catch (error) {
            console.error("Error al verificar la sesión:", error);
            return false;
        }
    }

    // Función para cargar y mostrar el promedio de calificación
    async function cargarPromedioCalificacion(servicioId, elementoId) {
        console.log(`Cargando promedio para servicio ${servicioId} en elemento ${elementoId}`);
        try {
            const response = await fetch(`/obtener_promedio_calificacion_servicio/${servicioId}`);
            const data = await response.json();
            if (response.ok && data.promedio !== null) {
                const promedioNumerico = parseFloat(data.promedio);
                if (typeof promedioNumerico === 'number' && !isNaN(promedioNumerico)) {
                    document.getElementById(elementoId).textContent = `Calificación promedio: ${promedioNumerico.toFixed(1)} / 5`;
                } else {
                    document.getElementById(elementoId).textContent = "Sin calificaciones aún";
                }
            } else {
                document.getElementById(elementoId).textContent = "Sin calificaciones aún";
            }
        } catch (error) {
            console.error("Error al cargar el promedio de calificación:", error);
            document.getElementById(elementoId).textContent = "Error al cargar calificación";
        }
    }

    // Función para mostrar el formulario de calificación
    async function mostrarFormularioCalificacion(servicioId) {
        const estaLogueado = await verificarSesion();

        if (estaLogueado) {
            const modal = document.createElement('div');
            modal.classList.add('modal-calificacion');
            modal.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">&times;</span>
                    <h3>Calificar Servicio</h3>
                    <label for="puntuacion">Puntuación (1-5):</label>
                    <input type="number" id="puntuacion" min="1" max="5"><br><br>
                    <label for="comentario">Comentario (opcional):</label><br>
                    <textarea id="comentario"></textarea><br><br>
                    <button id="enviarCalificacion">Enviar Calificación</button>
                </div>
            `;
            document.body.appendChild(modal);

            const cerrarModal = modal.querySelector('.cerrar-modal');
            cerrarModal.addEventListener('click', () => modal.remove());

            const enviarCalificacionBtn = modal.querySelector('#enviarCalificacion');
            enviarCalificacionBtn.addEventListener('click', () => enviarCalificacion(servicioId, modal));
        } else {
            alert("Debes iniciar sesión para calificar un servicio.");
            window.location.href = "/loguear";
        }
    }

    // Función para enviar la calificación al backend
    async function enviarCalificacion(servicioId, modal) {
        const puntuacionInput = modal.querySelector('#puntuacion');
        const comentarioInput = modal.querySelector('#comentario');
        const puntuacion = puntuacionInput.value;
        const comentario = comentarioInput.value;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            alert('Por favor, ingrese una puntuación entre 1 y 5.');
            return;
        }

        try {
            const response = await fetch('/calificar_servicio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ servicio_id: servicioId, puntuacion: parseInt(puntuacion), comentario: comentario })
            });

            if (response.ok) {
                alert('Gracias por tu calificación!');
                modal.remove();
                const servicioIndex = Array.from(document.querySelectorAll('.servicio')).findIndex(serv => serv.querySelector('.calificar').previousElementSibling.textContent === 'Calificar');
                if (servicioIndex !== -1) {
                    let calificacionId;
                    if (servicioIndex === 0) calificacionId = "calificacionCabello";
                    else if (servicioIndex === 1) calificacionId = "calificacionNiño";
                    else if (servicioIndex === 2) calificacionId = "calificacionAfeitado";
                    else if (servicioIndex === 3) calificacionId = "calificacionArreglo";
                    if (calificacionId) {
                        cargarPromedioCalificacion(servicioId, calificacionId);
                    }
                }
            } else {
                const data = await response.json();
                alert(`Error al calificar: ${data.error || 'Ocurrió un error'}`);
            }
        } catch (error) {
            console.error('Error al enviar la calificación:', error);
            alert('Error al enviar la calificación.');
        }
    }

    // Función para mostrar los comentarios del servicio
    async function mostrarComentarios(servicioId) {
        try {
            const response = await fetch(`/obtener_comentarios_servicio/${servicioId}`);
            const data = await response.json();

            const modalComentarios = document.createElement('div');
            modalComentarios.classList.add('modal-comentarios');
            modalComentarios.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">&times;</span>
                    <h3>Comentarios del Servicio</h3>
                    <div class="lista-comentarios">
                        ${data.length > 0 ? data.map(opinion => `
                            <div class="comentario">
                                <p>Puntuación: ${opinion.puntuacion} / 5</p>
                                <p>${opinion.comentario || 'Sin comentario'}</p>
                                <p class="fecha">${new Date(opinion.fecha).toLocaleDateString()} ${new Date(opinion.fecha).toLocaleTimeString()}</p>
                            </div>
                        `).join('') : '<p>No hay comentarios para este servicio aún.</p>'}
                    </div>
                </div>
            `;
            document.body.appendChild(modalComentarios);

            const cerrarModal = modalComentarios.querySelector('.cerrar-modal');
            cerrarModal.addEventListener('click', () => modalComentarios.remove());

        } catch (error) {
            console.error('Error al obtener los comentarios:', error);
            alert('Error al obtener los comentarios.');
        }
    }
});