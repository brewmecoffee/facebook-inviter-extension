(function() {
    'use strict';

    let totalInvitesSent = 0;
    const MAX_INVITES = 5000;
    const INVITE_DELAY = 1000; // 1 second
    const SCROLL_AMOUNT = 500;
    let isProcessing = false;

    // Create UI Controls
    function createControls() {
        const controlPanel = document.createElement('div');
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Start Button
        const startButton = document.createElement('button');
        startButton.textContent = 'Start Inviting';
        startButton.style.cssText = `
            padding: 8px 16px;
            background: #1877f2;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;

        // Stop Button
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop Inviting';
        stopButton.style.cssText = `
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            display: none;
        `;

        // Counter Display
        const counterDisplay = document.createElement('div');
        counterDisplay.style.cssText = `
            text-align: center;
            font-size: 14px;
            font-weight: bold;
        `;

        startButton.onclick = () => {
            isProcessing = true;
            startButton.style.display = 'none';
            stopButton.style.display = 'block';
            processReactions();
        };

        stopButton.onclick = () => {
            isProcessing = false;
            startButton.style.display = 'block';
            stopButton.style.display = 'none';
        };

        controlPanel.appendChild(startButton);
        controlPanel.appendChild(stopButton);
        controlPanel.appendChild(counterDisplay);
        document.body.appendChild(controlPanel);

        // Update counter
        setInterval(() => {
            counterDisplay.textContent = `Invites: ${totalInvitesSent}/${MAX_INVITES}`;
        }, 1000);

        return { startButton, stopButton, counterDisplay };
    }

    // Find scrollable container in popup
    function findScrollableContainer(dialog) {
        return Array.from(dialog.querySelectorAll('div')).find(div => {
            return div.querySelector('[aria-label="Invite"]') &&
                div.scrollHeight > div.clientHeight;
        });
    }

    // Scroll popup and handle invites
    async function handlePopupScroll(dialog) {
        const container = findScrollableContainer(dialog);
        if (!container) return false;

        let canScroll = true;
        let lastScrollTop = -1;

        while (canScroll && isProcessing) {
            // Find and click invite buttons
            const inviteButtons = dialog.querySelectorAll('[aria-label="Invite"]');
            for (let button of inviteButtons) {
                if (!isProcessing || totalInvitesSent >= MAX_INVITES) {
                    return true; // Reached limit or stopped
                }

                try {
                    button.click();
                    totalInvitesSent++;
                    await new Promise(resolve => setTimeout(resolve, INVITE_DELAY));
                } catch (e) {
                    console.error('Error clicking invite button:', e);
                }
            }

            // Try scrolling
            const currentScrollTop = container.scrollTop;
            container.scrollTop += SCROLL_AMOUNT;
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if we actually scrolled
            canScroll = container.scrollTop !== currentScrollTop &&
                container.scrollTop !== lastScrollTop;
            lastScrollTop = container.scrollTop;
        }

        return false;
    }

    // Find and click reaction elements
    function findReactionElements() {
        return Array.from(document.querySelectorAll('span.x1e558r4')).filter(span => {
            return /^\d+$/.test(span.textContent.trim());
        });
    }

    // Process each post's reactions
    async function processPost(reactionElement) {
        try {
            if (!isProcessing) return true;

            // Click the reaction count
            reactionElement.click();
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Find popup dialog
            const dialog = document.querySelector('[role="dialog"]');
            if (!dialog) return false;

            // Process the popup
            const reachedLimit = await handlePopupScroll(dialog);
            if (reachedLimit) return true;

            // Close popup
            const closeButton = document.querySelector('div[aria-label="Close"]');
            if (closeButton) {
                closeButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            return false;
        } catch (e) {
            console.error('Error processing post:', e);
            return false;
        }
    }

    // Main processing function
    async function processReactions() {
        while (isProcessing && totalInvitesSent < MAX_INVITES) {
            const reactionElements = findReactionElements();
            let foundNew = false;

            for (let element of reactionElements) {
                if (!isProcessing) return;
                if (element.getAttribute('data-processed')) continue;

                element.setAttribute('data-processed', 'true');
                foundNew = true;

                const reachedLimit = await processPost(element);
                if (reachedLimit) return;
            }

            if (!foundNew) {
                window.scrollBy(0, SCROLL_AMOUNT);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Initialize controls
    createControls();
})();