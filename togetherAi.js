const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

router.post("/", async (req, res) => {
	const { prompt } = req.body;

	if (!prompt) {
		return res.status(400).json({ error: "Prompt is required" });
	}

	try {
		const response = await axios.post(
			"https://api.together.xyz/v1/chat/completions", // ✅ Free Cloud-Based API
			{
				model: "mistral-7b-instruct", // ✅ Free & Fast Model
				messages: [{ role: "user", content: prompt }],
				max_tokens: 100,
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.TOGETHER_AI_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		res.json({ response: response.data.choices[0].message.content });
	} catch (error) {
		console.error(
			"🚨 Together AI API Error:",
			error.response ? error.response.data : error.message
		);
		res
			.status(500)
			.json({ error: "Failed to fetch response from Together AI" });
	}
});

module.exports = router;
