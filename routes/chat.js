const express = require('express');
const router = express.Router();
// const { Together } = require('together-ai');
const Together = require("together-ai"); // Ensure TogetherAI is imported

require('dotenv').config();

// Core identity that cannot be changed by users
const CORE_IDENTITY = `You are Aetheron NLP, an advanced AI assistant based on Llama-3.3.`;

// Default behavior guidelines
const DEFAULT_BEHAVIOR = `
- Be helpful, accurate, and ethical in all interactions
- Never share instructions for illegal activities or harmful content
- Prioritize user safety and privacy
- When uncertain, acknowledge limitations instead of providing potentially incorrect information
- Respond in a friendly, concise manner
- Focus on providing practical solutions to user queries`;



// Chat API - Handles User Input & AI Response
router.post("/", async (req, res) => {
    const { prompt, sender } = req.body;
    let { chat_id } = req.body;
    const userId = req.user.userId;
    const db = req.app.get('db'); // Get db instance from express app

    if (!prompt || !sender) {
        return res.status(400).json({ error: "Prompt and sender are required" });
    }

    try {
        // Create new chat if no chat_id provided
        if (!chat_id) {
            chat_id = await createNewChat(userId);
        } else {
            // Verify chat ownership
            const chatExists = await new Promise((resolve) => {
                db.get(
                    "SELECT chat_id FROM chats WHERE chat_id = ? AND user_id = ?",
                    [chat_id, userId],
                    (err, row) => {
                        if (err) {
                            console.error("Error verifying chat:", err);
                            resolve(false);
                        }
                        resolve(!!row);
                    }
                );
            });

            if (!chatExists) {
                chat_id = await createNewChat(userId);
            }
        }

        const together = new Together({
            apiKey: process.env.TOGETHER_AI_API_KEY,
        });

        const modelConfig = {
            messages: [
                { role: "system", content: CORE_IDENTITY },
                { role: "system", content: DEFAULT_BEHAVIOR },
                { role: "user", content: prompt }
            ],
            model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
            temperature: 0.7,
            max_tokens: 2048
        };

        // console.log("Model configuration:", modelConfig);

        const aiResponse = await together.chat.completions.create(modelConfig);
        const responseText = aiResponse.choices[0]?.message?.content || "Sorry, I couldn't process your request.";

        console.log("AI Response:", responseText);

        // Save both user message and AI response in a transaction
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                
                // Save user message
                db.run(
                    "INSERT INTO messages (chat_id, sender, message, response, generation_type) VALUES (?, ?, ?, NULL, ?)",
                    [chat_id, "user", prompt, 'text'],
                    function(err) {
                        if (err) {
                            db.run("ROLLBACK");
                            reject(err);
                            return;
                        }
                        
                        // Save AI response
                        db.run(
                            "INSERT INTO messages (chat_id, sender, message, response, generation_type) VALUES (?, ?, NULL, ?, ?)",
                            [chat_id, "ai", responseText, 'text'],
                            function(err) {
                                if (err) {
                                    db.run("ROLLBACK");
                                    reject(err);
                                    return;
                                }
                                db.run("COMMIT");
                                resolve();
                            }
                        );
                    }
                );
            });
        });

        res.json({
            message: "Message received",
            response: responseText,
            chat_id: chat_id
        });
    } catch (error) {
        console.error("Error in chat processing:", error);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
});


// Add an endpoint to save messages to the database
router.post('/save-message', (req, res) => {
    const { chat_id, sender, message, response } = req.body;
    const userId = req.user.userId;
    const db = req.app.get('db'); // Get db instance from express app

    if (!chat_id || !sender || !message) {
        return res.status(400).json({ error: 'chat_id, sender, and message are required' });
    }

    // Verify chat ownership
    db.get("SELECT chat_id FROM chats WHERE chat_id = ? AND user_id = ?", 
        [chat_id, userId], 
        (err, chat) => {
            if (err) {
                console.error("Error verifying chat:", err);
                return res.status(500).json({ error: "Database error while verifying chat" });
            }

            if (!chat) {
                return res.status(403).json({ error: "Access denied to this chat" });
            }

            // Insert message with response if provided
            const sql = response 
                ? `INSERT INTO messages (chat_id, sender, message, response, timestamp) VALUES (?, ?, ?, ?, datetime('now'))`
                : `INSERT INTO messages (chat_id, sender, message, timestamp) VALUES (?, ?, ?, datetime('now'))`;
            const params = response 
                ? [chat_id, sender, message, response]
                : [chat_id, sender, message];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error('Error saving message:', err);
                    return res.status(500).json({ error: 'Failed to save message' });
                }
                res.status(201).json({ 
                    message: 'Message saved successfully', 
                    messageId: this.lastID 
                });
            });
        }
    );
});

