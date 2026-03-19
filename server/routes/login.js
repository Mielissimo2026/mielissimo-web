document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Por favor, completá todos los campos.");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Inicio de sesión exitoso");
        // Guardar en localStorage (opcional)
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        window.location.href = "index.html";
      } else {
        alert(data.error || "Error al iniciar sesión");
      }
    } catch (error) {
      alert("Error de conexión");
    }
  });
});
