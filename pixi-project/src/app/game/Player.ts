import { Container, Graphics } from "pixi.js";
import type { EquipmentSlots, InventoryItem } from "./InventoryItem";
import { ItemType } from "./InventoryItem";
import { PersistentStorage } from "../utils/PersistentStorage";

export type { InventoryItem, EquipmentSlots } from "./InventoryItem";
export { ItemType } from "./InventoryItem";

export class Player extends Container {
  private body: Graphics;
  private speed = 200; // pixels per second
  private direction = { x: 0, y: 0 };
  public backpack: InventoryItem[] = [];
  public equipment: EquipmentSlots = {
    helmet: null,
    bodyArmor: null,
    mainHand: null,
  };
  public maxBackpackSize = 20;

  constructor() {
    super();

    // Create a simple player representation (circle)
    this.body = new Graphics();
    this.body.circle(0, 0, 20);
    this.body.fill({ color: 0x00ff00 });

    // Add direction indicator
    const directionIndicator = new Graphics();
    directionIndicator.moveTo(0, 0);
    directionIndicator.lineTo(0, -25);
    directionIndicator.stroke({ color: 0xffffff, width: 3 });
    this.body.addChild(directionIndicator);

    this.addChild(this.body);

    // Load saved inventory
    this.loadInventory();
  }

  public setMovement(x: number, y: number) {
    this.direction.x = x;
    this.direction.y = y;

    // Normalize diagonal movement
    if (this.direction.x !== 0 && this.direction.y !== 0) {
      const length = Math.sqrt(
        this.direction.x * this.direction.x +
          this.direction.y * this.direction.y
      );
      this.direction.x /= length;
      this.direction.y /= length;
    }

    // Rotate player to face movement direction
    if (x !== 0 || y !== 0) {
      this.body.rotation = Math.atan2(y, x) + Math.PI / 2;
    }
  }

  public update(deltaTime: number) {
    this.x += this.direction.x * this.speed * deltaTime;
    this.y += this.direction.y * this.speed * deltaTime;
  }

  public addItem(item: InventoryItem): boolean {
    // Try to equip if it's equipment and slot is empty
    if (item.type === ItemType.Helmet && !this.equipment.helmet) {
      this.equipment.helmet = { ...item };
      return true;
    } else if (item.type === ItemType.BodyArmor && !this.equipment.bodyArmor) {
      this.equipment.bodyArmor = { ...item };
      return true;
    } else if (item.type === ItemType.Weapon && !this.equipment.mainHand) {
      this.equipment.mainHand = { ...item };
      return true;
    }

    // Try to stack with existing item in backpack
    const existingItem = this.backpack.find((i) => i.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
      return true;
    } else if (this.backpack.length < this.maxBackpackSize) {
      this.backpack.push({ ...item });
      return true;
    }

    return false; // Inventory full
  }

  public clearInventory() {
    this.backpack = [];
    this.equipment.helmet = null;
    this.equipment.bodyArmor = null;
    this.equipment.mainHand = null;
  }

  public getInventoryCount(): number {
    let count = this.backpack.reduce((sum, item) => sum + item.quantity, 0);
    if (this.equipment.helmet) count++;
    if (this.equipment.bodyArmor) count++;
    if (this.equipment.mainHand) count++;
    return count;
  }

  public getTotalSlots(): number {
    return this.maxBackpackSize + 3; // backpack + 3 equipment slots
  }

  public loadInventory() {
    this.backpack = PersistentStorage.loadPlayerBackpack();
    this.equipment = PersistentStorage.loadPlayerEquipment();
    console.log("Loaded player inventory from storage");
  }

  public saveInventory() {
    PersistentStorage.savePlayerBackpack(this.backpack);
    PersistentStorage.savePlayerEquipment(this.equipment);
    console.log("Saved player inventory to storage");
  }
}
