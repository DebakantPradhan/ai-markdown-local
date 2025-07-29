import dotenv from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServer } from 'http';
import { detectContentType, processWithAI, extractTitle } from './ai-processor.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// WebSocket Server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
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
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to AI Markdown Server',
    timestamp: new Date().toISOString()
  }));
});

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
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
    server: 'Gemini WebSocket Server'
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
      timestamp: new Date().toISOString()
    });

    // Detect content type
    const contentType = detectContentType(text, url);
    console.log('Detected content type:', contentType);

    // Process with AI
    const aiResult = await processWithAI(text, contentType, url, model);

    // Create processed note
    const processedNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalText: text,
      processedMarkdown: aiResult.markdown,
      title: aiResult.title,
      contentType: contentType,
      sourceUrl: url,
      sourceTitle: title,
      sourceDomain: domain,
      createdAt: timestamp || new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    // Send processed markdown to frontend via WebSocket
    broadcast({
      type: 'markdown_ready',
      note: processedNote,
      message: 'Text processed successfully!',
      timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
    });

    // Fallback response
    const fallbackNote = {
      id: Date.now().toString(),
      originalText: req.body.text,
      processedMarkdown: `# Captured Text\n\n${req.body.text}`,
      title: 'Captured Text (AI Processing Failed)',
      contentType: 'raw',
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