import Matter from 'matter-js';
import { GameModule } from '../../router/types';
import { NinjaUI } from './NinjaUI';
import { Spawner } from './Spawner';
import { SliceSystem } from './SliceSystem';
import { customRenderBodies } from '../../rendering/customRender';
import { AssetManager } from '../../utils/AssetManager';
import { createFruitBody } from '../../physics/bodies';

export class GameNinja implements GameModule {
    private engine: Matter.Engine;
    private runner: Matter.Runner;
    private ui!: NinjaUI;
    private spawner!: Spawner;
    private sliceSystem!: SliceSystem;
    private animationId: number = 0;
    
    // State
    private score: number = 0;
    private lives: number = 3;
    private isGameOver: boolean = false;
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    constructor() {
        this.engine = Matter.Engine.create({
            gravity: { x: 0, y: 1 }
        });
        this.runner = Matter.Runner.create();
    }

    mount(container: HTMLElement) {
        // 1. Setup UI
        this.ui = new NinjaUI(container, () => this.restartGame());
        
        const wrapper = this.ui.getCanvasWrapper();
        this.canvasWidth = wrapper.clientWidth;
        this.canvasHeight = wrapper.clientHeight;

        const canvas = this.ui.getCanvas();
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;

        // 2. Setup Systems
        this.spawner = new Spawner(this.engine, this.canvasWidth, this.canvasHeight);
        this.sliceSystem = new SliceSystem(this.engine, wrapper, (body) => this.handleSlice(body));

        // 3. Preload Assets
        AssetManager.getInstance().preloadImages();

        // 4. Start Physics & Game Loop
        Matter.Runner.run(this.runner, this.engine);
        this.startGameLoop();
        this.spawner.start();

        // 5. Events
        window.addEventListener('resize', this.handleResizeBound);
        Matter.Events.on(this.engine, 'afterUpdate', this.checkMissedFruitBound);
    }

    unmount() {
        window.removeEventListener('resize', this.handleResizeBound);
        cancelAnimationFrame(this.animationId);
        Matter.Runner.stop(this.runner);
        Matter.World.clear(this.engine.world, false);
        Matter.Engine.clear(this.engine);
        if (this.spawner) this.spawner.stop();
    }

    private handleResizeBound = () => {
        const wrapper = this.ui.getCanvasWrapper();
        if (!wrapper) return;
        this.canvasWidth = wrapper.clientWidth;
        this.canvasHeight = wrapper.clientHeight;
        
        const canvas = this.ui.getCanvas();
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;

        if (this.spawner) this.spawner.resize(this.canvasWidth, this.canvasHeight);
    };

    private checkMissedFruitBound = () => {
        if (this.isGameOver) return;
        
        const bodies = Matter.Composite.allBodies(this.engine.world);
        for (const body of bodies) {
            // Check if fruit fell below screen
            if (body.label.startsWith('fruit_') && !body.isSensor && body.position.y > this.canvasHeight + 100) {
                 Matter.World.remove(this.engine.world, body);
                 this.handleMissedFruit();
            }
            // Remove debris that fell out
            if (body.label === 'fruit_debris' && body.position.y > this.canvasHeight + 100) {
                 Matter.World.remove(this.engine.world, body);
            }
        }
    };

    private handleMissedFruit() {
        // Simple logic: missed fruit = game over? Or lives?
        // Let's implement lives later if requested, for now strict game over or just ignore?
        // Fruit Ninja: Lose life if fruit drops.
        // Let's implement simple "3 strikes" or just game over on bombs (no bombs yet).
        // Let's just say if you miss 3 fruits you lose.
        this.lives--;
        if (this.lives <= 0) {
            this.setGameOver();
        }
    }

    private handleSlice(body: Matter.Body) {
        if (this.isGameOver) return;

        // 1. Remove original body
        Matter.World.remove(this.engine.world, body);

        // 2. Add score
        this.score += 10;
        this.ui.updateScore(this.score);

        // 3. Spawn debris (visual only)
        this.spawnDebris(body);
    }

