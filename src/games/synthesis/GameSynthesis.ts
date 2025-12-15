import Matter from 'matter-js';
import { FRUIT_LEVELS, SPAWN_Y } from '../../constants';
import { createFruitBody } from '../../physics/bodies';
import { createWalls } from '../../physics/setup';
import { customRenderBodies } from '../../rendering/customRender';
import { GameModule } from '../../router/types';
import { SynthesisUI } from './UI';
import { InputHandler } from './Input';
import { AssetManager } from '../../utils/AssetManager';

export class GameSynthesis implements GameModule {
    private engine!: Matter.Engine;
    private render!: Matter.Render;
    private runner!: Matter.Runner;
    
    // Components
    private ui!: SynthesisUI;
    private inputHandler!: InputHandler;
    private assetManager: AssetManager;

    // Game State
    private currentFruit: Matter.Body | null = null;
    private nextFruitLevel: number = 0;
    private score: number = 0;
    private isDropping: boolean = false;
    private isGameOver: boolean = false;
    
    // Dimensions
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    constructor() {
        this.assetManager = AssetManager.getInstance();
    }

    mount(container: HTMLElement) {
        // 1. Setup UI
        // Restart callback passed to UI
        this.ui = new SynthesisUI(container, () => this.restartGame());
        
        // 2. Initialize Physics Engine
        this.engine = Matter.Engine.create({
            gravity: { x: 0, y: 4, scale: 0.001 }
        });

        // 3. Setup Render
        const canvas = this.ui.getCanvas();
        this.canvasWidth = this.ui.getCanvasWrapper().clientWidth;
        this.canvasHeight = this.ui.getCanvasWrapper().clientHeight;

        this.render = Matter.Render.create({
            canvas: canvas,
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

        // 4. Initialize Game
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
        if (this.inputHandler) {
            this.inputHandler.cleanup();
        }
        window.removeEventListener('resize', this.handleResizeBound);
    }

    private handleResizeBound = this.handleResize.bind(this);

    private init() {
        // Preload assets
        this.assetManager.onUpdate(() => {
            this.ui.updateNextPreview(this.nextFruitLevel);
        });
        this.assetManager.preloadImages();

        this.setupPhysics();
        this.setupEvents();
        
        // Setup Input
        this.inputHandler = new InputHandler(this.ui.getCanvasWrapper(), {
            onMove: (x) => this.handleInputMove(x),
            onEnd: (x) => this.handleInputEnd(x),
            isDropping: () => this.isDropping || this.isGameOver || !this.currentFruit
        });

        // Initial Game State
        this.nextFruitLevel = this.getRandomNextLevel();
        this.ui.updateNextPreview(this.nextFruitLevel); // Ensure preview updates immediately if assets cached
        this.spawnCurrentFruit();

        // Start Rendering & Physics
        Matter.Events.on(this.render, 'afterRender', () => customRenderBodies(this.render, this.engine));
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
        
        // Resize Listener
        window.addEventListener('resize', this.handleResizeBound);
    }

    private setupPhysics() {
        const walls = createWalls(this.canvasWidth, this.canvasHeight);
        Matter.World.add(this.engine.world, walls);
    }

    private setupEvents() {
        // Collision Handling
        Matter.Events.on(this.engine, 'collisionStart', (event) => this.handleCollisions(event));
        
        // Game Over Logic
        Matter.Events.on(this.engine, 'afterUpdate', () => this.checkGameOverCondition());
    }

    private handleCollisions(event: Matter.IEventCollision<Matter.Engine>) {
        if (this.isGameOver) return;
        const pairs = event.pairs;
        const removedBodies = new Set<number>();

        for (let i = 0; i < pairs.length; i++) {
            const { bodyA, bodyB } = pairs[i];

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
                    this.ui.updateScore(this.score);
                }
            }
        }
    }

    private checkGameOverCondition() {
        if (this.isGameOver || this.isDropping) return;

        const bodies = Matter.Composite.allBodies(this.engine.world);
        for (const body of bodies) {
            if (body.label.startsWith('fruit_') && !body.isSensor) {
                // Check if stuck near top
                if (body.position.y < 80 && body.speed < 0.2 && body.position.y > 70) {
                     if (!body.isStuck) {
                        body.isStuck = true;
                        body.stuckTimer = Date.now();
                    } else if (body.stuckTimer && Date.now() - body.stuckTimer > 1000) {
                        this.setGameOver();
                        break;
                    }
                } else {
                    body.isStuck = false;
                }
            }
        }
    }

    private handleInputMove(relativeX: number) {
        if (!this.currentFruit) return;
        
        const currentLevel = parseInt(this.currentFruit.label.split('_')[1]);
        const radius = FRUIT_LEVELS[currentLevel].radius;
        const clampedX = Math.max(radius, Math.min(this.canvasWidth - radius, relativeX));

        Matter.Body.setPosition(this.currentFruit, {
            x: clampedX,
            y: SPAWN_Y
        });
    }

    private handleInputEnd(relativeX: number) {
        if (!this.currentFruit) return;

        // Ensure fruit is at the release position
        this.handleInputMove(relativeX);

        this.isDropping = true;
        Matter.Body.setStatic(this.currentFruit, false);
        this.currentFruit.isSensor = false; // Enable collisions
        this.currentFruit = null;

        setTimeout(() => this.spawnCurrentFruit(), 600);
    }

    private getRandomNextLevel(): number {
        let minLevel = 0;
        let maxLevel = 5;

        // Dynamic difficulty
        if (this.score >= 2500) { minLevel = 1; maxLevel = 6; }
        if (this.score >= 5000) { minLevel = 2; maxLevel = 7; }

        minLevel = Math.min(minLevel, maxLevel - 1);
        const rangeSize = maxLevel - minLevel;

        if (rangeSize <= 0) return minLevel;
        return Math.floor(Math.random() * rangeSize) + minLevel;
    }

    private spawnCurrentFruit() {
        if (this.isGameOver) return;
        const level = this.nextFruitLevel;
        // Spawn isSensor=true (static, no collision)
        this.currentFruit = createFruitBody(this.canvasWidth / 2, SPAWN_Y, level, true);
        Matter.World.add(this.engine.world, this.currentFruit);

        this.nextFruitLevel = this.getRandomNextLevel();
        this.ui.updateNextPreview(this.nextFruitLevel);
        this.isDropping = false;
    }

    private setGameOver() {
        this.isGameOver = true;
        this.ui.showGameOver();
        if (this.currentFruit) Matter.World.remove(this.engine.world, this.currentFruit);
    }

    private restartGame() {
        Matter.Runner.stop(this.runner);
        Matter.World.clear(this.engine.world, true); // Create from scratch
        Matter.Engine.clear(this.engine);

        this.score = 0;
        this.isGameOver = false;
        this.ui.updateScore(this.score);
        this.ui.hideGameOver();

        this.setupPhysics();
        this.nextFruitLevel = this.getRandomNextLevel();
        this.ui.updateNextPreview(this.nextFruitLevel);
        this.spawnCurrentFruit();

        Matter.Runner.run(this.runner, this.engine);
    }

    private handleResize() {
        // Use non-destructive resize logic we implemented earlier
        const wrapper = this.ui.getCanvasWrapper();
        if (!wrapper) return;
        
        this.canvasWidth = wrapper.clientWidth;
        this.canvasHeight = wrapper.clientHeight;
        
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
