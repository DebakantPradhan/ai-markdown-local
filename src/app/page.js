'use client';

import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import Header from '../components/Header';
import NoteCard from '../components/NoteCard';
import EmptyState from '../components/EmptyState';

function MarkdownPreview() {
	const [notes, setNotes] = useState([]);
	const [status, setStatus] = useState('Disconnected');
	const [isConnected, setIsConnected] = useState(false);
	const [currentTopic, setCurrentTopic] = useState('');
	const wsRef = useRef(null);

	useEffect(() => {
		loadNotesFromStorage();
		connectWebSocket();

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

	useEffect(() => {
		if (notes.length > 0) {
			saveNotesToStorage();
		}
	}, [notes]);

	const loadNotesFromStorage = () => {
		try {
			const saved = localStorage.getItem('ai-markdown-notes');
			const savedTopic = localStorage.getItem('ai-markdown-topic');
			if (saved) {
				const parsedNotes = JSON.parse(saved);
				const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
				const recentNotes = parsedNotes.filter(
					(note) => new Date(note.timestamp).getTime() > thirtyMinutesAgo
				);
				setNotes(recentNotes);
			}
			if (savedTopic) {
				setCurrentTopic(savedTopic);
			}
		} catch (error) {
			console.error('Failed to load notes from storage:', error);
		}
	};

	const saveNotesToStorage = () => {
		try {
			localStorage.setItem('ai-markdown-notes', JSON.stringify(notes));
			localStorage.setItem('ai-markdown-topic', currentTopic);
		} catch (error) {
			console.error('Failed to save notes to storage:', error);
		}
	};

	const connectWebSocket = () => {
		try {
			wsRef.current = new WebSocket('ws://localhost:3001/ws');

			wsRef.current.onopen = () => {
				console.log('Connected to WebSocket server');
				setIsConnected(true);
				setStatus('Connected');
			};

			wsRef.current.onmessage = (event) => {
				const data = JSON.parse(event.data);
				console.log('Received:', data);

				switch (data.type) {
					case 'connection':
						setStatus('Connected');
						break;

					case 'processing_start':
						setStatus('Processing...');
						const processingNote = {
							id: `processing-${Date.now()}`,
							type: 'processing',
							content: `Processing text from ${data.sourceDomain}\n\n${data.textPreview}`,
							timestamp: new Date().toISOString(),
							sourceUrl: data.sourceUrl,
						};
						setNotes((prev) => [...prev, processingNote]);
						break;

					case 'markdown_ready':
						setStatus('Ready');
						setNotes((prev) => {
							const filtered = prev.filter(
								(note) => !note.id.startsWith('processing-')
							);
							return [
								...filtered,
								{
									id: data.note.id,
									type: 'markdown',
									content: data.note.processedMarkdown,
									title: data.note.title,
									timestamp: data.note.processedAt,
									sourceUrl: data.note.sourceUrl,
									sourceDomain: data.note.sourceDomain,
								},
							];
						});
						break;

					case 'processing_error':
						setStatus('Error');
						setNotes((prev) => {
							const filtered = prev.filter(
								(note) => !note.id.startsWith('processing-')
							);
							return [
								...filtered,
								{
									id: `error-${Date.now()}`,
									type: 'error',
									content: `Processing Error\n\n${data.error}\n\n${data.message}`,
									timestamp: new Date().toISOString(),
								},
							];
						});
						break;
				}
			};

			wsRef.current.onclose = () => {
				console.log('WebSocket connection closed');
				setIsConnected(false);
				setStatus('Disconnected');
				setTimeout(connectWebSocket, 3000);
			};

			wsRef.current.onerror = (error) => {
				console.error('WebSocket error:', error);
				setIsConnected(false);
				setStatus('Error');
			};
		} catch (error) {
			console.error('Failed to connect to WebSocket:', error);
			setStatus('Connection Failed');
		}
	};

	const copyToClipboard = async (content) => {
		try {
			await navigator.clipboard.writeText(content);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	const copyAllNotes = async () => {
		const allContent = notes
			.filter((note) => note.type === 'markdown')
			.map(
				(note, index) =>
					`# Note ${index + 1}: ${note.title || 'Untitled'}\n\n${note.content}`
			)
			.join('\n\n---\n\n');

		try {
			await navigator.clipboard.writeText(allContent);
		} catch (error) {
			console.error('Failed to copy all notes:', error);
		}
	};

	const downloadMarkdown = (content, title = 'markdown') => {
		const blob = new Blob([content], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const downloadAllNotes = () => {
		const allContent = notes
			.filter((note) => note.type === 'markdown')
			.map((note) => `# ${note.title || 'Note'}\n\n${note.content}\n\n---\n`)
			.join('\n');

		downloadMarkdown(allContent, currentTopic || 'all_notes');
	};

	const resetCanvas = () => {
		setNotes([]);
		setCurrentTopic('');
		localStorage.removeItem('ai-markdown-notes');
		localStorage.removeItem('ai-markdown-topic');
	};

	const markdownNotesCount = notes.filter((n) => n.type === 'markdown').length;

	return (
		<div className="min-h-screen bg-stone-50 dark:bg-black transition-colors">
			<Header
				currentTopic={currentTopic}
				setCurrentTopic={setCurrentTopic}
				isConnected={isConnected}
				status={status}
				onDownloadAll={downloadAllNotes}
				onCopyAll={copyAllNotes}
				onResetCanvas={resetCanvas}
				notesCount={markdownNotesCount}
			/>

			<main className="max-w-6xl mx-auto px-6 py-8">
				{notes.length === 0 ? (
					<EmptyState isConnected={isConnected} />
				) : (
					<div className="space-y-6">
						{notes.map((note, index) => (
							<NoteCard
								key={note.id}
								note={note}
								index={index}
								onCopy={copyToClipboard}
								onDownload={downloadMarkdown}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}

export default function Page() {
	return (
		<ThemeProvider>
			<MarkdownPreview />
		</ThemeProvider>
	);
}
