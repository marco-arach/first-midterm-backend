const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await userRepository.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userRepository.createUser(name, email, hashedPassword);

    const token = generateToken({ id: newUser.id, email: newUser.email });

    res.status(201).json({
      success: true,
      message: 'Registro exitoso',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error en el registro de usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};

module.exports = {
  registerUser,
};