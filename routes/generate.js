const { Router } = require('express');
const { generateDiagram, generateObjects } = require('../controllers/generateController');
const multer = require("multer");

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/generate-diagram", upload.single("image"), generateDiagram);

router.post("/generate-objects", generateObjects);

module.exports = router;
