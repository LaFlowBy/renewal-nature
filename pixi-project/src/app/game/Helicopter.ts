import { Container, Graphics, Text } from "pixi.js";

export class Helicopter extends Container {
  private body: Graphics;
  private interactionRadius = 80;
  private promptText: Text;
  private isPlayerNearby = false;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // Create helicopter body (simplified)
    this.body = new Graphics();

    // Main body
    this.body.rect(-30, -15, 60, 30);
    this.body.fill({ color: 0x4a4a4a });

    // Tail
    this.body.rect(30, -5, 40, 10);
    this.body.fill({ color: 0x3a3a3a });

    // Rotor
    this.body.rect(-40, -3, 80, 6);
    this.body.fill({ color: 0x2a2a2a });

    // Windows
    this.body.rect(-15, -10, 12, 12);
    this.body.fill({ color: 0x87ceeb });
    this.body.rect(3, -10, 12, 12);
    this.body.fill({ color: 0x87ceeb });

    this.addChild(this.body);

    // Interaction prompt
    this.promptText = new Text({
      text: "Press E to start Loot Run",
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.promptText.anchor.set(0.5);
    this.promptText.y = -60;
    this.promptText.visible = false;
    this.addChild(this.promptText);

    // Draw interaction radius (for debugging) - ENABLED
    const radiusCircle = new Graphics();
    radiusCircle.circle(0, 0, this.interactionRadius);
    radiusCircle.stroke({ color: 0xffff00, width: 2, alpha: 0.3 });
    this.addChild(radiusCircle);
  }

  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.isPlayerNearby = distance < this.interactionRadius;
    this.promptText.visible = this.isPlayerNearby;

    return this.isPlayerNearby;
  }

  public update(deltaTime: number) {
    // Rotate the rotor
    if (this.body.children[2]) {
      this.body.children[2].rotation += deltaTime * 10;
    }
  }
}
