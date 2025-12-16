export class NinjaUI {
    private container: HTMLElement;
    private canvasWrapper: HTMLElement;
    private canvas: HTMLCanvasElement;
    private scoreElement: HTMLElement;
    private gameOverElement: HTMLElement;
    private score: number = 0;
    
    constructor(container: HTMLElement, onRestart: () => void) {
        this.container = container;
        this.container.innerHTML = '';
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#2c3e50';
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
        this.scoreElement.style.top = '20px';
        this.scoreElement.style.left = '20px';
        this.scoreElement.style.fontSize = '48px';
        this.scoreElement.style.color = 'white';
        this.scoreElement.style.fontFamily = 'Arial, sans-serif';
        this.scoreElement.style.fontWeight = 'bold';
        this.scoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.scoreElement.style.pointerEvents = 'none';
        this.container.appendChild(this.scoreElement);

        // Game Over Screen
        this.gameOverElement = document.createElement('div');
        this.gameOverElement.style.position = 'absolute';
        this.gameOverElement.style.top = '0';
        this.gameOverElement.style.left = '0';
        this.gameOverElement.style.width = '100%';
        this.gameOverElement.style.height = '100%';
        this.gameOverElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
        this.gameOverElement.style.display = 'none';
        this.gameOverElement.style.flexDirection = 'column';
        this.gameOverElement.style.justifyContent = 'center';
        this.gameOverElement.style.alignItems = 'center';
        this.gameOverElement.style.zIndex = '10';
        this.container.appendChild(this.gameOverElement);

        const title = document.createElement('h1');
        title.innerText = 'Game Over';
        title.style.color = 'white';
        title.style.fontSize = '64px';
        title.style.marginBottom = '20px';
        this.gameOverElement.appendChild(title);

        const restartBtn = document.createElement('button');
        restartBtn.innerText = 'Restart';
        restartBtn.style.padding = '15px 40px';
        restartBtn.style.fontSize = '24px';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '8px';
        restartBtn.style.backgroundColor = '#e74c3c';
        restartBtn.style.color = 'white';
        restartBtn.onclick = () => onRestart();
        this.gameOverElement.appendChild(restartBtn);
    }

    getCanvas() { return this.canvas; }
    getCanvasWrapper() { return this.canvasWrapper; }

    updateScore(score: number) {
        this.score = score;
        this.scoreElement.innerText = score.toString();
    }

    showGameOver() {
        this.gameOverElement.style.display = 'flex';
    }

    hideGameOver() {
        this.gameOverElement.style.display = 'none';
    }
}
