export default function EmptyState({ isConnected }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
        Ready to capture content
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Select text on any webpage and press{' '}
        <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded font-mono">
          Ctrl+Shift+Q
        </kbd>{' '}
        to start capturing AI-enhanced notes.
      </p>
      <div className="text-sm text-gray-400 dark:text-gray-500">
        {isConnected ? 'Extension ready' : 'Check WebSocket connection'}
      </div>
    </div>
  );
}