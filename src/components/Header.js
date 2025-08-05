'use client';

import { useTheme } from './ThemeProvider';

export default function Header({
	currentTopic,
	setCurrentTopic,
	isConnected,
	status,
	onDownloadAll,
	onCopyAll,
	onResetCanvas,
	notesCount,
}) {
	const { theme, toggleTheme } = useTheme();

	const getThemeIcon = () => {
		switch (theme) {
			case 'light':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				);
			case 'dark':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
						/>
					</svg>
				);
			case 'system':
				return (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				);
			default:
				return null;
		}
	};

	return (
		<header className="sticky top-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-gray-300 dark:border-neutral-700 shadow-sm">
			<div className="max-w-6xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
					{/* Left section */}
					<div className="flex items-center gap-6">
						<div>
							<h1 className="text-xl font-bold text-black dark:text-white">
								AI Markdown Canvas
							</h1>
							<p className="text-sm text-stone-600 dark:text-gray-400">
								Real-time note processing
							</p>
						</div>

						<input
							type="text"
							placeholder="Topic name..."
							value={currentTopic}
							onChange={(e) => setCurrentTopic(e.target.value)}
							className="px-4 py-2 text-sm bg-stone-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:border-neutral-400 dark:focus:border-neutral-500 text-black dark:text-white placeholder-stone-500 dark:placeholder-gray-400 min-w-[200px]"
						/>
					</div>

					{/* Right section */}
					<div className="flex items-center gap-3">
						{/* Connection status */}
						<div
							className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
								isConnected
									? 'bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 border border-stone-300 dark:border-neutral-600'
									: 'bg-stone-200 dark:bg-neutral-700 text-stone-800 dark:text-neutral-200 border border-stone-400 dark:border-neutral-500'
							}`}
						>
							<div
								className={`w-2 h-2 rounded-full mr-2 ${
									isConnected
										? 'bg-neutral-500 dark:bg-neutral-400'
										: 'bg-neutral-600 dark:bg-neutral-300'
								}`}
							></div>
							{status}
						</div>

						{/* Copy All button */}
						<button
							onClick={onCopyAll}
							disabled={notesCount === 0}
							className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-neutral-300 bg-stone-100 dark:bg-neutral-800 border border-stone-300 dark:border-neutral-600 rounded-lg hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							title="Copy all notes to clipboard"
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
							Copy All
						</button>

						{/* Download All button */}
						<button
							onClick={onDownloadAll}
							disabled={notesCount === 0}
							className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-neutral-300 bg-stone-100 dark:bg-neutral-800 border border-stone-300 dark:border-neutral-600 rounded-lg hover:bg-stone-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							title="Download all notes as markdown"
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
							Download All
						</button>

						{/* Theme toggle */}
						<button
							onClick={toggleTheme}
							className="p-2 text-stone-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg transition-all border border-transparent hover:border-stone-300 dark:hover:border-neutral-600"
							title={`Switch to ${
								theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
							} mode`}
						>
							{getThemeIcon()}
						</button>

						{/* Reset button */}
						<button
							onClick={onResetCanvas}
							className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-neutral-400 bg-stone-50 dark:bg-neutral-900 border border-stone-300 dark:border-neutral-600 rounded-lg hover:bg-stone-100 dark:hover:bg-neutral-800 hover:text-stone-800 dark:hover:text-neutral-200 transition-all"
							title="Clear all notes"
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Reset
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
