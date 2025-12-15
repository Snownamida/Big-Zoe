export class InputHandler {
    private element: HTMLElement;
    private onMove: (x: number) => void;
    private onEnd: (x: number) => void;
    private isDropping: () => boolean; // Check if game is in dropping state

    constructor(element: HTMLElement, callbacks: { 
        onMove: (x: number) => void, 
        onEnd: (x: number) => void,
        isDropping: () => boolean
    }) {
        this.element = element;
        this.onMove = callbacks.onMove;
        this.onEnd = callbacks.onEnd;
        this.isDropping = callbacks.isDropping;

        this.bindEvents();
    }

    private bindEvents() {
        // Mouse Events
        this.element.addEventListener('mousemove', this.handleMove.bind(this));
        this.element.addEventListener('mousedown', this.handleMove.bind(this));
        this.element.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Touch Events
        this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.element.addEventListener('touchstart', this.handleMove.bind(this), { passive: false });
        this.element.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });

        // Click fallback
        this.element.addEventListener('click', (e) => {
            if (!this.isDropping()) this.handleEnd(e);
        });
    }

    private getClientX(e: MouseEvent | TouchEvent): number | null {
        if (e.type.startsWith('touch')) {
            const touchEvent = e as TouchEvent;
            const touches = e.type === 'touchend' ? touchEvent.changedTouches : touchEvent.touches;
            if (touches && touches.length > 0) {
                return touches[0].clientX;
            }
            return null;
        } else {
            return (e as MouseEvent).clientX;
        }
    }

    private handleMove(e: MouseEvent | TouchEvent) {
        if (this.isDropping()) return;
        
        // Prevent scrolling on touch
        if (e.type.startsWith('touch')) {
            e.preventDefault();
        }

        const clientX = this.getClientX(e);
        if (clientX !== null) {
            const rect = this.element.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            this.onMove(relativeX);
        }
    }

    private handleEnd(e: MouseEvent | TouchEvent) {
        if (this.isDropping()) return;
        e.preventDefault();

        const clientX = this.getClientX(e);
        if (clientX !== null) {
            const rect = this.element.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            this.onEnd(relativeX);
        }
    }

    public cleanup() {
        // Remove listeners if needed, though usually the element is destroyed
    }
}
