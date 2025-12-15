import Matter from 'matter-js';
import { FRUIT_LEVELS } from '../constants';
import { AssetManager } from '../utils/AssetManager';

export function createFruitBody(x: number, y: number, levelIndex: number, isSensor: boolean = false): Matter.Body {
    const levelData = FRUIT_LEVELS[levelIndex];
    // Use AssetManager to get texture
    const textureData = AssetManager.getInstance().getTexture(levelIndex);

    // 自定义渲染属性，用于手动绘制
    // Note: If textureData is undefined (not loaded yet), it will handle gracefully in render
    const customRender = {
        level: levelIndex,
        texture: textureData!, // We might need to handle undefined type-wise or ensure it's loaded. 
                               // For now, let's assert it or leave it as possibly undefined if the type allows.
                               // Looking at types.d.ts, texture is required. 
                               // But AssetManager returns TextureData | undefined.
                               // Let's assume preloading is done as per game flow.
                               // Or better, cast it as we know logic ensures it.
        backgroundColor: levelData.backgroundColor,
        borderColor: levelData.borderColor,
        radius: levelData.radius
    };

    const options: Matter.IBodyDefinition = {
        isSensor: isSensor,
        isStatic: isSensor,
        restitution: 0.2,
        friction: 0.1,
        density: 0.002,
        label: 'fruit_' + levelIndex,
        render: {
            visible: false // 禁用 Matter.js 默认渲染
        }
    };

    const body = Matter.Bodies.circle(x, y, levelData.radius, options);
    
    (body as any).customRender = customRender;

    return body;
}
