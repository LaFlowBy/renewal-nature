import { Container, Graphics, Text } from "pixi.js";
import type { InventoryItem } from "./InventoryItem";
import { ItemType } from "./InventoryItem";

export class LootContainer extends Container {
  private body: Graphics;
  private interactionRadius = 60;
  private promptText: Text;
  private isPlayerNearby = false;
  public items: InventoryItem[] = [];
  public isOpen = false;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // Create container body (crate/box)
    this.body = new Graphics();

    // Main box
    this.body.rect(-25, -25, 50, 50);
    this.body.fill({ color: 0x8b4513 });
    this.body.stroke({ color: 0x654321, width: 2 });

    // Details/bands
    this.body.rect(-25, -5, 50, 3);
    this.body.fill({ color: 0x654321 });
    this.body.rect(-25, 5, 50, 3);
    this.body.fill({ color: 0x654321 });

    // Lock/clasp
    this.body.circle(0, 0, 5);
    this.body.fill({ color: 0xffaa00 });

    this.addChild(this.body);

    // Interaction prompt
    this.promptText = new Text({
      text: "Press E to open",
      style: {
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.promptText.anchor.set(0.5);
    this.promptText.y = -40;
    this.promptText.visible = false;
    this.addChild(this.promptText);

    // Generate random loot
    this.generateLoot();
  }

  private generateLoot() {
    const lootTypes = [
      { name: "Plant Seeds", type: ItemType.Seed },
      { name: "Wheat Seeds", type: ItemType.Seed },
      { name: "Tree Sapling", type: ItemType.Seed },
      { name: "Machine Parts", type: ItemType.MachinePart },
      { name: "Gears", type: ItemType.MachinePart },
      { name: "Circuit Board", type: ItemType.Component },
      { name: "Power Cell", type: ItemType.Component },
      { name: "Metal Scrap", type: ItemType.Resource },
      { name: "Plastic", type: ItemType.Resource },
      { name: "Old Helmet", type: ItemType.Helmet },
      { name: "Kevlar Vest", type: ItemType.BodyArmor },
      { name: "Repair Tool", type: ItemType.Weapon },
    ];

    // Random 2-6 items
    const itemCount = 2 + Math.floor(Math.random() * 5);

    for (let i = 0; i < itemCount; i++) {
      const lootType = lootTypes[Math.floor(Math.random() * lootTypes.length)];
      const quantity =
        lootType.type === ItemType.Seed || lootType.type === ItemType.Resource
          ? 1 + Math.floor(Math.random() * 5)
          : 1;

      this.items.push({
        id: `${lootType.name.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substr(2, 9)}`,
        name: lootType.name,
        type: lootType.type,
        quantity,
      });
    }
  }

  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.isPlayerNearby = distance < this.interactionRadius;

    if (!this.isOpen) {
      this.promptText.visible = this.isPlayerNearby;
    }

    return this.isPlayerNearby;
  }

  public open() {
    this.isOpen = true;
    this.promptText.visible = false;

    // Visual change when opened
    this.body.clear();
    this.body.rect(-25, -25, 50, 50);
    this.body.fill({ color: 0x654321 });
    this.body.stroke({ color: 0x8b4513, width: 2 });
    this.body.rect(-25, -5, 50, 3);
    this.body.fill({ color: 0x8b4513 });
    this.body.rect(-25, 5, 50, 3);
    this.body.fill({ color: 0x8b4513 });
  }

  public close() {
    this.isOpen = false;
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public takeItem(index: number): InventoryItem | null {
    if (index >= 0 && index < this.items.length) {
      return this.items.splice(index, 1)[0];
    }
    return null;
  }
}
