import { FRUIT_LEVELS, IMG_PATH } from '../constants';

export interface TextureData {
    url: string;
    scale: number;
    loaded: boolean;
    imgObject: HTMLImageElement;
}

export class AssetManager {
    private static instance: AssetManager;
    private cache: TextureData[] = [];
    private listeners: Array<() => void> = [];

    private constructor() {}

    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    public preloadImages(): void {
        if (this.cache.length > 0) {
            this.notifyListeners();
            return;
        }

        FRUIT_LEVELS.forEach((level, index) => {
            const url = IMG_PATH + level.fileName;
            const img = new Image();

            const textureData: TextureData = {
                url: url,
                scale: 1,
                loaded: false,
                imgObject: img
            };

            this.cache[index] = textureData;

            img.onload = () => {
                const diameter = level.radius * 2;
                textureData.scale = diameter / img.width;
                textureData.loaded = true;
                this.notifyListeners();
            };

            img.onerror = () => {
                console.error("Failed to load image:", url);
                textureData.loaded = false;
                this.notifyListeners();
            };

            img.src = url;
        });
    }

    public getTexture(levelIndex: number): TextureData | undefined {
        return this.cache[levelIndex];
    }

    public onUpdate(callback: () => void) {
        this.listeners.push(callback);
    }

    private notifyListeners() {
        this.listeners.forEach(cb => cb());
    }
}
