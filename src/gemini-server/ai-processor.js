// Content type detection
export function detectContentType(text, url = '') {
  const lowerText = text.toLowerCase();
  const lowerUrl = url.toLowerCase();

  const codePatterns = [
    /(?:function|class|def|public|private|const|let|var|\{|\}|;|import|export)/,
    /(?:console\.log|print\(|printf|cout|System\.out)/,
    /(?:<\?php|<html|<div|<script|<!DOCTYPE)/,
  ];

  const dsaPatterns = [
    /(?:algorithm|complexity|O\(|time complexity|space complexity)/i,
    /(?:leetcode|hackerrank|codechef|interview|problem)/i,
    /(?:binary search|merge sort|quicksort|dynamic programming)/i,
  ];

  if (codePatterns.some(pattern => pattern.test(text))) return 'code';
  if (dsaPatterns.some(pattern => pattern.test(text))) return 'dsa';
  return 'article';
}

// AI processing function
export async function processWithAI(text, contentType, sourceUrl = '', model) {
  const prompts = {
    code: `Format this code as clean Markdown with proper code blocks and brief explanation:

${text}`,
    
    dsa: `Structure this algorithm/DSA content as organized Markdown with problem statement, approach, and solution:

${text}`,
    
    article: `Format this text as well-structured Markdown with appropriate headings:

${text}`
  };

  try {
    const prompt = prompts[contentType] || prompts.article;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const markdown = response.text();

    return {
      title: extractTitle(text),
      markdown: markdown
    };
  } catch (error) {
    console.error('AI processing failed:', error);
    return {
      title: extractTitle(text),
      markdown: `# ${extractTitle(text)}\n\n${text}`
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