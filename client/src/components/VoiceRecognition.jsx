const initializeRecognition = () => {
	if (!("webkitSpeechRecognition" in window)) {
		setError("Speech recognition is not supported in this browser");
		return;
	}

	const recognition = new window.webkitSpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 1;

	recognition.onstart = () => {
		setIsListening(true);
		setError(null);
		if (onListeningChange) onListeningChange(true);
	};

	recognition.onresult = (event) => {
		const transcript = Array.from(event.results)
			.map((result) => result[0].transcript)
			.join("");
		setTranscript(transcript);
		if (onTranscript) onTranscript(transcript);
	};

	recognition.onerror = (event) => {
		console.error("Speech recognition error:", event.error);
		if (event.error === "not-allowed") {
			setError(
				"Microphone access was denied. Please allow microphone access in your browser settings."
			);
		} else if (event.error === "no-speech") {
			setError("No speech detected. Please try speaking again.");
		} else {
			setError(`Speech recognition error: ${event.error}`);
		}
		setIsListening(false);
		if (onListeningChange) onListeningChange(false);
	};

	recognition.onend = () => {
		setIsListening(false);
		if (onListeningChange) onListeningChange(false);
	};

	recognitionRef.current = recognition;
};

const checkMicrophonePermission = async () => {
	try {
		// First check if getUserMedia is supported
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setError("Voice recognition is not supported in this browser");
			return false;
		}

		// Check current permission status
		const permissionStatus = await navigator.permissions.query({
			name: "microphone",
		});

		if (permissionStatus.state === "granted") {
			return true;
		}

		// If permission is not granted, request it
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
			},
		});

		// Stop the stream immediately after getting permission
		stream.getTracks().forEach((track) => track.stop());
		return true;
	} catch (error) {
		console.error("Microphone permission error:", error);
		if (error.name === "NotFoundError") {
			setError("No microphone found. Please check your system settings.");
		} else if (error.name === "NotAllowedError") {
			setError(
				"Microphone access was denied. Please allow microphone access in your browser settings."
			);
		} else {
			setError(`Error accessing microphone: ${error.message}`);
		}
		return false;
	}
};

const handleButtonClick = async () => {
	if (isListening) {
		stopListening();
		return;
	}

	setIsRequestingPermission(true);
	setError(null);

	try {
		const hasPermission = await checkMicrophonePermission();
		if (hasPermission) {
			startListening();
		}
	} catch (error) {
		console.error("Error handling button click:", error);
		setError("Failed to initialize voice recognition");
	} finally {
		setIsRequestingPermission(false);
	}
};
