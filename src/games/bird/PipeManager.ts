import { BirdPlayer } from './BirdPlayer';

export interface PipePair {
    x: number;
    gapY: number; // Top Y of the gap
    gapHeight: number;
    width: number;
    passed: boolean;
}

export class PipeManager {
    public pipes: PipePair[] = [];
    private canvasWidth: number;
    private canvasHeight: number;
    
    private spawnTimer: number = 0;
    private spawnInterval: number = 1.8; // seconds
    private speed: number = 200; // pixels per second
    
    // Config
    private pipeWidth: number = 60;
    private gapHeight: number = 150;
    private minPipeHeight: number = 50;

    constructor(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    reset() {
        this.pipes = [];
        this.spawnTimer = 0;
    }

    update(dt: number, bird: BirdPlayer): 'NONE' | 'COLLISION' | 'SCORE' {
        let result: 'NONE' | 'COLLISION' | 'SCORE' = 'NONE';
        
        // Spawn
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnPipe();
            this.spawnTimer = this.spawnInterval;
        }

        // Move & Check
        const birdBounds = bird.getBounds();
        
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.speed * dt;
            
            // Check Collision
            // Top Pipe
            if (
                birdBounds.x < pipe.x + pipe.width &&
                birdBounds.x + birdBounds.width > pipe.x &&
                birdBounds.y < pipe.gapY
            ) {
                return 'COLLISION';
            }
            
            // Bottom Pipe
            if (
                birdBounds.x < pipe.x + pipe.width &&
                birdBounds.x + birdBounds.width > pipe.x &&
                birdBounds.y + birdBounds.height > pipe.gapY + pipe.gapHeight
            ) {
                return 'COLLISION';
            }
            
            // Check Score
            if (!pipe.passed && birdBounds.x > pipe.x + pipe.width) {
                pipe.passed = true;
                result = 'SCORE';
            }

            // Remove off-screen
            if (pipe.x + pipe.width < 0) {
                this.pipes.splice(i, 1);
            }
        }
        
        return result;
    }

    private spawnPipe() {
        // Calculate gap position
        // gapY can be from minPipeHeight to height - gapHeight - minPipeHeight
        const minGapY = this.minPipeHeight;
        const maxGapY = this.canvasHeight - this.gapHeight - this.minPipeHeight;
        const gapY = minGapY + Math.random() * (maxGapY - minGapY);
        
        this.pipes.push({
            x: this.canvasWidth,
            gapY: gapY,
            gapHeight: this.gapHeight,
            width: this.pipeWidth,
            passed: false
        });
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#73bf2e'; // Pipe Green
        ctx.strokeStyle = '#558c22';
        ctx.lineWidth = 3;
        
        for (const pipe of this.pipes) {
            // Draw Top Pipe
            ctx.fillRect(pipe.x, 0, pipe.width, pipe.gapY);
            ctx.strokeRect(pipe.x, 0, pipe.width, pipe.gapY);
            
            // Cap on Top Pipe
            ctx.fillRect(pipe.x - 2, pipe.gapY - 20, pipe.width + 4, 20);
            ctx.strokeRect(pipe.x - 2, pipe.gapY - 20, pipe.width + 4, 20);

            // Draw Bottom Pipe
            const bottomPipeY = pipe.gapY + pipe.gapHeight;
            const bottomPipeHeight = this.canvasHeight - bottomPipeY;
            
            ctx.fillRect(pipe.x, bottomPipeY, pipe.width, bottomPipeHeight);
            ctx.strokeRect(pipe.x, bottomPipeY, pipe.width, bottomPipeHeight);
            
            // Cap on Bottom Pipe
            ctx.fillRect(pipe.x - 2, bottomPipeY, pipe.width + 4, 20);
            ctx.strokeRect(pipe.x - 2, bottomPipeY, pipe.width + 4, 20);
        }
    }
    
    resize(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
}
