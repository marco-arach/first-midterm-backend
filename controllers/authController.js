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

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {

    const existingUser = await userRepository.findUserByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'El usuario no existe.' });
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Credenciales incorrectas.' });
    }

    const token = generateToken({ id: existingUser.id, email: existingUser.email });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
      },
      token,
    });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};


module.exports = {
  registerUser,
  loginUser
};