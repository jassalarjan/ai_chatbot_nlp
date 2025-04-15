const express = require("express");
const router = express.Router();
const Together = require("together-ai");
require("dotenv").config();

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

// Image generation route - already authenticated by middleware
router.post("/", async (req, res) => {
  const { prompt, chatId } = req.body;
  const userId = req.user.userId; // from auth middleware
  const db = req.app.get('db'); // Get db instance from express app

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!process.env.TOGETHER_API_KEY) {
    console.error("TOGETHER_API_KEY is not set in environment variables");
    return res.status(500).json({ error: "Image generation service not configured" });
  }

  try {
    console.log("Generating image with prompt:", prompt);

    const modelConfig = {
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width: 512,
      height: 512,
      steps: 2,
      n: 1,
      response_format: "b64_json",
    };

    const response = await together.images.create(modelConfig);
    const base64Image = response.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    // Save image to database using the new image_generations table
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO image_generations (
          chat_id, 
          user_id, 
          prompt, 
          image_data, 
          model_used,
          width,
          height,
          generation_config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chatId || null,
          userId,
          prompt,
          base64Image,
          modelConfig.model,
          modelConfig.width,
          modelConfig.height,
          JSON.stringify(modelConfig)
        ],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.status(200).json({ imageUrl, chatId });
  } catch (error) {
    console.error("Error generating image:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Get user's image history with enhanced metadata
router.get("/history", async (req, res) => {
  const userId = req.user.userId;
  const db = req.app.get('db'); // Get db instance from express app

  try {
    db.all(
      `SELECT 
        id, 
        chat_id, 
        prompt, 
        model_used,
        width,
        height,
        created_at 
      FROM image_generations 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error("Error fetching image history:", err);
          return res.status(500).json({ error: "Failed to fetch image history" });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get specific image with full metadata
router.get("/:imageId", async (req, res) => {
  const userId = req.user.userId;
  const imageId = req.params.imageId;
  const db = req.app.get('db'); // Get db instance from express app

  try {
    db.get(
      `SELECT * FROM image_generations WHERE id = ? AND user_id = ?`,
      [imageId, userId],
      (err, row) => {
        if (err) {
          console.error("Error fetching image:", err);
          return res.status(500).json({ error: "Failed to fetch image" });
        }
        if (!row) {
          return res.status(404).json({ error: "Image not found" });
        }
        res.json({
          imageUrl: `data:image/png;base64,${row.image_data}`,
          prompt: row.prompt,
          model: row.model_used,
          width: row.width,
          height: row.height,
          created_at: row.created_at,
          generation_config: JSON.parse(row.generation_config)
        });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
