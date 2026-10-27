// lib/embeddings.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELO_EMBEDDINGS = 'gemini-embedding-001';

export async function generarEmbedding(
  texto: string,
  tipo: 'query' | 'document' = 'document'
): Promise<number[]> {
  const taskType = tipo === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT';

  const response = await ai.models.embedContent({
    model: MODELO_EMBEDDINGS,
    contents: texto,
    config: {
      taskType: taskType,
    },
  });

  // Validación de TypeScript y de seguridad en runtime
  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error('Gemini no devolvió embeddings válidos');
  }

  const values = response.embeddings[0].values;

  if (!values || values.length === 0) {
    throw new Error('El embedding devuelto está vacío');
  }

  return values as number[];
}

export async function generarEmbeddings(
  textos: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const texto of textos) {
    const emb = await generarEmbedding(texto, 'document');
    embeddings.push(emb);
  }
  return embeddings;
}