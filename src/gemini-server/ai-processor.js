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

	const systemPrompt = `You are an intelligent note-taking assistant. Your job is to convert captured text into well-formatted markdown while preserving the original meaning and correcting only obvious typos or grammar errors.

FORMATTING REQUIREMENTS:
- Use proper markdown syntax with correct code block formatting
- For code blocks: Always use proper fenced code blocks with language identifiers (e.g., \`\`\`cpp, \`\`\`python, \`\`\`javascript)
- Always preserve ALL whitespace, indentation and formatting in code blocks exactly as provided
- For numbered lists: Use "1. " format with a blank line before the list and between items
- For bullet points: Use "- " format with a blank line before the list and between items

CONTENT HANDLING:
- Preserve ALL original content exactly as written - DO NOT summarize or condense
- Keep ALL original explanations and details intact
- For code: Identify the language, add a title, but NEVER modify the actual code
- If code lacks explanation, add brief notes AFTER the code block (never inside it)
- Fix only obvious typos like "ere" → "here" but preserve technical terms exactly

MARKDOWN CODE BLOCK FORMAT:
When formatting code, use this exact format:
\`\`\`language
code content here
\`\`\`

CONTEXT AWARENESS:
${contextSummary ? `Previous notes context:\n${contextSummary}\n` : ''}

Return a JSON object with this structure (DO NOT include any markdown code fences around the JSON):
{
  "title": "Brief descriptive title (max 60 chars)",
  "content_type": "code|algorithm|article|documentation|tutorial",
  "markdown": "The properly formatted markdown content with proper spacing and code blocks"
}`;

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
        .replace(/^```json\s*/gm, '')  // Remove opening ```json
        .replace(/```\s*$/gm, '')      // Remove closing ```
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
        if (text.includes('class ') || text.includes('function ') || text.includes('#include')) {
            const detectedLang = detectLanguage(text);
            fallbackMarkdown = `# ${extractTitle(text)}\n\n\`\`\`${detectedLang}\n${text}\n\`\`\``;
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
