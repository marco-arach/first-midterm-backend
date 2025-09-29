const { Router } = require('express');
const { generateProject } = require('../controllers/generateProjectController');

const router = Router();

router.post("/generate-project", generateProject);

module.exports = router;
