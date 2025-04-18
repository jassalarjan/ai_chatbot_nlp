const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require("jsonwebtoken");
const Together = require("together-ai"); // Ensure TogetherAI is imported
const imageRoutes = require("./image_gen.js");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Health check route
app.get("/api/health", (req, res) => {
	res.json({ status: "OK", timestamp: new Date() });
});

// Authentication middleware with enhanced error handling
const authenticateToken = (req, res, next) => {
    console.log('Authenticating token...');
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('No token provided in request');
        return res.status(401).json({ 
            error: "Authentication token required",
            details: "No token found in Authorization header"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token decoded successfully:', { 
            userId: decoded.userId,
            username: decoded.username,
            exp: new Date(decoded.exp * 1000).toISOString()
        });
        
        // Additional validation
        if (!decoded.userId) {
            console.error('Token missing userId');
            return res.status(400).json({ 
                error: "Invalid token format",
                details: "Token is missing required user data"
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: "Token expired",
                details: "Please log in again"
            });
        }
        return res.status(403).json({ 
            error: "Invalid token",
            details: err.message
        });
    }
};

// Route setup
app.use("/api/image", authenticateToken, imageRoutes);

// Add token verification endpoint
app.get("/api/verify-token", authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.userId,
            username: req.user.username
        }
    });
});

// Add debugging middleware
app.use((req, res, next) => {
	console.log(`Incoming Request: ${req.method} ${req.url}`);
	console.log('Headers:', req.headers);
	console.log('Body:', req.body);
	next();
});

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    
    // Log request details
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Log response
    const originalJson = res.json;
    res.json = function(body) {
        const responseTime = Date.now() - start;
        console.log(`Response (${responseTime}ms):`, JSON.stringify(body, (key, value) => {
            // Redact sensitive data
            if (['password', 'token'].includes(key)) return '[REDACTED]';
            return value;
        }, 2));
        return originalJson.call(this, body);
    };
    
    next();
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

// Share db instance with routes
app.set('db', db);

// Add debugging to database initialization
const initializeDB = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('Initializing database...');

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

            // Create chats table with 'created_at' column
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

            // Fix the PRAGMA query to use db.all instead of db.get
            db.all("PRAGMA table_info(chats)", (err, columns) => {
                if (err) {
                    console.error("Error fetching table info for chats:", err);
                    reject(err);
                }

                const hasCreatedAt = Array.isArray(columns) && columns.some(column => column.name === 'created_at');
                if (!hasCreatedAt) {
                    db.run("ALTER TABLE chats ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
                        if (err) {
                            console.error("Error adding 'created_at' column to chats table:", err);
                            reject(err);
                        }
                    });
                }
            });

            // Create messages table
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    generation_type TEXT DEFAULT 'text',
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
            
            // Fix the PRAGMA query to use db.all instead of db.get
            db.all("PRAGMA table_info(messages)", (err, columns) => {
                if (err) {
                    console.error("Error fetching table info for messages:", err);
                    reject(err);
                }

                const hasGenerationType = Array.isArray(columns) && columns.some(column => column.name === 'generation_type');
                if (!hasGenerationType) {
                    db.run("ALTER TABLE messages ADD COLUMN generation_type TEXT DEFAULT 'text'", (err) => {
                        if (err) {
                            console.error("Error adding 'generation_type' column to messages table:", err);
                            reject(err);
                        }
                    });
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
                }
            });

            // Create images table
            db.run(`
                CREATE TABLE IF NOT EXISTS images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    user_id INTEGER,
                    prompt TEXT,
                    image_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating images table:", err);
                    reject(err);
                }
            });

            // Create image_generations table
            db.run(`
                CREATE TABLE IF NOT EXISTS image_generations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    user_id INTEGER,
                    prompt TEXT,
                    image_data TEXT,
                    model_used TEXT,
                    width INTEGER,
                    height INTEGER,
                    generation_config TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating image_generations table:", err);
                    reject(err);
                }
            });

            // Create text_generations table
            db.run(`
                CREATE TABLE IF NOT EXISTS text_generations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    user_id INTEGER,
                    prompt TEXT,
                    response TEXT,
                    model_used TEXT,
                    temperature REAL,
                    max_tokens INTEGER,
                    generation_config TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating text_generations table:", err);
                    reject(err);
                }
            });

            // Create audio_generations table
            db.run(`
                CREATE TABLE IF NOT EXISTS audio_generations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    user_id INTEGER,
                    prompt TEXT,
                    audio_data TEXT,
                    model_used TEXT,
                    voice_id TEXT,
                    duration_seconds INTEGER,
                    format TEXT,
                    generation_config TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating audio_generations table:", err);
                    reject(err);
                }
            });

            // Create code_generations table
            db.run(`
                CREATE TABLE IF NOT EXISTS code_generations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id INTEGER,
                    user_id INTEGER,
                    prompt TEXT,
                    code_response TEXT,
                    language TEXT,
                    model_used TEXT,
                    temperature REAL,
                    generation_config TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `, (err) => {
                if (err) {
                    console.error("Error creating code_generations table:", err);
                    reject(err);
                } else {
                    resolve();
                }
                console.log('Database initialization complete.');
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

// Login endpoint with enhanced token handling
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

            // Include user data in the token
            const userData = {
                userId: row.id,
                username: row.username
            };

            const token = jwt.sign(
                userData,
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            console.log('Generated token with user data:', { ...userData, token: '[REDACTED]' });

            res.json({
                message: "Login successful",
                token,
                user: userData
            });
        }
    );
});

