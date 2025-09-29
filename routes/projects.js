const { Router } = require('express');
const { getProjects, createProject, deleteProject } = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = Router();

router.get('/:userId', verifyToken, getProjects);

router.post('/', verifyToken, createProject);

router.delete('/:projectId', verifyToken, deleteProject);

module.exports = router;
