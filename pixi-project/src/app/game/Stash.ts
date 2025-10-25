import { Container, Graphics, Text } from "pixi.js";

export class Stash extends Container {
  private body: Graphics;
  private interactionRadius = 80;
  private promptText: Text;
  private isPlayerNearby = false;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // Create stash body (large storage container)
    this.body = new Graphics();

    // Base
    this.body.rect(-40, -30, 80, 60);
    this.body.fill({ color: 0x2a4a2a });
    this.body.stroke({ color: 0x1a3a1a, width: 3 });

    // Door/front panel
    this.body.rect(-30, -20, 60, 50);
    this.body.fill({ color: 0x3a5a3a });
    this.body.stroke({ color: 0x1a3a1a, width: 2 });

    // Handle
    this.body.circle(0, 0, 6);
    this.body.fill({ color: 0xcccccc });

    // Label
    const label = new Text({
      text: "STASH",
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    label.anchor.set(0.5);
    label.y = -40;
    this.body.addChild(label);

    this.addChild(this.body);

    // Interaction prompt
    this.promptText = new Text({
      text: "Press E to access Stash",
      style: {
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.promptText.anchor.set(0.5);
    this.promptText.y = -70;
    this.promptText.visible = false;
    this.addChild(this.promptText);

    // Debug interaction radius
    const radiusCircle = new Graphics();
    radiusCircle.circle(0, 0, this.interactionRadius);
    radiusCircle.stroke({ color: 0x00ff00, width: 2, alpha: 0.3 });
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
}
