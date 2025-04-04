const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

router.post("/", async (req, res) => { // ✅ Supports only POST
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to fetch response from OpenAI" });
    }
});

module.exports = router;
