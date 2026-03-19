import { mostrarUsuario, actualizarContadorCarrito, crearBotonCarritoFlotante } from "./navbar.js";

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


const infoProducto = document.getElementById("info-producto");
const variantesSection = document.getElementById("variantes-producto");
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const token = localStorage.getItem("token_usuario");
const mensajeProducto = document.getElementById("mensaje-producto");

let esFavorito = false;
let variantesSeleccionadas = [];
let precioBase = 0;
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

async function cargarProducto() {
  try {
    const res = await fetch(`https://api.mielissimo.com.ar/api/productos/${id}`);
    const prod = await res.json();

    if (!prod) {
      infoProducto.innerHTML = "<p>Producto no encontrado</p>";
      return;
    }

    precioBase = parseFloat(prod.precio);
    if (token) await verificarFavorito();

    infoProducto.innerHTML = `
      <div class="tarjeta-producto-detalle">
        <h1 class="nombre-producto">${prod.nombre}</h1>
        <div class="contenido-producto">
          <div class="producto-imagen">
            <img src="${prod.imagen}" alt="${prod.nombre}" class="img-estandarizada"/>
          </div>
          <div class="producto-info">
            <div id="seccion-variantes-dentro"></div>
            <p><strong>Precio:</strong> <span id="precio-dinamico">AR$ ${precioBase.toFixed(2)}</span></p>
            <p><strong>Categoría:</strong> ${prod.categoria_nombre || "Sin categoría"}</p>
           <div class="botones-producto">
  <button id="btn-agregar" class="btn">Agregar al carrito</button>
  <span class="contador-carrito-producto badge-inline" data-id="${prod.id}" style="display:none; margin-left:8px;">0</span>
  ${token ? `<button id="btn-favorito" class="btn-favorito">${esFavorito ? "❤️" : "🤍"}</button>` : ""}
</div>


          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-agregar").addEventListener("click", () => agregarAlCarrito(prod));
    if (token) {
      document.getElementById("btn-favorito").addEventListener("click", toggleFavorito);
    }
actualizarContadorProducto(prod.id);

    cargarVariantesVisuales();
  } catch (err) {
    console.error("Error al cargar producto:", err);
  }
}

async function verificarFavorito() {
  try {
    const res = await fetch("https://api.mielissimo.com.ar/api/favoritos", {
      headers: { Authorization: `Bearer ${token}` }
    });

   if (manejarTokenExpiradoUsuario(res)) return;


    const favoritos = await res.json();
    esFavorito = favoritos.some(f => f.producto_id == id);
  } catch (err) {
    console.error("Error al verificar favorito:", err);
  }
}


async function toggleFavorito() {
  try {
    const btn = document.getElementById("btn-favorito");
    if (esFavorito) {
      await fetch(`https://api.mielissimo.com.ar/api/favoritos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      esFavorito = false;
    } else {
      await fetch("https://api.mielissimo.com.ar/api/favoritos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ producto_id: parseInt(id) })
      });
      esFavorito = true;
    }
    btn.textContent = esFavorito ? "❤️" : "🤍";
  } catch (err) {
    console.error("Error al actualizar favorito:", err);
  }
}

function actualizarPrecio() {
  const precioMostrado = document.getElementById("precio-dinamico");
  const varianteTamanio = variantesSeleccionadas.find(v => v.tipo === "Tamaño");
  if (varianteTamanio && !isNaN(varianteTamanio.precio)) {
    precioMostrado.textContent = `$${parseFloat(varianteTamanio.precio).toFixed(2)}`;
  } else {
    precioMostrado.textContent = `$${precioBase.toFixed(2)}`;
  }
}

function agregarAlCarrito(prod) {
  const sinVariantes = variantesSeleccionadas.length === 0;

  const igual = p => {
    if (sinVariantes) {
      // Comparar solo por id y variantes vacías/undefined
      return p.id === prod.id && (!p.variantes || p.variantes.length === 0);
    } else {
      // Comparar id + variantes específicas
      return (
        p.id === prod.id &&
        JSON.stringify(p.variantes) === JSON.stringify(variantesSeleccionadas)
      );
    }
  };

  const existente = carrito.find(igual);
  const varianteTamanio = variantesSeleccionadas.find(v => v.tipo === "Tamaño");
  const precioFinal = varianteTamanio?.precio ?? precioBase;

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: precioFinal,
      imagen: prod.imagen,
      cantidad: 1,
      variantes: sinVariantes ? [] : variantesSeleccionadas
    });
  }

  gtag('event', 'agregar_al_carrito', {
    event_category: 'Carrito',
    event_label: prod.nombre,
    value: prod.precio
  });

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorProducto(prod.id);
  actualizarContadorCarrito();

  const mensajeProducto = document.getElementById("mensaje-producto");
  mensajeProducto.textContent = "✅ Producto agregado al carrito.";
  mensajeProducto.style.color = "green";
  mensajeProducto.style.display = "block";

  setTimeout(() => {
    mensajeProducto.textContent = "";
  }, 2000);
}


