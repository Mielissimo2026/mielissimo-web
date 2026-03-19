const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");
const db = require('./db');
const cloudinary = require('./config/cloudinary');

require('dotenv').config();

const app = express();
const PORT = 3000;
const JWT_SECRET = "claveultrasecreta123";
const mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔸 Multer configuración para subir imágenes
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + '-' + file.originalname;
    cb(null, nombreUnico);
  }
});
const upload = multer({ storage });

// 🔸 Middlewares
app.use(cors());
app.use(express.json());

// Proteger admin.html para acceso directo
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'admin.html'));
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// 🛠️ MIGRATION / SCHEMA UPDATE ON START
db.query("SHOW COLUMNS FROM productos LIKE 'fecha_creacion'", (err, result) => {
  if (!err && result.length === 0) {
    console.log("⚠️ Columna 'fecha_creacion' no existe. Intentando agregar...");
    db.query("ALTER TABLE productos ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
      if (err) console.error("❌ Error agregando columna fecha_creacion:", err);
      else console.log("✅ Columna 'fecha_creacion' agregada correctamente.");
    });
  }
});

// Add es_nuevo
db.query("SHOW COLUMNS FROM productos LIKE 'es_nuevo'", (err, result) => {
  if (!err && result.length === 0) {
    db.query("ALTER TABLE productos ADD COLUMN es_nuevo BOOLEAN DEFAULT FALSE", (err) => {
      if (err) console.error("❌ Error agregando columna es_nuevo");
      else console.log("✅ Columna 'es_nuevo' agregada.");
    });
  }
});

// Add en_carrusel
db.query("SHOW COLUMNS FROM productos LIKE 'en_carrusel'", (err, result) => {
  if (!err && result.length === 0) {
    db.query("ALTER TABLE productos ADD COLUMN en_carrusel BOOLEAN DEFAULT FALSE", (err) => {
      if (err) console.error("❌ Error agregando columna en_carrusel");
      else console.log("✅ Columna 'en_carrusel' agregada.");
    });
  }
});

// Add descripcion_carrusel
db.query("SHOW COLUMNS FROM productos LIKE 'descripcion_carrusel'", (err, result) => {
  if (!err && result.length === 0) {
    db.query("ALTER TABLE productos ADD COLUMN descripcion_carrusel TEXT", (err) => {
      if (err) console.error("❌ Error agregando columna descripcion_carrusel");
      else console.log("✅ Columna 'descripcion_carrusel' agregada.");
    });
  }
});

// Add carrusel_etiqueta
db.query("SHOW COLUMNS FROM productos LIKE 'carrusel_etiqueta'", (err, result) => {
  if (!err && result.length === 0) {
    db.query("ALTER TABLE productos ADD COLUMN carrusel_etiqueta VARCHAR(50) DEFAULT 'NINGUNO'", (err) => {
      if (err) console.error("❌ Error agregando columna carrusel_etiqueta");
      else console.log("✅ Columna 'carrusel_etiqueta' agregada.");
    });
  }
});


// 🔐 Middleware para validar token
function verificarToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No autorizado" });

  const token = auth.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });
    req.usuario = decoded.usuario;
    next();
  });
}

// ==============================
// ⚙️ CONFIGURACIÓN GLOBAL
// ==============================
app.get("/api/configuracion", (req, res) => {
  db.query("SELECT * FROM configuracion", (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener configuración" });

    // Transform to object { clave: valor }
    const config = {};
    resultados.forEach(row => {
      config[row.clave] = row.valor;
    });
    res.json(config);
  });
});

app.post("/api/configuracion", verificarToken, (req, res) => {
  const { clave, valor } = req.body;
  if (!clave || !valor) return res.status(400).json({ error: "Clave y Valor requeridos" });

  const sql = "INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?";
  db.query(sql, [clave, valor, valor], (err) => {
    if (err) return res.status(500).json({ error: "Error al guardar configuración" });
    res.json({ mensaje: "Configuración actualizada" });
  });
});

// ==============================
// 🖼️ BANNER CAROUSEL
// ==============================
app.get("/api/banners", (req, res) => {
  db.query("SELECT * FROM banners WHERE activo = TRUE ORDER BY id DESC", (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener banners" });
    res.json(resultados);
  });
});

app.post("/api/banners", verificarToken, upload.single("imagen"), async (req, res) => {
  const { titulo } = req.body;

  if (!req.file) return res.status(400).json({ error: "Imagen requerida" });

  try {
    const resultado = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners_mielissimo",
      quality: "auto",
      fetch_format: "auto"
    });
    const imagenUrl = resultado.secure_url;

    db.query("INSERT INTO banners (imagen_url, titulo) VALUES (?, ?)", [imagenUrl, titulo], (err, result) => {
      if (err) return res.status(500).json({ error: "Error al guardar banner" });
      res.status(201).json({ mensaje: "Banner creado", id: result.insertId, imagen_url: imagenUrl });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir imagen" });
  }
});

