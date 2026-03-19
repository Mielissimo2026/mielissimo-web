// === VERIFICACIÓN SEGURA DE TOKEN ===
let tokenAdmin = null;
try {
    tokenAdmin = localStorage.getItem("tokenAdmin");
} catch (e) {
    console.error("Error accediendo a localStorage:", e);
}

if (!tokenAdmin) {
    console.warn("No hay token, redirigiendo...");
    window.location.href = "login-admin.html";
}

// === INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Cargado. Iniciando Admin Panel...");

    // 1. NAVEGACIÓN (SIDEBAR)
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dashboard-section');
    // === LÓGICA MENÚ MÓVIL (HAMBURGUESA) ===
    const btnMenu = document.getElementById("menu-toggle");
    const navMenu = document.getElementById("sidebar-nav");
    
    if (btnMenu && navMenu) {
        btnMenu.addEventListener("click", () => {
            navMenu.classList.toggle("open");
            // Cambiar icono opcionalmente
            const icon = btnMenu.querySelector("i");
            if (navMenu.classList.contains("open")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-times"); // X para cerrar
            } else {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        });
    }

    // === LOGOUT VERSIÓN MÓVIL ===
    const btnLogoutMobile = document.getElementById("logout-mobile");
    if (btnLogoutMobile) {
        btnLogoutMobile.addEventListener("click", () => {
            try { localStorage.removeItem("tokenAdmin"); } catch (e) { }
            window.location.href = "login-admin.html";
        });
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar clase active de todos
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Activar el actual
            btn.classList.add('active');
            const sectionId = btn.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
            } else {
                console.error("Sección no encontrada:", sectionId);
            }
        });
    });

    // 2. ELEMENTOS GLOBALES (Con chequeo de existencia)
    const btnLogout = document.getElementById("logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", () => {
            try { localStorage.removeItem("tokenAdmin"); } catch (e) { }
            window.location.href = "login-admin.html";
        });
    }

    // Toggle Estado Local
    const btnEstado = document.getElementById("btn-toggle-estado");
    if (btnEstado) btnEstado.addEventListener("click", toggleEstadoLocal);

    // 3. FORMULARIOS
    const formProducto = document.getElementById("formulario-producto");
    if (formProducto) formProducto.addEventListener("submit", guardarProducto);

    const buscador = document.getElementById("buscador-productos");
    if (buscador) buscador.addEventListener("input", filtrarProductos);

    const filtroCat = document.getElementById("filtro-categoria-productos");
    if (filtroCat) filtroCat.addEventListener("change", filtrarProductos);

    const btnCancelProd = document.getElementById("cancelar-edicion-producto");
    if (btnCancelProd) btnCancelProd.addEventListener("click", resetFormProducto);

    // Categorías
    const formCategoria = document.getElementById("formulario-categoria");
    if (formCategoria) formCategoria.addEventListener("submit", agregarCategoria);

    // Variantes
    const formVariante = document.getElementById("formulario-variante");
    if (formVariante) formVariante.addEventListener("submit", agregarVariante);

    const btnCancelVar = document.getElementById("btnCancelarEdicionVariante");
    if (btnCancelVar) btnCancelVar.addEventListener("click", () => {
        if (formVariante) formVariante.reset();
        const secVar = document.getElementById("seccionVariantes");
        if (secVar) secVar.style.display = "none";
    });

    const btnCerrarVar = document.getElementById("btnCerrarVariantes");
    if (btnCerrarVar) {
        btnCerrarVar.addEventListener("click", () => {
            const secVar = document.getElementById("seccionVariantes");
            if (secVar) secVar.style.display = "none";
        });
    }

    // Pedidos
    const btnBuscarPedido = document.getElementById("btn-buscar-compra");
    if (btnBuscarPedido) btnBuscarPedido.addEventListener("click", buscarPedidoPorId);

    // 4. CARGA INICIAL DE DATOS
    cargarCategorias();
    cargarProductos();
    // cargarProductosCarrusel(); <--- ESTO YA NO EXISTE, LO COMENTAMOS PARA EVITAR ERRORES
    cargarEstadoLocal();
});


