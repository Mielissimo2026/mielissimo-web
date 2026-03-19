const API_URL = "https://api.mielissimo.com.ar/api";

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


const contenedorCategorias = document.getElementById("categorias-horizontal");
const contenedorProductos = document.getElementById("productos");
const contadorCarrito = document.getElementById("contador-carrito");
const contadorCarritoFlotante = document.getElementById("contador-carrito-flotante");
const searchInput = document.getElementById("buscador");

let productosCache = [];
let favoritosCache = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [productos, favoritos] = await Promise.all([
      fetch(`${API_URL}/productos`).then(r => r.json()),
      obtenerFavoritos()
    ]);

    productosCache = productos;
    favoritosCache = favoritos.map(f => f.producto_id);

    renderizarCategorias();
    renderizarProductos(productosCache, favoritosCache);

    configurarBuscador();
    mostrarUsuario();
    actualizarContadorCarrito();
    crearBotonCarritoFlotante();
  } catch (error) {
    console.error("Error inicial:", error);
  }
});

// FAVORITOS
async function obtenerFavoritos() {
  const token = localStorage.getItem("token_usuario");
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/favoritos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (manejarTokenExpiradoUsuario(res)) return [];
if (!res.ok) return [];

    return await res.json();
  } catch {
    return [];
  }
}

