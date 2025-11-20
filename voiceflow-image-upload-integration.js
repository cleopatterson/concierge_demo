/**
 * VOICEFLOW IMAGE UPLOAD BUTTON INTEGRATION
 *
 * This script adds a persistent image upload button to your Voiceflow chat widget
 * that allows users to upload images for analysis.
 *
 * INSTALLATION:
 * 1. Add this entire <script> block AFTER your Voiceflow chat widget script
 * 2. Update the CONFIG object below with your MCP server URL and API key
 * 3. Ensure the Voiceflow widget is loaded on the page
 *
 * REQUIREMENTS:
 * - Voiceflow chat widget must be installed on the page
 * - MCP server with analyze_image tool endpoint
 * - ImgBB API key configured on the MCP server
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ============================================================================
  const CONFIG = {
    MCP_URL: 'https://get-tools-cleopatterson.replit.app/mcp',
    API_KEY: 'ljAaCgaZ3u72asFhp6HUvmAIy/5hGKKuQtBHJLNJiCI=',
    MAX_IMAGE_SIZE: 800,        // Max pixels on longest side
    JPEG_QUALITY: 0.7,          // 0-1 compression quality
    MAX_ATTEMPTS: 40,           // Widget detection attempts
    ATTEMPT_INTERVAL: 500       // ms between attempts
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function updateStatus(iconUrl, text) {
    const icon = document.getElementById('status-icon');
    const status = document.getElementById('status-text');
    if (icon) icon.src = iconUrl;
    if (status) status.textContent = text;
  }

  function showStatus() {
    document.querySelector('.upload-status')?.classList.add('show');
  }

  function hideStatus(delay = 2000) {
    setTimeout(() => {
      document.querySelector('.upload-status')?.classList.remove('show');
    }, delay);
  }

  async function compressImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      img.onload = function() {
        let { width, height } = img;

        // Resize if needed
        if (width > CONFIG.MAX_IMAGE_SIZE || height > CONFIG.MAX_IMAGE_SIZE) {
          const scale = CONFIG.MAX_IMAGE_SIZE / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // Compress to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', CONFIG.JPEG_QUALITY));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onload = (e) => img.src = e.target.result;
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImage(imageData) {
    const response = await fetch(CONFIG.MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'analyze_image',
          arguments: {
            image_data: imageData,
            create_permanent_url: true  // Get permanent URL for HubSpot
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.result.content[0].text);
    return result;  // Return full result: { description, permanent_url, ... }
  }

  // ============================================================================
  // MAIN FUNCTION
  // ============================================================================
  function addPersistentUploadButton() {

    // Add custom CSS for the upload button
    const style = document.createElement('style');
    style.textContent = `
      #custom-upload-btn {
        position: absolute;
        right: 76px;
        bottom: 45px;
        width: 32px;
        height: 32px;
        background: transparent;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 10;
        opacity: 1;
        color: #9CA3AF;
      }

      #custom-upload-btn.visible {
        display: flex;
      }

      /* Only apply hover effects on devices with hover capability (desktop) */
      @media (hover: hover) and (pointer: fine) {
        #custom-upload-btn:hover {
          background: #0066cc;
          color: white;
        }

        #custom-upload-btn:hover::after {
          content: 'Upload photo';
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: #0066cc;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          white-space: nowrap;
          font-family: Arial, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 1000;
        }
      }

      #custom-upload-btn.hidden {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }

      #custom-upload-btn svg {
        width: 24px;
        height: 24px;
      }

      /* Make input container relative so button positions correctly */
      .vfrc-footer {
        position: relative !important;
      }

      /* Upload status indicator */
      .upload-status {
        position: fixed;
        bottom: 130px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: none;
        align-items: center;
        gap: 10px;
        z-index: 100001;
      }

      .upload-status.show {
        display: flex;
      }

      .upload-status img {
        width: 24px;
        height: 24px;
      }
    `;
    document.head.appendChild(style);

    // Wait for chat widget to be ready
    let attempts = 0;

    const findAndInjectButton = setInterval(() => {
      attempts++;

      // Find widget container - in embedded mode with declarative shadow DOM,
      // the shadow root is directly on #vf-embed
      const embedDiv = document.querySelector('#vf-embed');
      const widgetContainer = embedDiv ||
                              document.querySelector('#voiceflow-chat') ||
                              document.querySelector('[id*="voiceflow"]');
      const shadowRoot = widgetContainer?.shadowRoot;

      // Log what we're seeing
      if (attempts === 1) {
        console.log('Embed div:', embedDiv);
        console.log('Widget container:', widgetContainer);
        console.log('Has shadow root:', !!shadowRoot);
        console.log('Embed div HTML:', embedDiv?.innerHTML);
      }

      // Check if shadow DOM has content
      const shadowHasContent = shadowRoot && shadowRoot.querySelectorAll('*').length > 0;

      if (!shadowHasContent) {
        // Maybe it's not using shadow DOM at all - check regular DOM
        const inputInEmbed = embedDiv?.querySelector('input') ||
                            embedDiv?.querySelector('textarea') ||
                            embedDiv?.querySelector('[class*="input"]');

        if (inputInEmbed) {
          console.log('Attempt', attempts, '- Found input in regular DOM (no shadow)!', inputInEmbed);
          // Widget is not using shadow DOM - look for footer in regular DOM
        } else {
          if (attempts % 10 === 0) {
            console.log('Attempt', attempts, '- Still waiting for widget to render...');
          }
          return;
        }
      } else {
        console.log('Attempt', attempts, '- Shadow DOM has', shadowRoot.querySelectorAll('*').length, 'elements');
      }

      // Find footer container - try multiple selectors
      const footerContainer = shadowRoot?.querySelector('.vfrc-footer') ||
                              shadowRoot?.querySelector('[class*="footer"]') ||
                              shadowRoot?.querySelector('.vfrc-input-container') ||
                              shadowRoot?.querySelector('[class*="input"]') ||
                              embedDiv?.querySelector('.vfrc-footer') ||
                              document.querySelector('.vfrc-footer');

      if (footerContainer) {
        console.log('Found footer:', footerContainer);
      }

      // Check if button already exists
      const existingBtn = shadowRoot?.getElementById('custom-upload-btn') ||
                         document.getElementById('custom-upload-btn');

      if (footerContainer && !existingBtn) {

        // Inject CSS into shadow DOM
        if (shadowRoot && !shadowRoot.querySelector('#custom-upload-styles')) {
          const shadowStyle = document.createElement('style');
          shadowStyle.id = 'custom-upload-styles';
          shadowStyle.textContent = style.textContent;
          shadowRoot.appendChild(shadowStyle);
        }

        // Create the upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.id = 'custom-upload-btn';
        uploadBtn.setAttribute('aria-label', 'Upload photo');
        uploadBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 1)">
              <path d="M4 8C4 6.89543 4.89543 6 6 6H8.17157C8.70201 6 9.21071 5.78929 9.58579 5.41421L10.5858 4.41421C10.9609 4.03914 11.4696 3.82843 12 3.82843H13C13.5304 3.82843 14.0391 4.03914 14.4142 4.41421L15.4142 5.41421C15.7893 5.78929 16.298 6 16.8284 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H6C4.89543 20 4 19.1046 4 18V8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12.5" cy="13" r="3.5" stroke="currentColor" stroke-width="1.5"/>
            </g>
          </svg>
        `;
        uploadBtn.classList.add('visible'); // Start visible

        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.id = 'custom-file-input';

        // Create upload status indicator
        const statusDiv = document.createElement('div');
        statusDiv.className = 'upload-status';
        statusDiv.innerHTML = `
          <img src="" alt="Status" id="status-icon">
          <span id="status-text">Uploading...</span>
        `;

        // Add button to footer, others to body
        footerContainer.appendChild(uploadBtn);
        document.body.appendChild(fileInput);
        document.body.appendChild(statusDiv);

        console.log('Upload button added to footer');

        // Handle button click
        uploadBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Upload button clicked!');
          fileInput.click();
        });

        // Monitor input to hide/show button
        const findInput = () => {
          return (shadowRoot?.querySelector('.vfrc-input')) ||
                 (shadowRoot?.querySelector('textarea')) ||
                 (shadowRoot?.querySelector('input[type="text"]')) ||
                 document.querySelector('.vfrc-input') ||
                 document.querySelector('textarea') ||
                 document.querySelector('input[type="text"]');
        };

        // Function to check and toggle button visibility
        const checkInputValue = () => {
          const chatInput = findInput();
          if (chatInput && chatInput.value && chatInput.value.trim().length > 0) {
            uploadBtn.classList.add('hidden');
            uploadBtn.classList.remove('visible');
          } else if (chatInput) {
            uploadBtn.classList.remove('hidden');
            uploadBtn.classList.add('visible');
          }
        };

        // Setup event listeners
        const setupListeners = setInterval(() => {
          const chatInput = findInput();
          if (chatInput && !chatInput.dataset.uploadListenerAdded) {
            chatInput.dataset.uploadListenerAdded = 'true';
            chatInput.addEventListener('input', checkInputValue);
            chatInput.addEventListener('keyup', checkInputValue);
            chatInput.addEventListener('change', checkInputValue);
            clearInterval(setupListeners);
          }
        }, 500);

        // Also continuously check (as backup)
        setInterval(checkInputValue, 200);

        // Handle file selection
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Validate file type
          if (!file.type.startsWith('image/')) {
            alert('Please select a photo file');
            fileInput.value = '';
            return;
          }

          // Show status and process image
          showStatus();
          updateStatus(
            'https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif',
            'Compressing photo...'
          );

          try {
            // Compress image
            const compressedImage = await compressImage(file);

            // Analyze image and get permanent URL
            updateStatus(
              'https://s3.amazonaws.com/com.voiceflow.studio/share/upload/upload.gif',
              'Uploading photo...'
            );
            const result = await analyzeImage(compressedImage);

            if (!result.permanent_url) {
              throw new Error('Failed to create permanent image URL');
            }

            // Show success
            updateStatus(
              'https://s3.amazonaws.com/com.voiceflow.studio/share/check/check.gif',
              'Photo uploaded!'
            );

            // Send image URL in the message so agent can extract it and analyze
            window.voiceflow.chat.interact({
              type: 'text',
              payload: `📸 Photo uploaded: ${result.permanent_url}`
            });

            // Cleanup
            fileInput.value = '';
            hideStatus();

          } catch (error) {
            console.error('Image upload error:', error);

            // Show error
            updateStatus(
              'https://s3.amazonaws.com/com.voiceflow.studio/share/error.gif',
              'Upload failed'
            );

            // Send error to chat
            window.voiceflow.chat.interact({
              type: 'text',
              payload: `❌ Photo upload failed: ${error.message}`
            });

            // Cleanup
            fileInput.value = '';
            hideStatus(3000);
          }
        });

        clearInterval(findAndInjectButton);
      } else if (attempts >= CONFIG.MAX_ATTEMPTS) {
        console.warn('Upload button: Widget footer not found after', CONFIG.MAX_ATTEMPTS, 'attempts');
        clearInterval(findAndInjectButton);
      }
    }, CONFIG.ATTEMPT_INTERVAL);
  }

  // Expose function globally so it can be called after widget loads
  window.addVoiceflowImageUpload = addPersistentUploadButton;

})();
