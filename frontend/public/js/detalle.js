const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  document.body.innerHTML = "<h2>Producto no especificado</h2>";
  throw new Error("ID faltante");
}

fetch(`https://api.mielissimo.com.ar/api/productos`)
  .then(res => res.json())
  .then(productos => {
    const producto = productos.find(p => p.id == id);
    if (!producto) {
      document.body.innerHTML = "<h2>Producto no encontrado</h2>";
      return;
    }

    document.getElementById("imagen-producto").src = producto.imagen;
    document.getElementById("nombre-producto").textContent = producto.nombre;
    document.getElementById("precio-producto").textContent = parseFloat(producto.precio).toFixed(2);
    document.getElementById("stock-producto").textContent = producto.stock;
    document.getElementById("categoria-producto").textContent = producto.categoria_nombre || "Sin categoría";

    document.getElementById("btn-agregar").addEventListener("click", () => {
      agregarAlCarrito(producto);
      const mensaje = document.getElementById("mensaje-carrito");
      mensaje.textContent = "✅ Producto agregado";
      mensaje.style.color = "green";
      setTimeout(() => mensaje.textContent = "", 2000);
    });
  })
  .catch(err => {
    console.error("Error:", err);
    document.body.innerHTML = "<h2>Error al cargar el producto</h2>";
  });

// Funciones carrito
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  actualizarContadorCarrito();
}

function agregarAlCarrito(prod) {
  const existente = carrito.find(p => p.id === prod.id);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: prod.id,
      nombre: prod.nombre,
      precio: parseFloat(prod.precio),
      cantidad: 1,
      imagen: prod.imagen
    });
  }
  guardarCarrito();
}

function actualizarContadorCarrito() {
  const contador = document.getElementById("contador-carrito");
  if (contador) {
    const total = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    contador.textContent = `(${total})`;
  }
}

actualizarContadorCarrito();
