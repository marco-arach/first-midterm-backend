const projectRepository = require('../repositories/projectRepository');

const getProjects = async (req, res) => {
    const { userId } = req.params;

    try {
        const projects = await projectRepository.findProjectsByUser(userId);
        res.json({ success: true, projects });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

const createProject = async (req, res) => {
    const { userId, name } = req.body;

    if (!userId || !name) {
        return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
    }

    try {
        const newProject = await projectRepository.createProject(userId, name);
        res.status(201).json({ success: true, project: newProject });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

const deleteProject = async (req, res) => {
    const { projectId } = req.params;

    try {
        const deleted = await projectRepository.deleteProject(projectId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        }
        res.json({ success: true, message: 'Proyecto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
};

module.exports = {
    getProjects,
    createProject,
    deleteProject,
};
