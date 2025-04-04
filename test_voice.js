const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Test voice input simulation
function simulateVoiceInput(text) {
    console.log('Simulating voice input:', text);
    return text;
}

// Test voice output
function simulateVoiceOutput(text) {
    console.log('Simulating voice output:', text);
    
    // Create a new gTTS instance
    const gttsInstance = new gTTS(text, 'en');
    
    // Generate a unique filename
    const filename = `test_output_${Date.now()}.mp3`;
    const filepath = path.join(__dirname, filename);
    
    // Save the audio file
    gttsInstance.save(filepath, (err) => {
        if (err) {
            console.error('Error generating voice output:', err);
            return;
        }
        console.log(`Voice output saved to: ${filepath}`);
        
        // Clean up the file after 5 seconds
        setTimeout(() => {
            fs.unlink(filepath, (err) => {
                if (err) {
                    console.error('Error deleting test file:', err);
                    return;
                }
                console.log('Test file cleaned up');
            });
        }, 5000);
    });
}

// Get AI response from API
async function getAIResponse(prompt) {
    try {
        // Read the authentication token
        const authToken = fs.readFileSync('test_auth_token.txt', 'utf8').trim();
        
        // Configure axios with timeout and retry logic
        const axiosInstance = axios.create({
            timeout: 10000, // 10 second timeout
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Add retry logic
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axiosInstance.post('http://localhost:5000/api/chat', {
                    prompt,
                    sender: 'user',
                    userPreferences: '',
                    expertiseDomains: ''
                });
                return response.data.response;
            } catch (error) {
                retries--;
                if (retries === 0) throw error;
                
                // Log the error and wait before retrying
                console.log(`Request failed, retrying... (${retries} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Network error: Could not connect to the server. Please check if the server is running.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('Network error: Request timed out. Please check your internet connection.');
        } else if (error.response) {
            console.error('Server error:', error.response.status, error.response.data);
        } else {
            console.error('Error getting AI response:', error.message);
        }
        return 'Error: Could not get AI response';
    }
}

// Test cases
const testCases = [
    "Hello, how are you?",
    "What's the weather like today?",
    "Tell me a joke",
    "What time is it?"
];

// Run tests
console.log('Starting voice input/output tests...\n');

async function runTests() {
    try {
        for (let i = 0; i < testCases.length; i++) {
            console.log(`Test ${i + 1}:`);
            const input = simulateVoiceInput(testCases[i]);
            const aiResponse = await getAIResponse(input);
            console.log('AI Response:', aiResponse);
            simulateVoiceOutput(aiResponse);
            console.log('-------------------\n');
            
            // Add a small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Test failed:', error.message);
    }
    console.log('Voice input/output tests completed!');
}

runTests(); 