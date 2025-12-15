import { GameModule } from './types';

interface Route {
    path: string;
    module: () => Promise<GameModule> | GameModule; // Support lazy load or direct
    name: string;
}

export class Router {
    private routes: Route[] = [];
    private currentModule: GameModule | null = null;
    private container: HTMLElement;

    constructor(containerId: string) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Container ${containerId} not found`);
        this.container = el;

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    addRoute(path: string, moduleFactory: () => Promise<GameModule> | GameModule, name: string) {
        this.routes.push({ path, module: moduleFactory, name });
    }

    private async handleRoute() {
        // Simple hash routing: #/2048 -> /2048
        // Default to / if empty
        let hash =  window.location.hash.slice(1) || '/';
        
        const route = this.routes.find(r => r.path === hash);
        
        if (route) {
            // Unmount previous
            if (this.currentModule) {
                this.currentModule.unmount();
                this.currentModule = null;
            }

            // Clear container
            this.container.innerHTML = '';

            // Load new
            try {
                const moduleOrPromise = route.module();
                const module = moduleOrPromise instanceof Promise ? await moduleOrPromise : moduleOrPromise;
                
                this.currentModule = module;
                module.mount(this.container);
            } catch (e) {
                console.error("Failed to load route:", e);
                this.container.innerHTML = `<div style="color:red; padding:20px;">Error loading game</div>`;
            }
        } else {
             console.warn("Route not found:", hash);
             // Redirect to default if not found
             if (hash !== '/') window.location.hash = '/';
        }
    }
}
