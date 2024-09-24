document.addEventListener('DOMContentLoaded', function () {
  const copyButton = document.getElementById('copyButton');
  copyButton.addEventListener('click', copySelectedContent);
});

function copySelectedContent() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tabId = tabs[0].id;

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: getSelectedHtml,
      },
      (results) => {
        if (chrome.runtime.lastError || !results || !results[0]) {
          console.error('Copy failed:', chrome.runtime.lastError);
          alert('An error occurred while copying.');
          return;
        }
        const selectedHtml = results[0].result;
        if (selectedHtml) {
          // Create a Blob containing the HTML
          const blob = new Blob([selectedHtml], { type: 'text/html' });
          const item = new ClipboardItem({ 'text/html': blob });

          navigator.clipboard.write([item]).catch(err => {
            console.error('Copy failed:', err);
            alert('An error occurred while copying.');
          });
          // On success, no prompt is necessary
        } else {
          // No content selected
          alert('No content selected.');
        }
      }
    );
  });
}

// Function executed in the page context to get the selected HTML
function getSelectedHtml() {
  // Remove event listeners that may prevent copying
  ['copy', 'cut', 'contextmenu', 'selectstart', 'mousedown', 'mouseup', 'mousemove', 'keydown', 'keypress', 'keyup'].forEach(function(eventName) {
    document.addEventListener(eventName, function(e) {
      e.stopPropagation();
    }, true);
  });

  // Get the selected content as HTML
  let selectedHtml = '';
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const container = document.createElement('div');
    for (let i = 0; i < selection.rangeCount; i++) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }
    selectedHtml = container.innerHTML;
  }
  return selectedHtml;
}
