export class RunnerUI {
    private container: HTMLElement;
    private canvasWrapper: HTMLElement;
    private canvas: HTMLCanvasElement;
    private scoreElement: HTMLElement;
    private gameOverElement: HTMLElement;
    
    constructor(container: HTMLElement, onRestart: () => void) {
        this.container = container;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#87CEEB'; // Sky blue
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
        this.scoreElement.innerText = '0m';
        this.scoreElement.style.position = 'absolute';
        this.scoreElement.style.top = '20px';
        this.scoreElement.style.left = '20px';
        this.scoreElement.style.fontSize = '32px';
        this.scoreElement.style.color = 'white';
        this.scoreElement.style.fontFamily = 'Arial, sans-serif';
        this.scoreElement.style.fontWeight = 'bold';
        this.scoreElement.style.textShadow = '2px 2px 2px rgba(0,0,0,0.3)';
        this.container.appendChild(this.scoreElement);

        // Game Over Screen
        this.gameOverElement = document.createElement('div');
        this.gameOverElement.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10;
        `;
        this.container.appendChild(this.gameOverElement);

        const title = document.createElement('h1');
        title.innerText = 'Game Over';
        title.style.color = 'white';
        this.gameOverElement.appendChild(title);

        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'Run Again';
        restartBtn.style.padding = '10px 20px';
        restartBtn.style.fontSize = '20px';
        restartBtn.style.marginTop = '20px';
        restartBtn.onclick = onRestart;
        this.gameOverElement.appendChild(restartBtn);
    }

    getCanvas() { return this.canvas; }

    updateScore(distance: number) {
        this.scoreElement.innerText = Math.floor(distance) + 'm';
    }

    showGameOver() {
        this.gameOverElement.style.display = 'flex';
    }

    hideGameOver() {
        this.gameOverElement.style.display = 'none';
    }
}
