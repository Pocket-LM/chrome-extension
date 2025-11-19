/**
 * Background Script
 *
 * This script runs in the background and handles:
 * 1. Creating context menu items (right-click menu)
 * 2. Storing selected text temporarily
 * 3. Handling keyboard shortcuts
 * 4. Capturing URLs from active tabs
 * 5. Communicating with the popup
 */

// Store captured content temporarily so popup can access it
// Can be either selected text or URL
let capturedText = '';

export default defineBackground(() => {
  console.log('PocketLM Background Service Started', { id: browser.runtime.id });

  /**
   * STEP 1: Create Context Menu
   *
   * This runs when the extension is installed or when Chrome starts.
   * We create a right-click menu item that appears when text is selected.
   *
   * chrome.contextMenus.create() parameters:
   * - id: Unique identifier for this menu item
   * - title: Text shown in the context menu
   * - contexts: When to show this menu (only when text is selected)
   */
  browser.contextMenus.create({
    id: 'capture-in-pocketlm',
    title: 'Capture in PocketLM',
    contexts: ['selection'], // Only show when user has selected text
  });

  /**
   * STEP 2: Handle Context Menu Clicks
   *
   * This listener fires when user clicks our context menu item.
   *
   * Parameters:
   * - info: Contains information about the click (including selected text)
   * - tab: Information about the tab where the click happened
   */
  browser.contextMenus.onClicked.addListener((info, tab) => {
    // Check if our menu item was clicked
    if (info.menuItemId === 'capture-in-pocketlm') {
      // Get the selected text from the info object
      const selectedText = info.selectionText || '';

      // Store it in our background script variable
      capturedText = selectedText;

      console.log('Text captured:', selectedText);

      /**
       * STEP 3: Open the Extension Popup
       *
       * chrome.action.openPopup() opens our extension's popup window
       * This will trigger the popup to load and we can then pass the text to it
       */
      browser.action.openPopup();
    }
  });

  /**
   * STEP 4: Handle Keyboard Shortcuts
   *
   * This listener fires when user presses a registered keyboard shortcut.
   * We defined "capture-url" in wxt.config.ts as Ctrl+Shift+U (Cmd+Shift+U on Mac).
   *
   * When triggered, we simply open the popup without capturing any content.
   */
  browser.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    if (command === 'capture-url') {
      // Simply open the popup - no automatic content capture
      browser.action.openPopup();
    }
  });

  /**
   * STEP 5: Listen for Messages from Popup
   *
   * The popup will send a message asking "what text was captured?"
   * We respond with the stored capturedText.
   *
   * This is how different parts of the extension communicate:
   * - Popup sends: { type: 'GET_CAPTURED_TEXT' }
   * - Background responds: { text: 'the captured text' }
   */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CAPTURED_TEXT') {
      console.log('Popup requested captured text:', capturedText);

      // Send the captured text back to the popup
      sendResponse({ text: capturedText });

      // Clear the stored text after sending it
      capturedText = '';
      return true;
    }

    if (message.type === 'GET_FRESH_CONTEXT') {
      console.log('Popup requested fresh context');

      // Get fresh context from current tab
      (async () => {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });

        if (tabs[0]) {
          const url = tabs[0].url || '';
          const title = tabs[0].title || '';

          // Detect if PDF - multiple detection methods
          const urlLower = url.toLowerCase();
          const isPdf =
            // Direct PDF file extension
            urlLower.endsWith('.pdf') ||
            // PDF in URL path or query parameters
            urlLower.includes('.pdf') ||
            // Common PDF viewer URLs
            urlLower.includes('/pdf/') ||
            urlLower.includes('pdf=') ||
            urlLower.includes('file=') && urlLower.includes('pdf') ||
            // Google Drive PDF viewer
            urlLower.includes('drive.google.com') && urlLower.includes('/file/d/') ||
            // Common document viewers that might serve PDFs
            urlLower.includes('pdfviewer') ||
            urlLower.includes('pdf-viewer') ||
            // Chrome's PDF viewer
            title.toLowerCase().endsWith('.pdf') ||
            // Check if it's a chrome-extension:// PDF viewer
            urlLower.startsWith('chrome-extension://') && urlLower.includes('pdf');

          const pdfSource = url.startsWith('file://') ? 'local' : 'online';

          // Try to get selected text
          let selectedText = '';
          try {
            const results = await browser.scripting.executeScript({
              target: { tabId: tabs[0].id! },
              func: () => window.getSelection()?.toString() || ''
            });
            selectedText = results[0]?.result || '';
          } catch (error) {
            console.log('Could not get selected text:', error);
          }

          const context = {
            selectedText,
            currentUrl: url,
            pageTitle: title,
            isPdf,
            pdfSource
          };

          console.log('Sending fresh context:', context);
          sendResponse(context);
        } else {
          sendResponse(null);
        }
      })();

      // Return true to indicate we'll respond asynchronously
      return true;
    }

    return false;
  });
});