    private spawnDebris(originalBody: Matter.Body) {
        const { position, velocity } = originalBody;
        const level = parseInt(originalBody.label.split('_')[1] || '0');
        
        // Calculate slice angle from velocity difference or random perpendicular to velocity?
        // Actually we want the slice to look like the cut.
        // But we don't have the cut trail vector here easily without passing it.
        // Let's assume the slice is perpendicular to the fruit's velocity (as if it hit a blade)
        // OR better: use the slice system's last cut angle if we could.
        // For simplicity, let's just make it random or based on fruit velocity.
        // If we want it to look like THE cut, we need the cut angle.
        // Let's just pick a random angle for now to show the effect, or assume a horizontal cut if falling/vertical if moving side.
        // Let's use a random angle for the cut.
        const cutAngle = Math.random() * Math.PI * 2;
        
        // Spawn 2 halves
        for (let i = 0; i < 2; i++) {
            const debris = createFruitBody(position.x, position.y, level, true);
            debris.label = 'fruit_debris';
            Matter.Body.setStatic(debris, false); // Ensure it moves
            
            // Set slice property
            // Half 1: cutAngle to cutAngle + PI
            // Half 2: cutAngle + PI to cutAngle + 2PI
            const startAngle = cutAngle + (i * Math.PI);
            const endAngle = startAngle + Math.PI;
            
            // We need to ensure customRender exists. createFruitBody attaches it.
            if (debris.customRender) {
                debris.customRender.slice = {
                    startAngle: startAngle, 
                    endAngle: endAngle
                };
            }
            
            // Push them apart perpendicular to the cut
            // Normal vector for half 1 is roughly at cutAngle + PI/2
            const pushAngle = cutAngle + Math.PI/2 + (i === 1 ? Math.PI : 0);
            const pushSpeed = 5;
            
            Matter.Body.setVelocity(debris, {
                x: velocity.x + Math.cos(pushAngle) * pushSpeed,
                y: velocity.y + Math.sin(pushAngle) * pushSpeed
            });
            Matter.Body.setAngularVelocity(debris, (Math.random() - 0.5) * 0.5);

            Matter.World.add(this.engine.world, debris);
        }
    }

    private setGameOver() {
        this.isGameOver = true;
        this.spawner.stop();
        this.ui.showGameOver();
    }

    private restartGame() {
        this.isGameOver = false;
        this.score = 0;
        this.lives = 3;
        this.ui.updateScore(0);
        this.ui.hideGameOver();
        
        Matter.World.clear(this.engine.world, true); // keep walls if any (we have none)
        // actually we don't have walls in Ninja
        
        this.spawner.start();
    }

    private startGameLoop() {
        const render = (time: number) => {
            this.animationId = requestAnimationFrame(render);

            this.spawner.update(time);
            
            // Render
            // We need a dummy render object for customRenderBodies if it expects one
            // customRenderBodies takes (render, engine). It uses render.context.
            // We don't have a Matter.Render instance.
            // We can mock it or modify customRenderBodies.
            // customRenderBodies uses `render.context`. 
            
            const canvas = this.ui.getCanvas();
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Mock render object for customRenderBodies
            const mockRender = {
                context: ctx,
                canvas: canvas,
                options: {
                    width: canvas.width,
                    height: canvas.height,
                    background: 'transparent',
                    wireframes: false
                }
            } as any; // Cast as any to satisfy type if needed, or Matter.Render

            customRenderBodies(mockRender, this.engine);

            // Draw slice trail
            this.sliceSystem.draw(ctx);
            
            // Draw Lives (simple text)
            ctx.fillStyle = 'red';
            ctx.font = '24px Arial';
            ctx.fillText(`Lives: ${this.lives}`, canvas.width - 100, 40);
        };
        this.animationId = requestAnimationFrame(render);
    }
}
