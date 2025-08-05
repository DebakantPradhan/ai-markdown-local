import MarkdownRenderer from './MarkdownRenderer';
import { useTheme } from './ThemeProvider';

export default function NoteCard({ note, index, onCopy, onDownload }) {
	const { theme } = useTheme();

	return (
		<section className="group relative bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 shadow-sm hover:shadow-md dark:shadow-black/10 dark:hover:shadow-black/20 hover:border-gray-400 dark:hover:border-neutral-600 transition-all duration-200">
			{/* Left accent bar for visual distinction - now neutral */}
			<div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-neutral-600 to-neutral-800 dark:from-neutral-400 dark:to-neutral-600 rounded-l-xl opacity-80"></div>

			{/* Note header */}
			<header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
				<div className="flex items-center gap-3">
					<span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold bg-gradient-to-r from-neutral-700 to-neutral-900 dark:from-neutral-300 dark:to-neutral-500 text-white dark:text-black rounded-full">
						{String(index + 1).padStart(2, '0')}
					</span>
					{note.title && (
						<h2 className="font-semibold text-black dark:text-white text-base">
							{note.title}
						</h2>
					)}
					{note.sourceDomain && (
						<span className="text-sm text-stone-600 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full border border-gray-200 dark:border-neutral-700">
							{note.sourceDomain}
						</span>
					)}
				</div>

				<div className="flex items-center gap-3">
					<time className="text-sm text-stone-500 dark:text-gray-400">
						{new Date(note.timestamp).toLocaleTimeString()}
					</time>

					{/* Action buttons - visible on hover */}
					{note.type === 'markdown' && (
						<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button
								onClick={() => onCopy(note.content)}
								className="inline-flex items-center justify-center w-8 h-8 text-stone-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
								title="Copy to clipboard"
							>
								<svg
									className="w-4 h-4"
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
								className="inline-flex items-center justify-center w-8 h-8 text-stone-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-all border border-transparent hover:border-gray-200 dark:hover:border-neutral-700"
								title="Download as .md"
							>
								<svg
									className="w-4 h-4"
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
						</div>
					)}
				</div>
			</header>

			{/* Note content */}
			<div className="px-6 py-5">
				<MarkdownRenderer content={note.content} type={note.type} theme={theme} />
			</div>

			{/* Source link footer */}
			{note.sourceUrl && (
				<footer className="px-6 pb-4">
					<a
						href={note.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center text-sm text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors underline decoration-neutral-400 hover:decoration-black dark:hover:decoration-white"
					>
						<svg
							className="w-4 h-4 mr-2"
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
		</section>
	);
}
