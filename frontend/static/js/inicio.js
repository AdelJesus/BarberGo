document.addEventListener("DOMContentLoaded", function () {
    // Menú de navegación responsive
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const links = document.querySelectorAll(".nav-links a");

    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("active");
    });

    links.forEach(link => {
        link.addEventListener("click", function () {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove("active");
            }
        });
    });

    // Manejar clics en los servicios
    const servicioLinks = document.querySelectorAll(".carousel a");

    servicioLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const tipoServicio = new URL(this.href, window.location.href).searchParams.get("tipo");

            if (tipoServicio) {
                window.location.href = `servicios.html?tipo=${tipoServicio}`;
            } else {
                console.error("No se pudo determinar el tipo de servicio.");
            }
        });
    });

    // Perfil y menú flotante
    const perfilBtnNav = document.getElementById("perfilBtn");
    const menuFlotante = document.getElementById("menuFlotante");
    const btnVerPerfil = document.getElementById("btnVerPerfil");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");

    const modal = document.getElementById("modalPerfil");
    const cerrarModalBtn = document.getElementById("cerrarModal");
    const editarPerfilBtn = document.getElementById("editarPerfilBtn");
    const guardarPerfilBtn = document.getElementById("guardarPerfilBtn");


    // Mostrar nombre del cliente
    fetch("/get_cliente")
        .then(response => response.json())
        .then(data => {
            if (data.nombre) {
                document.getElementById("nombreCliente").textContent = data.nombre;
            }
        })
        .catch(error => console.error("Error al obtener cliente:", error));

    perfilBtn.addEventListener("click", function (event) {
        event.stopPropagation(); 
        menuFlotante.classList.toggle("activo");
    });

    document.addEventListener("click", function (event) {
        if (!menuFlotante.contains(event.target) && event.target !== perfilBtn) {
            menuFlotante.classList.remove("activo");
        }
    });

    // nuevo Botón de Login/Registro
    const loginRegisterButton = document.createElement("li");
    const loginRegisterLink = document.createElement("a");
    loginRegisterLink.href = "/loguear";
    loginRegisterLink.textContent = "Iniciar Sesion";
    loginRegisterButton.appendChild(loginRegisterLink);

    const navLinksList = document.querySelector(".nav-links");

    // Función para actualizar la interfaz según el estado de login
    function actualizarInterfaz(estaLogueado) {
        if (perfilBtnNav) {
            perfilBtnNav.style.display = estaLogueado ? "block" : "none";
        }
        // Eliminar el botón de login/registro si ya existe
        const existingLoginRegister = navLinksList.querySelector('li a[href="/"]')?.parentNode;
        if (estaLogueado && existingLoginRegister) {
            existingLoginRegister.remove();
        } else if (!estaLogueado && !existingLoginRegister) {
            navLinksList.appendChild(loginRegisterButton);
        }
        // Ocultar el menú flotante si el usuario no está logueado
        if (!estaLogueado && menuFlotante) {
            menuFlotante.classList.remove("activo");
        }
    }

    // Verificar el estado de la sesión al cargar la página
    fetch('/check_session')
        .then(response => response.json())
        .then(data => {
            actualizarInterfaz(data.esta_logueado);
            const nombreClienteElement = document.getElementById("nombreCliente");
            console.log("Elemento nombreCliente:", nombreClienteElement);
            if (data.esta_logueado && data.nombre) {
                console.log(data.nombre);
            } else if (!data.esta_logueado) {
                console.log("nada");
            }
        })
        .catch(error => {
            console.error("Error al verificar la sesión:", error);
            actualizarInterfaz(false);
        });

    // Boton de información del perfil
    if (btnVerPerfil) {
        btnVerPerfil.addEventListener("click", function () {
            fetch("/get_cliente")
                .then(response => response.json())
                .then(data => {
                    document.getElementById("nombre").value = data.nombre;
                    document.getElementById("apellido").value = data.apellido;
                    document.getElementById("correo").value = data.correo;

                    document.getElementById("nombre").disabled = true;
                    document.getElementById("apellido").disabled = true;
                    document.getElementById("correo").disabled = true;

                    editarPerfilBtn.style.display = "inline-block";
                    guardarPerfilBtn.style.display = "none";
                })
                .catch(error => {
                    console.error("Error al obtener cliente:", error);
                    alert("Debes iniciar sesión para ver tu perfil.");
                });
            modalPerfil.style.display = "flex";
        });
    }

    // Cerrar perfil
    cerrarModalBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Cerrar perfil(fuera del formulario)
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Habilitar edicion del perfil
    editarPerfilBtn.addEventListener("click", function () {
        document.getElementById("nombre").disabled = false;
        document.getElementById("apellido").disabled = false;
        document.getElementById("correo").disabled = false;
        editarPerfilBtn.style.display = "none";
        guardarPerfilBtn.style.display = "inline-block";
    });

    // Guardar cambios en el perfil
    document.getElementById("formPerfil").addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const correo = document.getElementById("correo").value.trim();

        if (!correo.value.includes("@")) {
            mensajePerfil.textContent = "El correo esta mal escrito.";
            mensajePerfil.style.color = "red";
            return;
        }

        const respuesta = await fetch("/actualizar_perfil_cliente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, apellido, correo })
        });

        if (respuesta.ok) {
            modal.style.display = "none";
        }
    });

    // Ver historial
    const modalHistorial = document.getElementById("modalHistorial");
    const btnHistorial = document.getElementById("btnHistorial");
    const tablaHistorial = document.getElementById("tablaHistorial").getElementsByTagName('tbody')[0];
    const cerrarModalHistorial = document.getElementById("cerrarModalHistorial");

    btnHistorial.addEventListener("click", () => {
        modalHistorial.style.display = "flex";
        cargarHistorial();
    });

    cerrarModalHistorial.addEventListener("click", () => {
        modalHistorial.style.display = "none";
    });

    window.addEventListener("click", (event) => {
        if (event.target === modalHistorial) {
            modalHistorial.style.display = "none";
        }
    });

    function cargarHistorial() {
        fetch("/historial_cliente")
            .then(response => response.json())
            .then(data => mostrarHistorial(data))
            .catch(error => console.error("Error al cargar el historial:", error));
    }

    function mostrarHistorial(historial) {
        while (tablaHistorial.firstChild) {
            tablaHistorial.removeChild(tablaHistorial.firstChild);
        }
    
        if (historial && historial.length > 0) {
            historial.forEach(cita => {
                let fila = document.createElement("tr");
    
                let celdaBarbero = document.createElement("td");
                celdaBarbero.textContent = cita.barbero;
    
                let celdaServicio = document.createElement("td");
                celdaServicio.textContent = cita.servicio;
    
                let celdaFecha = document.createElement("td");
                const fecha = new Date(cita.fecha);
                fecha.setDate(fecha.getDate() + 1);
                celdaFecha.textContent = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    
                let celdaHora = document.createElement("td");
                const hora = new Date(`1970-01-01T${cita.hora}`);
                celdaHora.textContent = hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
                let celdaEstado = document.createElement("td");
                celdaEstado.textContent = cita.estado;
    
                fila.appendChild(celdaBarbero);
                fila.appendChild(celdaServicio);
                fila.appendChild(celdaFecha);
                fila.appendChild(celdaHora);
                fila.appendChild(celdaEstado);
                tablaHistorial.appendChild(fila);
            });
        } else {
            let fila = document.createElement("tr");
            let celda = document.createElement("td");
            celda.colSpan = 5;
            celda.textContent = "No hay historial de citas disponible.";
            celda.style.textAlign = "center";
    
            fila.appendChild(celda);
            tablaHistorial.appendChild(fila);
        }
    }

    const tablaBarberosBody = document.querySelector('#tablaBarberos tbody');
    async function cargarBarberos() {
        try {
            const responseBarberos = await fetch('/barberos_inicio');
            const dataBarberos = await responseBarberos.json();

            if (responseBarberos.ok && dataBarberos) {
                for (const barbero of dataBarberos) {
                    const row = tablaBarberosBody.insertRow();
                    const nombreCell = row.insertCell();
                    const apellidoCell = row.insertCell();
                    const calificacionCell = row.insertCell();
                    const accionesCell = row.insertCell();

                    nombreCell.textContent = barbero.nombre;
                    apellidoCell.textContent = barbero.apellido;

                    // Obtener y mostrar la calificación promedio del barbero
                    const promedioData = await obtenerPromedioCalificacionBarbero(barbero.id);
                    console.log('Promedio Data para el barbero', barbero.id, ':', promedioData, typeof promedioData);

                    const promedioNumerico = parseFloat(promedioData);

                    if (typeof promedioNumerico === 'number' && !isNaN(promedioNumerico)) {
                        calificacionCell.textContent = `${promedioNumerico.toFixed(1)} / 5`;
                    } else {
                        calificacionCell.textContent = 'Sin calificaciones';
                    }

                    // Crear botones de Comentarios y Calificar
                    const comentariosBtn = document.createElement('button');
                    comentariosBtn.textContent = 'Comentarios';
                    comentariosBtn.addEventListener('click', () => mostrarComentariosBarbero(barbero.id));

                    const calificarBtn = document.createElement('button');
                    calificarBtn.textContent = 'Calificar';
                    calificarBtn.addEventListener('click', () => mostrarFormularioCalificacionBarbero(barbero.id));

                    accionesCell.appendChild(comentariosBtn);
                    accionesCell.appendChild(calificarBtn);
                }
            } else {
                tablaBarberosBody.innerHTML = '<tr><td colspan="4">No se pudieron cargar los barberos.</td></tr>';
            }
        } catch (error) {
            console.error('Error al cargar los barberos:', error);
            tablaBarberosBody.innerHTML = '<tr><td colspan="4">Error al cargar los barberos.</td></tr>';
        }
    }

    // Función para obtener el promedio de calificación de un barbero
    async function obtenerPromedioCalificacionBarbero(barberoId) {
        try {
            const response = await fetch(`/obtener_promedio_calificacion_barbero/${barberoId}`);
            const data = await response.json();
            return data.promedio;
        } catch (error) {
            console.error(`Error al obtener el promedio para el barbero ${barberoId}:`, error);
            return null;
        }
    }

    // Función para mostrar el formulario de calificación de un barbero
    function mostrarFormularioCalificacionBarbero(barberoId) {
        console.log('mostrarFormularioCalificacionBarbero llamado para el barbero ID:', barberoId);
        let modalExistente = document.querySelector('.modal-calificacion');
        if (modalExistente) {
            modalExistente.remove();
        }

        const modal = document.createElement('div');
        modal.classList.add('modal-calificacion');
        modal.innerHTML = `
            <div class="modal-contenido">
                <span class="cerrar-modal">&times;</span>
                <h3>Calificar Barbero</h3>
                <label for="puntuacion">Puntuación (1-5):</label>
                <input type="number" id="puntuacion" min="1" max="5"><br><br>
                <label for="comentario">Comentario (opcional):</label><br>
                <textarea id="comentario"></textarea><br><br>
                <button id="enviarCalificacionBarbero">Enviar Calificación</button>
            </div>
        `;
        document.body.appendChild(modal);

        const cerrarModal = modal.querySelector('.cerrar-modal');
        cerrarModal.addEventListener('click', () => modal.remove());

        const enviarCalificacionBtn = modal.querySelector('#enviarCalificacionBarbero');
        enviarCalificacionBtn.addEventListener('click', () => enviarCalificacionBarbero(barberoId, modal));
    }

    async function enviarCalificacionBarbero(barberoId, modal) {
        const puntuacionInput = modal.querySelector('#puntuacion');
        const comentarioInput = modal.querySelector('#comentario');
        const puntuacion = puntuacionInput.value;
        const comentario = comentarioInput.value;

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            alert('Por favor, ingrese una puntuación entre 1 y 5.');
            return;
        }

        try {
            const response = await fetch('/calificar_barbero', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ barbero_id: barberoId, puntuacion: parseInt(puntuacion), comentario: comentario })
            });

            if (response.ok) {
                alert('Gracias por tu calificación!');
                modal.remove();
                cargarBarberos();
            } else {
                const data = await response.json();
                alert(`Error al calificar: ${data.error || 'Ocurrió un error'}`);
            }
        } catch (error) {
            console.error('Error al enviar la calificación del barbero:', error);
            alert('Error al enviar la calificación.');
        }
    }

    async function mostrarComentariosBarbero(barberoId) {
        console.log('mostrarComentariosBarbero llamado para el barbero ID:', barberoId);
        let modalExistente = document.querySelector('.modal-comentarios');
        if (modalExistente) {
            modalExistente.remove();
        }

        try {
            const response = await fetch(`/obtener_comentarios_barbero/${barberoId}`);
            const data = await response.json();

            const modalComentarios = document.createElement('div');
            modalComentarios.classList.add('modal-comentarios');
            modalComentarios.innerHTML = `
                <div class="modal-contenido">
                    <span class="cerrar-modal">&times;</span>
                    <h3>Comentarios del Barbero</h3>
                    <div class="lista-comentarios">
                        ${data.length > 0 ? data.map(opinion => `
                            <div class="comentario">
                                <p>Puntuación: ${opinion.puntuacion} / 5</p>
                                <p>${opinion.comentario || 'Sin comentario'}</p>
                                <p class="fecha">${new Date(opinion.fecha).toLocaleDateString()} ${new Date(opinion.fecha).toLocaleTimeString()}</p>
                            </div>
                        `).join('') : '<p>No hay comentarios para este barbero aún.</p>'}
                    </div>
                </div>
            `;
            document.body.appendChild(modalComentarios);

            const cerrarModal = modalComentarios.querySelector('.cerrar-modal');
            cerrarModal.addEventListener('click', () => modalComentarios.remove());

        } catch (error) {
            console.error('Error al obtener los comentarios del barbero:', error);
            alert('Error al obtener los comentarios.');
        }
    }
    cargarBarberos();

    const btnNotificaciones = document.getElementById("btnNotificaciones");
    const modalNotificacionesCliente = document.createElement("div");
    modalNotificacionesCliente.id = "modalNotificacionesCliente";
    modalNotificacionesCliente.classList.add("modal-c");
    modalNotificacionesCliente.innerHTML = `
        <div class="modal-cd">
            <span id="cerrarModalNotificacionesCliente" class="cerrar">×</span>
            <h2>Notificaciones</h2>
            <div class="notificaciones-container">
                <ul id="listaNotificacionesCliente">
                    </ul>
                <p id="mensajeSinNotificacionesCliente" style="display:none;">No tienes notificaciones.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modalNotificacionesCliente);

    const listaNotificacionesCliente = document.getElementById("listaNotificacionesCliente");
    const cerrarModalNotificacionesCliente = document.getElementById("cerrarModalNotificacionesCliente");
    const mensajeSinNotificacionesCliente = document.getElementById("mensajeSinNotificacionesCliente");

    // Función para obtener las notificaciones del cliente
    async function obtenerNotificacionesCliente() {
        try {
            const respuesta = await fetch("/get_notificaciones_cliente");
            const data = await respuesta.json();
            if (respuesta.ok) {
                return data;
            } else {
                console.error("Error al obtener notificaciones del cliente:", data.error);
                return [];
            }
        } catch (error) {
            console.error("Error de conexión al obtener notificaciones del cliente:", error);
            return [];
        }
    }

    // Función para mostrar las notificaciones del cliente en el modal
    async function mostrarNotificacionesCliente() {
        listaNotificacionesCliente.innerHTML = "";
        const notificaciones = await obtenerNotificacionesCliente();

        if (notificaciones.length === 0) {
            mensajeSinNotificacionesCliente.style.display = "block";
        } else {
            mensajeSinNotificacionesCliente.style.display = "none";
            notificaciones.forEach(notificacion => {
                const fecha = new Date(notificacion.fecha);
                const li = document.createElement("li");
                li.innerHTML = `${notificacion.mensaje}`;
                listaNotificacionesCliente.appendChild(li);
            });
        }

        modalNotificacionesCliente.style.display = "flex";
    }

    // Función para formatear la fecha de la notificación
    function formatearFechaNotificacion(fecha) {
        const opciones = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return fecha.toLocaleDateString('es-CO', opciones);
    }

    // Event listener para el botón de notificaciones
    if (btnNotificaciones) {
        btnNotificaciones.addEventListener("click", mostrarNotificacionesCliente);
    }

    // Event listener para cerrar el modal de notificaciones
    cerrarModalNotificacionesCliente.addEventListener("click", () => {
        modalNotificacionesCliente.style.display = "none";
    });

    // Cerrar el modal de notificaciones si se hace clic fuera de él
    window.addEventListener("click", (event) => {
        if (event.target === modalNotificacionesCliente) {
            modalNotificacionesCliente.style.display = "none";
        }
    });

    // Cerrar sesion
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", function () {
            fetch("/logout")
                .then(response => {
                    if (response.ok) {
                        actualizarInterfaz(false);
                    } else {
                        console.error("Error al cerrar sesión:", response.status);
                    }
                })
                .catch(error => console.error("Error al cerrar sesión:", error));
        });
    }
});
