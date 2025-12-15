import { FRUIT_LEVELS } from '../../constants';
import { AssetManager } from '../../utils/AssetManager';

export class SynthesisUI {
    private container: HTMLElement;
    private scoreElement!: HTMLElement;
    private nextPreviewElement!: HTMLElement;
    private gameOverOverlay!: HTMLElement;
    private canvasWrapper!: HTMLElement;
    private restartCallback: () => void;

    constructor(container: HTMLElement, restartCallback: () => void) {
        this.container = container;
        this.restartCallback = restartCallback;
        this.renderInitialHTML();
        this.cacheElements();
        this.bindEvents();
    }

    private renderInitialHTML() {
        this.container.innerHTML = `
            <div id="game-container">
                <div class="game-ui-bar">
                    <div class="score-box"><span id="score">0</span></div>
                    <div class="next-box">
                        <span class="next-label">下一个:</span>
                        <div id="next-item-preview"></div>
                    </div>
                </div>
                <div id="canvas-wrapper" class="canvas-wrapper">
                    <canvas id="world"></canvas>
                    <div id="game-over-overlay">
                        <h2>游戏结束</h2>
                        <button id="restart-btn">再来一次</button>
                    </div>
                </div>
                <div class="header-bar">
                    <div>合成崔梓璇</div>
                </div>
            </div>
        `;
    }

    private cacheElements() {
        this.scoreElement = this.container.querySelector('#score') as HTMLElement;
        this.nextPreviewElement = this.container.querySelector('#next-item-preview') as HTMLElement;
        this.gameOverOverlay = this.container.querySelector('#game-over-overlay') as HTMLElement;
        this.canvasWrapper = this.container.querySelector('#canvas-wrapper') as HTMLElement;
    }

    private bindEvents() {
        const restartBtn = this.container.querySelector('#restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartCallback();
            });
        }
    }

    public getCanvas(): HTMLCanvasElement {
        return this.container.querySelector('#world') as HTMLCanvasElement;
    }

    public getCanvasWrapper(): HTMLElement {
        return this.canvasWrapper;
    }

    public updateScore(score: number) {
        this.scoreElement.innerText = score.toString();
    }

    public updateNextPreview(levelIndex: number) {
        const assetManager = AssetManager.getInstance();
        const textureData = assetManager.getTexture(levelIndex);
        const levelData = FRUIT_LEVELS[levelIndex];

        this.nextPreviewElement.innerHTML = '';
        this.nextPreviewElement.style.backgroundColor = levelData.backgroundColor;
        this.nextPreviewElement.style.borderColor = levelData.borderColor;

        if (textureData && textureData.loaded) {
            const img = new Image();
            img.src = textureData.url;
            img.className = 'preview-img';
            this.nextPreviewElement.appendChild(img);
        } else {
            this.nextPreviewElement.innerText = (levelIndex + 1).toString();
            this.nextPreviewElement.className = 'preview-text';
            // Fallback styles handled by CSS class preferably, or here if simple
            this.nextPreviewElement.style.color = 'white';
            this.nextPreviewElement.style.display = 'flex';
            this.nextPreviewElement.style.alignItems = 'center';
            this.nextPreviewElement.style.justifyContent = 'center';
            this.nextPreviewElement.style.fontSize = '20px';
            this.nextPreviewElement.style.fontWeight = 'bold';
        }
    }

    public showGameOver() {
        this.gameOverOverlay.style.display = 'flex';
    }

    public hideGameOver() {
        this.gameOverOverlay.style.display = 'none';
    }
}
