document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".content-section");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("active");
    });

    // Manejador de navegación entre secciones
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const sectionId = this.getAttribute("data-section");

            sections.forEach(section => {
                section.classList.remove("active");
            });

            document.getElementById(sectionId).classList.add("active");

            buttons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Mostrar los datos del barbero
    async function cargarPerfil() {
        const respuesta = await fetch("/mostrar_info");
        const datos = await respuesta.json();

        if (respuesta.ok) {
            document.getElementById("name-barbero").textContent = datos.nombre;
            document.getElementById("lastname-barbero").textContent = datos.apellido;
            document.getElementById("email-barbero").textContent = datos.correo;
        }
    }
    cargarPerfil();

    //Barberos
    async function cargarBarberos() {
        const respuesta = await fetch("/lista_barberos");
        const barberos = await respuesta.json();
        const tabla = document.getElementById("barberos-lista");
        tabla.innerHTML = "";

        barberos.forEach(barbero => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${barbero.nombre}</td>
                <td>${barbero.apellido}</td>
                <td>${barbero.correo}</td>
                <td><button class="eliminar-barbero" data-id="${barbero.id}">Eliminar</button></td>
            `;
            tabla.appendChild(fila);
        });

        // Botones de eliminar
        document.querySelectorAll(".eliminar-barbero").forEach(boton => {
            boton.addEventListener("click", async function () {
                const barberoId = this.getAttribute("data-id");
                eliminarBarber.textContent = "Eliminando barbero...";
                eliminarBarber.style.color = "orange";
                eliminarBarber.classList.remove("hidden");

                setTimeout(() => {
                    eliminarBarbero(barberoId);
                }, 2000);
            });
        });
    }
    
    // Eliminar un barbero
    const eliminarBarber = document.getElementById("mensaje-eliminar");
    async function eliminarBarbero(id) {
        const respuesta = await fetch(`/eliminar_barbero/${id}`, { method: "DELETE" });
        const resultado = await respuesta.json();

        eliminarBarber.textContent = resultado.mensaje;
        eliminarBarber.style.color = respuesta.ok ? "green" : "red";
        
        eliminarBarber.classList.remove("hidden");

        setTimeout(() => {
            eliminarBarber.classList.add("hidden");
        }, 2000);
        
        if (respuesta.ok) {
            cargarBarberos();
        }
    }
    cargarBarberos();

    // Registro de barbero
    const barberoForm = document.getElementById("barbero-form");
    const mensajeBarbero = document.getElementById("mensaje-barbero");
    if (barberoForm) {
        barberoForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const nombre = document.getElementById("nombre-barbero").value.trim();
            const apellido = document.getElementById("apellido-barbero").value.trim();
            const correo = document.getElementById("correo-barbero").value.trim();
            const password = document.getElementById("password-barbero").value.trim();

            if (!correo.includes("@")) {
                mensajeBarbero.textContent = "El correo esta mal escrito";
                mensajeBarbero.style.color = "red";
                mensajeBarbero.classList.remove("hidden");
                return;
            }

            const datos = { nombre, apellido, correo, password };

            const respuesta = await fetch("/registrar_barbero", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mensajeBarbero.textContent = "Barbero registrado correctamente.";
                mensajeBarbero.style.color = "green";
                barberoForm.reset();
                cargarBarberos();
            } else {
                mensajeBarbero.textContent = resultado.error;
                mensajeBarbero.style.color = "red";
            }

            mensajeBarbero.classList.remove("hidden");

            setTimeout(() => {
                mensajeBarbero.classList.add("hidden");
            }, 2000);
        });
    }

    // "Editar" en el perfil
    const guardarPerfilBtn = document.getElementById("editar-perfil");
    if (guardarPerfilBtn) {
        guardarPerfilBtn.addEventListener("click", async function () {
            const mensaje = document.getElementById("mensaje-perfil");
            const nombre = document.getElementById("nombre").value.trim();
            const apellido = document.getElementById("apellido").value.trim();
            const correo = document.getElementById("correo").value.trim();
            const password = document.getElementById("password").value.trim();

            mensaje.textContent = "";
            mensaje.style.color = "";

            if (!correo.includes("@")) {
                mensaje.textContent = "El correo esta mal escrito";
                mensaje.style.color = "red";
                return;
            }

            const datos = { nombre, apellido, correo, password };

            const respuesta = await fetch("/actualizar_perfil", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mensaje.textContent = "Perfil actualizado correctamente. Cerrando sesión..";
                mensaje.style.color = "green"
                setTimeout(() => {
                    window.location.href = "/logout";
                }, 1000);
            }
        });
    }

    // Mostrar el nombre del barbero
    fetch("/get_barbero")
        .then(response => response.json())
        .then(data => {
            if (data.nombre) {
                document.getElementById("barberoNombre").textContent = "Bienvenido, " + data.nombre;
            }
        });

    // enviar clientes a admin
    const tablaClientes = document.querySelector("#tabla-clientes tbody");
    const mensajeClientes = document.getElementById("mensaje-clientes");
    async function cargarClientes() {
        try {
            const respuesta = await fetch("/get_clientes");
            const clientes = await respuesta.json();

            if (respuesta.ok) {
                tablaClientes.innerHTML = "";

                if (clientes.length === 0) {
                    mensajeClientes.textContent = "No hay clientes registrados.";
                    return;
                }

                mensajeClientes.textContent = "";

                clientes.forEach(cliente => {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${cliente.nombre}</td>
                        <td>${cliente.apellido}</td>
                        <td>${cliente.correo}</td>
                    `;
                    tablaClientes.appendChild(fila);
                });
            } else {
                mensajeClientes.textContent = "Error al obtener clientes.";
            }
        } catch (error) {
            mensajeClientes.textContent = "Error de conexión con el servidor.";
        }
    }
    cargarClientes();

    // Botón de cerrar sesión
    document.getElementById("logoutBtn").addEventListener("click", function () {
        fetch("/logout")
            .then(() => {
                window.location.href = "/";
            });
    });

    //Cargar citas
    async function cargarCitasBarbero() {
        const respuesta = await fetch("/citas_barbero");
        const citas = await respuesta.json();
        const tablaCitas = document.querySelector("#citas table tbody");
        tablaCitas.innerHTML = "";
    
        if (respuesta.ok) {
            citas.forEach(cita => {
                const fila = document.createElement("tr");
                let estadoMostrar = cita.estado;
    
                // Formatear la fecha a DD/MM/YYYY
                const fecha = new Date(cita.fecha);
                const dia = fecha.getDate().toString().padStart(2, '0');
                const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
                const anio = fecha.getFullYear();
                const fechaFormateada = `${dia}/${mes}/${anio}`;
    
                // Formatear la hora a 12 horas
                const [horas, minutos] = cita.hora.split(":");
                const horas12 = horas % 12 || 12;
                const ampm = horas < 12 ? "AM" : "PM";
                const horaFormateada = `${horas12}:${minutos} ${ampm}`;
    
                if (cita.estado === "pendiente") {
                    estadoMostrar = `
                        <button class="accept" data-id="${cita.id}">✔</button>
                        <button class="decline" data-id="${cita.id}">✖</button>
                    `;
                } else if (cita.estado === "confirmada") {
                    estadoMostrar = "Confirmada";
                } else if (cita.estado === "cancelada") {
                    estadoMostrar = "Cancelada";
                }
    
                fila.innerHTML = `
                    <td>${cita.cliente}</td>
                    <td>${fechaFormateada}</td>
                    <td>${horaFormateada}</td>
                    <td>${estadoMostrar}</td>
                `;
                tablaCitas.appendChild(fila);
            });
        } else {
            alert("Error al cargar las citas.");
        }
    }
    cargarCitasBarbero();

    // eventos para los botones de aceptar y rechazar
    document.querySelector("#citas table tbody").addEventListener('click', async function(event) {
        if (event.target.classList.contains('accept') || event.target.classList.contains('decline')) {
            const citaId = event.target.dataset.id;
            let nuevoEstado;

            if (event.target.classList.contains('accept')) {
                nuevoEstado = 'confirmada';
            } else if (event.target.classList.contains('decline')) {
                nuevoEstado = 'cancelada';
            }

            if (citaId && nuevoEstado) {
                const respuesta = await fetch(`/actualizar_cita/${citaId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                });

                if (respuesta.ok) {
                    cargarCitasBarbero();
                } else {
                    const errorData = await respuesta.json();
                    alert(`Error al actualizar la cita: ${errorData.error || "Desconocido"}`);
                }
            }
        }
    });

    // Cargar calificación promedio y comentarios del barbero
    async function cargarCalificacionComentarios() {
        const respuesta = await fetch("/get_calificacion_comentarios_barbero");
        const datos = await respuesta.json();
        const calificacionPromedioSpan = document.getElementById("calificacion-promedio");
        const listaComentarios = document.getElementById("lista-comentarios-barbero");
        const mensajeSinComentarios = document.getElementById("mensaje-sin-comentarios");

        if (respuesta.ok) {
            if (datos.promedio_calificacion !== null) {
                calificacionPromedioSpan.textContent = datos.promedio_calificacion.toFixed(1) + " / 5";
            } else {
                calificacionPromedioSpan.textContent = "Sin calificaciones";
            }

            listaComentarios.innerHTML = "";
            if (datos.comentarios && datos.comentarios.length > 0) {
                mensajeSinComentarios.style.display = "none";
                datos.comentarios.forEach(comentario => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <p class="comentario-cliente">Cliente: ${comentario.nombre_cliente} ${comentario.apellido_cliente}</p>
                        <p class="comentario-texto">${comentario.texto}</p>
                        <p class="comentario-fecha">${new Date(comentario.fecha).toLocaleDateString()} - ${new Date(comentario.fecha).toLocaleTimeString()}</p>
                    `;
                    listaComentarios.appendChild(li);
                });
            } else {
                mensajeSinComentarios.style.display = "block";
            }
        } else {
            calificacionPromedioSpan.textContent = "Error al cargar";
            mensajeSinComentarios.style.display = "block";
            mensajeSinComentarios.textContent = "Error al cargar los comentarios.";
        }
    }

    cargarCalificacionComentarios();

    const notificacionesBtnBarbero = document.getElementById("notificacionesBtnBarbero");
    const notificacionesSection = document.getElementById("notificaciones");
    const listaNotificacionesBarbero = document.createElement("ul");
    notificacionesSection.appendChild(listaNotificacionesBarbero);

    // Función para obtener las notificaciones del barbero
    async function obtenerNotificacionesBarbero() {
        try {
            const respuesta = await fetch("/get_notificaciones_barbero");
            const data = await respuesta.json();
            if (respuesta.ok) {
                return data;
            } else {
                console.error("Error al obtener notificaciones del barbero:", data.error);
                return [];
            }
        } catch (error) {
            console.error("Error de conexión al obtener notificaciones del barbero:", error);
            return [];
        }
    }

    // Función para mostrar las notificaciones del barbero en la interfaz
    async function mostrarNotificacionesBarbero() {
        listaNotificacionesBarbero.innerHTML = "";
        const notificaciones = await obtenerNotificacionesBarbero();

        if (notificaciones.length === 0) {
            const li = document.createElement("li");
            li.textContent = "No hay notificaciones.";
            listaNotificacionesBarbero.appendChild(li);
            return;
        }

        notificaciones.forEach(notificacion => {
            const fecha = new Date(notificacion.fecha);
            const li = document.createElement("li");
            li.innerHTML = `${notificacion.mensaje}`;
            listaNotificacionesBarbero.appendChild(li);
        });

        // Mostrar la sección de notificaciones y ocultar las demás
        sections.forEach(section => section.classList.remove("active"));
        notificacionesSection.classList.add("active");
    }

    // Función para formatear la fecha de la notificación
    function formatearFechaNotificacion(fecha) {
        const opciones = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return fecha.toLocaleDateString('es-CO', opciones); 
    }

    // Event listener para el botón de notificaciones
    if (notificacionesBtnBarbero) {
        notificacionesBtnBarbero.addEventListener("click", mostrarNotificacionesBarbero);
    }
});

