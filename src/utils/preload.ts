import { FRUIT_LEVELS, IMG_PATH } from '../constants';

export interface TextureData {
    url: string;
    scale: number;
    loaded: boolean;
    imgObject: HTMLImageElement;
}

export const textureCache: TextureData[] = [];

export function preloadImages(onLoadUpdate?: () => void) {
    FRUIT_LEVELS.forEach((level, index) => {
        const img = new Image();
        const url = IMG_PATH + level.fileName;

        textureCache[index] = {
            url: url,
            scale: 1,
            loaded: false,
            imgObject: img
        };

        img.onload = function() {
            const diameter = level.radius * 2;
            const scale = diameter / img.width;

            textureCache[index].scale = scale;
            textureCache[index].loaded = true;

            if (onLoadUpdate) onLoadUpdate();
        };

        img.onerror = function() {
            console.error("加载图片失败:", url);
            textureCache[index].loaded = false;
             if (onLoadUpdate) onLoadUpdate();
        };

        img.src = url;
    });
}
