// background.js - Extension background script
console.log('🚀 AI Markdown Converter background script loaded');
console.log('🔍 Chrome commands API available:', !!chrome.commands);

// Add this debugging section
chrome.commands.getAll((commands) => {
	console.log('📋 Registered commands:', commands);
	commands.forEach((command) => {
		console.log(
			`Command: ${command.name}, Shortcut: ${command.shortcut}, Description: ${command.description}`
		);
	});
});

// Listen for hotkey command (Ctrl+Shift+Q)
chrome.commands.onCommand.addListener(async (command) => {
	console.log('🎯 Command received:', command);
	console.log('📝 Processing capture-text command...');

	if (command === 'capture-text') {
		try {
			// Get current active tab
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

			if (!tab) {
				console.error('No active tab found');
				return;
			}

			console.log('📍 Current tab:', { id: tab.id, url: tab.url, title: tab.title });

			// Send message to content script to capture text
			chrome.tabs.sendMessage(tab.id, { action: 'capture-text' }, (response) => {
				if (chrome.runtime.lastError) {
					console.error(
						'🚨 Failed to send message to content script:',
						chrome.runtime.lastError
					);
					console.log('🔍 Tab info:', { id: tab.id, url: tab.url, status: tab.status });
					console.log(
						'💡 This usually means the content script is not loaded. Try refreshing the page.'
					);
					showNotification(
						'⚠️ Content script not loaded. Please refresh the page and try again.'
					);
				} else {
					console.log('✅ Message sent successfully to content script');
				}
			});
		} catch (error) {
			console.error('Error in command handler:', error);
			showNotification('Error: Failed to capture text');
		}
	}
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	console.log('Message received in background:', message);

	if (message.type === 'TEXT_CAPTURED') {
		console.log('Processing captured text...');

		try {
			// Process with API
			const result = await processWithAPI(message.data);

			// Store the processed note locally for popup to access
			await saveNoteLocally(result);

			// Show success notification
			showNotification(`✅ Note processed: "${result.title}"`);
		} catch (error) {
			console.error('Failed to process text:', error);
			showNotification('❌ Failed to process text. Check if server is running on port 3001.');

			// Save raw text as fallback
			await saveNoteLocally({
				id: Date.now().toString(),
				title: 'Raw Text (Server Error)',
				originalText: message.data.selectedText,
				processedMarkdown: `# Raw Text\n\n${message.data.selectedText}`,
				sourceUrl: message.data.url,
				sourceDomain: message.data.domain,
				createdAt: new Date().toISOString(),
				contentType: 'raw',
			});
		}
	}
});

// Function to process text with backend API
async function processWithAPI(capturedData) {
	const API_ENDPOINT = 'http://localhost:3001';

	console.log('Sending to API:', capturedData);

	const response = await fetch(`${API_ENDPOINT}/api/process-text`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			text: capturedData.selectedText,
			url: capturedData.url,
			title: capturedData.title,
			domain: capturedData.domain,
			timestamp: capturedData.timestamp,
		}),
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	const result = await response.json();
	console.log('API response:', result);

	if (!result.success) {
		throw new Error(result.error || 'API processing failed');
	}

	return result.note;
}

// Function to save note to local storage
async function saveNoteLocally(note) {
	try {
		// Get existing notes
		const result = await chrome.storage.local.get(['notes']);
		const existingNotes = result.notes || [];

		// Add new note at the beginning
		const updatedNotes = [note, ...existingNotes];

		// Keep only last 100 notes to avoid storage issues
		const limitedNotes = updatedNotes.slice(0, 100);

		// Save back to storage
		await chrome.storage.local.set({ notes: limitedNotes });

		console.log('✅ Note saved locally:', note.title);
	} catch (error) {
		console.error('❌ Failed to save note locally:', error);
	}
}

// Function to show notification
function showNotification(message) {
	chrome.notifications.create({
		type: 'basic',
		iconUrl: 'icon.png',
		title: 'AI Markdown Converter',
		message: message,
	});
}
