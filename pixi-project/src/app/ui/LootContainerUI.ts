import { Container, Graphics, Text } from "pixi.js";
import type { InventoryItem } from "../game/InventoryItem";

export class LootContainerUI extends Container {
  private background: Graphics;
  private lootSlots: LootSlotUI[] = [];
  private titleText: Text;
  private closeText: Text;
  private instructionText: Text;

  public onTakeItem?: (slotIndex: number) => void;
  public onClose?: () => void;

  constructor() {
    super();

    this.visible = false;

    // Background
    this.background = new Graphics();
    this.background.rect(0, 0, 400, 500);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: 0x666666, width: 2 });
    this.addChild(this.background);

    // Title
    this.titleText = new Text({
      text: "LOOT CONTAINER",
      style: {
        fontSize: 24,
        fill: 0xffaa00,
        fontWeight: "bold",
      },
    });
    this.titleText.x = 20;
    this.titleText.y = 20;
    this.addChild(this.titleText);

    // Close instruction
    this.closeText = new Text({
      text: "Press E to close",
      style: {
        fontSize: 14,
        fill: 0xaaaaaa,
      },
    });
    this.closeText.x = 260;
    this.closeText.y = 25;
    this.addChild(this.closeText);

    // Instruction
    this.instructionText = new Text({
      text: "Press F to take item",
      style: {
        fontSize: 14,
        fill: 0x00ff00,
      },
    });
    this.instructionText.x = 20;
    this.instructionText.y = 60;
    this.addChild(this.instructionText);

    // Create loot slots (2x5 grid)
    const slotsPerRow = 2;
    const slotSize = 80;
    const slotSpacing = 15;
    const startX = 20;
    const startY = 100;

    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;
      const x = startX + col * (slotSize + slotSpacing);
      const y = startY + row * (slotSize + slotSpacing);

      const slot = new LootSlotUI(i, x, y);
      this.lootSlots.push(slot);
      this.addChild(slot);
    }
  }

  public setLootItems(items: InventoryItem[]) {
    this.lootSlots.forEach((slot, index) => {
      slot.setItem(items[index] || null);
    });
  }

  public highlightSlot(index: number) {
    this.lootSlots.forEach((slot, i) => {
      slot.setHighlight(i === index);
    });
  }

  public getFirstNonEmptySlotIndex(): number {
    return this.lootSlots.findIndex((slot) => slot.hasItem());
  }

  public show() {
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }
}

class LootSlotUI extends Container {
  private slotBackground: Graphics;
  private itemNameText: Text;
  private itemTypeText: Text;
  private quantityText: Text;
  public slotIndex: number;
  private currentItem: InventoryItem | null = null;
  private isHighlighted = false;

  constructor(slotIndex: number, x: number, y: number) {
    super();

    this.slotIndex = slotIndex;
    this.x = x;
    this.y = y;

    // Slot background
    this.slotBackground = new Graphics();
    this.updateBackground();
    this.addChild(this.slotBackground);

    // Item name
    this.itemNameText = new Text({
      text: "",
      style: {
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: "bold",
        wordWrap: true,
        wordWrapWidth: 75,
      },
    });
    this.itemNameText.x = 5;
    this.itemNameText.y = 5;
    this.addChild(this.itemNameText);

    // Item type
    this.itemTypeText = new Text({
      text: "",
      style: {
        fontSize: 10,
        fill: 0xaaaaaa,
      },
    });
    this.itemTypeText.x = 5;
    this.itemTypeText.y = 45;
    this.addChild(this.itemTypeText);

    // Quantity
    this.quantityText = new Text({
      text: "",
      style: {
        fontSize: 14,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.quantityText.anchor.set(1, 1);
    this.quantityText.x = 75;
    this.quantityText.y = 75;
    this.addChild(this.quantityText);
  }

  private updateBackground() {
    this.slotBackground.clear();
    this.slotBackground.rect(0, 0, 80, 80);
    this.slotBackground.fill({ color: 0x2a2a2a });

    if (this.isHighlighted) {
      this.slotBackground.stroke({ color: 0x00ff00, width: 3 });
    } else {
      this.slotBackground.stroke({ color: 0x555555, width: 2 });
    }
  }

  public setItem(item: InventoryItem | null) {
    this.currentItem = item;

    if (item) {
      this.itemNameText.text = item.name;
      this.itemTypeText.text = item.type;

      if (item.quantity > 1) {
        this.quantityText.text = `x${item.quantity}`;
        this.quantityText.visible = true;
      } else {
        this.quantityText.visible = false;
      }
    } else {
      this.itemNameText.text = "Empty";
      this.itemNameText.style.fill = 0x666666;
      this.itemTypeText.text = "";
      this.quantityText.visible = false;
    }

    this.updateBackground();
  }

  public setHighlight(highlight: boolean) {
    this.isHighlighted = highlight;
    this.updateBackground();
  }

  public getItem(): InventoryItem | null {
    return this.currentItem;
  }

  public hasItem(): boolean {
    return this.currentItem !== null;
  }
}
