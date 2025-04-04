const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MYSQL_PORT = process.env.MYSQL_PORT || 3306;

// Middleware
app.use(cors());
app.use(express.json());

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

// MySQL Connection
const db = mysql.createPool({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "ai_chat_nlp",
	password: process.env.DB_PASSWORD || "@Ichatnlp",
	database: process.env.DB_NAME || "ai_chat_nlp",
	port: MYSQL_PORT,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// Initialize DB (Creates tables if they don't exist)
const initializeDB = async () => {
	try {
		await db.query(`
      CREATE TABLE IF NOT EXISTS chats (
        chat_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL
      )
    `);

		await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT,
        sender VARCHAR(255),
        message TEXT,
        response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
      )
    `);

		console.log("✅ Database initialized");
	} catch (error) {
		console.error("❌ Error initializing database:", error);
		process.exit(1);
	}
};

// ===== User Registration Route =====
app.post("/api/register", async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Username and password are required" });
	}

	try {
		// Check if user already exists
		const [existingUser] = await db.query(
			"SELECT * FROM users WHERE username = ?",
			[username]
		);

		if (existingUser.length > 0) {
			return res.status(409).json({ error: "User already exists" });
		}

		// Insert new user into the database
		await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
			username,
			password,
		]);

		return res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		console.error("❌ Error during registration:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

// ===== User Login Route =====
app.post("/api/login", async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ error: "Username and password are required" });
	}

	try {
		// Check if user exists with given credentials
		const [users] = await db.query(
			"SELECT * FROM users WHERE username = ? AND password = ?",
			[username, password]
		);

		if (users.length === 0) {
			return res.status(401).json({ error: "Invalid username or password" });
		}

		// Create a JWT token (optional)
		const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		return res.json({ message: "Login successful", token });
	} catch (error) {
		console.error("❌ Error during login:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

// ===== Protected Route Example =====
app.get("/api/protected", (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res
			.status(401)
			.json({ message: "Access denied, no token provided" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		res.json({ message: "Access granted", userId: decoded.userId });
	} catch (error) {
		res.status(401).json({ message: "Invalid token" });
	}
});

// Get or create the latest chat ID for a user
const getOrCreateChat = async () => {
	try {
		const [rows] = await db.query(
			"SELECT chat_id FROM chats ORDER BY chat_id DESC LIMIT 1"
		);

		if (rows.length === 0) {
			const [chatInsertResult] = await db.query(
				"INSERT INTO chats (user_id) VALUES (NULL)"
			);
			return chatInsertResult.insertId;
		}

		return rows[0].chat_id;
	} catch (error) {
		console.error("❌ Error getting or creating chat:", error);
		throw error;
	}
};
const expertisedata = async (userPreferences, expertiseDomains) => {
	try {
		const response = await axios.post("/api/expertise", {
			userPreferences,
			expertiseDomains,
		});
		console.log(response.data.message);
	} catch (error) {
		console.error("Error sending data:", error);
	}
};

// Chat API - Handles User Input & AI Response
app.post("/api/chat", async (req, res) => {
	const { prompt, sender, userPreferences, expertiseDomains } = req.body;
	if (!prompt || !sender) {
		return res.status(400).json({ error: "Prompt and sender are required" });
	}

	try {
		// Initialize Together AI
		const Together = require("together-ai");
		const together = new Together({
			apiKey: process.env.TOGETHER_API_KEY,
		});

		// Combine core identity (non-negotiable) with user preferences and default behavior
		const systemMessage = {
			role: "system",
			content: `${CORE_IDENTITY}
${
	userPreferences
		? `\nUser preferences: ${userPreferences}+${expertiseDomains}`
		: DEFAULT_BEHAVIOR
}`,
		};

		// Get AI Response
		const response = await together.chat.completions.create({
			messages: [systemMessage, { role: "user", content: prompt }],
			model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
			max_tokens: null,
			temperature: 0.7,
			top_p: 0.7,
			top_k: 50,
			repetition_penalty: 1,
			stop: ["<|eot_id|>", "<|eom_id|>"],
			stream: false,
		});

		const responseText = response.choices[0]?.message?.content || "No response";

		// Get or create a chat ID
		const chat_id = await getOrCreateChat();

		// Insert user message & AI response into database
		await db.query(
			"INSERT INTO messages (chat_id, sender, message, response) VALUES (?, ?, ?, ?)",
			[chat_id, sender, prompt, responseText]
		);

		// Log the system prompt used (for debugging purposes)
		console.log("System prompt used:", systemMessage.content);

		return res.json({
			chat_id,
			sender,
			prompt,
			response: responseText,
			userPreferencesApplied: !!userPreferences,
		});
	} catch (error) {
		console.error("❌ AI API Error:", error);
		return res.status(500).json({ error: "Failed to fetch response" });
	}
});

// Fetch messages for a given chat_id (User + AI Messages)
app.get("/api/chats/:chat_id/messages", async (req, res) => {
	const chatId = req.params.chat_id;
	try {
		const [messages] = await db.query(
			"SELECT sender, message, response, timestamp FROM messages WHERE chat_id = ? ORDER BY timestamp ASC",
			[chatId]
		);

		if (messages.length === 0) {
			return res.json({ messages: [] }); // No messages, return empty array
		}
		return res.json(messages);
	} catch (error) {
		console.error("❌ Error fetching messages:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

// Fetch latest chat ID
app.get("/api/latest-chat", async (req, res) => {
	try {
		const [rows] = await db.query(
			"SELECT chat_id FROM chats ORDER BY chat_id DESC LIMIT 1"
		);
		return res.json({ chat_id: rows.length > 0 ? rows[0].chat_id : 0 });
	} catch (error) {
		console.error("❌ Error fetching latest chat:", error);
		return res.status(500).json({ error: "Database error" });
	}
});

// Fetch chat history
app.get("/api/chat-history", async (req, res) => {
	try {
		const [chats] = await db.query(
			"SELECT c.chat_id, MAX(m.timestamp) AS last_message_time FROM chats c LEFT JOIN messages m ON c.chat_id = m.chat_id GROUP BY c.chat_id ORDER BY last_message_time DESC"
		);

		if (chats.length === 0) {
			return res.json({ chats: [] }); // No chat history, return empty array
		}

		return res.json(chats);
	} catch (error) {
		console.error("❌ Error fetching chat history:", error);
		return res.status(500).json({ error: "Failed to fetch chat history" });
	}
});
// ... rest of the existing code ...

// Start Server
initializeDB().then(() => {
	app.listen(PORT, () => {
		console.log(`🚀 Server running on http://localhost:${PORT}`);
	});
});
