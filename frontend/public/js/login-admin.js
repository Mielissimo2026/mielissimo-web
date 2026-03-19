const formLogin = document.getElementById("form-login-admin");
const mensaje = document.getElementById("mensaje-login");

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(formLogin));

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });

    const resultado = await res.json();

    if (res.ok) {
      localStorage.setItem("tokenAdmin", resultado.token);
      window.location.href = "admin.html";
    } else {
      mensaje.textContent = resultado.error || "Credenciales incorrectas";
    }
  } catch (err) {
    console.error("Error en login:", err);
    mensaje.textContent = "Error de conexión con el servidor";
  }
});
