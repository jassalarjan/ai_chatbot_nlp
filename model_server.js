const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PythonShell } = require("python-shell");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/api/chat", (req, res) => {
	const userMessage = req.body.message;

	let options = {
		mode: "text",
		pythonOptions: ["-u"],
		scriptPath: "./models",
		args: [userMessage],
	};

	PythonShell.run("predict.py", options, (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).send("Error processing message");
		}
		res.send({ response: results[0] });
	});
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
