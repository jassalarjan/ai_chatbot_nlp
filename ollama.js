const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config(); // Load environment variables

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY; // Secure API key

router.post("/", async (req, res) => {
	try {
		const { prompt } = req.body; // Get user input
		const response = await axios.post(
			"https://api.cloud.llamaindex.ai/api/generate",
			{ query: prompt },
			{
				headers: {
					Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		// ✅ Extract AI response
		const aiResponse = response?.data?.response || "No response from AI";
		console.log("Llama Response:", aiResponse);

		// ✅ Save AI response to MySQL
		const sql =
			"INSERT INTO messages (chat_id, sender, message, response) VALUES (?, ?, ?, ?)";
		const values = [req.body.chatcount, req.body.msgcount, prompt, aiResponse];

		db.query(sql, values, (err, results) => {
			if (err) {
				console.error("❌ Database Insertion Error:", err);
				return res.status(500).json({ error: "Database insertion failed" });
			} else {
				console.log("✅ Message saved to database");
				return res.json({ message: aiResponse });
			}
		});
	} catch (error) {
		console.error("❌ Error:", error.message);
		res.status(500).json({ error: "Failed to generate response" });
	}
});

module.exports = router;
