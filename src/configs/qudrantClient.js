import dotenv from 'dotenv';
dotenv.config();

export const client = new QdrantClient(
  {
    url: process.env.QUADRANT_URL,
    apiKey: process.env.QUADRANT_API_KEY,
  }
);