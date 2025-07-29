'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState('# AI Markdown Converter\n\nWaiting for content...');
  const [status, setStatus] = useState('Disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001/ws');
      
      wsRef.current.onopen = () => {
        console.log('🔌 Connected to WebSocket server');
        setIsConnected(true);
        setStatus('Connected');
        setMarkdown('# 🤖 AI Markdown Converter\n\n✅ **Connected to server**\n\nWaiting for content from browser extension...\n\n## How to use:\n1. Install the browser extension\n2. Select text on any webpage\n3. Press `Ctrl+Shift+Q` to capture\n4. Watch the AI-processed markdown appear here!\n\n---\n\n*Real-time markdown preview powered by WebSocket*');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data);

        switch (data.type) {
          case 'connection':
            setStatus('Connected');
            break;
            
          case 'processing_start':
            setStatus('Processing...');
            setMarkdown(`# 🔄 Processing Text\n\n**Source:** ${data.sourceUrl}\n\n**Preview:**\n${data.textPreview}\n\n---\n\n*AI is analyzing and formatting your content...*`);
            break;
            
          case 'markdown_ready':
            setStatus('Ready');
            setMarkdown(data.note.processedMarkdown);
            break;
            
          case 'processing_error':
            setStatus('Error');
            setMarkdown(`# ❌ Processing Error\n\n**Error:** ${data.error}\n\n**Message:** ${data.message}\n\n---\n\n*Please check the server logs and try again.*`);
            break;
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        setIsConnected(false);
        setStatus('Disconnected');
        setMarkdown('# ⚠️ Connection Lost\n\nWebSocket connection to server was lost.\n\n**Trying to reconnect...**');
        
        // Auto-reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        setIsConnected(false);
        setStatus('Error');
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setStatus('Connection Failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 AI Markdown Preview
              </h1>
              <p className="text-sm text-gray-600">
                Real-time markdown processing with WebSocket
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Markdown Preview
            </h2>
            <p className="text-sm text-gray-600">
              Content will appear here when processed by AI
            </p>
          </div>
          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            Powered by Google Gemini AI • WebSocket Connection • Next.js
          </p>
        </div>
      </div>
    </div>
  );
}