app.delete("/api/banners/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM banners WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error eliminando banner" });
    res.json({ mensaje: "Banner eliminado" });
  });
});

// ==============================
// 📂 RUTAS CATEGORÍAS
// ==============================
app.get("/api/categorias", (req, res) => {
  db.query("SELECT * FROM categorias", (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener categorías" });
    res.json(resultados);
  });
});

app.post("/api/categorias", verificarToken, (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });

  db.query("INSERT INTO categorias (nombre) VALUES (?)", [nombre], (err, resultado) => {
    if (err) return res.status(500).json({ error: "Error al agregar categoría" });
    res.status(201).json({ mensaje: "Categoría creada", id: resultado.insertId });
  });
});

app.put("/api/categorias/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });

  db.query("UPDATE categorias SET nombre = ? WHERE id = ?", [nombre, id], err => {
    if (err) return res.status(500).json({ error: "Error al actualizar categoría" });
    res.json({ mensaje: "Categoría actualizada correctamente" });
  });
});

app.delete("/api/categorias/:id", verificarToken, (req, res) => {
  const { id } = req.params;

  db.query("SELECT COUNT(*) AS total FROM productos WHERE categoria_id = ? AND activo = TRUE", [id], (err, resultado) => {
    if (err) return res.status(500).json({ error: "Error al verificar productos activos asociados" });

    const total = resultado[0].total;
    if (total > 0) {
      return res.status(400).json({ error: "No se puede eliminar una categoría que tiene productos activos." });
    }

    // Desasociar productos de la tabla pivot tambien por si acaso (aunque la logica principal usa pivot ahora)
    db.query("DELETE FROM producto_categorias WHERE categoria_id = ?", [id], (errCat) => {
      // Ignoramos error aqui, intentamos borrar
    });

    db.query("UPDATE productos SET categoria_id = NULL WHERE categoria_id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: "Error al desasociar productos inactivos" });

      db.query("DELETE FROM categorias WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Error al eliminar categoría" });
        res.json({ mensaje: "Categoría eliminada correctamente" });
      });
    });
  });
});

// ==============================
// 📂 RUTAS PRODUCTOS
// ==============================
app.get("/api/productos", (req, res) => {
  const { categoria, id, mostrarInactivos, q } = req.query;

  let sql = `
    SELECT p.*, 
            GROUP_CONCAT(c.id) as categorias_ids,
            GROUP_CONCAT(c.nombre) as categorias_nombres
    FROM productos p
    LEFT JOIN producto_categorias pc ON p.id = pc.producto_id
    LEFT JOIN categorias c ON pc.categoria_id = c.id
    WHERE 1
  `;
  const valores = [];

  if (id) {
    sql += " GROUP BY p.id ORDER BY p.es_nuevo DESC, p.id DESC"
    valores.push(id);
  } else if (categoria) {
    sql += " AND p.id IN (SELECT producto_id FROM producto_categorias WHERE categoria_id = ?)";
    valores.push(categoria);
  }

  // SEARCH LOGIC
  if (q) {
    sql += " AND p.nombre LIKE ?";
    valores.push(`%${q}%`);
  }

  if (mostrarInactivos !== "true") {
    sql += " AND p.activo = TRUE";
  }

  // FIX: Sort by 'es_nuevo' (treating null as 0) DESC, then by ID DESC 
  sql += " GROUP BY p.id ORDER BY COALESCE(p.es_nuevo, 0) DESC, p.id DESC";

  db.query(sql, valores, (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener productos" });

    if (resultados.length === 0) return res.json([]);

    // Get Variants separately to avoid join complexity
    // We get ALL variants for the fetched products
    const productIds = resultados.map(p => p.id);
    if (productIds.length === 0) return res.json([]);

    // This is safe provided we don't have thousands of products in one page. 
    // For pagination we should limit above but client handles pagination based on user request.
    const sqlVariantes = `SELECT * FROM variantes WHERE id_producto IN (${productIds.join(',')})`;

    db.query(sqlVariantes, (errV, variantesRes) => {
      if (errV) {
        console.error("Error fetching variantes", errV);
        // Don't fail the whole request, return products without variants
        // or return [] for variants
      }

      const variantesPorProducto = {};
      if (!errV && variantesRes) {
        variantesRes.forEach(v => {
          if (!variantesPorProducto[v.id_producto]) variantesPorProducto[v.id_producto] = [];
          variantesPorProducto[v.id_producto].push(v);
        });
      }

      // Process results
      const productos = resultados.map(prod => {
        const catIds = prod.categorias_ids ? prod.categorias_ids.toString().split(',').map(Number) : [];
        const catNombres = prod.categorias_nombres ? prod.categorias_nombres.toString().split(',') : [];

        const categorias = catIds.map((id, index) => ({
          id: id,
          nombre: catNombres[index]
        }));

        return {
          ...prod,
          categorias,
          categoria_id: catIds[0] || null,
          categoria_nombre: catNombres[0] || null,
          variantes: variantesPorProducto[prod.id] || [] // Attach variants array
        };
      });

      res.json(productos);
    });
  });
});