// =========================================================
// 1. GESTIÓN DE PRODUCTOS
// =========================================================
let productosCache = [];
let productoEnEdicion = null;

async function cargarProductos() {
    try {
        const res = await fetch("/api/productos?mostrarInactivos=true", {
            headers: { "Authorization": `Bearer ${tokenAdmin}` }
        });
        if (!res.ok) throw new Error("Error fetching productos");
        productosCache = await res.json();

        // Initial render limited to first 50 to avoid lag
        renderProductos(productosCache.slice(0, 50));
    } catch (e) { console.error("Error cargando productos:", e); }
}

function renderProductos(lista) {
    const container = document.getElementById("lista-productos");
    if (!container) return; // Si no existe el contenedor, salimos sin error
    container.innerHTML = "";

    lista.forEach(prod => {
        const div = document.createElement("div");
        div.className = "producto-admin";
        div.style = `display: flex; gap: 10px; padding: 10px; border-bottom: 1px solid #eee; align-items: center; ${!prod.activo ? 'opacity:0.6; background:#fff0f5;' : ''}`;

        div.innerHTML = `
            <img src="${prod.imagen || 'assets/placeholder.png'}" style="width:50px; height:50px; object-fit:contain; background:white; border-radius:5px;">
            <div style="flex:1;">
                <strong>${prod.nombre}</strong> - ARS $${prod.precio}
                ${!prod.activo ? '<span style="color:red; font-size:0.8em;">(Pausado)</span>' : ''}
                <div style="font-size:0.8em; color:#666;">
                    ${prod.categorias && prod.categorias.length > 0 
    ? [...new Set(prod.categorias.map(c => c.nombre))].join(', ') 
    : 'Sin categoría'}
                </div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-var" onclick="editarVariantes(${prod.id}, '${prod.nombre.replace(/'/g, "\\'")}')" title="Variantes"><i class="fa-solid fa-list"></i></button>
                <button class="btn-edit" onclick="editarProducto(${prod.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-del" onclick="eliminarProducto(${prod.id}, ${prod.activo})" title="Borrar/Pausar">
                    <i class="fa-solid ${prod.activo ? 'fa-trash' : 'fa-trash-arrow-up'}"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function filtrarProductos() {
    const texto = document.getElementById("buscador-productos").value.toLowerCase();
    const catId = document.getElementById("filtro-categoria-productos").value;

    let filtrados = productosCache;

    if (texto) {
        filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(texto));
    }

    if (catId) {
        filtrados = filtrados.filter(p => {
            // Check against array of categories
            return p.categorias.some(c => c.id == catId);
        });
    }

    // Since user is searching, show all matches (or limit if too many, but usually search narrows it down)
    renderProductos(filtrados.slice(0, 100));
}

async function guardarProducto(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    // === CORRECCIÓN CLAVE: Validar existencia antes de leer .checked ===
    const checkOferta = form.querySelector('input[name="es_oferta"]');
    if (checkOferta) formData.set("es_oferta", checkOferta.checked);

    const checkNuevo = form.querySelector('input[name="es_nuevo"]');
    if (checkNuevo) formData.set("es_nuevo", checkNuevo.checked);

    // ELIMINADO: formData.set("en_carrusel", ...) porque ese input YA NO EXISTE
    // Lo mandamos false por defecto para que la base de datos no se queje
    formData.set("en_carrusel", false); 

    // Categorías
    const catsChecked = Array.from(document.querySelectorAll('input[name="categorias"]:checked')).map(c => c.value);
    formData.append("categorias", JSON.stringify(catsChecked));

    const id = document.getElementById("producto-id").value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/api/productos/${id}` : "/api/productos";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": `Bearer ${tokenAdmin}` },
            body: formData
        });
        if (res.ok) {
            Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
            resetFormProducto();
            cargarProductos();
            // cargarProductosCarrusel(); <--- ELIMINADO
        } else {
            const err = await res.json();
            Swal.fire({ icon: 'error', title: 'Error', text: err.error || 'No se pudo guardar' });
        }
    } catch (e) { console.error(e); }
}

