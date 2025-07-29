// content.js - Runs on every webpage to capture text
console.log('🚀 AI Markdown Converter content script loaded on:', window.location.href);
console.log('🔍 Chrome runtime available:', !!chrome.runtime);

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('📨 Content script received message:', message);

	if (message.action === 'capture-text') {
		try {
			// Get selected text from the webpage
			const selectedText = window.getSelection().toString().trim();

			if (!selectedText) {
				showTempNotification('❌ No text selected! Please select some text first.');
				sendResponse({ success: false, error: 'No text selected' });
				return;
			}

			if (selectedText.length < 10) {
				showTempNotification('❌ Selected text too short! Please select more text.');
				sendResponse({ success: false, error: 'Text too short' });
				return;
			}

			if (selectedText.length > 5000) {
				showTempNotification('❌ Selected text too long! Please select less text.');
				sendResponse({ success: false, error: 'Text too long' });
				return;
			}

			// Show processing notification
			showTempNotification('🔄 Processing with AI...', 3000);

			// Gather context about the webpage
			const context = {
				url: window.location.href,
				title: document.title,
				domain: window.location.hostname,
				timestamp: new Date().toISOString(),
				selectedText: selectedText,
			};

			console.log('Captured context:', context);

			// Send data to background script
			chrome.runtime.sendMessage({
				type: 'TEXT_CAPTURED',
				data: context,
			});

			sendResponse({ success: true, data: context });
		} catch (error) {
			console.error('Error in content script:', error);
			showTempNotification('❌ Error capturing text');
			sendResponse({ success: false, error: error.message });
		}
	}
});

// Function to show temporary notification on the webpage
function showTempNotification(message, duration = 2000) {
	// Remove any existing notification
	const existingNotification = document.getElementById('ai-markdown-notification');
	if (existingNotification) {
		existingNotification.remove();
	}

	// Create notification element
	const notification = document.createElement('div');
	notification.id = 'ai-markdown-notification';
	notification.textContent = message;

	// Style the notification
	notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    max-width: 350px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;

	// Add CSS animation
	if (!document.getElementById('ai-markdown-styles')) {
		const styles = document.createElement('style');
		styles.id = 'ai-markdown-styles';
		styles.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
		document.head.appendChild(styles);
	}

	// Add to page
	document.body.appendChild(notification);

	// Remove after specified duration
	setTimeout(() => {
		if (notification.parentNode) {
			notification.style.animation = 'slideOut 0.3s ease-in';
			setTimeout(() => {
				if (notification.parentNode) {
					notification.remove();
				}
			}, 300);
		}
	}, duration);
}
