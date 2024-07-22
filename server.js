const path = require('path');
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Verifique se a chave da API foi carregada corretamente
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('API key is missing in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "Você é um assistente virtual capaz de responder dúvidas de alunos, principalmente a respeito de inteligência artificial.",
});

const generationConfig = {
  temperature: 0.15,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve o arquivo index.html para a rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const sessions = {};

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    const sessionId = req.body.sessionId || 'default';

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        chatSession: model.startChat({
          generationConfig,
          history: [],
        }),
        history: [],
      };
    }

    const { chatSession, history } = sessions[sessionId];
    const result = await chatSession.sendMessage(userMessage);

    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'bot', content: result.response.text() });

    res.json({ response: result.response.text() });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
