function manejarTokenExpiradoUsuario(res) {
  if (res.status === 401) {
    localStorage.removeItem("token_usuario");
    localStorage.removeItem("nombre_usuario");
    alert("Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.");
    window.location.href = "login.html";
    return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  cargarHistorial();
});

async function cargarHistorial() {
  const token = localStorage.getItem("token_usuario");

  if (!token) {
    console.error("No hay token, no se puede cargar historial");
    return;
  }

  try {
    const res = await fetch("https://api.mielissimo.com.ar/api/historial", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

   if (manejarTokenExpiradoUsuario(res)) return;

    if (!res.ok) {
      throw new Error("Error al obtener historial");
    }

    const compras = await res.json();

    if (!Array.isArray(compras)) {
      throw new Error("Formato inesperado del historial");
    }

    mostrarHistorial(compras); // tu función existente
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }
}


function mostrarHistorial(compras) {
  const contenedor = document.getElementById("historial-container");
  if (!contenedor) return;

  if (compras.length === 0) {
    contenedor.innerHTML = "<p>No hay compras registradas.</p>";
    return;
  }

  // Construcción de HTML en bloque para mayor rendimiento
  const historialHTML = compras.map(compra => {
    const fecha = new Date(compra.fecha_compra).toLocaleDateString();

    const variantesHTML = compra.variantes.length > 0
      ? `
        <div class="variantes-historial">
          <strong>Variantes:</strong>
          <ul>
            ${compra.variantes.map(v => 
              `<li>${v.tipo}: ${v.nombre} ${v.precio ? `(AR$ ${v.precio})` : ""}</li>`
            ).join("")}
          </ul>
        </div>`
      : "";

    return `
      <div class="historial-card">
        <img src="${compra.imagen}" alt="${compra.nombre_producto}" />
        <h3>${compra.nombre_producto}</h3>
        <p>Precio base: AR$ ${compra.precio}</p>
        <p>Cantidad: ${compra.cantidad}</p>
        <p>Fecha: ${fecha}</p>
        <p>Tipo de envío: ${compra.tipo_envio}</p>
        ${variantesHTML}
      </div>
    `;
  }).join("");

  contenedor.innerHTML = historialHTML;
}
