const express = require('express');
const router = express.Router();
const { Together } = require('together-ai');
require('dotenv').config();

const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

router.post('/', async (req, res) => {
  const { prompt, chatId } = req.body;
  const userId = req.user.userId;
  const db = req.app.get('db');

  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: [{ role: "user", content: prompt }]
    });

    const aiText = response.choices[0].message.content;

    // Store NLP chat
    db.run(
      `INSERT INTO nlp_chats (chat_id, user_id, prompt, response) VALUES (?, ?, ?, ?)`,
      [chatId || null, userId, prompt, aiText],
      function (err) {
        if (err) {
          console.error("DB Insert Error:", err);
        }
      }
    );

    res.status(200).json({ response: aiText, chatId });
  } catch (error) {
    console.error("NLP error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get response from NLP" });
  }
});

module.exports = router;