app.post("/api/productos", verificarToken, upload.single("imagen"), async (req, res) => {
  const { nombre, precio, categoria_id, precio_oferta, es_oferta, categorias } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Imagen requerida" });
  }

  try {
    const resultado = await cloudinary.uploader.upload(req.file.path, {
      folder: "productos_mielissimo",
      quality: "auto",
      fetch_format: "auto"
    });

    const imagenUrl = resultado.secure_url;

    const esOfertaVal = es_oferta === 'true' || es_oferta === true || es_oferta === 1 ? 1 : 0;
    const esNuevoVal = req.body.es_nuevo === 'true' || req.body.es_nuevo === true || req.body.es_nuevo === 1 ? 1 : 0;
    const enCarruselVal = req.body.en_carrusel === 'true' || req.body.en_carrusel === true || req.body.en_carrusel === 1 ? 1 : 0;
    const precioOfertaVal = precio_oferta ? parseFloat(precio_oferta) : null;

    db.query(
      "INSERT INTO productos (nombre, precio, imagen, categoria_id, activo, precio_oferta, es_oferta, es_nuevo, en_carrusel) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)",
      [nombre, precio, imagenUrl, categoria_id || null, precioOfertaVal, esOfertaVal, esNuevoVal, enCarruselVal],
      (err, resultadoDb) => {
        if (err) return res.status(500).json({ error: "Error al insertar producto" });

        const productoId = resultadoDb.insertId;

        // --- ROBUST CATEGORY HANDLING ---
        let categoriasArray = [];
        if (categorias) {
          try {
            // Check if it's already an array or needs parsing
            if (Array.isArray(categorias)) {
              categoriasArray = categorias;
            } else if (typeof categorias === 'string') {
              categoriasArray = JSON.parse(categorias);
            }
          } catch (e) {
            console.error("Error parsing categorias JSON", e);
          }
        }

        // Add legacy categoria_id if not present
        if (categoria_id && !categoriasArray.includes(Number(categoria_id))) {
          categoriasArray.push(Number(categoria_id));
        }

        // Deduplicate and filter valid IDs
        const uniqueCats = [...new Set(categoriasArray.map(Number))].filter(id => !isNaN(id));

        if (uniqueCats.length > 0) {
          const values = uniqueCats.map(cid => [productoId, cid]);
          db.query("INSERT INTO producto_categorias (producto_id, categoria_id) VALUES ?", [values], (errCat) => {
            if (errCat) console.error("Error linking categories", errCat);
            res.status(201).json({ mensaje: "Producto agregado", id: productoId });
          });
        } else {
          res.status(201).json({ mensaje: "Producto agregado", id: productoId });
        }
      }
    );
  } catch (error) {
    console.error("Error subiendo a Cloudinary:", error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});



app.put("/api/productos/:id", verificarToken, upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria_id, precio_oferta, es_oferta, categorias } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    let nuevaImagenUrl = null;
    if (req.file) {
      const resultado = await cloudinary.uploader.upload(req.file.path, {
        folder: "productos_mielissimo",
        quality: "auto",
        fetch_format: "auto"
      });
      nuevaImagenUrl = resultado.secure_url;
    }

    const esOfertaVal = es_oferta === 'true' || es_oferta === true || es_oferta === 1 ? 1 : 0;
    const esNuevoVal = req.body.es_nuevo === 'true' || req.body.es_nuevo === true || req.body.es_nuevo === 1 ? 1 : 0;
    const enCarruselVal = req.body.en_carrusel === 'true' || req.body.en_carrusel === true || req.body.en_carrusel === 1 ? 1 : 0;
    const precioOfertaVal = precio_oferta ? parseFloat(precio_oferta) : null;

    const sql = nuevaImagenUrl
      ? "UPDATE productos SET nombre=?, precio=?, imagen=?, categoria_id=?, precio_oferta=?, es_oferta=?, es_nuevo=?, en_carrusel=? WHERE id=?"
      : "UPDATE productos SET nombre=?, precio=?, categoria_id=?, precio_oferta=?, es_oferta=?, es_nuevo=?, en_carrusel=? WHERE id=?";

    const valores = nuevaImagenUrl
      ? [nombre, precio, nuevaImagenUrl, categoria_id || null, precioOfertaVal, esOfertaVal, esNuevoVal, enCarruselVal, id]
      : [nombre, precio, categoria_id || null, precioOfertaVal, esOfertaVal, esNuevoVal, enCarruselVal, id];

    db.query(sql, valores, err => {
      if (err) return res.status(500).json({ error: "Error al actualizar producto" });

      // --- ROBUST CATEGORY HANDLING ---
      let categoriasArray = [];
      if (categorias) {
        try {
          if (Array.isArray(categorias)) {
            categoriasArray = categorias;
          } else if (typeof categorias === 'string') {
            categoriasArray = JSON.parse(categorias);
          }
        } catch (e) {
          console.error("Error parsing categorias JSON", e);
        }
      }

      // Legacy support
      if (categoria_id && !categoriasArray.includes(Number(categoria_id))) {
        categoriasArray.push(Number(categoria_id));
      }

      const uniqueCats = [...new Set(categoriasArray.map(Number))].filter(id => !isNaN(id));

      // First delete existing links
      db.query("DELETE FROM producto_categorias WHERE producto_id = ?", [id], (errDel) => {
        if (errDel) console.error("Error deleting old categories", errDel);

        if (uniqueCats.length > 0) {
          const values = uniqueCats.map(cid => [id, cid]);
          db.query("INSERT INTO producto_categorias (producto_id, categoria_id) VALUES ?", [values], (errIns) => {
            if (errIns) console.error("Error inserting new categories", errIns);
            res.json({ mensaje: "Producto actualizado correctamente" });
          });
        } else {
          res.json({ mensaje: "Producto actualizado correctamente" });
        }
      });
    });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});