// Helper function to create a new chat
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

// Chat API - Handles User Input & AI Response
app.post("/api/chat", authenticateToken, async (req, res) => {
    const { prompt, sender } = req.body;
    let { chat_id } = req.body;
    const userId = req.user.userId;
    
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

        console.log("Model configuration:", modelConfig);

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
app.post('/api/save-message', authenticateToken, (req, res) => {
    const { chat_id, sender, message, response } = req.body;
    const userId = req.user.userId;

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
app.get("/api/chat-history", authenticateToken, (req, res) => {
	const userId = req.user.userId;

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
app.get("/api/latest-chat", authenticateToken, (req, res) => {
	const userId = req.user.userId;

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

// Expertise endpoint - Store user preferences and expertise domains
app.post("/api/expertise", authenticateToken, (req, res) => {
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
app.get("/api/user-preferences/:userId", authenticateToken, (req, res) => {
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
app.put("/api/user-preferences/:userId", authenticateToken, (req, res) => {
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

// Add a new endpoint to fetch user details
app.get("/api/user", authenticateToken, (req, res) => {
    const userId = req.user.userId;
    console.log('DEBUG - User endpoint called:', {
        userId,
        headers: req.headers,
        decodedToken: req.user
    });

    // Validate userId
    if (!userId || typeof userId !== 'number') {
        console.error('Invalid userId in token:', userId);
        return res.status(400).json({ 
            error: "Invalid user ID in token",
            details: `Expected number, got ${typeof userId}`
        });
    }

    db.get(
        "SELECT id, username, email FROM users WHERE id = ?",
        [userId],
        (err, row) => {
            if (err) {
                console.error("Database error in /api/user:", err);
                return res.status(500).json({ 
                    error: "Database error",
                    details: err.message 
                });
            }

            if (!row) {
                console.error('User not found in database:', userId);
                return res.status(404).json({ 
                    error: "User not found",
                    details: "No user exists with the ID from your authentication token"
                });
            }

            console.log('User found:', { id: row.id, username: row.username });
            res.json(row);
        }
    );
});

// Comprehensive token verification endpoint
app.get("/api/verify-token", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    console.log('Verifying token and user existence for userId:', userId);

    // Check if user exists in database
    db.get(
        "SELECT id, username, email FROM users WHERE id = ?",
        [userId],
        (err, user) => {
            if (err) {
                console.error('Database error during token verification:', err);
                return res.status(500).json({
                    error: "Internal server error",
                    details: "Database error during user verification"
                });
            }

            if (!user) {
                console.error('User not found for token userId:', userId);
                return res.status(401).json({
                    error: "Invalid token",
                    details: "User no longer exists"
                });
            }

            // Token is valid and user exists
            console.log('Token verification successful for user:', user.username);
            res.json({
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        }
    );
});

// Delete chat history endpoint
app.delete("/api/chat-history", authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        // Delete messages from all chats owned by the user
        db.run(
            `DELETE FROM messages 
             WHERE chat_id IN (
                 SELECT chat_id FROM chats WHERE user_id = ?
             )`,
            [userId],
            (err) => {
                if (err) {
                    console.error("Error deleting messages:", err);
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "Failed to delete messages" });
                }

                // Delete all chats owned by the user
                db.run(
                    "DELETE FROM chats WHERE user_id = ?",
                    [userId],
                    (err) => {
                        if (err) {
                            console.error("Error deleting chats:", err);
                            db.run("ROLLBACK");
                            return res.status(500).json({ error: "Failed to delete chats" });
                        }
                        
                        db.run("COMMIT");
                        res.json({ message: "Chat history deleted successfully" });
                    }
                );
            }
        );
    });
});

// Diagnostic endpoint to check user registration
app.get("/api/check-registration/:username", (req, res) => {
    const username = req.params.username;
    
    db.get(
        "SELECT id, username, email FROM users WHERE username = ?",
        [username],
        (err, row) => {
            if (err) {
                console.error("Error checking user registration:", err);
                return res.status(500).json({ 
                    error: "Database error",
                    details: err.message 
                });
            }

            if (!row) {
                return res.status(404).json({ 
                    error: "User not found",
                    message: "This username is not registered in the database"
                });
            }

            res.json({
                message: "User found",
                userExists: true,
                details: {
                    id: row.id,
                    username: row.username,
                    hasEmail: !!row.email
                }
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
        error: "Internal server error",
        message: err.message
    });
});
