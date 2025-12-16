import { AssetManager } from '../../utils/AssetManager';

export class BirdPlayer {
    public x: number;
    public y: number;
    public width: number = 40;
    public height: number = 40;
    public radius: number = 20; // For circular collision approximation
    
    // Physics
    public velocityY: number = 0;
    private gravity: number = 1200; // pixels per second squared
    private jumpForce: number = -400;
    
    // Rotation
    public rotation: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    update(dt: number) {
        this.velocityY += this.gravity * dt;
        this.y += this.velocityY * dt;
        
        // Rotation logic
        // If moving up, rotate up (-30deg). If moving down, rotate down (up to 90deg).
        if (this.velocityY < -100) {
            this.rotation = -Math.PI / 6;
        } else if (this.velocityY > 100) {
            this.rotation += 5 * dt;
            if (this.rotation > Math.PI / 2) this.rotation = Math.PI / 2;
        } else {
            this.rotation = 0;
        }
    }

    flap() {
        this.velocityY = this.jumpForce;
        this.rotation = -Math.PI / 6;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const texture = AssetManager.getInstance().getTexture(0); // Use first Zixuan image
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        if (texture && texture.loaded) {
            ctx.drawImage(texture.imgObject, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    getBounds() {
        // Slightly smaller hitbox
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}