function configurarBotonesFavoritos() {
  const botones = document.querySelectorAll(".btn-favorito");
  botones.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idProducto = parseInt(btn.dataset.id);
      const esFavorito = favoritosCache.includes(idProducto);
      const token = localStorage.getItem("token_usuario");
      if (!token) return;

      try {
        if (esFavorito) {
          const res = await fetch(`${API_URL}/favoritos/${idProducto}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            favoritosCache = favoritosCache.filter(id => id !== idProducto);
            btn.textContent = "🤍";
            btn.style.color = "#999";
          }
        } else {
          const res = await fetch(`${API_URL}/favoritos`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ producto_id: idProducto })
          });
          if (res.ok) {
            favoritosCache.push(idProducto);
            btn.textContent = "❤️";
            btn.style.color = "#ef5579";
          }
        }
      } catch (err) {
        console.error("Error al actualizar favorito:", err);
      }
    });
  });
}

// CATEGORÍAS
function renderizarCategorias() {
  if (!contenedorCategorias) return;
  contenedorCategorias.innerHTML = "";

  const fragment = document.createDocumentFragment();

  const botonTodos = document.createElement("button");
  botonTodos.textContent = "Todos";
  botonTodos.className = "boton-categoria";
  botonTodos.addEventListener("click", () => renderizarProductos(productosCache, favoritosCache));
  fragment.appendChild(botonTodos);

  fetch(`${API_URL}/categorias`)
    .then(r => r.json())
    .then(categorias => {
      categorias.forEach(cat => {
        const boton = document.createElement("button");
        boton.textContent = cat.nombre;
        boton.className = "boton-categoria";
        boton.addEventListener("click", () => {
          const filtrados = productosCache.filter(
            p => String(p.categoria_id) === String(cat.id)
          );
          renderizarProductos(filtrados, favoritosCache);
        });
        fragment.appendChild(boton);
      });
      contenedorCategorias.appendChild(fragment);
    });
}

// RENDERIZAR PRODUCTOS
function renderizarProductos(lista, favoritos) {
  carrito = JSON.parse(localStorage.getItem("carrito")) || [];



  if (!contenedorProductos) return;
  contenedorProductos.innerHTML = "";

  const fragment = document.createDocumentFragment();
  const tokenUsuario = localStorage.getItem("token_usuario");

  lista.forEach(prod => {
    if (!prod.activo) return;

    const div = document.createElement("div");
    div.classList.add("producto");

    const esFavorito = favoritos.includes(prod.id);
    const icono = esFavorito ? "❤️" : "🤍";
    const color = esFavorito ? "#ef5579" : "#999";

   div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p class="categoria-nombre">${prod.categoria_nombre || "Sin categoría"}</p>
      <p>Precio: AR$ ${parseFloat(prod.precio).toFixed(2)}</p>
      <button class="btn-carrito" data-id="${prod.id}">Agregar al carrito</button>
      ${tokenUsuario ? `<button class="btn-favorito" data-id="${prod.id}" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:${color};">${icono}</button>` : ""}
      <span class="contador-carrito-producto badge" data-id="${prod.id}" style="display:none">0</span>

    `;


    div.addEventListener("click", (e) => {
      if (!e.target.classList.contains("btn-carrito") && !e.target.classList.contains("btn-favorito")) {
        window.location.href = `producto.html?id=${prod.id}`;
      }
    });

    gtag('event', 'ver_producto', {
  event_category: 'Productos',
  event_label: prod.nombre,
  value: prod.precio
});


    fragment.appendChild(div);
  });

  contenedorProductos.appendChild(fragment);

carrito = JSON.parse(localStorage.getItem("carrito")) || [];
carrito.forEach(item => {
  actualizarContadorProducto(item.id);
});


  if (tokenUsuario) configurarBotonesFavoritos();
  configurarBotonesCarrito();


}

// BUSCADOR
function configurarBuscador() {
  if (!searchInput) return;
  searchInput.addEventListener("input", e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = productosCache.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
    renderizarProductos(filtrados, favoritosCache);
  });
}

// 📧 Newsletter
const formNewsletter = document.getElementById("form-newsletter");
const inputEmail = document.getElementById("email-newsletter");
const mensajeNewsletter = document.getElementById("mensaje-newsletter");

if (formNewsletter) {
  formNewsletter.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = inputEmail.value.trim();

    try {
      const res = await fetch("https://api.mielissimo.com.ar/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        mensajeNewsletter.textContent = data.mensaje;
        mensajeNewsletter.style.color = "green";
        formNewsletter.reset();
      } else {
        mensajeNewsletter.textContent = data.error;
        mensajeNewsletter.style.color = "red";
      }
    } catch (err) {
      mensajeNewsletter.textContent = "Error de conexión";
      mensajeNewsletter.style.color = "red";
    }
  });
}

// CARRITO
function configurarBotonesCarrito() {
  document.querySelectorAll(".btn-carrito").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productoId = parseInt(btn.dataset.id);

      // Buscar el producto en productosCache
      const productoSeleccionado = productosCache.find(p => p.id === productoId);

      // Llamar función que ya tenés para agregar al carrito
      agregarAlCarrito(productoId);

      // Enviar evento a Google Analytics
      gtag('event', 'agregar_al_carrito', {
        event_category: 'Carrito',
        event_label: productoSeleccionado ? productoSeleccionado.nombre : `ID ${productoId}`,
        value: productoSeleccionado ? productoSeleccionado.precio : 0
      });
    });
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




function agregarAlCarrito(idProducto) {
  const producto = productosCache.find(p => p.id == idProducto);
  const item = carrito.find(item => item.id == idProducto);

  if (item) {
    item.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
  actualizarContadorProducto(idProducto);
}


function actualizarContadorCarrito() {
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  if (contadorCarrito) contadorCarrito.textContent = `(${total})`;
  if (contadorCarritoFlotante) contadorCarritoFlotante.textContent = `(${total})`;
}

// USUARIO Y BOTÓN CARRITO FLOTANTE
function mostrarUsuario() {
  const nombreUsuario = localStorage.getItem("nombre_usuario");
  const botonLogin = document.getElementById("boton-login");
  const nombreUsuarioElemento = document.getElementById("nombre-usuario");
  const botonLogout = document.getElementById("boton-logout");

  if (nombreUsuario) {
    if (botonLogin) botonLogin.style.display = "none";
    if (nombreUsuarioElemento) nombreUsuarioElemento.textContent = nombreUsuario;
    if (botonLogout) botonLogout.style.display = "inline-block";
  } else {
    if (botonLogin) botonLogin.style.display = "inline-block";
    if (nombreUsuarioElemento) nombreUsuarioElemento.textContent = "";
    if (botonLogout) botonLogout.style.display = "none";
  }
}

function crearBotonCarritoFlotante() {
  const botonFlotante = document.createElement("button");
  botonFlotante.id = "boton-carrito-flotante";
  botonFlotante.innerHTML = `🛒 <span id="contador-carrito-flotante">(0)</span>`;
  botonFlotante.style.position = "fixed";
  botonFlotante.style.bottom = "20px";
  botonFlotante.style.right = "20px";
  botonFlotante.style.zIndex = "1000";
  botonFlotante.addEventListener("click", () => {
    window.location.href = "carrito.html";
  });
  document.body.appendChild(botonFlotante);
}
