import MarkdownRenderer from './MarkdownRenderer';

export default function NoteCard({ note, index, onCopy, onDownload }) {
	return (
		<article className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
			<header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
				<div className="flex items-center gap-3">
					<span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full">
						{String(index + 1).padStart(2, '0')}
					</span>
					{note.title && (
						<h2 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
							{note.title}
						</h2>
					)}
					{note.sourceDomain && (
						<span className="text-xs text-gray-500 dark:text-gray-400">
							from {note.sourceDomain}
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<time className="text-xs text-gray-400 dark:text-gray-500">
						{new Date(note.timestamp).toLocaleTimeString()}
					</time>

					{note.type === 'markdown' && (
						<>
							<button
								onClick={() => onCopy(note.content)}
								className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
								title="Copy to clipboard"
							>
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</button>

							<button
								onClick={() => onDownload(note.content, note.title)}
								className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
								title="Download as .md"
							>
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</button>
						</>
					)}
				</div>
			</header>

			<div className="p-4">
				<MarkdownRenderer content={note.content} type={note.type} />
			</div>

			{note.sourceUrl && (
				<footer className="px-4 pb-3">
					<a
						href={note.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
					>
						<svg
							className="w-3 h-3 mr-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
							/>
						</svg>
						View source
					</a>
				</footer>
			)}
		</article>
	);
}