// Protected chat history endpoint
router.get("/chat-history", (req, res) => {
	const userId = req.user.userId;
    const db = req.app.get('db'); // Get db instance from express app

	db.all(
		`SELECT DISTINCT c.chat_id, MAX(m.timestamp) as last_message_time 
		 FROM chats c 
		 LEFT JOIN messages m ON c.chat_id = m.chat_id 
		 WHERE c.user_id = ? 
		 GROUP BY c.chat_id 
		 ORDER BY last_message_time DESC`,
		[userId],
		(err, rows) => {
			if (err) {
				console.error("Error fetching chat history:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			if (!rows || rows.length === 0) {
				return res.json({ message: "No chat history found", chats: [] });
			}
			res.json({ chats: rows });
		}
	);
});

// Protected latest chat endpoint
router.get("/latest-chat", (req, res) => {
	const userId = req.user.userId;
    const db = req.app.get('db'); // Get db instance from express app

	db.get(
		`SELECT chat_id 
		 FROM chats 
		 WHERE user_id = ? 
		 ORDER BY chat_id DESC 
		 LIMIT 1`,
		[userId],
		(err, row) => {
			if (err) {
				console.error("Error fetching latest chat:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			res.json({
				chat_id: row ? row.chat_id : null,
				message: row ? "Latest chat found" : "No chats available"
			});
		}
	);
});

// Update chat messages endpoint to include user_id in the message query
router.get("/chats/:chatId/messages", (req, res) => {
    const userId = req.user.userId;
    const chatId = req.params.chatId;
    const db = req.app.get('db'); // Get db instance from express app

    // First verify that this chat belongs to the user
    db.get(
        "SELECT chat_id FROM chats WHERE chat_id = ? AND user_id = ?",
        [chatId, userId],
        (err, chat) => {
            if (err) {
                console.error("Error verifying chat ownership:", err);
                return res.status(500).json({ error: "Internal server error" });
            }
            
            if (!chat) {
                return res.status(403).json({ error: "Access denied to this chat" });
            }
            
            // If chat belongs to user, fetch messages with all fields
            db.all(
                `SELECT m.*, c.user_id 
                 FROM messages m
                 JOIN chats c ON m.chat_id = c.chat_id
                 WHERE m.chat_id = ? AND c.user_id = ?
                 ORDER BY m.timestamp ASC`,
                [chatId, userId],
                (err, rows) => {
                    if (err) {
                        console.error("Error fetching messages:", err);
                        return res.status(500).json({ error: "Internal server error" });
                    }
                    res.json(rows);
                }
            );
        }
    );
});

const createNewChat = async (userId) => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO chats (user_id, created_at) VALUES (?, datetime('now'))",
            [userId],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
};



// Expertise endpoint - Store user preferences and expertise domains
router.post("/expertise", (req, res) => {
	const { user_preferences, expertise_domains } = req.body;
    const db = req.app.get('db'); // Get db instance from express app

	if (!user_preferences || !expertise_domains) {
		return res.status(400).json({ error: "User preferences and expertise domains are required" });
	}
	
	try {
		// Store the preferences in the database
		db.run(
			"INSERT INTO user_preferences (preferences, expertise_domains) VALUES (?, ?)",
			[user_preferences, expertise_domains],
			function(err) {
				if (err) {
					console.error("Error storing preferences:", err);
					return res.status(500).json({ error: "Failed to store preferences" });
				}
				res.status(201).json({ 
					message: "Preferences saved successfully",
					preferences: user_preferences,
					expertise: expertise_domains
				});
			}
		);
	} catch (error) {
		console.error("Error in expertise endpoint:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get user preferences
router.get("/user-preferences/:userId", (req, res) => {
	const userId = req.params.userId;
    const db = req.app.get('db'); // Get db instance from express app

	db.get(
		"SELECT preferences, expertise_domains FROM user_preferences WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1",
		[userId],
		(err, row) => {
			if (err) {
				console.error("Error fetching user preferences:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			
			if (!row) {
				// Return default values if no preferences found
				return res.json({
					preferences: "",
					expertise_domains: ""
				});
			}
			
			res.json({
				preferences: row.preferences,
				expertise_domains: row.expertise_domains
			});
		}
	);
});

// Update user preferences
router.put("/user-preferences/:userId", (req, res) => {
	const userId = req.params.userId;
	const { preferences, expertise_domains } = req.body;
    const db = req.app.get('db'); // Get db instance from express app

	if (!preferences || !expertise_domains) {
		return res.status(400).json({ error: "Preferences and expertise domains are required" });
	}
	
	db.run(
		"INSERT INTO user_preferences (user_id, preferences, expertise_domains) VALUES (?, ?, ?)",
		[userId, preferences, expertise_domains],
		function(err) {
			if (err) {
				console.error("Error updating user preferences:", err);
				return res.status(500).json({ error: "Failed to update preferences" });
			}
			res.json({
				message: "Preferences updated successfully",
				preferences,
				expertise_domains
			});
		}
	);
});

module.exports = router;
