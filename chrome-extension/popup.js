// popup.js - Extension popup functionality
document.addEventListener('DOMContentLoaded', async () => {
	console.log('Popup loaded');

	// Initialize popup
	await loadNotes();
	setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
	// Search functionality
	const searchInput = document.getElementById('searchInput');
	searchInput.addEventListener('input', handleSearch);

	// Export button
	const exportBtn = document.getElementById('exportBtn');
	exportBtn.addEventListener('click', exportNotes);

	// Clear button
	const clearBtn = document.getElementById('clearBtn');
	clearBtn.addEventListener('click', clearAllNotes);
}

// Load and display notes
async function loadNotes() {
	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];

		console.log('Loaded notes:', notes.length);

		displayNotes(notes);
		updateStats(notes);
	} catch (error) {
		console.error('Failed to load notes:', error);
	}
}

// Display notes in the UI
function displayNotes(notes) {
	const notesList = document.getElementById('notesList');
	const emptyState = document.getElementById('emptyState');

	if (notes.length === 0) {
		notesList.style.display = 'none';
		emptyState.style.display = 'block';
		return;
	}

	notesList.style.display = 'block';
	emptyState.style.display = 'none';

	notesList.innerHTML = notes.map((note) => createNoteHTML(note)).join('');

	// Add event listeners to note actions
	setupNoteEventListeners();
}

// Create HTML for a single note
function createNoteHTML(note) {
	const previewText = (note.originalText || '').substring(0, 100);
	const domain = note.sourceDomain || 'Unknown';
	const date = formatDate(note.createdAt);
	const contentType = note.contentType || 'text';

	return `
        <div class="note-card" data-note-id="${note.id}">
            <div class="note-header">
                <h3 class="note-title">${escapeHtml(note.title || 'Untitled Note')}</h3>
                <div class="note-meta">
                    <span class="note-source">${escapeHtml(domain)}</span>
                    <span class="note-date">${date}</span>
                </div>
            </div>
            
            <div class="note-content">
                <p class="note-preview">${escapeHtml(previewText)}${
		previewText.length >= 100 ? '...' : ''
	}</p>
            </div>
            
            <div class="note-footer">
                <span class="content-type-badge">${contentType}</span>
                <div class="note-actions">
                    <button class="btn-icon view-btn" data-note-id="${
						note.id
					}" title="View Full Note">
                        👁️
                    </button>
                    <button class="btn-icon download-btn" data-note-id="${
						note.id
					}" title="Download Markdown">
                        📥
                    </button>
                    <button class="btn-icon delete-btn" data-note-id="${
						note.id
					}" title="Delete Note">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Setup event listeners for note actions
function setupNoteEventListeners() {
	// View buttons
	document.querySelectorAll('.view-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const noteId = e.target.getAttribute('data-note-id');
			viewNote(noteId);
		});
	});

	// Download buttons
	document.querySelectorAll('.download-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const noteId = e.target.getAttribute('data-note-id');
			downloadNote(noteId);
		});
	});

	// Delete buttons
	document.querySelectorAll('.delete-btn').forEach((btn) => {
		btn.addEventListener('click', (e) => {
			const noteId = e.target.getAttribute('data-note-id');
			deleteNote(noteId);
		});
	});
}

// View note in new tab
async function viewNote(noteId) {
	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];
		const note = notes.find((n) => n.id === noteId);

		if (note) {
			// Create a data URL with the markdown content
			const markdownContent = `# ${note.title || 'Untitled Note'}

**Source:** ${note.sourceUrl || 'Unknown'}  
**Date:** ${formatDate(note.createdAt)}  
**Type:** ${note.contentType || 'text'}

---

${note.processedMarkdown || note.originalText}
`;

			const blob = new Blob([markdownContent], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);

			chrome.tabs.create({ url: url });
		}
	} catch (error) {
		console.error('Failed to view note:', error);
	}
}

// Download single note as markdown
async function downloadNote(noteId) {
	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];
		const note = notes.find((n) => n.id === noteId);

		if (note) {
			const markdownContent = note.processedMarkdown || note.originalText;
			const filename = `${(note.title || 'note')
				.replace(/[^a-z0-9]/gi, '_')
				.toLowerCase()}.md`;

			downloadFile(markdownContent, filename, 'text/markdown');
		}
	} catch (error) {
		console.error('Failed to download note:', error);
	}
}

// Delete note
async function deleteNote(noteId) {
	if (!confirm('Are you sure you want to delete this note?')) {
		return;
	}

	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];
		const updatedNotes = notes.filter((n) => n.id !== noteId);

		await chrome.storage.local.set({ notes: updatedNotes });

		// Reload the display
		await loadNotes();
	} catch (error) {
		console.error('Failed to delete note:', error);
	}
}

// Search functionality
async function handleSearch(e) {
	const query = e.target.value.toLowerCase().trim();

	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];

		let filteredNotes = notes;

		if (query) {
			filteredNotes = notes.filter(
				(note) =>
					(note.title || '').toLowerCase().includes(query) ||
					(note.originalText || '').toLowerCase().includes(query) ||
					(note.sourceDomain || '').toLowerCase().includes(query)
			);
		}

		displayNotes(filteredNotes);
	} catch (error) {
		console.error('Search failed:', error);
	}
}

// Export all notes
async function exportNotes() {
	try {
		const result = await chrome.storage.local.get(['notes']);
		const notes = result.notes || [];

		if (notes.length === 0) {
			alert('No notes to export!');
			return;
		}

		// Create a combined markdown file
		const combinedMarkdown = notes
			.map((note) => {
				return `# ${note.title || 'Untitled Note'}

**Source:** ${note.sourceUrl || 'Unknown'}  
**Date:** ${formatDate(note.createdAt)}  
**Type:** ${note.contentType || 'text'}

---

${note.processedMarkdown || note.originalText}

---

`;
			})
			.join('\n\n');

		const filename = `ai_notes_export_${new Date().toISOString().split('T')[0]}.md`;
		downloadFile(combinedMarkdown, filename, 'text/markdown');
	} catch (error) {
		console.error('Failed to export notes:', error);
	}
}

// Clear all notes
async function clearAllNotes() {
	if (!confirm('Are you sure you want to delete ALL notes? This cannot be undone.')) {
		return;
	}

	try {
		await chrome.storage.local.set({ notes: [] });
		await loadNotes();
	} catch (error) {
		console.error('Failed to clear notes:', error);
	}
}

// Update stats display
function updateStats(notes) {
	const noteCount = document.getElementById('noteCount');
	noteCount.textContent = notes.length;
}

// Utility functions
function formatDate(dateString) {
	try {
		const date = new Date(dateString);
		return (
			date.toLocaleDateString() +
			' ' +
			date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		);
	} catch {
		return 'Unknown date';
	}
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

function downloadFile(content, filename, mimeType) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	URL.revokeObjectURL(url);
}
