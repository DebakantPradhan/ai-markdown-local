// AI processing function with improved prompts and context
export async function processWithAI(text, previousNotes = [], sourceUrl = '', genAI) {
	// Create context from previous notes
	const contextSummary = previousNotes
		.slice(0, 3)
		.map(
			(note) =>
				`Previous note: "${note.title}" - ${note.processedMarkdown.substring(0, 100)}...`
		)
		.join('\n');

	const systemPrompt = `You are "Quill", an expert Markdown formatter and note-taking assistant.

Return ONLY a valid JSON object—no markdown fences, no extra text.

───────────────────────────── JSON SHAPE ──────────────────────────────
{
 "title": "Brief descriptive title (≤60 chars, plain text)",
 "content_type": "code | article | tutorial | doc | list | note | rules | summary",
 "markdown": "Complete, meaningful markdown; never repeat title as heading"
}
────────────────────────────────────────────────────────────────────────────

MANDATORY RULES:
1. Output ONLY valid JSON—never markdown fences around JSON or extra text.
2. NEVER repeat the title as heading inside markdown.
3. ALWAYS produce complete, meaningful notes—no fragments or broken sentences.
4. PRESERVE original wording and technical terms; fix only obvious typos.
5. REMOVE ALL EMOJIS from content—replace with text descriptions if needed.
6. For code:
   • Wrap in fenced blocks: \`\`\`python, \`\`\`cpp, \`\`\`javascript, \`\`\`java, \`\`\`bash, \`\`\`plaintext
   • If code lacks comments, add ONE line after: \`> **Explanation:** ...\` (max 25 words)
   • Escape backticks in code content
7. Structure text:
   • Title-case/ALL-CAPS lines → \`##\` heading
   • Lines starting with -, *, 1., • → proper markdown lists
   • For numbered lists: keep number and content on SAME line (e.g., "1. Content here")
   
8. Smart parsing:
   • If fragmentary but interpretable: repair and complete logically
   • If too short/random/unclear: create meaningful summary
   • If partial instructions: convert to proper numbered/bulleted lists
   • If lacks context: add brief intro sentence
   • Always prefer concise, clear, usable notes

KEEP every sentence; DON'T summarize or drop details unless fragment is meaningless.

───────────────────────────── EXAMPLES ──────────────────────────────

# Code with explanation needed
Input: for i in range(3): print(i)
Output:
{
 "title": "Python Loop Example",
 "content_type": "code",
 "markdown": "\`\`\`python\\nfor i in range(3): print(i)\\n\`\`\`\\n> **Explanation:** Prints numbers 0 to 2."
}

# Text with emojis (remove them)
Input: "This is great! ✅ It works perfectly 🎉"
Output:
{
 "title": "Positive Feedback",
 "content_type": "note",
 "markdown": "This is great! It works perfectly."
}

# Numbered list (keep on same line)
Input: "Steps: 1. Install dependencies 2. Configure API"
Output:
{
 "title": "Setup Steps",
 "content_type": "tutorial",
 "markdown": "## Steps\\n\\n1. Install dependencies\\n2. Configure API"
}

# Broken list (complete)
Input: "Dashboard Features: - real-time updates - export"
Output:
{
 "title": "Dashboard Features",
 "content_type": "list",
 "markdown": "## Dashboard Features\\n\\n- Real-time updates\\n- Export options"
}

# Random fragment (summarize)
Input: "...socket json...frontend..."
Output:
{
 "title": "System Fragment",
 "content_type": "summary",
 "markdown": "This fragment references system components involving sockets, JSON data, and frontend interfaces, but lacks sufficient detail."
}

─────────────────────────────────────────────────────────────

CONTEXT AWARENESS:
${contextSummary ? `Previous notes context:\n${contextSummary}\n` : ''}

Follow these rules exactly. Output only the JSON object.`;

	try {
		// Fix the API call format to match Gemini's requirements
		// const result = await model.generateContent({
		// 	parts: [{ text: systemPrompt + '\n\nText to process:\n\n' + text }],
		// });

		const response = await genAI.models.generateContent({
			model: 'gemini-2.5-flash-lite',
			contents: systemPrompt + '\n\nText to process:\n\n' + text,
			config: {
				systemInstruction: systemPrompt,
				// temperature: 0.2,
				// topP: 0.8,
				// topK: 40,
				maxOutputTokens: 8192,
			},
		});

		let responseText = response.text;
		console.log('Raw AI response:', responseText);

		// Properly clean the response to extract JSON
		// Remove the markdown code fences around JSON
		responseText = responseText
			.replace(/^```json\s*/gm, '') // Remove opening ```json
			.replace(/```\s*$/gm, '') // Remove closing ```
			.trim();

		console.log('Cleaned response for JSON parsing:', responseText);

		try {
			const parsed = JSON.parse(responseText);

			// The AI already provides properly formatted markdown - don't modify it
			let processedMarkdown = parsed.markdown || text;

			console.log('Final markdown to send:', processedMarkdown);

			return {
				title: parsed.title || extractTitle(text),
				markdown: processedMarkdown,
				contentType: parsed.content_type || 'article',
			};
		} catch (parseError) {
			console.warn('Failed to parse AI response as JSON:', parseError);
			console.warn('Response text was:', responseText);

			// Fallback: try to use the raw response as markdown
			// Remove any remaining code fences that might be wrapping content
			let fallbackMarkdown = responseText;

			// If it's code content, ensure proper formatting
			if (
				text.includes('class ') ||
				text.includes('function ') ||
				text.includes('#include')
			) {
				const detectedLang = detectLanguage(text);
				fallbackMarkdown = `# ${extractTitle(
					text
				)}\n\n\`\`\`${detectedLang}\n${text}\n\`\`\``;
			}

			return {
				title: extractTitle(text),
				markdown: fallbackMarkdown,
				contentType: 'article',
			};
		}
	} catch (error) {
		console.error('AI processing failed:', error);

		// Enhanced fallback for code content
		let fallbackMarkdown = text;
		if (text.includes('class ') || text.includes('function ') || text.includes('#include')) {
			const detectedLang = detectLanguage(text);
			fallbackMarkdown = `# ${extractTitle(text)}\n\n\`\`\`${detectedLang}\n${text}\n\`\`\``;
		} else {
			fallbackMarkdown = `# ${extractTitle(text)}\n\n${text}`;
		}

		return {
			title: extractTitle(text),
			markdown: fallbackMarkdown,
			contentType: 'article',
		};
	}
}

export function extractTitle(text) {
	const firstLine = text.trim().split('\n')[0];
	if (firstLine && firstLine.length > 5 && firstLine.length < 100) {
		return firstLine.replace(/[#*`]/g, '').trim();
	}
	const words = text.trim().split(/\s+/).slice(0, 8).join(' ');
	return words.length > 50 ? words.substring(0, 47) + '...' : words;
}

// Remove the manual content type detection function as it's now AI-driven

// Add language detection helper function
function detectLanguage(text) {
	if (text.includes('class ') && text.includes('public:')) return 'cpp';
	if (text.includes('function ') && text.includes('{')) return 'javascript';
	if (text.includes('def ') && text.includes(':')) return 'python';
	if (text.includes('public class ')) return 'java';
	if (text.includes('#include')) return 'cpp';
	if (text.includes('<?php')) return 'php';
	return 'text';
}
