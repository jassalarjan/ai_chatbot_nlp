const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ error: "Authentication token required" });
	}

	jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
};

// Health check route
app.get("/api/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date() });
});

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

// Replace MySQL connection with SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('❌ Error connecting to database:', err);
		process.exit(1);
	}
	console.log('✅ Connected to SQLite database');
});

// Initialize DB (Creates tables if they don't exist)
const initializeDB = () => {
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			// Create users table
			db.run(`
				CREATE TABLE IF NOT EXISTS users (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					username TEXT UNIQUE,
					email TEXT,
					password TEXT
				)
			`, (err) => {
				if (err) {
					console.error("Error creating users table:", err);
					reject(err);
				}
			});

			// Create chats table
			db.run(`
				CREATE TABLE IF NOT EXISTS chats (
					chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_id INTEGER,
					created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (user_id) REFERENCES users(id)
				)
			`, (err) => {
				if (err) {
					console.error("Error creating chats table:", err);
					reject(err);
				}
			});

			// Create messages table
			db.run(`
				CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					chat_id INTEGER,
					sender TEXT,
					message TEXT,
					response TEXT,
					timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (chat_id) REFERENCES chats(chat_id)
				)
			`, (err) => {
				if (err) {
					console.error("Error creating messages table:", err);
					reject(err);
				}
			});
			
			// Create user_preferences table
			db.run(`
				CREATE TABLE IF NOT EXISTS user_preferences (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					user_id INTEGER,
					preferences TEXT,
					expertise_domains TEXT,
					timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
					FOREIGN KEY (user_id) REFERENCES users(id)
				)
			`, (err) => {
				if (err) {
					console.error("Error creating user_preferences table:", err);
					reject(err);
				} else {
					resolve();
				}
			});
		});
	});
};

// Registration endpoint
app.post("/api/register", (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: "Username and password are required" });
	}

	// First check if user exists
	db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
		if (err) {
			console.error("Database error:", err);
			return res.status(500).json({ error: "Internal server error" });
		}

		if (row) {
			return res.status(409).json({ error: "Username already exists" });
		}

		// If user doesn't exist, create new user
		const sql = email 
			? "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
			: "INSERT INTO users (username, password) VALUES (?, ?)";
		const params = email ? [username, email, password] : [username, password];

		db.run(sql, params, function(err) {
			if (err) {
				console.error("Error creating user:", err);
				return res.status(500).json({ error: "Failed to create user" });
			}
			res.status(201).json({ 
				message: "User registered successfully",
				userId: this.lastID
			});
		});
	});
});

// Login endpoint
app.post("/api/login", (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: "Username and password are required" });
	}

	db.get(
		"SELECT id, username FROM users WHERE username = ? AND password = ?",
		[username, password],
		(err, row) => {
			if (err) {
				console.error("Database error:", err);
				return res.status(500).json({ error: "Internal server error" });
			}

			if (!row) {
				return res.status(401).json({ error: "Invalid username or password" });
			}

			const token = jwt.sign(
				{ userId: row.id, username: row.username },
				process.env.JWT_SECRET || 'your-secret-key',
				{ expiresIn: '24h' }
			);

			res.json({
				message: "Login successful",
				token,
				user: {
					id: row.id,
					username: row.username
				}
			});
		}
	);
});

// Chat API - Handles User Input & AI Response
app.post("/api/chat", authenticateToken, async (req, res) => {
	const { prompt, sender, chat_id } = req.body;
	const userId = req.user.userId;
	
	if (!prompt || !sender) {
		return res.status(400).json({ error: "Prompt and sender are required" });
	}

	try {
		// For testing purposes, generate a simulated response
		const simulatedResponses = {
			"Hello, how are you?": "I'm doing well, thank you for asking! How can I help you today?",
			"What's the weather like today?": "I apologize, but I don't have access to real-time weather data. You would need to check a weather service or look outside for current conditions.",
			"Tell me a joke": "Here's a programming joke: Why do programmers prefer dark mode? Because light attracts bugs!",
			"What time is it?": "I'm an AI language model, so I don't have access to real-time information. You can check your device's clock for the current time."
		};

		const responseText = simulatedResponses[prompt] || "I understand you said: " + prompt + ". How can I help you with that?";

		// Store the message and response
		await new Promise((resolve, reject) => {
			db.run(
				"INSERT INTO messages (chat_id, sender, message, response) VALUES (?, ?, ?, ?)",
				[chat_id || 1, sender, prompt, responseText],
				(err) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		res.json({
			message: "Message received",
			response: responseText,
			chat_id: chat_id || 1
		});
	} catch (error) {
		console.error("Detailed error in chat endpoint:", {
			message: error.message,
			stack: error.stack,
			response: error.response?.data
		});
		res.status(500).json({ 
			error: "Internal server error",
			details: error.message
		});
	}
});

// Protected chat history endpoint
app.get("/api/chat-history", authenticateToken, (req, res) => {
	const userId = req.user.userId;
	
	db.all(
		"SELECT DISTINCT c.chat_id, MAX(m.timestamp) as last_message_time FROM chats c LEFT JOIN messages m ON c.chat_id = m.chat_id WHERE c.user_id = ? GROUP BY c.chat_id ORDER BY last_message_time DESC",
		[userId],
		(err, rows) => {
			if (err) {
				console.error("Error fetching chat history:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			res.json(rows);
		}
	);
});

// Protected latest chat endpoint
app.get("/api/latest-chat", authenticateToken, (req, res) => {
	const userId = req.user.userId;
	
	db.get(
		"SELECT chat_id FROM chats WHERE user_id = ? ORDER BY chat_id DESC LIMIT 1",
		[userId],
		(err, row) => {
			if (err) {
				console.error("Error fetching latest chat:", err);
				return res.status(500).json({ error: "Internal server error" });
			}
			res.json({
				chat_id: row ? row.chat_id : 0
			});
		}
	);
});

// Protected chat messages endpoint
app.get("/api/chats/:chatId/messages", authenticateToken, (req, res) => {
	const userId = req.user.userId;
	const chatId = req.params.chatId;
	
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
			
			// If chat belongs to user, fetch messages
			db.all(
				"SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC",
				[chatId],
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

// Expertise endpoint - Store user preferences and expertise domains
app.post("/api/expertise", (req, res) => {
	const { user_preferences, expertise_domains } = req.body;
	
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
app.get("/api/user-preferences/:userId", (req, res) => {
	const userId = req.params.userId;
	
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
app.put("/api/user-preferences/:userId", (req, res) => {
	const userId = req.params.userId;
	const { preferences, expertise_domains } = req.body;
	
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

// Start server
initializeDB()
	.then(() => {
		console.log("✅ Database initialized");
		app.listen(PORT, () => {
			console.log(`🚀 Server running on http://localhost:${PORT}`);
		});
	})
	.catch((error) => {
		console.error("❌ Error initializing database:", error);
		process.exit(1);
	});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
	console.error('Unhandled Rejection:', error);
});