app.delete("/api/productos/:id", verificarToken, (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Intentando eliminar producto ID: ${id}`);

  db.query("SELECT imagen FROM productos WHERE id = ?", [id], (err, resultado) => {
    if (err) {
      console.error("❌ Error al buscar producto:", err);
      return res.status(500).json({ error: "Error al buscar el producto" });
    }

    if (resultado.length === 0) {
      console.warn("⚠️ Producto no encontrado");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const imagen = resultado[0].imagen;
    const nombreArchivo = imagen && imagen.includes("/uploads/")
      ? imagen.replace("/uploads/", "")
      : null;

    const rutaImagen = nombreArchivo ? path.join(__dirname, "uploads", nombreArchivo) : null;

    db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
      if (err) {
        console.error("❌ Error al eliminar producto:", err);
        return res.status(500).json({ error: "Error al eliminar producto" });
      }

      if (rutaImagen) {
        fs.unlink(rutaImagen, (err) => {
          if (err && err.code !== "ENOENT") {
            console.error("🧨 Error al eliminar imagen:", err);
          } else {
            console.log("🧹 Imagen eliminada correctamente o no existía");
          }
        });
      }

      res.json({ mensaje: "Producto eliminado correctamente" });
    });
  });
});

app.put("/api/productos/desactivar/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  db.query("UPDATE productos SET activo = FALSE WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error al desactivar producto" });
    res.json({ mensaje: "Producto desactivado correctamente" });
  });
});

app.put("/api/productos/activar/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  db.query("UPDATE productos SET activo = TRUE WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error al activar producto" });
    res.json({ mensaje: "Producto activado correctamente" });
  });
});

app.put("/api/productos/toggle-carrusel/:id", verificarToken, (req, res) => {
  const { id } = req.params;
  const { en_carrusel } = req.body;
  const val = en_carrusel ? 1 : 0;

  db.query("UPDATE productos SET en_carrusel = ? WHERE id = ?", [val, id], (err) => {
    if (err) return res.status(500).json({ error: "Error actualizando carrusel" });
    res.json({ mensaje: "Estado de carrusel actualizado" });
  });
});

// Update Carousel Details
app.put("/api/productos/:id/carrusel", verificarToken, (req, res) => {
  const { id } = req.params;
  const { en_carrusel, descripcion, etiqueta } = req.body;
  const val = en_carrusel ? 1 : 0;

  const sql = "UPDATE productos SET en_carrusel = ?, descripcion_carrusel = ?, carrusel_etiqueta = ? WHERE id = ?";
  db.query(sql, [val, descripcion, etiqueta, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error actualizando detalles del carrusel" });
    }
    res.json({ mensaje: "Carrusel actualizado correctamente" });
  });
});

// ==============================
// 🔐 LOGIN ADMIN
// ==============================
app.post("/api/admin/login", (req, res) => {
  const { usuario, clave } = req.body;

  db.query("SELECT * FROM admins WHERE usuario = ?", [usuario], (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error en DB" });
    if (resultados.length === 0) return res.status(401).json({ error: "Usuario no existe" });

    const admin = resultados[0];
    bcrypt.compare(clave, admin.clave, (err, esValida) => {
      if (err || !esValida) return res.status(401).json({ error: "Clave incorrecta" });

      const token = jwt.sign({ usuario: admin.usuario }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ mensaje: "Login exitoso", token });
    });
  });
});

// ==============================
// 📬 NEWSLETTER
// ==============================
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido" });
  }

  // Primero, guardar en tu base de datos local
  db.query("INSERT INTO suscriptores (email) VALUES (?)", [email], async (err) => {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Correo ya registrado" });
    }
    if (err) {
      return res.status(500).json({ error: "Error al suscribir" });
    }

    // Luego, enviar a Mailchimp
    try {
      await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID, {
        email_address: email,
        status: "subscribed"
      });

      return res.status(201).json({ mensaje: "¡Suscripción exitosa!" });
    } catch (mcError) {
      console.error("Error al enviar a Mailchimp:", mcError.response?.body || mcError.message);
      return res.status(500).json({ error: "Suscripto localmente, pero error en Mailchimp" });
    }
  });
});


// ==============================
// 👥 USUARIOS
// ==============================
app.post("/api/usuarios/registro", (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: "Faltan campos" });

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Error al encriptar" });

    db.query("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)", [nombre, email, hash], (err) => {
      if (err && err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Correo ya registrado" });
      if (err) return res.status(500).json({ error: "Error al registrar usuario" });
      res.status(201).json({ mensaje: "Usuario registrado correctamente" });
    });
  });
});

app.post("/api/usuarios/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Faltan campos" });

  db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (resultados.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const usuario = resultados[0];
    bcrypt.compare(password, usuario.password, (err, esValida) => {
      if (err || !esValida) return res.status(401).json({ error: "Contraseña incorrecta" });

      const token = jwt.sign({ usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        mensaje: "Login exitoso",
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email
        }
      });
    });
  });
});


// ==============================
// 🧾 COMPRAS (con y sin sesión)
// ==============================
app.post("/api/compras", (req, res) => {
  const { id_usuario, carrito, tipoEnvio, zona, total } = req.body;

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).json({ error: "Datos inválidos para la compra." });
  }

  const fecha_compra = new Date().toISOString().slice(0, 19).replace("T", " ");
  const tipo = tipoEnvio || "retiro";
  const usuarioId = id_usuario && !isNaN(id_usuario) ? id_usuario : null;

  // Usamos el primer item para obtener pedido_id
  const primerItem = carrito[0];

  // Función para calcular precio final (producto + variante Tamaño si aplica)
  const calcularPrecioFinal = (productoPrecio, variantes) => {
    if (!variantes || variantes.length === 0) return productoPrecio;

    const varianteTamaño = variantes.find(v => v.tipo === "Tamaño" && v.precio_extra);
    const extra = varianteTamaño ? parseFloat(varianteTamaño.precio_extra) : 0;

    return parseFloat(productoPrecio) + extra;
  };

  // Guardar variantes como texto legible
  const variantesTexto = primerItem.variantes && primerItem.variantes.length > 0
    ? primerItem.variantes.map(v => `${v.tipo}: ${v.nombre}`).join(", ")
    : "Sin variantes";

  const precioUnitarioPrimer = calcularPrecioFinal(primerItem.precio, primerItem.variantes);

  // Insertar el primer producto
  db.query(
    `INSERT INTO compras (id_usuario, id_producto, cantidad, precio_unitario, fecha_compra, tipo_envio, zona, variantes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, primerItem.id, primerItem.cantidad, precioUnitarioPrimer, fecha_compra, tipo, zona, variantesTexto],
    (err, result) => {
      if (err) {
        console.error("Error al insertar producto:", err);
        return res.status(500).json({ error: "Error al registrar la compra." });
      }

      const pedidoId = result.insertId;

      // Actualizamos pedido_id para el primer registro
      db.query(`UPDATE compras SET pedido_id = ? WHERE id = ?`, [pedidoId, pedidoId]);

      // Insertar los demás productos
      let insertados = 1;
      for (let i = 1; i < carrito.length; i++) {
        const item = carrito[i];

        const variantesTextoItem = item.variantes && item.variantes.length > 0
          ? item.variantes.map(v => `${v.tipo}: ${v.nombre}`).join(", ")
          : "Sin variantes";

        const precioUnitario = calcularPrecioFinal(item.precio, item.variantes);

        db.query(
          `INSERT INTO compras (id_usuario, id_producto, cantidad, precio_unitario, fecha_compra, tipo_envio, zona, variantes, pedido_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [usuarioId, item.id, item.cantidad, precioUnitario, fecha_compra, tipo, zona, variantesTextoItem, pedidoId],
          (err2) => {
            if (err2) {
              console.error("Error al insertar producto:", err2);
              return res.status(500).json({ error: "Error al registrar la compra." });
            }

            insertados++;
            if (insertados === carrito.length) {
              res.json({ mensaje: "Compra registrada correctamente", id: pedidoId });
            }
          }
        );
      }

      // Si solo había un producto
      if (carrito.length === 1) {
        res.json({ mensaje: "Compra registrada correctamente", id: pedidoId });
      }
    }
  );
});




app.get("/api/compras/:id_usuario", (req, res) => {
  const id = req.params.id_usuario;
  db.query(
    `SELECT c.*, p.nombre, p.imagen
     FROM compras c
     JOIN productos p ON c.id_producto = p.id
     WHERE c.id_usuario = ?
     ORDER BY c.fecha_compra DESC`,
    [id], (err, resultados) => {
      if (err) return res.status(500).json({ error: "Error al obtener compras" });
      res.json(resultados);
    }
  );
});

app.get("/api/historial", verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;

  const query = `
    SELECT 
      c.id,
      p.nombre AS nombre_producto,
      p.imagen,
      c.cantidad,
      c.fecha_compra,
      c.tipo_envio,
      p.precio,
      c.variantes
    FROM compras c
    JOIN productos p ON c.id_producto = p.id
    WHERE c.id_usuario = ?
    ORDER BY c.fecha_compra DESC
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("Error al obtener historial:", err);
      return res.status(500).json({ error: "Error al obtener historial" });
    }

    // Convertir JSON string de variantes a objeto (si existe)
    const historialConVariantes = results.map(compra => {
      try {
        compra.variantes = compra.variantes ? JSON.parse(compra.variantes) : [];
      } catch (e) {
        compra.variantes = [];
      }
      return compra;
    });

    res.json(historialConVariantes);
  });
});