window.editarProducto = function (id) {
    // 1. Cerrar variantes anteriores para que no estorben
    const secVar = document.getElementById("seccionVariantes");
    if (secVar) secVar.style.display = "none";

    const p = productosCache.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById("producto-id").value = p.id;
    document.getElementById("prod-nombre").value = p.nombre;
    document.getElementById("prod-precio").value = p.precio;

    // Inputs opcionales con chequeo de seguridad
    const inputOferta = document.querySelector('input[name="precio_oferta"]');
    if (inputOferta) inputOferta.value = p.precio_oferta || '';

    const checkOferta = document.querySelector('input[name="es_oferta"]');
    if (checkOferta) checkOferta.checked = !!p.es_oferta;

    const checkNuevo = document.querySelector('input[name="es_nuevo"]');
    if (checkNuevo) checkNuevo.checked = !!p.es_nuevo;

    // Imagen preview
    const imgPreview = document.getElementById("preview-imagen");
    if (imgPreview) {
        imgPreview.src = p.imagen || '';
        imgPreview.style.display = p.imagen ? "block" : "none";
    }

    // Categorías - Robust check
    document.querySelectorAll('input[name="categorias"]').forEach(cb => cb.checked = false);
    if (p.categorias) {
        p.categorias.forEach(cat => {
            const cb = document.querySelector(`input[name="categorias"][value="${cat.id}"]`);
            if (cb) cb.checked = true;
        });
    }

    const btnGuardar = document.getElementById("btn-guardar-producto");
    if (btnGuardar) btnGuardar.textContent = "Actualizar";

    const btnCancel = document.getElementById("cancelar-edicion-producto");
    if (btnCancel) btnCancel.style.display = "inline-block";

    // 2. SCROLL AUTOMÁTICO AL FORMULARIO (Mejorado)
    setTimeout(() => {
        const form = document.getElementById("formulario-producto");
        if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
};

function resetFormProducto() {
    const form = document.getElementById("formulario-producto");
    if (form) form.reset();

    document.getElementById("producto-id").value = "";

    const btnGuardar = document.getElementById("btn-guardar-producto");
    if (btnGuardar) btnGuardar.textContent = "Guardar";

    const btnCancel = document.getElementById("cancelar-edicion-producto");
    if (btnCancel) btnCancel.style.display = "none";

    const imgPreview = document.getElementById("preview-imagen");
    if (imgPreview) imgPreview.style.display = "none";
}

window.eliminarProducto = async function (id, activoActual) {
    if (!confirm(activoActual ? "¿Pausar producto?" : "¿Reactivar producto?")) return;
    const endpoint = activoActual ? 'desactivar' : 'activar';
    try {
        await fetch(`/api/productos/${endpoint}/${id}`, {
            method: "PUT", headers: { "Authorization": `Bearer ${tokenAdmin}` }
        });
        cargarProductos();
    } catch (e) { console.error(e); }
};

// =========================================================
// 2. GESTIÓN DE CATEGORÍAS
// =========================================================
async function cargarCategorias() {
    try {
        const res = await fetch("/api/categorias", { headers: { "Authorization": `Bearer ${tokenAdmin}` } });
        const cats = await res.json();

        // Renderizar lista para eliminar
        const listContainer = document.getElementById("lista-categorias");
        if (listContainer) {
            listContainer.innerHTML = cats.map(c => `
                <div class="categoria-item" style="display:flex; justify-content:space-between; padding:15px; border:1px solid #e0e0e0; border-radius: 8px; background: white; align-items:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="font-weight: 500;">${c.nombre}</div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="editarCategoria(${c.id}, '${c.nombre}')" style="color:#007bff; border:none; background:none; cursor:pointer;" title="Editar">
                           <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="eliminarCategoria(${c.id})" style="color:#dc3545; border:none; background:none; cursor:pointer;" title="Borrar">
                           <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Renderizar filter dropdown
        const filtro = document.getElementById("filtro-categoria-productos");
        if (filtro) {
            const currentVal = filtro.value;
            filtro.innerHTML = '<option value="">Todas las categorías</option>' +
                cats.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
            filtro.value = currentVal;
        }

        // Renderizar checkboxes en formulario producto
        const checkContainer = document.getElementById("categorias-container");
        if (checkContainer) {
            checkContainer.innerHTML = cats.map(c => `
                <label style="display:inline-flex; gap:5px; align-items:center; margin-right:10px; cursor:pointer;">
                    <input type="checkbox" name="categorias" value="${c.id}"> ${c.nombre}
                </label>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

async function agregarCategoria(e) {
    e.preventDefault();
    const input = e.target.querySelector('input[name="nombre"]');
    if (!input) return;
    const nombre = input.value;

    await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ nombre })
    });
    e.target.reset();
    cargarCategorias();
}

window.editarCategoria = async function (id, nombreActual) {
    const { value: nuevoNombre } = await Swal.fire({
        title: 'Editar Categoría',
        input: 'text',
        inputValue: nombreActual,
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value) { return 'Debes escribir un nombre!' }
        }
    });

    if (nuevoNombre && nuevoNombre !== nombreActual) {
        try {
            const res = await fetch(`/api/categorias/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenAdmin}` },
                body: JSON.stringify({ nombre: nuevoNombre })
            });
            if (res.ok) {
                Swal.fire("Actualizado", "", "success");
                cargarCategorias();
            } else {
                Swal.fire("Error", "No se pudo actualizar", "error");
            }
        } catch (e) { console.error(e); }
    }
}

