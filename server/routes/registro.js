const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // conexión a MySQL

// POST /api/registro
router.post('/', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el email ya está registrado
    const [existingUser] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado.' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    await pool.query(
      'INSERT INTO usuarios (nombre, email, contraseña) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error del servidor al registrar el usuario.' });
  }
});

module.exports = router;