// ✅ NUEVO ENDPOINT: GET /api/pedidos/:id con JOIN de usuarios y detalle
app.get("/api/pedidos/:id", verificarToken, (req, res) => {
  const { id } = req.params;

  // Obtenemos los productos del pedido + Info de usuario si existe
  const query = `
      SELECT c.pedido_id, c.fecha_compra, c.tipo_envio, c.zona, c.variantes,
             p.nombre AS producto, c.cantidad, c.precio_unitario,
             u.nombre as usuario_nombre, u.email as usuario_email, c.id_usuario
      FROM compras c
      JOIN productos p ON c.id_producto = p.id
      LEFT JOIN usuarios u ON c.id_usuario = u.id
      WHERE c.pedido_id = ?
    `;

  db.query(query, [id], (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener detalle de compra" });
    if (resultados.length === 0) return res.status(404).json({ error: "Compra no encontrada" });

    // Calcular total de los productos
    let total = resultados.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

    // Sumar costo de zona si es envío
    if (resultados[0].tipo_envio === "envio" && resultados[0].zona) {
      const preciosZonas = {
        "Zona centro": 1500,
        "Jds": 2000,
        "Ribera": 2000,
        "Barrio unión": 2500
      };
      total += preciosZonas[resultados[0].zona] || 0;
    }

    // Responder con los datos completos
    res.json({
      pedido_id: id,
      fecha_compra: resultados[0].fecha_compra,
      tipo_envio: resultados[0].tipo_envio,
      zona: resultados[0].zona,
      usuario: resultados[0].usuario_nombre ? {
        nombre: resultados[0].usuario_nombre,
        email: resultados[0].usuario_email,
        id: resultados[0].id_usuario
      } : null,
      detalles: JSON.stringify(resultados.map(item => ({
        nombre: item.producto,
        cantidad: item.cantidad,
        precio: item.precio_unitario,
        variantes: item.variantes
      }))), // Para compatibilidad con frontend que espera stringified JSON en 'detalles'
      productos: resultados.map(item => ({
        nombre: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        variantes: item.variantes
      })),
      total
    });
  });
});