let chart;

function cargarDashboard() {
    fetch('/admin/estadisticas')
        .then(res => {
            if (!res.ok) {
                console.error(`Error al cargar el dashboard. Código de estado: ${res.status}`);
                return Promise.reject(`Error en la petición: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Datos recibidos del backend:", data);
            mostrarDatosGenerales(data);
            actualizarGraficoServicios(data.servicios_mas_solicitados);
            graficarValoracionesBarberos(data.valoraciones);
            graficarCitasPorDia(data.dias_mas_citas);
            graficarTopClientesReservas(data.top_clientes);
        })
        .catch(error => console.error("Error al cargar el dashboard:", error));
}

// Datos Generales
function mostrarDatosGenerales(data) {
    const cardsContainer = document.querySelector('#dashboard .cards-container');
    if (!cardsContainer) {
        console.error("Error: El elemento .cards-container no se encontró en el dashboard.");
        return;
    }
    cardsContainer.innerHTML = '';

    if (data && typeof data.total_clientes !== 'undefined' && typeof data.total_barberos !== 'undefined') {
        cardsContainer.appendChild(crearCard('Clientes Registrados', data.total_clientes, 'primary'));
        cardsContainer.appendChild(crearCard('Barberos Registrados', data.total_barberos, 'success'));
    } else {
        console.warn("Advertencia: Datos de total de clientes o barberos no encontrados.");
    }
}

function crearCard(titulo, valor, claseColor) {
    const card = document.createElement('div');
    card.className = `card ${claseColor} text-white p-3 m-2`;

    const h3 = document.createElement('h3');
    h3.textContent = titulo;

    const p = document.createElement('p');
    p.textContent = valor;

    card.appendChild(h3);
    card.appendChild(p);

    return card;
}

// Servicios Más Solicitados
function actualizarGraficoServicios(servicios) {
    const ctx = document.getElementById('graficoServicios');
    if (!ctx) {
        console.error("Error: El elemento canvas con ID 'graficoServicios' no se encontró.");
        return;
    }
    const nombres = servicios ? servicios.map(s => s.nombre) : [];
    const valores = servicios ? servicios.map(s => s.veces_solicitado) : [];

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: nombres,
            datasets: [{
                data: valores,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56',
                    '#4CAF50', '#FF9800', '#9C27B0'
                ],
            }]
        },
        options: {
            animation:false,
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Promedio de Valoración por Barbero
function graficarValoracionesBarberos(valoraciones) {
    const canvas = document.getElementById('graficoValoraciones');
    if (!canvas) {
        console.error("Error: El elemento canvas con ID 'graficoValoraciones' no se encontró.");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: valoraciones ? valoraciones.map(ob => ob.nombre) : [],
                datasets: [{
                    label: 'Promedio de valoración',
                    data: valoraciones ? valoraciones.map(ob => ob.promedio_valoracion) : [],
                    backgroundColor: '#4CAF50'
                }]
            }
        });
    } else {
        console.error("Error: No se pudo obtener el contexto del canvas 'graficoValoraciones'.");
    }
}

// Días con Más Citas
function graficarCitasPorDia(dias) {
    const canvas = document.getElementById('graficoDiasCitas');
    if (!canvas) {
        console.error("Error: El elemento canvas con ID 'graficoDiasCitas' no se encontró.");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dias ? dias.map(d => d.dia) : [],
                datasets: [{
                    label: 'Citas por día',
                    data: dias ? dias.map(d => d.cantidad) : [],
                    borderColor: '#FF6384',
                    fill: false
                }]
            }
        });
    } else {
        console.error("Error: No se pudo obtener el contexto del canvas 'graficoDiasCitas'.");
    }
}

// Top Clientes con Más Reservas
function graficarTopClientesReservas(clientes) {
    const canvas = document.getElementById('graficoTopClientes');
    if (!canvas) {
        console.error("Error: El elemento canvas con ID 'graficoTopClientes' no se encontró.");
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: clientes ? clientes.map(c => c.nombre) : [],
                datasets: [{
                    label: 'Reservas',
                    data: clientes ? clientes.map(c => c.reservas) : [],
                    backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384']
                }]
            }
        });
    } else {
        console.error("Error: No se pudo obtener el contexto del canvas 'graficoTopClientes'.");
    }
}

document.addEventListener('DOMContentLoaded', cargarDashboard);
setInterval(cargarDashboard, 3000);