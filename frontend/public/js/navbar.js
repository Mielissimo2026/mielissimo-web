  export function mostrarUsuario() {
    const nombreUsuario = localStorage.getItem("nombre_usuario");
    const loginLi = document.getElementById("login-li");
    const usuarioLogueadoLi = document.getElementById("usuario-logueado");
    const historialLi = document.getElementById("btn-historial");
    const favoritosLi = document.getElementById("btn-favoritos");

    if (nombreUsuario) {
      if (loginLi) loginLi.style.display = "none";
      if (usuarioLogueadoLi) {
        usuarioLogueadoLi.textContent = `👤 ${nombreUsuario}`;
        usuarioLogueadoLi.style.display = "inline";
        usuarioLogueadoLi.style.color = "white";
      }
      if (historialLi) historialLi.style.display = "inline";
      if (favoritosLi) favoritosLi.style.display = "inline";

      if (!document.getElementById("btn-logout")) {
        const liCerrar = document.createElement("li");
        liCerrar.id = "btn-logout";
        liCerrar.innerHTML = `<a href="#">Cerrar sesión</a>`;
        liCerrar.addEventListener("click", () => {
          localStorage.removeItem("token_usuario");
          localStorage.removeItem("nombre_usuario");
          localStorage.removeItem("id_usuario");
          localStorage.removeItem("carrito");
          window.location.href = "index.html";
        });

        document.querySelector("nav ul").appendChild(liCerrar);
      }
    } else {
      if (loginLi) loginLi.style.display = "inline";
      if (usuarioLogueadoLi) usuarioLogueadoLi.style.display = "none";
      if (historialLi) historialLi.style.display = "none";
      if (favoritosLi) favoritosLi.style.display = "none";

      const btnLogout = document.getElementById("btn-logout");
      if (btnLogout) btnLogout.remove();
    }
  }

  export function actualizarContadorCarrito() {
    const contador = document.getElementById("contador-carrito");
    const contadorFlotante = document.getElementById("contador-carrito-flotante");
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);

    if (contador) contador.textContent = `(${total})`;
    if (contadorFlotante) contadorFlotante.textContent = `(${total})`;
  }

  export function crearBotonCarritoFlotante() {
    if (window.location.pathname.includes("carrito.html")) return;

    if (document.getElementById("boton-carrito-flotante")) return; // Evita duplicados

    const btn = document.createElement("div");
    btn.id = "boton-carrito-flotante";
    btn.innerHTML = `
      <a href="carrito.html" class="boton-carrito-flotante">
        🛒 <span id="contador-carrito-flotante">(0)</span>
      </a>
    `;
    document.body.appendChild(btn);

    actualizarContadorCarrito(); // actualiza contador al crearlo
  }

 document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }
});
