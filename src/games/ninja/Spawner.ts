import Matter from 'matter-js';
import { createFruitBody } from '../../physics/bodies';

export class Spawner {
    private engine: Matter.Engine;
    private canvasWidth: number;
    private canvasHeight: number;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 2000; // ms
    private isGameActive: boolean = true;

    constructor(engine: Matter.Engine, width: number, height: number) {
        this.engine = engine;
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    update(time: number) {
        if (!this.isGameActive) return;

        if (time - this.lastSpawnTime > this.spawnInterval) {
            this.spawn();
            this.lastSpawnTime = time;
            // Decrease interval slightly to increase difficulty
            this.spawnInterval = Math.max(500, this.spawnInterval * 0.99);
        }
    }

    private spawn() {
        const x = this.canvasWidth * (0.2 + Math.random() * 0.6);
        const y = this.canvasHeight + 50; 
        
        const level = Math.floor(Math.random() * 5); 
        
        const body = createFruitBody(x, y, level);

        // Calculate launch velocity
        // We want it to reach roughly 20% to 40% from top of screen
        // Height to travel approx 0.8 * canvasHeight
        // Using velocity directly is easier than force
        
        // Empirically, with gravity 1 and frictionAir 0.01:
        // A velocity of -15 to -20 is usually good for a full screen toss.
        
        const velocityY = -(15 + Math.random() * 5); 
        const velocityX = (Math.random() - 0.5) * 5; // Horizontal sway

        Matter.Body.setVelocity(body, { x: velocityX, y: velocityY });
        
        // Add torque for rotation
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);

        Matter.World.add(this.engine.world, body);
    }

    resize(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    stop() {
        this.isGameActive = false;
    }
    
    start() {
        this.isGameActive = true;
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
    }
}
