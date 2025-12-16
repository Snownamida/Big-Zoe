export class AngryUI {
    private container: HTMLElement;
    private scoreElement!: HTMLElement;
    private overlay!: HTMLElement;
    private onReset: () => void;

    constructor(container: HTMLElement, onReset: () => void) {
        this.container = container;
        this.onReset = onReset;
        this.render();
        this.cacheElements();
        this.bindEvents();
    }

    private render() {
        this.container.innerHTML = `
            <div id="angry-game-container">
                <div class="angry-header">
                    <div class="score-display">分数: <span id="angry-score">0</span></div>
                    <button id="angry-reset-btn">重置关卡</button>
                </div>
                <div id="angry-canvas-wrapper" style="flex:1; width:100%; position:relative;">
                    <canvas id="angry-world" style="display:block; width:100%; height:100%;"></canvas>
                    <div id="angry-overlay">
                        <div class="instruction">
                            <h2>愤怒的崔梓璇</h2>
                            <p>向后拖动弹弓发射！</p>
                            <p>击倒所有方块得分</p>
                            <button id="start-btn">开始游戏</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private cacheElements() {
        this.scoreElement = this.container.querySelector('#angry-score') as HTMLElement;
        this.overlay = this.container.querySelector('#angry-overlay') as HTMLElement;
    }

    private bindEvents() {
        const resetBtn = this.container.querySelector('#angry-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.onReset();
                // Ensure overlay is hidden on reset if game is active
                this.overlay.style.display = 'none';
            });
        }

        const startBtn = this.container.querySelector('#start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.overlay.style.display = 'none';
            });
        }
    }

    public getCanvas(): HTMLCanvasElement {
        return this.container.querySelector('#angry-world') as HTMLCanvasElement;
    }

    public getCanvasWrapper(): HTMLElement {
        return this.container.querySelector('#angry-canvas-wrapper') as HTMLElement;
    }

    public updateScore(score: number) {
        if (this.scoreElement) {
            this.scoreElement.innerText = score.toString();
        }
    }

    public showOverlay(title: string, message: string) {
        const titleEl = this.overlay.querySelector('h2');
        const msgEl = this.overlay.querySelector('p');
        const btn = this.overlay.querySelector('button');

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;
        if (btn) btn.innerText = "继续";
        
        this.overlay.style.display = 'flex';
    }
}
