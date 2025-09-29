const { Router } = require('express');
const authRouter = require('./auth');
const projectRouter = require('./projects');

const router = Router();

router.use('/auth', authRouter);
router.use('/projects', projectRouter);

module.exports = router;