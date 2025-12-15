import Matter from 'matter-js';
import { FRUIT_LEVELS, SPAWN_Y } from '../../constants';
import { createFruitBody } from '../../physics/bodies';
import { createWalls } from '../../physics/setup';
import { customRenderBodies } from '../../rendering/customRender';
import { textureCache, preloadImages } from '../../utils/preload';
import { GameModule } from '../../router/types';

export class GameSynthesis implements GameModule {
    private engine: Matter.Engine;
    private render: Matter.Render;
    private runner: Matter.Runner;
    private canvas: HTMLCanvasElement;

    private canvasWrapper: HTMLElement;
    private scoreElement: HTMLElement;
    private nextPreviewElement: HTMLElement;
    private gameOverOverlay: HTMLElement;

    private currentFruit: Matter.Body | null = null;
    private nextFruitLevel: number = 0;
    private score: number = 0;
    private isDropping: boolean = false;
    private isGameOver: boolean = false;
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    constructor() {
        // Increase gravity to make the game feel snappier (default y is 1)
        this.engine = Matter.Engine.create({
            gravity: { x: 0, y: 4, scale: 0.001 }
        });
        
        // Typescript hack for uninitialized properties that will be set in mount()
        this.render = null as any; 
        this.runner = null as any;
        this.canvas = null as any;
        this.canvasWrapper = null as any;
        this.scoreElement = null as any;
        this.nextPreviewElement = null as any;
        this.gameOverOverlay = null as any;
    }

