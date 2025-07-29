import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content, type = 'markdown' }) {
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

	return (
		<div className={`prose prose-sm dark:prose-invert max-w-none ${getTypeStyles()}`}>
			<ReactMarkdown
				components={{
					h1: ({ children }) => (
						<h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-0">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3">
							{children}
						</h3>
					),
					p: ({ children }) => (
						<p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
							{children}
						</p>
					),
					ul: ({ children }) => (
						<ul className="text-gray-700 dark:text-gray-300 mb-3 pl-4 space-y-1">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="text-gray-700 dark:text-gray-300 mb-3 pl-4 space-y-1">
							{children}
						</ol>
					),
					li: ({ children }) => <li className="leading-relaxed">{children}</li>,
					blockquote: ({ children }) => (
						<blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-3">
							{children}
						</blockquote>
					),
					code: ({ inline, children }) =>
						inline ? (
							<code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono">
								{children}
							</code>
						) : (
							<code className="block bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-3 rounded text-sm font-mono overflow-x-auto">
								{children}
							</code>
						),
					strong: ({ children }) => (
						<strong className="font-semibold text-gray-900 dark:text-gray-100">
							{children}
						</strong>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
