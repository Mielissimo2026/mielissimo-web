require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Conexión a Railway usando variables de entorno
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Cambiá el usuario y contraseña si querés
const usuario = 'admin';
const clavePlano = '123456';

// Verificar si el usuario ya existe
const verificarSQL = 'SELECT * FROM admins WHERE usuario = ?';

db.query(verificarSQL, [usuario], (err, resultados) => {
  if (err) {
    console.error('Error al verificar usuario:', err);
    return db.end();
  }

  if (resultados.length > 0) {
    console.log('El usuario ya existe. No se realizó ninguna acción.');
    return db.end();
  }

  // Hashear la clave y crear el usuario
  bcrypt.hash(clavePlano, 10, (err, hash) => {
    if (err) {
      console.error('Error al hashear la clave:', err);
      return db.end();
    }

    const insertSQL = 'INSERT INTO admins (usuario, clave) VALUES (?, ?)';
    db.query(insertSQL, [usuario, hash], (err) => {
      if (err) {
        console.error('Error al insertar admin:', err);
      } else {
        console.log('Admin creado con éxito');
      }
      db.end();
    });
  });
});