window.eliminarCategoria = async function (id) {
    // Check product count in cache first to give instance feedback
    const productosEnCategoria = productosCache.filter(p => p.categorias && p.categorias.some(c => c.id == id));

    if (productosEnCategoria.length > 0) {
        const confirmResult = await Swal.fire({
            title: 'Categoría en uso',
            text: `Hay ${productosEnCategoria.length} productos usando esta categoría. Si la eliminas, esos productos quedarán sin ella. ¿Seguro?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmResult.isConfirmed) return;
    } else {
        if (!confirm("¿Eliminar categoría vacía?")) return;
    }

    try {
        const res = await fetch(`/api/categorias/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${tokenAdmin}` } });
        const data = await res.json();

        if (!res.ok) {
            Swal.fire("Error", data.error || "No se pudo eliminar", "error");
        } else {
            Swal.fire("Eliminado", "Categoría eliminada.", "success");
            cargarCategorias();
        }
    } catch (e) { console.error(e); }
};

// =========================================================
// 3. GESTIÓN DE VARIANTES
// =========================================================
let prodVarianteId = null;

window.editarVariantes = function (id, nombre) {
    prodVarianteId = id;
    const nombreEl = document.getElementById("nombre-producto-variante");
    if (nombreEl) nombreEl.textContent = nombre;

    const secVar = document.getElementById("seccionVariantes");
    if (secVar) {
        secVar.style.display = "block";
        secVar.scrollIntoView({ behavior: 'smooth' });
    }
    cargarVariantes(id);
};

async function cargarVariantes(id) {
    const res = await fetch(`/api/variantes/${id}`, { headers: { "Authorization": `Bearer ${tokenAdmin}` } });
    const variantes = await res.json();
    const tbody = document.querySelector("#tabla-variantes tbody");
    if (tbody) {
        tbody.innerHTML = variantes.map(v => `
            <tr>
                <td>${v.tipo}</td>
                <td>${v.nombre}</td>
                <td>$${v.precio_extra}</td>
                <td><button onclick="eliminarVariante(${v.id})" class="btn-del"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    }
}

async function agregarVariante(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.id_producto = prodVarianteId;
    await fetch("/api/variantes", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenAdmin}` },
        body: JSON.stringify(data)
    });
    e.target.reset();
    cargarVariantes(prodVarianteId);
}

window.eliminarVariante = async function (id) {
    if (!confirm("¿Borrar variante?")) return;
    await fetch(`/api/variantes/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${tokenAdmin}` } });
    cargarVariantes(prodVarianteId);
};

// =========================================================
// 4. ESTADO DEL LOCAL
// =========================================================
async function cargarEstadoLocal() {
    try {
        const res = await fetch("/api/configuracion");
        if (!res.ok) return;
        const config = await res.json();

        const texto = document.getElementById("estado-local-texto");
        // Manejar mayúsculas/minúsculas o falta de dato
        const estado = config.estado_local || config.ESTADO_LOCAL || "ABIERTO";

        if (texto) {
            texto.textContent = estado.toUpperCase();
            texto.style.color = estado.toUpperCase() === "ABIERTO" ? "green" : "red";
        }
    } catch (e) { console.error(e); }
}

async function toggleEstadoLocal() {
    const texto = document.getElementById("estado-local-texto");
    if (!texto) return;

    const nuevo = texto.textContent === "ABIERTO" ? "CERRADO" : "ABIERTO";
    await fetch("/api/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ clave: "estado_local", valor: nuevo })
    });
    cargarEstadoLocal();
}

// =========================================================
// 5. PEDIDOS (HISTORIAL)
// =========================================================
async function buscarPedidoPorId() {
    const input = document.getElementById("buscar-compra-id");
    if (!input) return;
    const id = input.value;
    const contenedor = document.getElementById("resultado-busqueda");
    if (!contenedor) return;

    contenedor.innerHTML = "Buscando...";

    try {
        const res = await fetch(`/api/pedidos/${id}`, { headers: { "Authorization": `Bearer ${tokenAdmin}` } });
        if (!res.ok) {
            contenedor.innerHTML = "<p style='color:red;'>Pedido no encontrado.</p>";
            return;
        }
        const pedido = await res.json();

        let detalles = [];
        try { detalles = typeof pedido.detalles === 'string' ? JSON.parse(pedido.detalles) : pedido.detalles; } catch (e) { }

        if ((!detalles || detalles.length === 0) && pedido.productos) {
            detalles = pedido.productos;
        }

        const usuarioInfo = pedido.usuario
            ? `<p><strong>Usuario:</strong> ${pedido.usuario.nombre} (${pedido.usuario.email})</p>`
            : '<p><strong>Usuario:</strong> Invitado / No registrado</p>';

        contenedor.innerHTML = `
            <div style="background:#f9f9f9; padding:15px; border:1px solid #ddd; margin-top:10px; border-radius:8px;">
                <h4 style="margin-top:0;">Pedido #${pedido.pedido_id || pedido.id}</h4>
                <p><strong>Total:</strong> $${pedido.total}</p>
                <p><strong>Fecha:</strong> ${new Date(pedido.fecha_compra).toLocaleString()}</p>
                <p><strong>Pago/Envio:</strong> ${pedido.tipo_envio} - ${pedido.zona || 'N/A'}</p>
                ${usuarioInfo}
                <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
                <h5>Items:</h5>
                <ul style="padding-left:20px;">
                    ${detalles.map(d => `
                        <li>
                            ${d.cantidad}x ${d.nombre} ($${d.precio || d.precio_unitario})
                            ${d.variantes && d.variantes !== "Sin variantes" ? `<br><small style="color:gray;">${d.variantes}</small>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    } catch (e) {
        console.error(e);
        contenedor.innerHTML = "<p>Error al buscar.</p>";
    }
}