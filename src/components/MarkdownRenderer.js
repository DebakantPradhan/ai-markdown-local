import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function MarkdownRenderer({ content, type = 'markdown', theme = 'light' }) {
	const getTypeStyles = () => {
		switch (type) {
			case 'processing':
				return 'text-blue-600 dark:text-blue-400';
			case 'error':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-gray-900 dark:text-gray-100';
		}
	};

	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

	return (
		<div className={`prose prose-sm dark:prose-invert max-w-none ${getTypeStyles()}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code: ({ node, inline, className, children, ...props }) => {
						const match = /language-(\w+)/.exec(className || '');
						const language = match ? match[1] : '';

						return !inline && language ? (
							<SyntaxHighlighter
								style={isDark ? oneDark : oneLight}
								language={language}
								PreTag="div"
								className="rounded-lg text-sm my-4 overflow-x-auto"
								showLineNumbers={true}
								wrapLines={true}
								customStyle={{
									margin: '1rem 0',
									padding: '1rem',
									borderRadius: '0.5rem',
								}}
								{...props}
							>
								{String(children).replace(/\n$/, '')}
							</SyntaxHighlighter>
						) : (
							<code
								className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono"
								{...props}
							>
								{children}
							</code>
						);
					},
					pre: ({ children }) => <div className="my-4">{children}</div>,
					h1: ({ children }) => (
						<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-0 border-b border-gray-200 dark:border-gray-700 pb-2">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">
							{children}
						</h3>
					),
					p: ({ children }) => (
						<p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
							{children}
						</p>
					),
					ul: ({ children }) => (
						<ul className="text-gray-700 dark:text-gray-300 mb-4 ml-6 space-y-2 list-disc">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="text-gray-700 dark:text-gray-300 mb-4 ml-6 space-y-2 list-decimal">
							{children}
						</ol>
					),
					li: ({ children }) => <li className="leading-relaxed pl-1 mb-1">{children}</li>,
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 py-2 rounded-r">
							{children}
						</blockquote>
					),
					table: ({ children }) => (
						<div className="overflow-x-auto mb-4">
							<table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
								{children}
							</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold text-left">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
							{children}
						</td>
					),
					strong: ({ children }) => (
						<strong className="font-semibold text-gray-900 dark:text-gray-100">
							{children}
						</strong>
					),
					em: ({ children }) => (
						<em className="italic text-gray-800 dark:text-gray-200">{children}</em>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
