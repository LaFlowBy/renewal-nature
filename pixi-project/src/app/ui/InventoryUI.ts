import { Container, Graphics, Text } from "pixi.js";
import type { EquipmentSlots, InventoryItem } from "../game/InventoryItem";
import { ItemType } from "../game/InventoryItem";

export class InventoryUI extends Container {
  private background: Graphics;
  private equipmentSlots: Map<string, SlotUI> = new Map();
  private backpackSlots: SlotUI[] = [];
  private titleText: Text;
  private closeText: Text;

  public onItemMove?: (fromSlot: string, toSlot: string) => void;
  public onClose?: () => void;

  constructor() {
    super();

    this.visible = false;

    // Background
    this.background = new Graphics();
    this.background.rect(0, 0, 600, 700);
    this.background.fill({ color: 0x2a2a2a, alpha: 0.95 });
    this.background.stroke({ color: 0x555555, width: 2 });
    this.addChild(this.background);

    // Title
    this.titleText = new Text({
      text: "INVENTORY",
      style: {
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.titleText.x = 20;
    this.titleText.y = 20;
    this.addChild(this.titleText);

    // Close instruction
    this.closeText = new Text({
      text: "Press TAB to close",
      style: {
        fontSize: 14,
        fill: 0xaaaaaa,
      },
    });
    this.closeText.x = 450;
    this.closeText.y = 25;
    this.addChild(this.closeText);

    // Equipment section
    const equipmentLabel = new Text({
      text: "EQUIPMENT",
      style: {
        fontSize: 18,
        fill: 0xffaa00,
        fontWeight: "bold",
      },
    });
    equipmentLabel.x = 20;
    equipmentLabel.y = 60;
    this.addChild(equipmentLabel);

    // Create equipment slots
    const helmetSlot = new SlotUI("helmet", "Helmet", 20, 90);
    const armorSlot = new SlotUI("bodyArmor", "Body Armor", 20, 160);
    const weaponSlot = new SlotUI("mainHand", "Main Hand", 20, 230);

    this.equipmentSlots.set("helmet", helmetSlot);
    this.equipmentSlots.set("bodyArmor", armorSlot);
    this.equipmentSlots.set("mainHand", weaponSlot);

    this.addChild(helmetSlot);
    this.addChild(armorSlot);
    this.addChild(weaponSlot);

    // Backpack section
    const backpackLabel = new Text({
      text: "BACKPACK (20 SLOTS)",
      style: {
        fontSize: 18,
        fill: 0xffaa00,
        fontWeight: "bold",
      },
    });
    backpackLabel.x = 20;
    backpackLabel.y = 310;
    this.addChild(backpackLabel);

    // Create backpack slots (4x5 grid)
    const slotsPerRow = 5;
    const slotSize = 60;
    const slotSpacing = 10;
    const startX = 20;
    const startY = 350;

    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;
      const x = startX + col * (slotSize + slotSpacing);
      const y = startY + row * (slotSize + slotSpacing);

      const slot = new SlotUI(`backpack_${i}`, `Slot ${i + 1}`, x, y);
      this.backpackSlots.push(slot);
      this.addChild(slot);
    }
  }

  public updateInventory(equipment: EquipmentSlots, backpack: InventoryItem[]) {
    // Update equipment slots
    this.equipmentSlots.get("helmet")?.setItem(equipment.helmet);
    this.equipmentSlots.get("bodyArmor")?.setItem(equipment.bodyArmor);
    this.equipmentSlots.get("mainHand")?.setItem(equipment.mainHand);

    // Update backpack slots
    this.backpackSlots.forEach((slot, index) => {
      slot.setItem(backpack[index] || null);
    });
  }

  public toggle() {
    this.visible = !this.visible;
  }

  public show() {
    this.visible = true;
  }

  public hide() {
    this.visible = false;
  }
}

class SlotUI extends Container {
  private slotBackground: Graphics;
  private itemText: Text;
  private quantityText: Text;
  private labelText: Text | null = null;
  public slotId: string;
  private currentItem: InventoryItem | null = null;

  constructor(slotId: string, label: string, x: number, y: number) {
    super();

    this.slotId = slotId;
    this.x = x;
    this.y = y;

    // Slot background
    this.slotBackground = new Graphics();
    this.slotBackground.rect(0, 0, 60, 60);
    this.slotBackground.fill({ color: 0x1a1a1a });
    this.slotBackground.stroke({ color: 0x444444, width: 2 });
    this.addChild(this.slotBackground);

    // Label (for equipment slots)
    if (!slotId.startsWith("backpack_")) {
      this.labelText = new Text({
        text: label,
        style: {
          fontSize: 12,
          fill: 0xaaaaaa,
        },
      });
      this.labelText.x = 70;
      this.labelText.y = 20;
      this.addChild(this.labelText);
    }

    // Item text
    this.itemText = new Text({
      text: "",
      style: {
        fontSize: 10,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 55,
      },
    });
    this.itemText.x = 5;
    this.itemText.y = 5;
    this.addChild(this.itemText);

    // Quantity text
    this.quantityText = new Text({
      text: "",
      style: {
        fontSize: 12,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.quantityText.anchor.set(1, 1);
    this.quantityText.x = 55;
    this.quantityText.y = 55;
    this.addChild(this.quantityText);
  }

  public setItem(item: InventoryItem | null) {
    this.currentItem = item;

    if (item) {
      // Color code by item type
      let color = 0x00ff00;
      switch (item.type) {
        case ItemType.Helmet:
        case ItemType.BodyArmor:
          color = 0x4488ff;
          break;
        case ItemType.Weapon:
          color = 0xff4444;
          break;
        case ItemType.Seed:
          color = 0x44ff44;
          break;
        case ItemType.MachinePart:
          color = 0x888888;
          break;
        case ItemType.Component:
          color = 0xffaa00;
          break;
      }

      this.slotBackground.clear();
      this.slotBackground.rect(0, 0, 60, 60);
      this.slotBackground.fill({ color: 0x1a1a1a });
      this.slotBackground.stroke({ color, width: 2 });

      this.itemText.text = item.name;
      this.itemText.style.fill = color;

      if (item.quantity > 1) {
        this.quantityText.text = `x${item.quantity}`;
        this.quantityText.visible = true;
      } else {
        this.quantityText.visible = false;
      }
    } else {
      this.slotBackground.clear();
      this.slotBackground.rect(0, 0, 60, 60);
      this.slotBackground.fill({ color: 0x1a1a1a });
      this.slotBackground.stroke({ color: 0x444444, width: 2 });

      this.itemText.text = "";
      this.quantityText.visible = false;
    }
  }

  public getItem(): InventoryItem | null {
    return this.currentItem;
  }
}
