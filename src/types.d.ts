import Matter from 'matter-js';
import { TextureData } from './utils/AssetManager';

declare module 'matter-js' {
    interface Body {
        customRender?: {
            level: number;
            texture: TextureData;
            backgroundColor: string;
            borderColor: string;
            radius: number;
            slice?: {
                startAngle: number;
                endAngle: number;
            };
        };
        // Add other properties that we were casting to 'any'.
        isStuck?: boolean;
        stuckTimer?: number;
    }
}
