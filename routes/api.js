const { Router } = require('express');
const authRouter = require('./auth');
const projectRouter = require('./projects');
const generateRouter = require("./generate");

const router = Router();

router.use('/auth', authRouter);
router.use('/projects', projectRouter);
router.use("/ai", generateRouter);

module.exports = router;