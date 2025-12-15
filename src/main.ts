import './style.css';
import { Game } from './game';
import { preloadImages } from './utils/preload';

// Preload images
preloadImages(() => {
    console.log("Image loaded");
});

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the game page (which we are)
    if (document.getElementById('world')) {
        new Game();
    }
});
