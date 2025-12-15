export interface GameModule {
    mount(container: HTMLElement): void;
    unmount(): void;
}
