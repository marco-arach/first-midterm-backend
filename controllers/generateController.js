const sharp = require("sharp");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function bufferToBase64(buffer) {
  return buffer.toString("base64");
}

function extractJSON(text) {
  try {
    const s = text.replace(/```(?:json)?/gi, "").trim();
    const first = s.indexOf("[");
    const last = s.lastIndexOf("]");
    if (first === -1 || last === -1) return null;
    return JSON.parse(s.substring(first, last + 1));
  } catch (err) {
    console.error("Error parseando JSON:", err);
    return null;
  }
}

const generateDiagram = async (req, res) => {
  try {
    console.log("Endpoint /generate-diagram invocado");

    const image = req.file;
    if (!image) {
      console.warn("No se envió ninguna imagen");
      return res.status(400).json({ success: false, error: "Se requiere una imagen" });
    }
    console.log(`Imagen recibida: ${image.originalname} (${image.mimetype}, ${image.size} bytes)`);

    const resizedBuffer = await sharp(image.buffer)
      .resize({ width: 256, height: 256, fit: "inside" })
      .png()
      .toBuffer();
    console.log("Imagen procesada con sharp:", resizedBuffer.length, "bytes");

    const imageBase64 = bufferToBase64(resizedBuffer);
    console.log("Imagen convertida a Base64, longitud:", imageBase64.length);

    const content = {
      role: "user",
      parts: [
        {
          text: `
Analiza la imagen adjunta y devuelve un array JSON con todos los objetos UML.
Incluye Clases y Relaciones.

Formato de los objetos:

Clases:
{
  "type": "UMLClass",
  "id": string,
  "name": string,
  "attributes": string[], //formato cada atributo 'nombreDelAtributo:TipoDeDato'
  "x": number,
  "y": number,
  "width": 100,
  "height": 140,
  "selected": false
}

Relaciones:
{
  "type": "UMLRelationship",
  "id": string,
  "from": string,      // id de la clase origen
  "to": string,        // id de la clase destino
  "relationType": string // one_to_one, one_to_many, many_to_one, many_to_many, inheritance, composition, aggregation
}

Devuelve **solo JSON**, sin texto adicional ni markdown.
          `,
        },
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/png",
          },
        },
      ],
    };
    console.log("Contenido preparado para Gemini:", Object.keys(content));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [content],
      config: { temperature: 0.1, maxOutputTokens: 10000 },
    });

    console.log("Respuesta completa de Gemini:\n", JSON.stringify(response, null, 2));

    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("rawText (preview 300 chars):", rawText.substring(0, 300));

    const diagramData = extractJSON(rawText);
    if (!diagramData) {
      console.warn("No se pudo extraer JSON del rawText");
      return res.status(500).json({ success: false, error: "No se pudo generar el diagrama" });
    }
    console.log("JSON extraído correctamente, elementos:", diagramData.length);

    const idMap = {};
    const normalizedClasses = [];
    const normalizedRels = [];

    diagramData.forEach(item => {
      if (item.type === "UMLClass") {
        const newId = "_" + Math.random().toString(36).substr(2, 9);
        idMap[item.id] = newId;
        normalizedClasses.push({
          id: newId,
          x: Number(item.x) || 100 + Math.random() * 100,
          y: Number(item.y) || 100 + Math.random() * 100,
          name: item.name || "NewClass",
          attributes: Array.isArray(item.attributes)
            ? item.attributes
            : ["attribute1"],
          width: 100,
          height: 140,
          type: "UMLClass",
          selected: false,
        });
      }
    });
    console.log("Clases normalizadas:", normalizedClasses.length);

    diagramData.forEach(item => {
      if (item.type === "UMLRelationship") {
        normalizedRels.push({
          id: "_" + Math.random().toString(36).substr(2, 9),
          from: idMap[item.from] || item.from,
          to: idMap[item.to] || item.to,
          relationType: item.relationType || "one_to_one",
          type: "UMLRelationship",
        });
      }
    });
    console.log("Relaciones normalizadas:", normalizedRels.length);

    res.json({ success: true, objetos: [...normalizedClasses, ...normalizedRels] });

  } catch (err) {
    console.error("Error en /generate-diagram:", err);
    res.status(500).json({ success: false, error: err?.message || "Error interno" });
  }
};

const generateObjects = async (req, res) => {
  try {
    const { prompt, objetos = [], pizarraId } = req.body;

    console.log("Prompt del usuario:", prompt);
    console.log("Objetos existentes:", objetos);

    const systemPrompt = `
Eres un generador de diagramas UML.

Reglas:
1. Devuelve siempre un arreglo JSON con objetos UML, sin texto adicional ni markdown.
2. Sigue exactamente la petición del usuario.
3. Si el usuario pide crear relaciones, usa los IDs de los objetos existentes para "from" y "to".
4. Puedes crear nuevas clases si el usuario lo solicita.
5. Devuelve clases y relaciones como objetos separados en el arreglo.

Formato de los objetos UML:

Clases:
{
  "type": "UMLClass",
  "id": string,
  "name": string,
  "attributes": string[], //formato cada atributo 'nombreDelAtributo:TipoDeDato'
  "x": number,
  "y": number,
  "width": 100,
  "height": 140,
  "selected": false
}

Relaciones:
{
  "type": "UMLRelationship",
  "id": string,
  "from": string,
  "to": string,
  "relationType": string // one_to_one, one_to_many, many_to_one, many_to_many, inheritance, composition, aggregation
}

Ejemplos de respuesta (solo JSON):

1. Crear una clase:
Prompt: "Crea una clase Usuario con atributos nombre:string, correo:string, contraseña:string"
Respuesta:
[
  {
    "type": "UMLClass",
    "id": "Usuario_1",
    "name": "Usuario",
    "attributes": ["nombre:string", "correo:string", "contraseña:string"],
    "x": 100,
    "y": 100,
    "width": 100,
    "height": 140,
    "selected": false
  }
]

2. Crear varias clases:
Prompt: "Crea Cliente(nombre:string,direccion:string) y Pedido(fecha:date,total:number)"
Respuesta:
[
  {
    "type": "UMLClass",
    "id": "Cliente_1",
    "name": "Cliente",
    "attributes": ["nombre:string", "direccion:string"],
    "x": 100,
    "y": 100,
    "width": 100,
    "height": 140,
    "selected": false
  },
  {
    "type": "UMLClass",
    "id": "Pedido_1",
    "name": "Pedido",
    "attributes": ["fecha:date","total:number"],
    "x": 300,
    "y": 100,
    "width": 100,
    "height": 140,
    "selected": false
  }
]

3. Crear relación usando clases existentes:
Prompt: "Crea relación one_to_many entre Cliente y Pedido"
Objetos existentes: [
  {"type":"UMLClass","id":"Cliente_1","name":"Cliente","attributes":["nombre:string","direccion:string"],"x":100,"y":100,"width":100,"height":140,"selected":false},
  {"type":"UMLClass","id":"Pedido_1","name":"Pedido","attributes":["fecha:date","total:number"],"x":300,"y":100,"width":100,"height":140,"selected":false}
]
Respuesta:
[
  {
    "type": "UMLRelationship",
    "id": "Rel_1",
    "from": "Cliente_1",
    "to": "Pedido_1",
    "relationType": "one_to_many"
  }
]
    `;

    const fullPrompt = `
${systemPrompt}

Objetos existentes (JSON):
${JSON.stringify(objetos, null, 2)}

Instrucción del usuario:
${prompt}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: { temperature: 0.1, maxOutputTokens: 10000 }
    });

    const generatedText = (response &&
      (response.text ||
        (response.outputs && response.outputs[0] && response.outputs[0].content && response.outputs[0].content[0] && response.outputs[0].content[0].text))
    ) || '';

    let rawText = generatedText || '';
    console.log("Respuesta cruda de Gemini:", rawText);

    rawText = rawText
      .trim()
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/```$/, '');

    let generated = [];
    try {
      generated = JSON.parse(rawText);
    } catch (e) {
      console.error("Error parseando respuesta Gemini:", e);
      return res.status(500).json({ success: false, error: "Gemini no devolvió JSON válido" });
    }

    const normalizedClasses = generated.filter(o => o.type === "UMLClass");
    const normalizedRels = generated.filter(o => o.type === "UMLRelationship");

    res.json({ success: true, objetos: [...normalizedClasses, ...normalizedRels] });
  } catch (err) {
    console.error("Error en generateObjects:", err);
    res.status(500).json({ success: false, error: "Error procesando los datos" });
  }
};

module.exports = { generateDiagram, generateObjects };