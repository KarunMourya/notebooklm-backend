import dotenv from "dotenv";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";

dotenv.config();

// 🧠 Simple in-memory chat sessions (for demo/dev)
const chatSessions = new Map();

// --- Initialize Embeddings ---
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

// --- Initialize Chat Model ---
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  temperature: 0.3,
  apiKey: process.env.GOOGLE_API_KEY,
});

/**
 * Controller: chatWithDocument
 * Handles user questions with memory (multi-turn conversation)
 */
export const chatWithDocument = async (req, res) => {
  try {
    const question = req.body?.question?.trim();
    const sessionId = req.body?.sessionId || "default";

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    console.log(`💬 [${sessionId}] Question received: ${question}`);

    // Step 1: Retrieve or initialize session memory
    if (!chatSessions.has(sessionId)) {
      chatSessions.set(sessionId, []);
    }
    const chatHistory = chatSessions.get(sessionId);

    // Step 2: Connect to Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QUADRANT_URL,
      collectionName: "notebooklm-documents",
    });

    // Step 3: Retrieve relevant document chunks
    const results = await vectorStore.similaritySearch(question, 5);
    console.log(`🔍 Retrieved ${results.length} relevant chunks`);

    const context = results
      .map(
        (doc, i) =>
          `Chunk ${i + 1} (Page ${doc.metadata?.page || "Unknown"}):\n${doc.pageContent}`
      )
      .join("\n\n");

    // Step 4: Construct message array (system + full chat history + new question)
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that answers strictly based on the provided PDF document context.",
      },
      ...chatHistory,
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer concisely and include page references like (Page X).`,
      },
    ];

    // Step 5: Generate Gemini response
    const response = await chatModel.invoke(messages);
    const answer = response.content;

    // Step 6: Extract citations (pages)
    const citations = results.map((r) => r.metadata?.page || "Unknown");

    // Step 7: Update session memory
    chatHistory.push({ role: "user", content: question });
    chatHistory.push({ role: "assistant", content: answer });
    chatSessions.set(sessionId, chatHistory);

    // Step 8: Respond with structured JSON
    res.json({
      sessionId,
      question,
      answer,
      citations,
      chatHistory,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Error answering question.",
    });
  }
};