// Buscar compra por ID individual (para panel admin) - Legacy
// Dejamos esto por compatibilidad, pero el frontend ahora usa /api/pedidos/:id
app.get("/api/compras/detalle/:id", verificarToken, (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT c.pedido_id, c.fecha_compra, c.tipo_envio, c.zona, c.variantes,
           p.nombre AS producto, c.cantidad, c.precio_unitario
    FROM compras c
    JOIN productos p ON c.id_producto = p.id
    WHERE c.pedido_id = ?
  `;

  db.query(query, [id], (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener detalle de compra" });
    if (resultados.length === 0) return res.status(404).json({ error: "Compra no encontrada" });

    // Calcular total de los productos
    let total = resultados.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

    // Sumar costo de zona si es envío
    if (resultados[0].tipo_envio === "envio" && resultados[0].zona) {
      const preciosZonas = {
        "Zona centro": 1500,
        "Jds": 2000,
        "Ribera": 2000,
        "Barrio unión": 2500
      };
      total += preciosZonas[resultados[0].zona] || 0;
    }

    // Responder con los datos completos
    res.json({
      pedido_id: id,
      fecha_compra: resultados[0].fecha_compra,
      tipo_envio: resultados[0].tipo_envio,
      zona: resultados[0].zona,
      productos: resultados.map(item => ({
        nombre: item.producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        variantes: item.variantes
      })),
      total
    });
  });
});




// ==============================
// 🧩 VARIANTES
// ==============================
app.get("/api/variantes/:id_producto", (req, res) => {
  const { id_producto } = req.params;

  db.query("SELECT * FROM variantes WHERE id_producto = ?", [id_producto], (err, resultados) => {
    if (err) return res.status(500).json({ error: "Error al obtener variantes" });
    res.json(resultados);
  });
});

app.post("/api/variantes", (req, res) => {
  const { id_producto, tipo, nombre, precio_extra } = req.body;

  const precioFinal = precio_extra === "" || precio_extra === undefined || precio_extra === null
    ? null
    : parseFloat(precio_extra);

  db.query(
    "INSERT INTO variantes (id_producto, tipo, nombre, precio_extra) VALUES (?, ?, ?, ?)",
    [id_producto, tipo, nombre, precioFinal],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error al crear variante" });
      res.json({ mensaje: "Variante creada correctamente", id: result.insertId });
    }
  );
});



app.put("/api/variantes/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, precio_extra } = req.body;

  // Convertimos precio_extra a null o número
  const precioFinal = precio_extra === "" || precio_extra === undefined || precio_extra === null
    ? null
    : parseFloat(precio_extra);

  // Query para actualizar (sin imágenes porque ya no usamos)
  const sql = "UPDATE variantes SET nombre=?, precio_extra=? WHERE id=?";

  db.query(sql, [nombre, precioFinal, id], (err) => {
    if (err) {
      console.error("Error al actualizar variante:", err);
      return res.status(500).json({ error: "Error al actualizar variante" });
    }
    res.json({ mensaje: "Variante actualizada correctamente" });
  });
});


app.delete("/api/variantes/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM variantes WHERE id = ?", [id], err => {
    if (err) return res.status(500).json({ error: "Error al eliminar variante" });
    res.json({ mensaje: "Variante eliminada correctamente" });
  });
});


// ==============================
// ❤️ FAVORITOS
// ==============================
app.get('/api/favoritos', verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;

  db.query(
    `SELECT f.producto_id, p.nombre, p.precio, p.imagen, p.stock, c.nombre AS categoria_nombre
     FROM favoritos f
     JOIN productos p ON f.producto_id = p.id
     LEFT JOIN categorias c ON p.categoria_id = c.id
     WHERE f.usuario_id = ?`,
    [usuarioId], (err, resultados) => {
      if (err) return res.status(500).json({ error: 'Error al obtener favoritos' });
      res.json(resultados);
    }
  );
});

app.post('/api/favoritos', verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;
  const { producto_id } = req.body;

  if (!producto_id) return res.status(400).json({ error: 'Falta producto_id' });

  db.query(
    'INSERT IGNORE INTO favoritos (usuario_id, producto_id) VALUES (?, ?)',
    [usuarioId, producto_id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al agregar favorito' });
      res.json({ mensaje: 'Agregado a favoritos' });
    }
  );
});

app.delete('/api/favoritos/:producto_id', verificarToken, (req, res) => {
  const usuarioId = req.usuario.id;
  const { producto_id } = req.params;

  db.query(
    'DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
    [usuarioId, producto_id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar favorito' });
      res.json({ mensaje: 'Eliminado de favoritos' });
    }
  );
});

// ==============================
// 🔑 RECUPERACIÓN DE CONTRASEÑA USUARIOS
// ==============================
app.post("/api/usuarios/recuperar", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email requerido" });
  }

  // Buscar si el email existe
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (results.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    // Generar token
    const token = require("crypto").randomBytes(32).toString("hex");

    // Guardar token en la base
    db.query("UPDATE usuarios SET reset_token = ? WHERE email = ?", [token, email], (err) => {
      if (err) return res.status(500).json({ error: "Error al guardar token" });

      // URL para resetear contraseña (ajustá la carpeta si es distinta)
      const resetUrl = `https://api.mielissimo.com.ar/reset-password.html?token=${token}`;


      // Responder rápido al frontend
      res.json({ mensaje: "Correo de recuperación enviado. Revisá tu bandeja de entrada." });

      // Enviar el correo en segundo plano
      const mailOptions = {
        from: `"Mielissimo" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Recuperación de contraseña",
        html: `
          <h2>Recuperación de contraseña</h2>
          <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Si no solicitaste este cambio, ignorá este correo.</p>
        `
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error("Error al enviar correo:", error);
        }
      });
    });
  });
});


// ==============================
// 🔑 RESET DE CONTRASEÑA USUARIOS
// ==============================

app.post("/api/usuarios/reset-password", async (req, res) => {
  const { token, nuevaPassword } = req.body;

  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
  }

  // Validar longitud mínima
  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  // Buscar usuario con ese token
  db.query("SELECT * FROM usuarios WHERE reset_token = ?", [token], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (results.length === 0) return res.status(400).json({ error: "Token inválido o expirado" });

    const userId = results[0].id;
    const emailUsuario = results[0].email;

    try {
      // Encriptar nueva contraseña
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

      // Actualizar contraseña y borrar token
      db.query(
        "UPDATE usuarios SET password = ?, reset_token = NULL WHERE id = ?",
        [hashedPassword, userId],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Error al actualizar contraseña" });

          // Enviar correo de confirmación
          const mailOptions = {
            from: `"Mielissimo" <${process.env.EMAIL_USER}>`,
            to: emailUsuario,
            subject: "Contraseña cambiada correctamente",
            html: `
              <h2>Tu contraseña fue cambiada con éxito</h2>
              <p>Si vos no realizaste este cambio, contactá con nuestro soporte inmediatamente.</p>
            `
          };

          transporter.sendMail(mailOptions, (error) => {
            if (error) {
              console.error("Error al enviar correo de confirmación:", error);
            }
          });

          res.json({ mensaje: "Contraseña actualizada correctamente" });
        }
      );
    } catch (e) {
      res.status(500).json({ error: "Error al procesar la contraseña" });
    }
  });
});

// ==============================
// 🔑 RECUPERACION Y RESETEO DE CONTRASEÑA ADMIN
// ==============================
app.post("/api/admin/recuperar", (req, res) => {
  const email = process.env.ADMIN_EMAIL; // correo fijo de tu cliente

  // Validamos que exista al menos un admin
  db.query("SELECT * FROM admins LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (results.length === 0) return res.status(404).json({ error: "Administrador no configurado" });

    const token = require("crypto").randomBytes(32).toString("hex");

    db.query("UPDATE admins SET reset_token = ? WHERE id = ?", [token, results[0].id], (err) => {
      if (err) return res.status(500).json({ error: "Error al guardar token" });

      const resetUrl = `https://api.mielissimo.com.ar/reset-password-admin.html?token=${token}`;

      res.json({ mensaje: "Correo de recuperación enviado. Revisá tu bandeja de entrada." });

      const mailOptions = {
        from: `"Mielissimo" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Recuperación de contraseña - Administrador",
        html: `
          <h2>Recuperación de contraseña</h2>
          <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Si no solicitaste este cambio, ignorá este correo.</p>
        `
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.error("Error al enviar correo de recuperación admin:", error);
        }
      });
    });
  });
});

app.post("/api/admin/reset-password", async (req, res) => {
  const { token, nuevaPassword } = req.body;

  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son requeridos" });
  }

  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }

  db.query("SELECT * FROM admins WHERE reset_token = ?", [token], async (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (results.length === 0) return res.status(400).json({ error: "Token inválido o expirado" });

    const adminId = results[0].id;
    const emailAdmin = process.env.ADMIN_EMAIL; // mismo correo fijo

    try {
      const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

      db.query(
        "UPDATE admins SET clave = ?, reset_token = NULL WHERE id = ?",
        [hashedPassword, adminId],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Error al actualizar contraseña" });

          const mailOptions = {
            from: `"Mielissimo" <${process.env.EMAIL_USER}>`,
            to: emailAdmin,
            subject: "Contraseña de administrador cambiada correctamente",
            html: `
              <h2>Tu contraseña de administrador fue cambiada con éxito</h2>
              <p>Si no realizaste este cambio, contactá con soporte.</p>
            `
          };

          transporter.sendMail(mailOptions, (error) => {
            if (error) {
              console.error("Error al enviar correo de confirmación admin:", error);
            }
          });

          res.json({ mensaje: "Contraseña de administrador actualizada correctamente" });
        }
      );
    } catch (e) {
      res.status(500).json({ error: "Error al procesar la contraseña" });
    }
  });
});

app.get("/api/productos/:id", (req, res) => {
  const { id } = req.params;

  const sqlProducto = `
    SELECT p.*, c.nombre AS categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ? AND p.activo = 1
  `;

  db.query(sqlProducto, [id], (err, productoRes) => {
    if (err) return res.status(500).json({ error: "Error al obtener producto" });
    if (productoRes.length === 0) return res.status(404).json({ error: "Producto no encontrado" });

    const producto = productoRes[0];

    // CORREGIDO: usamos la columna correcta `id_producto`
    const sqlVariantes = `
      SELECT id, nombre, tipo, precio_extra
      FROM variantes
      WHERE id_producto = ?
    `;

    db.query(sqlVariantes, [id], (err, variantesRes) => {
      if (err) return res.status(500).json({ error: "Error al obtener variantes" });

      res.json({
        ...producto,
        variantes: variantesRes || []
      });
    });
  });
});



// ==============================
// 🚀 INICIAR SERVIDOR
// ==============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);

});