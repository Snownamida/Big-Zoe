import Matter from 'matter-js';
import { FRUIT_LEVELS } from '../constants';
import { textureCache } from '../utils/preload';

export function createFruitBody(x: number, y: number, levelIndex: number, isSensor: boolean = false): Matter.Body {
    const levelData = FRUIT_LEVELS[levelIndex];
    const textureData = textureCache[levelIndex];

    // 自定义渲染属性，用于手动绘制
    const customRender = {
        level: levelIndex,
        texture: textureData, // 包含 imgObject 的缓存数据
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
    
    // Attach customRender to the body (we extended the type in customRender.ts, but let's cast or assign safely)
    (body as any).customRender = customRender;

    return body;
}
