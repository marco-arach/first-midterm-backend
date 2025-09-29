const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
const archiver = require("archiver");

const BASE_PACKAGE = "com.example.demo";
const GENERATED_DIR = path.join(__dirname, "..", "generated-project");

const generateProject = async (req, res) => {
  try {
    console.log("Payload recibido:", JSON.stringify(req.body, null, 2));
    const zipPath = await generateCode(req.body);
    res.download(zipPath, "spring-project.zip");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating project");
  }
};

async function generateCode(diagramRequest) {
  await fs.remove(GENERATED_DIR);
  await fs.copy(path.join(__dirname, "..", "spring-template"), GENERATED_DIR);

  const outputDir = path.join(GENERATED_DIR, "src/main/java");

  for (const umlClass of diagramRequest.classes) {
    const ctx = { umlClass, classes: diagramRequest.classes, relationships: diagramRequest.relationships, BASE_PACKAGE };

    await renderTemplate("entity.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "entity", `${umlClass.name}.java`));
    await renderTemplate("repository.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "repository", `${umlClass.name}Repository.java`));
    await renderTemplate("service.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "service", `${umlClass.name}Service.java`));
    await renderTemplate("serviceImpl.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "service/impl", `${umlClass.name}ServiceImpl.java`));
    await renderTemplate("controller.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "controller", `${umlClass.name}Controller.java`));
    await renderTemplate("dto.ejs", ctx, path.join(outputDir, BASE_PACKAGE.replace(/\./g, "/"), "dto", `${umlClass.name}Dto.java`));
  }

  const zipPath = path.join(__dirname, "..", "spring-project.zip");
  await createZip(GENERATED_DIR, zipPath);

  return zipPath;
}

async function renderTemplate(templateName, ctx, outputPath) {
  const templatePath = path.join(__dirname, "..", "templates", templateName);
  const content = await ejs.renderFile(templatePath, ctx);
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, content);
}

async function createZip(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

module.exports = { generateProject };