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
   * We defined "capture-url" in wxt.config.ts as Ctrl+Shift+U.
   *
   * When triggered, we need to:
   * 1. Get the currently active tab
   * 2. Extract its URL
   * 3. Store the URL
   * 4. Open the popup
   */
  browser.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    if (command === 'capture-url') {
      /**
       * Get the currently active tab
       *
       * browser.tabs.query() searches for tabs matching criteria:
       * - active: true - The tab currently visible to user
       * - currentWindow: true - In the current Chrome window
       *
       * Returns an array, we take the first one [0]
       */
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      });

      if (tabs[0]) {
        const currentTab = tabs[0];
        const url = currentTab.url || '';

        console.log('URL captured:', url);

        // Store the URL in our capturedText variable
        capturedText = url;

        // Open the popup to show the URL
        browser.action.openPopup();
      }
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

          // Detect if PDF
          const isPdf = url.toLowerCase().endsWith('.pdf') ||
                        url.startsWith('file://') && url.toLowerCase().includes('.pdf');
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