function cargarVariantesVisuales() {
  fetch(`https://api.mielissimo.com.ar/api/variantes/${id}`)
    .then(res => res.json())
    .then(variantes => {
      if (variantes.length === 0) return;

      const contenedor = document.getElementById("seccion-variantes-dentro");
      contenedor.innerHTML = "<h3>Variantes disponibles:</h3>";

      const tipos = {};
      variantes.forEach(v => {
        if (!tipos[v.tipo]) tipos[v.tipo] = [];
        tipos[v.tipo].push(v);
      });

      for (const tipo in tipos) {
        const grupo = document.createElement("div");
        grupo.className = "grupo-variantes";
        grupo.innerHTML = `<p><strong>${tipo}</strong></p>`;

        tipos[tipo].forEach(v => {
          const btn = document.createElement("button");
          btn.className = "btn-variante";
          btn.textContent = `${v.nombre} ${v.precio_extra ? `- $${parseFloat(v.precio_extra).toFixed(2)}` : ""}`;

          btn.addEventListener("pointerup", () => {
            const esTactil = "ontouchstart" in window;

            if (esTactil) {
              // En táctil: NO deselecciona si ya estaba seleccionada, solo reemplaza si toca otra variante
              if (!variantesSeleccionadas.find(sel => sel.id === v.id)) {
                variantesSeleccionadas = variantesSeleccionadas.filter(sel => sel.tipo !== v.tipo);
                variantesSeleccionadas.push({
                  id: v.id,
                  nombre: v.nombre,
                  precio: parseFloat(v.precio_extra) || precioBase,
                  tipo: v.tipo
                });
                grupo.querySelectorAll(".btn-variante").forEach(b => b.classList.remove("activo"));
                btn.classList.add("activo");
              }
            } else {
              // En desktop: comportamiento actual (puede deseleccionar con doble clic)
              const yaSeleccionada = variantesSeleccionadas.find(sel => sel.id === v.id);
              if (yaSeleccionada) {
                variantesSeleccionadas = variantesSeleccionadas.filter(sel => sel.id !== v.id);
                btn.classList.remove("activo");
              } else {
                variantesSeleccionadas = variantesSeleccionadas.filter(sel => sel.tipo !== v.tipo);
                variantesSeleccionadas.push({
                  id: v.id,
                  nombre: v.nombre,
                  precio: parseFloat(v.precio_extra) || precioBase,
                  tipo: v.tipo
                });
                grupo.querySelectorAll(".btn-variante").forEach(b => b.classList.remove("activo"));
                btn.classList.add("activo");
              }
            }
            gtag('event', 'seleccionar_variante', {
  event_category: 'Variantes',
  event_label: v.nombre,
  value: v.precio_extra || 0
});


            actualizarPrecio();
          });

          grupo.appendChild(btn);
        });

        contenedor.appendChild(grupo);
      }

      // Botón "Sin variantes" solo para táctiles
      if ("ontouchstart" in window) {
        const botonSinVariante = document.createElement("button");
        botonSinVariante.textContent = "Sin variantes";
        botonSinVariante.className = "btn-variante btn-sin-variante";

        botonSinVariante.addEventListener("pointerup", () => {
          variantesSeleccionadas = [];
          document.querySelectorAll(".btn-variante").forEach(b => b.classList.remove("activo"));
          actualizarPrecio();
        });

        contenedor.appendChild(botonSinVariante);
      }
    });
}

function actualizarContadorProducto(idProducto) {
  // Cargar carrito actualizado
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  // Sumar todas las variantes del mismo producto
  const totalCantidad = carrito
    .filter(item => item.id == idProducto)
    .reduce((sum, item) => sum + item.cantidad, 0);

  const contadorElemento = document.querySelector(`.contador-carrito-producto[data-id="${idProducto}"]`);
  if (contadorElemento) {
    if (totalCantidad > 0) {
      contadorElemento.textContent = totalCantidad;
      contadorElemento.style.display = "inline-flex";
    } else {
      contadorElemento.style.display = "none";
    }
  }
}



document.addEventListener("DOMContentLoaded", () => {
  mostrarUsuario();
  actualizarContadorCarrito();
  crearBotonCarritoFlotante();
  cargarProducto();
const prodId = parseInt(id);
if (carrito.length > 0) {
  const totalCantidad = carrito
  .filter(p => p.id == prodId)
  .reduce((sum, p) => sum + p.cantidad, 0);

if (totalCantidad > 0) actualizarContadorProducto(prodId);

}

});
