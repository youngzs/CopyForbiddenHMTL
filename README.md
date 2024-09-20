Some site Disable the HTML copy, So Write the Chrome externsion to enable the forbiddened copy.

- **Copy the selected content including images and formatting** (i.e., rich text/HTML), not just plain text.
- **Suppress unnecessary prompts**; only show prompts if there is an error, and the prompts should be in English.

Below is the extension code that meets these requirements.

---

### **Updated Extension Implementation**

#### **1. `manifest.json`**

Update the `manifest.json` file to ensure the necessary permissions are included.

```json
{
  "manifest_version": 3,
  "name": "Copy with Formatting",
  "version": "1.1",
  "description": "Copy selected content including images and formatting, even if the page blocks copying.",
  "permissions": [
    "scripting",
    "activeTab",
    "clipboardWrite"
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

**Explanation:**

- **`permissions`**:
  - **`scripting`**: Allows the extension to inject scripts into web pages.
  - **`activeTab`**: Grants temporary access to the active tab when the extension action is invoked.
  - **`clipboardWrite`**: Allows writing data to the clipboard.
- **`action`**: Specifies the popup UI for the extension.

---

#### **2. `popup.html`**

Create the popup interface with a single "Copy" button.

```html
<!DOCTYPE html>
<html>
<head>
  <title>Copy with Formatting</title>
  <style>
    body {
      min-width: 200px;
      padding: 10px;
      font-family: Arial, sans-serif;
    }
    button {
      width: 100%;
      padding: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <button id="copyButton">Copy Selected Content</button>

  <script src="popup.js"></script>
</body>
</html>
```

---

#### **3. `popup.js`**

Implement the logic to copy the selected content, including images and formatting, and handle errors appropriately.

```javascript
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
```

**Explanation:**

- **Suppress Unnecessary Prompts**: Removed any alert notifications on success; only alerts are shown in case of errors.
- **Error Messages in English**: Error messages are displayed in English.
- **Copying HTML Content**:
  - In `getSelectedHtml`, we collect the selected content along with its formatting by cloning the selected ranges and appending them to a temporary container.
    - This method preserves images and styling in the selected content.
  - We create a `Blob` with the HTML content and use it to create a `ClipboardItem` of type `'text/html'`.
  - We use `navigator.clipboard.write()` to write the `ClipboardItem` to the clipboard.

**Notes:**

- **Clipboard API Requirements**:
  - The `navigator.clipboard.write()` method requires that the script is executed in a secure context (HTTPS). Extensions are considered secure contexts, so this should work.
- **Error Handling**:
  - Any errors during the copy process are logged to the console and an alert is displayed to inform the user.
- **Compatibility**:
  - The Clipboard API is supported in modern browsers. Make sure you are using an up-to-date version of Chrome.

---

#### **4. Permissions and Considerations**

Ensure that the extension has permission to run scripts on the pages you are working with.

- **Host Permissions**: In Manifest V3, host permissions are specified under `"host_permissions"`. Since we're using `activeTab`, explicit host permissions aren't required unless you need to access specific domains all the time.
- **Cross-Origin Content**:
  - Be aware that due to cross-origin restrictions, some images or content from different origins may not copy correctly.
  - Unfortunately, this is a browser security measure that can't be bypassed.

---

### **Testing the Extension**

1. **Load the Extension**:

   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" if it's not already enabled.
   - Click on "Load unpacked" and select the directory containing your extension files (`manifest.json`, `popup.html`, `popup.js`).

2. **Test the Copy Functionality**:

   - Go to a webpage where copying is blocked or where you want to copy formatted content.
   - Select the content you wish to copy, including any images or formatting.
   - Click on the extension icon and then click the **"Copy Selected Content"** button.
   - Open a rich text editor (e.g., Google Docs, Microsoft Word, or an email composition window) and paste the content.
     - **Note**: Using a program that supports rich text is necessary to see the formatting and images.

3. **Verify No Unnecessary Prompts**:

   - Ensure that no alerts appear when copying is successful.
   - If an error occurs (e.g., no content is selected or the copy fails), an alert should appear with an appropriate English message.

---

### **Potential Issues and Solutions**

- **Images Not Copying Correctly**:

  - **Issue**: Images from different origins might not copy due to security restrictions.
  - **Solution**: This is a browser security feature and cannot be bypassed. Only images from the same origin as the page or allowed via CORS will copy correctly.

- **Copy Fails Silently**:

  - **Issue**: The copy operation does not work, and no error message appears.
  - **Solution**: Check the console logs (`chrome://extensions/` > "Inspect views: background page") for any errors. Ensure that the extension has the necessary permissions.

- **Clipboard API Errors**:

  - **Issue**: The `navigator.clipboard.write()` method throws an error.
  - **Solution**: Ensure you're testing in a secure context and that the page isn't overriding or blocking clipboard access.

---

### **Additional Notes**

- **Security Considerations**:

  - Be cautious with the content being copied. Ensure that any scripts or sensitive information are handled appropriately.
  - The extension should avoid any actions that could compromise user security or privacy.

- **Housekeeping**:

  - **Manifest Version**: Ensure that you are using Manifest Version 3, as per the current Chrome extension guidelines.
  - **Testing on Various Sites**: Test the extension on multiple websites to ensure broad compatibility.

- **Extensibility**:

  - This extension can be further developed to handle more complex scenarios, such as copying stylesheets or handling specific content types.

---

### **Conclusion**

By updating the extension as above, you should now be able to copy selected content, including images and formatting, even from pages that block copying via JavaScript. The extension will only display prompts in English when an error occurs, ensuring a smoother user experience.

If you have any further questions or need assistance with additional features, feel free to ask!
