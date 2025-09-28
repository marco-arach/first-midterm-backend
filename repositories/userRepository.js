const prisma = require('../config/prismaClient');

const createUser = async (name, email, password) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
};

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
};

module.exports = {
  createUser,
  findUserByEmail,
};