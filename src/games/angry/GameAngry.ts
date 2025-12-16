import Matter from 'matter-js';
import { GameModule } from '../../router/types';
import { AngryUI } from './AngryUI';
import { LevelManager } from './LevelManager';
import { Slingshot } from './Slingshot';
import { AssetManager } from '../../utils/AssetManager';
import { createFruitBody } from '../../physics/bodies';

export class GameAngry implements GameModule {
    private engine!: Matter.Engine;
    private render!: Matter.Render;
    private runner!: Matter.Runner;
    
    // Components
    private ui!: AngryUI;
    private levelManager!: LevelManager;
    private slingshot!: Slingshot;

    // State
    private width: number = 0;
    private height: number = 0;
    private score: number = 0;
    private currentBird: Matter.Body | null = null;

    constructor() {
        AssetManager.getInstance().preloadImages();
    }

    mount(container: HTMLElement) {
        // 1. UI Setup
        this.ui = new AngryUI(container, () => this.resetLevel());

        // 2. Physics Engine
        this.engine = Matter.Engine.create();
        
        // 3. Render Setup
        const canvas = this.ui.getCanvas();
        const wrapper = this.ui.getCanvasWrapper();
        this.width = wrapper.clientWidth;
        this.height = wrapper.clientHeight;

        this.render = Matter.Render.create({
            canvas: canvas,
            engine: this.engine,
            options: {
                width: this.width,
                height: this.height,
                wireframes: false, // Set true for debug if needed, false for colors
                background: '#87CEEB', // Sky blue
                pixelRatio: window.devicePixelRatio
            }
        });

        // 4. Managers
        this.levelManager = new LevelManager(this.engine, this.width, this.height);
        // Anchor relative to left-bottom
        const anchor = { x: 150, y: this.height - 150 };
        this.slingshot = new Slingshot(this.engine, canvas, anchor, () => this.handleLaunch());

        this.runner = Matter.Runner.create();

        this.init();
    }

    private init() {
        this.score = 0;
        this.ui.updateScore(this.score);
        
        this.levelManager.setupLevel();
        this.spawnBird();

        // Start Physics
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);

        // Custom render loop or events if needed
        Matter.Events.on(this.engine, 'collisionStart', (e) => this.handleCollision(e));
        
        window.addEventListener('resize', this.handleResizeBound);
        
        // Show overlay
        this.ui.showOverlay("愤怒的崔梓璇", "拖动弹弓发射！");
    }

    private spawnBird() {
        if (this.currentBird) {
            // Remove old bird if it wasn't launched? Or just create new one
        }
        
        // Create a 'bird' (using fruit body level 0 or specific)
        // Let's use fruit level 0 (small)
        this.currentBird = createFruitBody(0, 0, 0); 
        Matter.World.add(this.engine.world, this.currentBird);
        
        this.slingshot.setup(this.currentBird);
    }

    private handleLaunch() {
        // After launch, wait a bit then spawn new bird? 
        // Or wait until bird stops?
        setTimeout(() => {
            this.spawnBird();
        }, 3000); // Simple 3s cooldown for now
    }

    private handleCollision(event: Matter.IEventCollision<Matter.Engine>) {
        const pairs = event.pairs;
        for (let i = 0; i < pairs.length; i++) {
            const { bodyA, bodyB } = pairs[i];
            
            // Check if target hit
            if (bodyA.label === 'target' || bodyB.label === 'target') {
                const target = bodyA.label === 'target' ? bodyA : bodyB;
                // Only destroy if impact is strong enough? For simplicity, just destroy.
                if (!target.isStatic) { // Ensure we don't double count easily
                     Matter.World.remove(this.engine.world, target);
                     this.score += 100;
                     this.ui.updateScore(this.score);
                     // Hack to mark as destroyed so we don't re-process
                     target.isStatic = true; // functionally effectively removed from simple collisions checks if we filtered static, but we actually removed it from world above.
                }
            }
        }
    }

    private resetLevel() {
        this.score = 0;
        this.ui.updateScore(this.score);
        this.levelManager.setupLevel();
        if (this.currentBird) Matter.World.remove(this.engine.world, this.currentBird);
        this.spawnBird();
    }

    private handleResizeBound = () => {
        const wrapper = this.ui.getCanvasWrapper();
        if (!wrapper) return;
        this.width = wrapper.clientWidth;
        this.height = wrapper.clientHeight;
        
        this.render.canvas.width = this.width;
        this.render.canvas.height = this.height;
        this.render.options.width = this.width;
        this.render.options.height = this.height;

        this.levelManager.resize(this.width, this.height);
        // Slingshot anchor update?
        // Ideally Slingshot needs update too, but for MVP keep it simple or recreate
    };

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
        this.slingshot.cleanup();
        window.removeEventListener('resize', this.handleResizeBound);
    }
}
