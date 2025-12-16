import { Rect } from './RunnerPhysics';

export class LevelManager {
    public obstacles: Rect[] = [];
    public groundLevel: number;
    private canvasWidth: number;
    private canvasHeight: number;
    
    private spawnTimer: number = 0;
    private spawnInterval: number = 2.0;
    private gameSpeed: number = 300; // pixels per second

    constructor(width: number, height: number, groundLevel: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.groundLevel = groundLevel;
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.gameSpeed = 300;
    }

    update(dt: number): Rect[] {
        // Increase speed
        this.gameSpeed += 5 * dt;

        // Move obstacles
        const moveDist = this.gameSpeed * dt;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= moveDist;
            // Remove off-screen
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn new obstacles
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnObstacle();
            // Randomize next interval slightly
            this.spawnTimer = this.spawnInterval * (0.8 + Math.random() * 0.4); 
            // Decrease interval cap
            this.spawnInterval = Math.max(0.8, this.spawnInterval * 0.99);
        }

        return this.obstacles;
    }

    private spawnObstacle() {
        const type = Math.random();
        let obs: Rect;

        if (type < 0.3) {
            // Low block (Jump over)
            obs = { x: this.canvasWidth, y: this.groundLevel - 40, width: 40, height: 40 };
        } else if (type < 0.6) {
             // High block (Run under?) - Not implemented crouch yet, so maybe just tall thin wall
             // Or floating block
             obs = { x: this.canvasWidth, y: this.groundLevel - 80, width: 40, height: 40 }; // Floating
        } else {
            // Spikes
            obs = { x: this.canvasWidth, y: this.groundLevel - 30, width: 30, height: 30 };
        }

        this.obstacles.push(obs);
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#654321';
        // Draw Ground
        ctx.fillRect(0, this.groundLevel, this.canvasWidth, this.canvasHeight - this.groundLevel);

        // Draw Obstacles
        ctx.fillStyle = 'black'; // Spikes or boxes
        for (const obs of this.obstacles) {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
    }

    resize(width: number, height: number, groundLevel: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.groundLevel = groundLevel;
    }
}
