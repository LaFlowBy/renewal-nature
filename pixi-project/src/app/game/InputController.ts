export class InputController {
  private keys: Map<string, boolean> = new Map();
  private keyDownCallbacks: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    console.log("Key pressed:", key); // Debug log

    // Prevent default behavior for game keys
    if (
      [
        "tab",
        "e",
        "f",
        " ",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "enter",
      ].includes(key)
    ) {
      e.preventDefault();
    }

    // Fire callback only on first press (not on repeat)
    if (!this.keys.get(key)) {
      const callback = this.keyDownCallbacks.get(key);
      if (callback) {
        console.log("Firing callback for key:", key); // Debug log
        callback();
      }
    }

    this.keys.set(key, true);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.set(e.key.toLowerCase(), false);
  };

  public isKeyPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase()) || false;
  }

  public onKeyDown(key: string, callback: () => void) {
    this.keyDownCallbacks.set(key.toLowerCase(), callback);
  }

  public removeKeyCallback(key: string) {
    this.keyDownCallbacks.delete(key.toLowerCase());
  }

  public getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.isKeyPressed("w") || this.isKeyPressed("arrowup")) y -= 1;
    if (this.isKeyPressed("s") || this.isKeyPressed("arrowdown")) y += 1;
    if (this.isKeyPressed("a") || this.isKeyPressed("arrowleft")) x -= 1;
    if (this.isKeyPressed("d") || this.isKeyPressed("arrowright")) x += 1;

    return { x, y };
  }

  public destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