    mount(container: HTMLElement) {
        // Inject Game HTML
        container.innerHTML = `
            <div id="game-container">
                <div class="game-ui-bar">
                    <div class="score-box"><span id="score">0</span></div>
                    <div class="next-box">
                        <span class="next-label">下一个:</span>
                        <div id="next-item-preview"></div>
                    </div>
                </div>
                <div id="canvas-wrapper" style="height: 60vh; min-height: 400px; display:flex; flex-direction:column;">
                    <canvas id="world" style="flex:1; width:100%; height:100%; display:block;"></canvas>
                    <div id="game-over-overlay">
                        <h2>游戏结束</h2>
                        <button id="restart-btn">再来一次</button>
                    </div>
                </div>
                <div class="header-bar" style="margin-top:auto">
                    <div>合成崔梓璇</div>
                </div>
            </div>
        `;

        // Get Elements
        this.canvas = container.querySelector('#world') as HTMLCanvasElement;
        this.canvasWrapper = container.querySelector('#canvas-wrapper') as HTMLElement;
        this.scoreElement = container.querySelector('#score') as HTMLElement;
        this.nextPreviewElement = container.querySelector('#next-item-preview') as HTMLElement;
        this.gameOverOverlay = container.querySelector('#game-over-overlay') as HTMLElement;

        this.canvasWidth = this.canvasWrapper.clientWidth;
        this.canvasHeight = this.canvasWrapper.clientHeight;

        // Init Matter
        this.render = Matter.Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: this.canvasWidth,
                height: this.canvasHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });
        
        this.runner = Matter.Runner.create();

        this.init();
    }

    unmount() {
        if (this.runner) Matter.Runner.stop(this.runner);
        if (this.render) {
            Matter.Render.stop(this.render);
            if (this.render.canvas) this.render.canvas.remove();
        }
        if (this.engine) {
            Matter.World.clear(this.engine.world, false);
            Matter.Engine.clear(this.engine);
        }
        // Remove resize listener
        window.removeEventListener('resize', this.handleResizeBound);
    }

    private handleResizeBound = this.handleResize.bind(this);

    private init() {
        preloadImages(() => {
            // Update UI when images load (for next fruit preview)
            this.updateUI();
        });

        this.setupPhysics();
        this.setupEvents();
        this.setupInput();
        
        // Initial setup
        this.nextFruitLevel = this.getRandomNextLevel();
        this.updateUI();
        this.spawnCurrentFruit();

        // Start hooks
        Matter.Events.on(this.render, 'afterRender', () => customRenderBodies(this.render, this.engine));
        
        // Start loop
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
        
        // Resize handler
        window.addEventListener('resize', this.handleResizeBound);
    }

    private setupPhysics() {
        const walls = createWalls(this.canvasWidth, this.canvasHeight);
        Matter.World.add(this.engine.world, walls);
    }

    private setupEvents() {
        // Collision
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            if (this.isGameOver) return;
            const pairs = event.pairs;
            const removedBodies = new Set<number>();

            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                if (removedBodies.has(bodyA.id) || removedBodies.has(bodyB.id)) continue;

                if (bodyA.label.startsWith('fruit_') && bodyB.label.startsWith('fruit_')) {
                    const levelA = parseInt(bodyA.label.split('_')[1]);
                    const levelB = parseInt(bodyB.label.split('_')[1]);

                    if (levelA === levelB && levelA < FRUIT_LEVELS.length - 1) {
                        removedBodies.add(bodyA.id);
                        removedBodies.add(bodyB.id);

                        const midX = (bodyA.position.x + bodyB.position.x) / 2;
                        const midY = (bodyA.position.y + bodyB.position.y) / 2;

                        Matter.World.remove(this.engine.world, [bodyA, bodyB]);

                        const newLevel = levelA + 1;
                        const newFruit = createFruitBody(midX, midY, newLevel);
                        Matter.World.add(this.engine.world, newFruit);

                        this.score += FRUIT_LEVELS[newLevel].score;
                        this.scoreElement.innerText = this.score.toString();
                    }
                }
            }
        });

        // Game Over Check
        Matter.Events.on(this.engine, 'afterUpdate', () => {
             if (this.isGameOver || this.isDropping) return;

            const bodies = Matter.Composite.allBodies(this.engine.world);
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];
                if (body.label.startsWith('fruit_') && !body.isSensor) {
                    // Check if stuck at top
                    if (body.position.y < 80 && body.speed < 0.2 && body.position.y > 70) {
                         if (!(body as any).isStuck) {
                            (body as any).isStuck = true;
                            (body as any).stuckTimer = Date.now();
                        } else if (Date.now() - (body as any).stuckTimer > 1000) {
                            this.setGameOver();
                            break;
                        }
                    } else {
                        (body as any).isStuck = false;
                    }
                }
            }
        });

        // Restart Button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
    }

    private setupInput() {
        const handleInputMove = (e: MouseEvent | TouchEvent) => {
            if (this.isGameOver || this.isDropping || !this.currentFruit) return;
            e.preventDefault();

            let clientX;
            if (e.type.startsWith('touch')) {
                // Check if touches array exists and has length
                const touches = (e as TouchEvent).touches;
                if (touches && touches.length > 0) {
                     clientX = touches[0].clientX;
                } else {
                     return;
                }
            } else {
                clientX = (e as MouseEvent).clientX;
            }

            const rect = this.canvas.getBoundingClientRect();
            let relativeX = clientX - rect.left;

            const currentLevel = parseInt(this.currentFruit.label.split('_')[1]);
            const radius = FRUIT_LEVELS[currentLevel].radius;
            relativeX = Math.max(radius, Math.min(this.canvasWidth - radius, relativeX));

            Matter.Body.setPosition(this.currentFruit, {
                x: relativeX,
                y: SPAWN_Y
            });
        };

        const handleInputEnd = (e: MouseEvent | TouchEvent) => {
            if (this.isGameOver || this.isDropping || !this.currentFruit) return;
            e.preventDefault();

            // Ensure fruit is at the release position (critical for tap-to-drop)
            let clientX;
            if (e.type.startsWith('touch')) {
                const touches = (e as TouchEvent).changedTouches; // Use changedTouches for end event
                if (touches && touches.length > 0) {
                     clientX = touches[0].clientX;
                }
            } else {
                clientX = (e as MouseEvent).clientX;
            }

            if (clientX !== undefined) {
                 const rect = this.canvas.getBoundingClientRect();
                 let relativeX = clientX - rect.left;
                 
                 // Re-calculate bounds
                 const currentLevel = parseInt(this.currentFruit.label.split('_')[1]);
                 const radius = FRUIT_LEVELS[currentLevel].radius;
                 relativeX = Math.max(radius, Math.min(this.canvasWidth - radius, relativeX));
                 
                 Matter.Body.setPosition(this.currentFruit, {
                     x: relativeX,
                     y: SPAWN_Y
                 });
            }

            this.isDropping = true;

            Matter.Body.setStatic(this.currentFruit, false);
            this.currentFruit.isSensor = false;
            this.currentFruit = null;

            setTimeout(() => this.spawnCurrentFruit(), 600);
        };

        this.canvasWrapper.addEventListener('mousemove', handleInputMove);
        this.canvasWrapper.addEventListener('touchmove', handleInputMove, { passive: false });
        // Add immediate position update on touch start and mouse down
        this.canvasWrapper.addEventListener('touchstart', handleInputMove, { passive: false });
        this.canvasWrapper.addEventListener('mousedown', handleInputMove);

        this.canvasWrapper.addEventListener('mouseup', handleInputEnd);
        this.canvasWrapper.addEventListener('touchend', handleInputEnd, { passive: false });
        
        this.canvasWrapper.addEventListener('click', (e) => {
            if (!this.isDropping) handleInputEnd(e);
        });
    }

    private getRandomNextLevel(): number {
        let minLevel = 0;
        let maxLevel = 5;

        if (this.score >= 2500) {
            minLevel = 1;
            maxLevel = 6;
        }
        if (this.score >= 5000) {
            minLevel = 2;
            maxLevel = 7;
        }

        minLevel = Math.min(minLevel, maxLevel - 1);
        const rangeSize = maxLevel - minLevel;

        if (rangeSize <= 0) return minLevel;
        return Math.floor(Math.random() * rangeSize) + minLevel;
    }

    private updateUI() {
        this.scoreElement.innerText = this.score.toString();
        
        const textureData = textureCache[this.nextFruitLevel];
        const levelData = FRUIT_LEVELS[this.nextFruitLevel];
        
        this.nextPreviewElement.innerHTML = '';
        this.nextPreviewElement.style.backgroundColor = levelData.backgroundColor;
        this.nextPreviewElement.style.borderColor = levelData.borderColor;

        if (textureData && textureData.loaded) {
            const img = new Image();
            img.src = textureData.url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            this.nextPreviewElement.appendChild(img);
        } else {
             this.nextPreviewElement.innerText = (this.nextFruitLevel + 1).toString();
             this.nextPreviewElement.style.color = 'white';
             this.nextPreviewElement.style.textAlign = 'center';
             this.nextPreviewElement.style.lineHeight = '60px'; // Approx center
             this.nextPreviewElement.style.fontSize = '20px';
             this.nextPreviewElement.style.fontWeight = 'bold';
        }
    }

    private spawnCurrentFruit() {
        if (this.isGameOver) return;
        const level = this.nextFruitLevel;
        this.currentFruit = createFruitBody(this.canvasWidth / 2, SPAWN_Y, level, true);
        Matter.World.add(this.engine.world, this.currentFruit);

        this.nextFruitLevel = this.getRandomNextLevel();
        this.updateUI();
        this.isDropping = false;
    }

    private setGameOver() {
        this.isGameOver = true;
        this.gameOverOverlay.style.display = 'flex';
        if (this.currentFruit) Matter.World.remove(this.engine.world, this.currentFruit);
    }

    private restartGame() {
        Matter.Runner.stop(this.runner);
        Matter.World.clear(this.engine.world, true);
        Matter.Engine.clear(this.engine);

        this.score = 0;
        this.isGameOver = false;
        this.gameOverOverlay.style.display = 'none';

        this.setupPhysics();
        this.nextFruitLevel = this.getRandomNextLevel();
        this.updateUI();
        this.spawnCurrentFruit();

        Matter.Runner.run(this.runner, this.engine);
    }

    private handleResize() {
        if (!this.canvasWrapper) return;
        this.canvasWidth = this.canvasWrapper.clientWidth;
        this.canvasHeight = this.canvasWrapper.clientHeight;
        
        if (this.render && this.render.canvas) {
            this.render.canvas.width = this.canvasWidth;
            this.render.canvas.height = this.canvasHeight;
            this.render.options.width = this.canvasWidth;
            this.render.options.height = this.canvasHeight;
        }

        // Remove existing walls
        const bodies = Matter.Composite.allBodies(this.engine.world);
        const wallsToRemove = bodies.filter(body => 
            body.label === 'ground' || 
            body.label === 'leftWall' || 
            body.label === 'rightWall'
        );
        Matter.World.remove(this.engine.world, wallsToRemove);
        
        // Add new walls
        this.setupPhysics();
    }
}
