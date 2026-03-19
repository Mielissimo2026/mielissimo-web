const mensajeLogin = document.getElementById("mensaje-login");

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      mensajeLogin.textContent = "Por favor completá todos los campos.";
      mensajeLogin.style.color = "red";
      return;
    }

    try {
      const res = await fetch("https://api.mielissimo.com.ar/api/usuarios/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar datos en localStorage
        localStorage.setItem("token_usuario", data.token);
        localStorage.setItem("id_usuario", data.usuario.id);
        localStorage.setItem("nombre_usuario", data.usuario.nombre);

        mensajeLogin.textContent = "✅ Inicio de sesión exitoso. Redirigiendo...";
        mensajeLogin.style.color = "green";

        setTimeout(() => {
          window.location.href = "index.html";
        }, 500);
      } else {
        mensajeLogin.textContent = data.error || "Credenciales incorrectas.";
        mensajeLogin.style.color = "red";
      }
    } catch (err) {
      console.error(err);
      mensajeLogin.textContent = "❌ Error al conectar con el servidor.";
      mensajeLogin.style.color = "red";
    }
  });
});
