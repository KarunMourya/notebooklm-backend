import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import pdfRoutes from './routes/pdfRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors())
app.use('/api/', pdfRoutes);
app.use("/api/", chatRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (_, res) => {
  res.send('Hello, NotebookLM Clone Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});