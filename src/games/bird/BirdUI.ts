export class BirdUI {
    private container: HTMLElement;
    private canvasWrapper: HTMLElement;
    private canvas: HTMLCanvasElement;
    private scoreElement: HTMLElement;
    private messageElement: HTMLElement; // Start/Game Over message
    
    constructor(container: HTMLElement, onAction: () => void) {
        this.container = container;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#70c5ce'; // Flappy bird sky blue
        this.container.style.overflow = 'hidden';
        
        // Canvas Wrapper
        this.canvasWrapper = document.createElement('div');
        this.canvasWrapper.style.width = '100%';
        this.canvasWrapper.style.height = '100%';
        this.canvasWrapper.style.position = 'absolute';
        this.container.appendChild(this.canvasWrapper);

        // Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvasWrapper.appendChild(this.canvas);
        
        // Score
        this.scoreElement = document.createElement('div');
        this.scoreElement.innerText = '0';
        this.scoreElement.style.position = 'absolute';
        this.scoreElement.style.top = '10%';
        this.scoreElement.style.width = '100%';
        this.scoreElement.style.textAlign = 'center';
        this.scoreElement.style.fontSize = '48px';
        this.scoreElement.style.color = 'white';
        this.scoreElement.style.fontFamily = 'Arial, sans-serif';
        this.scoreElement.style.fontWeight = 'bold';
        this.scoreElement.style.textShadow = '2px 2px 0 #000';
        this.scoreElement.style.pointerEvents = 'none';
        this.scoreElement.style.zIndex = '10';
        this.container.appendChild(this.scoreElement);

        // Message Screen (Overlay)
        this.messageElement = document.createElement('div');
        this.messageElement.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 20;
            pointer-events: none; /* Let clicks pass through to container for generic input */
        `;
        this.container.appendChild(this.messageElement);

        const msgText = document.createElement('div');
        msgText.className = 'message-text'; // Class for easy toggle
        msgText.innerText = 'Tap to Flap!';
        msgText.style.fontSize = '32px';
        msgText.style.color = 'white';
        msgText.style.textShadow = '2px 2px 0 #000';
        this.messageElement.appendChild(msgText);
        
        // Restart Button (only for Game Over)
        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'Play Again';
        restartBtn.className = 'restart-btn';
        restartBtn.style.padding = '10px 20px';
        restartBtn.style.fontSize = '20px';
        restartBtn.style.marginTop = '20px';
        restartBtn.style.pointerEvents = 'auto'; // Enable click
        restartBtn.style.display = 'none';
        restartBtn.onclick = (e) => {
            e.stopPropagation();
            onAction();
        };
        this.messageElement.appendChild(restartBtn);
    }

    getCanvas() { return this.canvas; }

    updateScore(score: number) {
        this.scoreElement.innerText = score.toString();
    }

    showMessage(text: string, showRestart: boolean = false) {
        const txt = this.messageElement.querySelector('.message-text') as HTMLElement;
        const btn = this.messageElement.querySelector('.restart-btn') as HTMLElement;
        
        if (txt) txt.innerText = text;
        this.messageElement.style.display = 'flex';
        
        if (showRestart) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    }

    hideMessage() {
        this.messageElement.style.display = 'none';
    }
}
