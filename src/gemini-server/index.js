import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createServer } from 'http';
import { processWithAI, extractTitle } from './ai-processor.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(
	cors({
		origin: ['http://localhost:3000', 'http://localhost:3001'],
		credentials: true,
	})
);
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini AI with system instructions
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
/*const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash', // Consider upgrading to gemini-2.5-flash when available
	generationConfig: {
		temperature: 0.2, // Lower temperature for more consistent formatting
		topP: 0.8,
		topK: 40,
		maxOutputTokens: 8192,
	},
	systemInstruction: `You are an intelligent note-taking assistant that converts captured text into well-formatted markdown.
  
Your tasks:
1. Preserve the original content's meaning and technical accuracy
2. Fix minor grammar or typo issues without changing technical terms
3. Format with proper markdown including code blocks with language tags
4. Create descriptive titles that summarize the content
5. Maintain proper spacing for lists and code blocks`,
});*/


// Store recent notes for context (in memory for now)
let recentNotes = [];

// WebSocket Server
const wss = new WebSocketServer({
	server,
	path: '/ws',
});

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
	console.log('🔌 New WebSocket client connected');
	clients.add(ws);

	ws.on('close', () => {
		console.log('🔌 WebSocket client disconnected');
		clients.delete(ws);
	});

	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
		clients.delete(ws);
	});

	// Send welcome message
	ws.send(
		JSON.stringify({
			type: 'connection',
			message: 'Connected to AI Markdown Server',
			timestamp: new Date().toISOString(),
		})
	);
});

// Broadcast to all connected clients
function broadcast(data) {
	const message = JSON.stringify(data);
	clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	});
}

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		hasApiKey: !!process.env.GEMINI_API_KEY,
		connectedClients: clients.size,
		recentNotesCount: recentNotes.length,
		server: 'Gemini WebSocket Server',
	});
});

// Main text processing endpoint for extension
app.post('/api/process-text', async (req, res) => {
	console.log('📝 Processing request from extension:', {
		textLength: req.body.text?.length,
		domain: req.body.domain,
		timestamp: new Date().toISOString(),
	});

	try {
		const { text, url, title, domain, timestamp } = req.body;

		// Validate input
		if (!text || text.trim().length === 0) {
			return res.status(400).json({
				success: false,
				error: 'No text provided',
			});
		}

		// Send processing status to frontend via WebSocket
		broadcast({
			type: 'processing_start',
			message: 'Processing text with AI...',
			sourceUrl: url,
			sourceDomain: domain,
			textPreview: text.substring(0, 100) + '...',
			timestamp: new Date().toISOString(),
		});

		// Process with AI (including context from recent notes)
		const aiResult = await processWithAI(text, recentNotes, url, genAI);

		// Create processed note
		const processedNote = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			originalText: text,
			processedMarkdown: aiResult.markdown,
			title: aiResult.title, // AI-generated title
			contentType: aiResult.contentType, // AI-detected content type
			sourceUrl: url,
			sourceTitle: title,
			sourceDomain: domain,
			createdAt: timestamp || new Date().toISOString(),
			processedAt: new Date().toISOString(),
		};

		// Add to recent notes for context (keep last 10)
		recentNotes.unshift(processedNote);
		recentNotes = recentNotes.slice(0, 10);

		// Send processed markdown to frontend via WebSocket
		broadcast({
			type: 'markdown_ready',
			note: processedNote,
			message: 'Text processed successfully!',
			timestamp: new Date().toISOString(),
		});

		console.log('✅ Successfully processed and broadcasted:', processedNote.title);

		// Response to extension
		res.json({
			success: true,
			note: processedNote,
			message: 'Text processed successfully',
		});
	} catch (error) {
		console.error('❌ Processing error:', error);

		// Broadcast error to frontend
		broadcast({
			type: 'processing_error',
			error: error.message,
			message: 'AI processing failed',
			timestamp: new Date().toISOString(),
		});

		// Fallback response
		const fallbackNote = {
			id: Date.now().toString(),
			originalText: req.body.text,
			processedMarkdown: `# Captured Text\n\n${req.body.text}`,
			title: 'Captured Text (AI Processing Failed)',
			contentType: 'article',
			sourceUrl: req.body.url,
			createdAt: req.body.timestamp || new Date().toISOString(),
		};

		res.status(200).json({
			success: true,
			note: fallbackNote,
			message: 'Text captured (AI processing failed, using fallback)',
			warning: 'AI processing failed: ' + error.message,
		});
	}
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
	console.log(`🚀 AI Markdown Server running on http://localhost:${PORT}`);
	console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws`);
	console.log(`📝 Extension API: http://localhost:${PORT}/api/process-text`);
	console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('🛑 Shutting down WebSocket server...');
	wss.close(() => {
		server.close(() => {
			console.log('✅ Server shutdown complete');
			process.exit(0);
		});
	});
});
