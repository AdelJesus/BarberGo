document.addEventListener("DOMContentLoaded", function () {
    const title = document.getElementById("title");
    const nameInput = document.getElementById("nameInput");
    const apellidoInput = document.getElementById("apellidoInput");
    const correoInput = document.getElementById("correo");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const toggleForm = document.getElementById("toggleForm");
    const loginBtn = document.getElementById("loginBtn");
    const form = document.getElementById("formulario");
    const mensaje = document.getElementById("mensaje");

    let isLogin = true;

    function mostrarLogin() {
        title.textContent = "Login";
        nameInput.classList.add("hidden");
        apellidoInput.classList.add("hidden");
        correoInput.classList.remove("hidden");
        confirmPasswordInput.classList.add("hidden");
        loginBtn.textContent = "Iniciar Sesión";
        toggleForm.textContent = "Registrar";
        mensaje.classList.add("hidden");
        isLogin = true;
    }

    function mostrarRegistro() {
        title.textContent = "Registro";
        nameInput.classList.remove("hidden");
        apellidoInput.classList.remove("hidden");
        correoInput.classList.remove("hidden");
        confirmPasswordInput.classList.remove("hidden");
        loginBtn.textContent = "Registrar";
        toggleForm.textContent = "Login";
        isLogin = false;
    }

    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = tipo === "error" ? "error" : "success";
        mensaje.classList.remove("hidden");
    }

    mostrarLogin();

    toggleForm.addEventListener("click", function () {
        isLogin ? mostrarRegistro() : mostrarLogin();
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!isLogin) {
            if (!correoInput.value.includes("@")) {
                mostrarMensaje("El correo esta mal escrito");
                return;
            }
            if (passwordInput.value !== confirmPasswordInput.value) {
                mostrarMensaje("Las contraseñas no coinciden.");
                return;
            }
        }
        const datos = {
            nombre: nameInput.value,
            apellido: apellidoInput.value,
            correo: correoInput.value,
            password: passwordInput.value
        };
    
        const ruta = isLogin ? "/login" : "/registro";
        const respuesta = await fetch(ruta, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
    
        const resultado = await respuesta.json();
        if (respuesta.ok) {
            if (isLogin) {
                if (resultado.rol === "admin") {
                    window.location.href = "/admin";
                } else if (resultado.rol === "cliente") {
                    window.location.href = "/inicio";
                } else {
                    mostrarMensaje("Error: Rol de usuario desconocido en la respuesta.", "error");
                    console.error("Rol desconocido:", resultado.rol);
                }
            } else {
                mostrarMensaje("Registro exitoso", "success");
                form.reset();
                mostrarLogin();
            }
        } else {
            mostrarMensaje(resultado.error);
        }
    
    });
});
