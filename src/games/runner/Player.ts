import { Rect, RunnerPhysics } from './RunnerPhysics';
import { AssetManager } from '../../utils/AssetManager';

export class Player {
    public x: number;
    public y: number;
    public width: number = 60;
    public height: number = 60;
    
    // Physics
    public velocityY: number = 0;
    private gravity: number = 1500; // pixels per second squared
    private jumpForce: number = -700;
    
    // State
    private isGrounded: boolean = false;
    private canDoubleJump: boolean = false;
    
    // Animation
    private frameTimer: number = 0;
    private currentFrame: number = 0;

    constructor(startX: number, startY: number) {
        this.x = startX;
        this.y = startY;
    }

    update(dt: number, groundLevel: number, obstacles: Rect[]) {
        // Apply Gravity
        this.velocityY += this.gravity * dt;
        this.y += this.velocityY * dt;

        // Ground Collision (Simple floor)
        if (this.y + this.height >= groundLevel) {
            this.y = groundLevel - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
        } else {
            this.isGrounded = false;
        }
        
        // Obstacle Collision
        const playerRect: Rect = { x: this.x + 10, y: this.y + 10, width: this.width - 20, height: this.height - 20 }; // Hitbox margin
        for (const obs of obstacles) {
            if (RunnerPhysics.checkCollision(playerRect, obs)) {
                return true; // Collision detected (Dead)
            }
        }

        // Animation
        if (this.isGrounded) {
             this.frameTimer += dt;
             if (this.frameTimer > 0.1) {
                 this.currentFrame = (this.currentFrame + 1) % 5; // Cycle first 5 images generally
                 this.frameTimer = 0;
             }
        }
        
        return false;
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = this.jumpForce;
            this.isGrounded = false;
        } else if (this.canDoubleJump) {
            this.velocityY = this.jumpForce * 0.8;
            this.canDoubleJump = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const texture = AssetManager.getInstance().getTexture(Math.min(this.currentFrame, 10));
        
        ctx.save();
        if (texture && texture.loaded) {
            ctx.drawImage(texture.imgObject, this.x, this.y, this.width, this.height);
        } else {
            // Fallback
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}
