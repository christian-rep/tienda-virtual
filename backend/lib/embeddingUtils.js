// lib/embeddingUtils.js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Añade OPENAI_API_KEY a tu .env
});

async function generarEmbedding(texto) {
  const respuesta = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texto,
  });
  return respuesta.data[0].embedding;
}

module.exports = { generarEmbedding };