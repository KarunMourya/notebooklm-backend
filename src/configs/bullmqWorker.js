  import dotenv from 'dotenv';
  dotenv.config();

import { Worker } from 'bullmq';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    try {

      const data = JSON.parse(job.data);
      
      // Step 1: Load the PDF
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();
      
      // Step 2: Split into smaller chunks
      const splitter = new CharacterTextSplitter({
        chunkSize: 500,       // number of characters per chunk
        chunkOverlap: 200,     // overlap between chunks to preserve context
        separator: '\n',       // optional: can also use '.' or ' '
      });

      const splitDocs = await splitter.splitDocuments(docs);
      console.log('splitDocs: ', splitDocs);
      
      // Step 3: Initialize Google Gemini embeddings
      console.log('data.title: ', data.title);
      console.log('process.env.GOOGLE_API_KEY: ', process.env.GOOGLE_API_KEY);
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: 'gemini-embedding-001', // 768 dimensions
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: data.title || 'Uploaded Document',
        apiKey: process.env.GOOGLE_API_KEY, // <- ensure this is set
      });
      console.log('embeddings: ', embeddings);
      
      console.log('process.env.QUADRANT_URL: ', process.env.QUADRANT_URL);
      // Step 4: Store in Qdrant vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: process.env.QUADRANT_URL,
        collectionName: 'notebooklm-documents',
      }
    );
    await vectorStore.addDocuments(splitDocs);
    console.log('✅ Successfully added embeddings to Qdrant.');
  } catch (error) {
    console.error('Error processing job:', error);  
  }
  },
  {
    concurrency: 100,
    connection: {
      host: 'localhost',
      port: '6379',
    },
  }
);
