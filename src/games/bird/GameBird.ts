import { GameModule } from '../../router/types';
import { BirdUI } from './BirdUI';
import { BirdPlayer } from './BirdPlayer';
import { PipeManager } from './PipeManager';
import { AssetManager } from '../../utils/AssetManager';

export class GameBird implements GameModule {
    private ui!: BirdUI;
    private animationId: number = 0;
    private lastTime: number = 0;
    
    // Systems
    private bird!: BirdPlayer;
    private pipeManager!: PipeManager;
    
    // Game State
    private gameState: 'READY' | 'PLAYING' | 'GAMEOVER' = 'READY';
    private score: number = 0;
    
    private boundHandleInput = this.handleInput.bind(this);

    mount(container: HTMLElement) {
        this.ui = new BirdUI(container, () => this.restartGame());
        
        // Inputs
        window.addEventListener('keydown', this.boundHandleInput);
        container.addEventListener('mousedown', this.boundHandleInput);
        container.addEventListener('touchstart', this.boundHandleInput, { passive: false });
        window.addEventListener('resize', this.handleResize);
        
        window.addEventListener('resize', this.handleResize);
        
        // Preload assets
        AssetManager.getInstance().preloadImages();

        this.initGame();
        this.startGameLoop();
    }

    unmount() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('keydown', this.boundHandleInput);
        window.removeEventListener('resize', this.handleResize);
    }

    private initGame() {
        const canvas = this.ui.getCanvas();
        canvas.width = canvas.parentElement?.clientWidth || 400;
        canvas.height = canvas.parentElement?.clientHeight || 600;
        
        this.bird = new BirdPlayer(100, canvas.height / 2);
        this.pipeManager = new PipeManager(canvas.width, canvas.height);
        
        this.resetGame();
    }
    
    private resetGame() {
        this.gameState = 'READY';
        this.score = 0;
        this.ui.updateScore(0);
        this.ui.showMessage('Tap to Flap!', false);
        
        // Reset Logic Entities
        if (this.bird && this.ui) {
             const canvas = this.ui.getCanvas();
             this.bird.y = canvas.height / 2;
             this.bird.velocityY = 0;
             this.bird.rotation = 0;
        }
        if (this.pipeManager) {
            this.pipeManager.reset();
        }
    }

    private handleResize = () => {
        const canvas = this.ui.getCanvas();
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            
            if (this.pipeManager) this.pipeManager.resize(canvas.width, canvas.height);
        }
    }

    private handleInput(e: Event) {
        if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll
        
        if (this.gameState === 'GAMEOVER') return; // Handled by Restart Btn
        
        if (this.gameState === 'READY') {
            this.gameState = 'PLAYING';
            this.ui.hideMessage();
            this.flap();
        } else if (this.gameState === 'PLAYING') {
            this.flap();
        }
    }
    
    private flap() {
        if (this.bird) this.bird.flap();
    }

    private restartGame() {
        this.resetGame();
    }

    private startGameLoop() {
        const loop = (timestamp: number) => {
            this.animationId = requestAnimationFrame(loop);

            if (!this.lastTime) this.lastTime = timestamp;
            const deltaTime = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            const dt = Math.min(deltaTime, 0.1);

            this.update(dt);
            this.render();
        };
        this.animationId = requestAnimationFrame(loop);
    }

    private update(dt: number) {
        if (this.gameState !== 'PLAYING') return;
        
        // Update Bird
        this.bird.update(dt);
        
        // Check Ground Collision
        const canvas = this.ui.getCanvas();
        if (this.bird.y + this.bird.height >= canvas.height || this.bird.y < -300) { // -300 to allow high jumps but not too high
            this.setGameOver();
            return;
        }
        
        // Update Pipes & Check Collision
        const result = this.pipeManager.update(dt, this.bird);
        
        if (result === 'COLLISION') {
            this.setGameOver();
        } else if (result === 'SCORE') {
            this.score++;
            this.ui.updateScore(this.score);
        }
    }
    
    private setGameOver() {
        this.gameState = 'GAMEOVER';
        this.ui.showMessage(`Game Over\nScore: ${this.score}`, true);
    }

    private render() {
        const canvas = this.ui.getCanvas();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Pipes
        if (this.pipeManager) this.pipeManager.draw(ctx);
        
        // Draw Bird
        if (this.bird) this.bird.draw(ctx);
        
        // Ground (simple line)
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(0, canvas.height - 25, canvas.width, 5);
    }
}
