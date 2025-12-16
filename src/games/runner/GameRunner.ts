import { GameModule } from '../../router/types';
import { RunnerUI } from './RunnerUI';
import { Player } from './Player';
import { LevelManager } from './LevelManager';

export class GameRunner implements GameModule {
    private ui!: RunnerUI;
    private animationId: number = 0;
    private lastTime: number = 0;
    
    // Systems
    private player!: Player;
    private levelManager!: LevelManager;
    private groundY: number = 0;
    
    // Game State
    private isPlaying: boolean = false;
    private distance: number = 0;
    private boundHandleInput = this.handleInput.bind(this);

    mount(container: HTMLElement) {
        this.ui = new RunnerUI(container, () => this.restartGame());
        
        // Setup Inputs
        window.addEventListener('keydown', this.boundHandleInput);
        container.addEventListener('touchstart', this.boundHandleInput, { passive: false });
        container.addEventListener('mousedown', this.boundHandleInput);
        window.addEventListener('resize', this.handleResize);

        this.initGame();
        this.startGameLoop();
    }

    unmount() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('keydown', this.boundHandleInput);
        if (this.ui) {
            // const container = this.ui.getCanvas().parentElement; // roughly
            // Actually container is passed in mount, we don't store it but listeners are on window or container provided.
            window.removeEventListener('resize', this.handleResize);
        }
    }

    private initGame() {
        const canvas = this.ui.getCanvas();
        const width = canvas.parentElement?.clientWidth || 800;
        const height = canvas.parentElement?.clientHeight || 600;
        
        canvas.width = width;
        canvas.height = height;
        
        this.groundY = height - 50;
        
        this.player = new Player(100, this.groundY - 100);
        this.levelManager = new LevelManager(width, height, this.groundY);
        
        this.restartGame();
    }

    private handleResize = () => {
        const canvas = this.ui.getCanvas();
        if (canvas && canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            this.groundY = canvas.height - 50;
            
            // Update systems
            if (this.levelManager) this.levelManager.resize(canvas.width, canvas.height, this.groundY);
            // Player might need position adjustment if screen shrinks too much, but for now ok.
        }
    }

    private handleInput(e: Event) {
        if (!this.isPlaying) return;
        
        if (e.type === 'keydown') {
            if ((e as KeyboardEvent).code === 'Space' || (e as KeyboardEvent).code === 'ArrowUp') {
                 this.player.jump();
                 e.preventDefault();
            }
        } else {
            // Touch or Mouse
            this.player.jump();
            // e.preventDefault(); // Might interfere with UI clicks if not careful
        }
    }

    private restartGame() {
        this.isPlaying = true;
        this.distance = 0;
        this.ui.hideGameOver();
        
        // Reset systems
        if (this.player) {
            this.player.y = this.groundY - 100;
            this.player.velocityY = 0;
        }
        if (this.levelManager) this.levelManager.reset();
    }

    private startGameLoop() {
        const loop = (timestamp: number) => {
            this.animationId = requestAnimationFrame(loop);

            if (!this.lastTime) this.lastTime = timestamp;
            const deltaTime = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            // Cap delta time to prevent huge jumps
            const dt = Math.min(deltaTime, 0.1);

            this.update(dt);
            this.render();
        };
        this.animationId = requestAnimationFrame(loop);
    }

    private update(dt: number) {
        if (!this.isPlaying) return;
        
        this.distance += (300 + this.distance * 0.1) * dt / 50; // Visual meter
        this.ui.updateScore(this.distance);

        // Update Level
        const obstacles = this.levelManager.update(dt);
        
        // Update Player & Check Collision
        const isDead = this.player.update(dt, this.groundY, obstacles);
        
        if (isDead) {
            this.isPlaying = false;
            this.ui.showGameOver();
        }
    }

    private render() {
        const canvas = this.ui.getCanvas();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Sky (handled by CSS bg but can add clouds here)
        
        // Draw Level
        this.levelManager.draw(ctx);
        
        // Draw Player
        this.player.draw(ctx);
    }
}
