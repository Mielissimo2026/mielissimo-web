const mensajeRegistro = document.getElementById("mensaje-registro");

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registroForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!nombre || !email || !password) {
  mensajeRegistro.textContent = "Por favor completá todos los campos.";
  mensajeRegistro.style.color = "red";
  return;
}

if (!validarEmail(email)) {
  mensajeRegistro.textContent = "Ingresá un correo electrónico válido.";
  mensajeRegistro.style.color = "red";
  return;
}

if (password.length < 6) {
  mensajeRegistro.textContent = "La contraseña debe tener al menos 6 caracteres.";
  mensajeRegistro.style.color = "red";
  return;
}


    try {
      const res = await fetch("https://api.mielissimo.com.ar/api/usuarios/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, email, password })
      });

      const data = await res.json();

     if (res.ok) {
  mensajeRegistro.textContent = "✅ Usuario registrado con éxito. Ahora podés iniciar sesión.";
  mensajeRegistro.style.color = "green";

  // Redirigir después de 2 segundos
  setTimeout(() => {
    window.location.href = "login.html";
  }, 500);
} else {
  mensajeRegistro.textContent = data.error || "Ocurrió un error";
  mensajeRegistro.style.color = "red";
}

    } catch (err) {
      console.error(err);
     mensajeRegistro.textContent = "❌ Error al conectar con el servidor.";
mensajeRegistro.style.color = "red";

    }
  });
});

function validarEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}
