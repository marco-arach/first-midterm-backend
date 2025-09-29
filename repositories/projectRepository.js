const prisma = require('../config/prismaClient');

const findProjectsByUser = async (userId) => {
    return prisma.project.findMany({
        where: {
            userId: parseInt(userId),
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const createProject = async (userId, name, data = "{}") => {
    return prisma.project.create({
        data: {
            name,
            data,
            userId: parseInt(userId),
        },
    });
};

const deleteProject = async (projectId) => {
    return prisma.project.delete({
        where: {
            id: parseInt(projectId),
        },
    });
};

module.exports = {
    findProjectsByUser,
    createProject,
    deleteProject,
};
