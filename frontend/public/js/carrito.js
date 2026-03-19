import { mostrarUsuario, actualizarContadorCarrito } from "./navbar.js";

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


let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function renderizarCarrito() {
  const contenedor = document.querySelector(".carrito-contenedor");
  contenedor.innerHTML = "";

  if (carrito.length === 0) {
  contenedor.innerHTML = "<p style='text-align: center;'>Tu carrito está vacío.</p>";
  document.getElementById("opciones-envio").style.display = "none";
  document.getElementById("confirmar-compra").style.display = "none";
  document.getElementById("mensaje-compra").style.display = "none";
  document.getElementById("total-compra").textContent = "ARS $0.00";
  return;
} else {
  document.getElementById("opciones-envio").style.display = "block";
  document.getElementById("confirmar-compra").style.display = "inline-block";
  document.getElementById("mensaje-compra").style.display = "block";
}


  carrito.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("item-carrito");

    let variantesHTML = "";
    if (item.variantes && item.variantes.length > 0) {
      variantesHTML = "<ul class='lista-variantes'>";
      item.variantes.forEach(v => {
        variantesHTML += `<li>${v.tipo}: ${v.nombre}</li>`;
      });
      variantesHTML += "</ul>";
    }

    div.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <div class="info">
        <h3>${item.nombre}</h3>
        ${variantesHTML}
        <div class="cantidad-controles">
  <button class="btn-cantidad" data-index="${index}" data-accion="restar">-</button>
  <span class="cantidad-valor">${item.cantidad}</span>
  <button class="btn-cantidad" data-index="${index}" data-accion="sumar">+</button>
</div>
<p>Precio: ARS $${(item.precio * item.cantidad).toFixed(2)}</p>

      </div>
      <button class="btn-eliminar" data-index="${index}">Eliminar</button>
    `;

    contenedor.appendChild(div);
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      carrito.splice(index, 1);
      localStorage.setItem("carrito", JSON.stringify(carrito));
      renderizarCarrito();
      actualizarContadorCarrito();
    });
  });

  document.querySelectorAll(".btn-cantidad").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const index = e.target.dataset.index;
    const accion = e.target.dataset.accion;

    if (accion === "sumar") {
      carrito[index].cantidad++;
    } else if (accion === "restar" && carrito[index].cantidad > 1) {
      carrito[index].cantidad--;
    } else if (accion === "restar" && carrito[index].cantidad === 1) {
      carrito.splice(index, 1); // Eliminar producto si llega a 0
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderizarCarrito();
    actualizarContadorCarrito();
  });
});


  actualizarContadorCarrito();
  calcularTotal();
}

function toggleZonaEnvio() {
  const tipoEnvio = document.querySelector('input[name="tipo-envio"]:checked')?.value;
  const zonaContainer = document.getElementById("zona-envio-container");

  if (tipoEnvio === "envio") {
    zonaContainer.style.display = "block";
  } else {
    zonaContainer.style.display = "none";
    document.getElementById("zona-envio").value = ""; // Resetea selección
  }

  calcularTotal();
}

function calcularTotal() {
  const tipoEnvio = document.querySelector('input[name="tipo-envio"]:checked')?.value;
  let total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  if (tipoEnvio === "envio") {
    const zonaSelect = document.getElementById("zona-envio");
    const precioZona = parseFloat(zonaSelect?.selectedOptions[0]?.dataset.precio || 0);
    total += precioZona;
  }

  const totalSpan = document.getElementById("total-compra");
  if (totalSpan) {
    totalSpan.textContent = `ARS $${total.toFixed(2)}`;
  }
}




async function confirmarCompra() {
  const mensaje = document.getElementById("mensaje-compra");
  const id_usuario = Number(localStorage.getItem("id_usuario"));
  const nombreUsuario = localStorage.getItem("nombre_usuario") || "Anónimo";

  if (carrito.length === 0) {
    mensaje.textContent = "🛒 Tu carrito está vacío.";
    mensaje.style.color = "red";
    mensaje.style.display = "block";
    return;
  }

  const tipoEnvio = document.querySelector('input[name="tipo-envio"]:checked')?.value || "retiro";
  let zona = null;

  if (tipoEnvio === "envio") {
    const zonaSelect = document.getElementById("zona-envio");
    zona = zonaSelect.value;
    if (!zona) {
      mensaje.textContent = "⚠️ Elegí una zona para el envío.";
      mensaje.style.color = "red";
      mensaje.style.display = "block";
      return;
    }
  }

  const totalTexto = document.getElementById("total-compra").textContent.replace(/[^\d.-]/g, "").trim();
  const total = parseFloat(totalTexto);

  // Copia carrito antes de vaciarlo
  const carritoCopia = [...carrito];

  // Guardar en DB
  try {
    const res = await fetch("https://api.mielissimo.com.ar/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario: id_usuario || null,
        carrito: carritoCopia,
        tipoEnvio,
        zona,
        total
      })
    });
    if (id_usuario && manejarTokenExpiradoUsuario(res)) return;
    const data = await res.json();
    var pedidoId = data.id;
  } catch (err) {
    console.error("Error guardando en historial:", err);
  }

  // Mensaje WhatsApp
  let tipo = "🏠 Retiro en local";
if (tipoEnvio === "envio" && zona) {
  const preciosZonas = {
    "Zona centro": 1500,
    "Jds": 2000,
    "Ribera": 2000,
    "Barrio unión": 2500
  };
  const precioZona = preciosZonas[zona] || 0;
  tipo = `🚚 Envío a domicilio (${zona} - $${precioZona})`;
}


  const detallesProductos = carritoCopia.map(item => {
    const variantesTexto = item.variantes?.length
      ? ` (${item.variantes.map(v => v.nombre).join(", ")})`
      : "";
    return `💗 ${item.cantidad} x ${item.nombre}${variantesTexto} = $${(item.precio * item.cantidad).toFixed(2)}`;
  }).join("\n");

  const mensajeTexto = 
`📌 *Pedido #${pedidoId}*

Hola, quiero hacer un pedido en Mielíssimo 🍬💗  
🎀 ¡Más golosinas, más contento! 😋

Detalles del Pedido:
 ${detallesProductos}

💲 *Total:* $${total.toFixed(2)}

👤 *Nombre:* ${nombreUsuario}
 ${tipo}`;

  const textoCodificado = encodeURIComponent(mensajeTexto);
  const numeroWhatsapp = "2657603387";
  const linkWhatsapp = `https://wa.me/549${numeroWhatsapp}?text=${textoCodificado}`;

  setTimeout(() => {
    window.location.href = linkWhatsapp;
    carrito = [];
    localStorage.setItem("carrito", JSON.stringify([]));
    actualizarContadorCarrito();
    renderizarCarrito();
  }, 100);
}




document.addEventListener("DOMContentLoaded", () => {
  mostrarUsuario();
  renderizarCarrito();
  actualizarContadorCarrito();

  const radiosEnvio = document.querySelectorAll('input[name="tipo-envio"]');
  radiosEnvio.forEach(radio => {
    radio.addEventListener("change", calcularTotal);
  });

  document.getElementById("confirmar-compra").addEventListener("click", confirmarCompra);
});

window.calcularTotal = calcularTotal;
window.toggleZonaEnvio = toggleZonaEnvio;
