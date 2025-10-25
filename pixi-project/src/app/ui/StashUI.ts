import { Container, Graphics, Text } from "pixi.js";
import type { InventoryItem, EquipmentSlots } from "../game/InventoryItem";
import { ItemType } from "../game/InventoryItem";

export class StashUI extends Container {
  private background: Graphics;
  private stashSlots: StashSlotUI[] = [];
  private inventorySlots: InventorySlotUI[] = [];
  private equipmentSlots: {
    helmet: EquipmentSlotUI;
    bodyArmor: EquipmentSlotUI;
    mainHand: EquipmentSlotUI;
  };
  private titleText: Text;
  private closeText: Text;
  private infoText: Text;
  private stashContainer: Container;
  private stashMask: Graphics;
  private scrollBar: Graphics;
  private scrollThumb: Graphics;
  private scrollOffset = 0;
  private maxScrollOffset = 0;

  constructor() {
    super();

    this.visible = false;

    // Background (wider to fit both sides)
    this.background = new Graphics();
    this.background.rect(0, 0, 1400, 750);
    this.background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.background.stroke({ color: 0x666666, width: 3 });
    this.addChild(this.background);

    // Title
    this.titleText = new Text({
      text: "INVENTORY & STASH",
      style: {
        fontSize: 28,
        fill: 0x00ff00,
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
        fontSize: 16,
        fill: 0xaaaaaa,
      },
    });
    this.closeText.x = 1220;
    this.closeText.y = 25;
    this.addChild(this.closeText);

    // Info text
    this.infoText = new Text({
      text: "Arrow keys: Navigate across panels | F: Transfer item | E: Close",
      style: {
        fontSize: 14,
        fill: 0xcccccc,
      },
    });
    this.infoText.x = 20;
    this.infoText.y = 60;
    this.addChild(this.infoText);

    // === LEFT SIDE: PLAYER INVENTORY ===
    const inventoryTitle = new Text({
      text: "YOUR INVENTORY",
      style: {
        fontSize: 20,
        fill: 0x4488ff,
        fontWeight: "bold",
      },
    });
    inventoryTitle.x = 20;
    inventoryTitle.y = 100;
    this.addChild(inventoryTitle);

    // Equipment slots
    const equipStartX = 20;
    const equipStartY = 140;
    const equipSlotSize = 60;
    const equipSpacing = 10;

    this.equipmentSlots = {
      helmet: new EquipmentSlotUI("Helmet", equipStartX, equipStartY),
      bodyArmor: new EquipmentSlotUI("Body Armor", equipStartX + (equipSlotSize + equipSpacing), equipStartY),
      mainHand: new EquipmentSlotUI("Main Hand", equipStartX + 2 * (equipSlotSize + equipSpacing), equipStartY),
    };

    this.addChild(this.equipmentSlots.helmet);
    this.addChild(this.equipmentSlots.bodyArmor);
    this.addChild(this.equipmentSlots.mainHand);

    // Backpack slots (4x5 grid = 20 slots)
    const backpackTitle = new Text({
      text: "BACKPACK",
      style: {
        fontSize: 16,
        fill: 0x888888,
      },
    });
    backpackTitle.x = 20;
    backpackTitle.y = 220;
    this.addChild(backpackTitle);

    const backpackSlotsPerRow = 4;
    const backpackSlotSize = 60;
    const backpackSpacing = 10;
    const backpackStartX = 20;
    const backpackStartY = 250;

    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / backpackSlotsPerRow);
      const col = i % backpackSlotsPerRow;
      const x = backpackStartX + col * (backpackSlotSize + backpackSpacing);
      const y = backpackStartY + row * (backpackSlotSize + backpackSpacing);

      const slot = new InventorySlotUI(i, x, y, backpackSlotSize);
      this.inventorySlots.push(slot);
      this.addChild(slot);
    }

    // === RIGHT SIDE: STASH ===
    const stashTitle = new Text({
      text: "STASH (200 SLOTS)",
      style: {
        fontSize: 20,
        fill: 0x00ff00,
        fontWeight: "bold",
      },
    });
    stashTitle.x = 720;
    stashTitle.y = 100;
    this.addChild(stashTitle);

    // Create stash container with mask for scrolling
    this.stashContainer = new Container();
    this.stashContainer.x = 720;
    this.stashContainer.y = 140;
    
    // Create mask for stash area (shows 10 rows at a time)
    this.stashMask = new Graphics();
    this.stashMask.rect(0, 0, 640, 580); // Width for 10 cols, height for ~10 rows visible
    this.stashMask.fill({ color: 0xffffff });
    this.stashMask.x = 720;
    this.stashMask.y = 140;
    this.addChild(this.stashMask);
    this.stashContainer.mask = this.stashMask;

    // Create stash slots (10x20 grid = 200 slots)
    const slotsPerRow = 10;
    const slotSize = 50;
    const slotSpacing = 8;
    const startX = 0; // Relative to stashContainer
    const startY = 0;

    for (let i = 0; i < 200; i++) {
      const row = Math.floor(i / slotsPerRow);
      const col = i % slotsPerRow;
      const x = startX + col * (slotSize + slotSpacing);
      const y = startY + row * (slotSize + slotSpacing);

      const slot = new StashSlotUI(i, x, y);
      this.stashSlots.push(slot);
      this.stashContainer.addChild(slot);
    }
    
    this.addChild(this.stashContainer);
    
    // Calculate max scroll
    const totalStashHeight = 20 * (slotSize + slotSpacing);
    const visibleHeight = 580;
    this.maxScrollOffset = Math.max(0, totalStashHeight - visibleHeight);

    // Create scrollbar
    const scrollBarX = 720 + 640 + 10;
    const scrollBarY = 140;
    const scrollBarHeight = 580;
    
    // Scrollbar track
    this.scrollBar = new Graphics();
    this.scrollBar.rect(scrollBarX, scrollBarY, 20, scrollBarHeight);
    this.scrollBar.fill({ color: 0x2a2a2a });
    this.scrollBar.stroke({ color: 0x444444, width: 1 });
    this.addChild(this.scrollBar);
    
    // Scrollbar thumb
    const thumbHeight = Math.max(40, (visibleHeight / totalStashHeight) * scrollBarHeight);
    this.scrollThumb = new Graphics();
    this.scrollThumb.rect(scrollBarX + 2, scrollBarY + 2, 16, thumbHeight);
    this.scrollThumb.fill({ color: 0x00ff00, alpha: 0.7 });
    this.addChild(this.scrollThumb);
  }

  public scrollStash(delta: number) {
    // Scroll by rows (delta in rows)
    const slotSize = 50;
    const slotSpacing = 8;
    const rowHeight = slotSize + slotSpacing;
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + delta * rowHeight));
    this.stashContainer.y = 140 - this.scrollOffset;
    
    // Update scrollbar thumb position
    const scrollBarX = 720 + 640 + 10;
    const scrollBarY = 140;
    const scrollBarHeight = 580;
    const visibleHeight = 580;
    const totalStashHeight = 20 * rowHeight;
    const thumbHeight = Math.max(40, (visibleHeight / totalStashHeight) * scrollBarHeight);
    const scrollRatio = this.maxScrollOffset > 0 ? this.scrollOffset / this.maxScrollOffset : 0;
    const thumbY = scrollBarY + 2 + (scrollBarHeight - thumbHeight - 4) * scrollRatio;
    
    this.scrollThumb.clear();
    this.scrollThumb.rect(scrollBarX + 2, thumbY, 16, thumbHeight);
    this.scrollThumb.fill({ color: 0x00ff00, alpha: 0.7 });
  }

  public getVisibleStashRows(): { start: number; end: number } {
    const slotSize = 50;
    const slotSpacing = 8;
    const rowHeight = slotSize + slotSpacing;
    
    const startRow = Math.floor(this.scrollOffset / rowHeight);
    const endRow = Math.min(19, Math.ceil((this.scrollOffset + 580) / rowHeight));
    
    return { start: startRow, end: endRow };
  }

  public setStashItems(items: InventoryItem[]) {
    this.stashSlots.forEach((slot, index) => {
      slot.setItem(items[index] || null);
    });
  }

  public setPlayerInventory(backpack: InventoryItem[], equipment: EquipmentSlots) {
    // Update equipment
    this.equipmentSlots.helmet.setItem(equipment.helmet);
    this.equipmentSlots.bodyArmor.setItem(equipment.bodyArmor);
    this.equipmentSlots.mainHand.setItem(equipment.mainHand);

    // Update backpack
    this.inventorySlots.forEach((slot, index) => {
      slot.setItem(backpack[index] || null);
    });
  }

  public highlightStashSlot(index: number) {
    // Clear inventory highlights
    this.equipmentSlots.helmet.setHighlight(false);
    this.equipmentSlots.bodyArmor.setHighlight(false);
    this.equipmentSlots.mainHand.setHighlight(false);
    this.inventorySlots.forEach(slot => slot.setHighlight(false));
    
    // Highlight stash slot
    this.stashSlots.forEach((slot, i) => {
      slot.setHighlight(i === index);
    });
    
    // Auto-scroll to keep highlighted slot visible
    const row = Math.floor(index / 10);
    const visibleRows = this.getVisibleStashRows();
    
    if (row < visibleRows.start) {
      // Scroll up to show this row
      this.scrollStash(row - visibleRows.start);
    } else if (row > visibleRows.end - 1) {
      // Scroll down to show this row
      this.scrollStash(row - visibleRows.end + 1);
    }
  }

  public highlightInventorySlot(index: number) {
    // Clear all stash highlights
    this.stashSlots.forEach(slot => slot.setHighlight(false));
    
    // Clear equipment highlights
    this.equipmentSlots.helmet.setHighlight(false);
    this.equipmentSlots.bodyArmor.setHighlight(false);
    this.equipmentSlots.mainHand.setHighlight(false);

    // Highlight backpack slot
    this.inventorySlots.forEach((slot, i) => {
      slot.setHighlight(i === index);
    });
  }

  public highlightEquipmentSlot(type: "helmet" | "bodyArmor" | "mainHand") {
    // Clear all stash highlights
    this.stashSlots.forEach(slot => slot.setHighlight(false));
    
    // Clear all highlights
    this.equipmentSlots.helmet.setHighlight(false);
    this.equipmentSlots.bodyArmor.setHighlight(false);
    this.equipmentSlots.mainHand.setHighlight(false);
    this.inventorySlots.forEach(slot => slot.setHighlight(false));

    // Highlight selected equipment
    this.equipmentSlots[type].setHighlight(true);
  }

  public getFirstNonEmptyStashSlotIndex(): number {
    return this.stashSlots.findIndex(slot => slot.hasItem());
  }

  public getFirstNonEmptyInventorySlotIndex(): number {
    return this.inventorySlots.findIndex(slot => slot.hasItem());
  }

  public show() {
    this.visible = true;
    this.scrollOffset = 0;
    this.scrollStash(0); // Reset scroll position
  }

  public hide() {
    this.visible = false;
  }
}

class StashSlotUI extends Container {
  private slotBackground: Graphics;
  private itemNameText: Text;
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

    // Item name (abbreviated)
    this.itemNameText = new Text({
      text: "",
      style: {
        fontSize: 9,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 45,
      },
    });
    this.itemNameText.x = 3;
    this.itemNameText.y = 3;
    this.addChild(this.itemNameText);

    // Quantity
    this.quantityText = new Text({
      text: "",
      style: {
        fontSize: 11,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.quantityText.anchor.set(1, 1);
    this.quantityText.x = 47;
    this.quantityText.y = 47;
    this.addChild(this.quantityText);
  }

  private updateBackground() {
    this.slotBackground.clear();
    this.slotBackground.rect(0, 0, 50, 50);
    this.slotBackground.fill({ color: 0x2a2a2a });
    
    if (this.isHighlighted) {
      this.slotBackground.stroke({ color: 0x00ff00, width: 3 });
    } else {
      this.slotBackground.stroke({ color: 0x444444, width: 1 });
    }
  }

  public setItem(item: InventoryItem | null) {
    this.currentItem = item;

    if (item) {
      // Abbreviate long names
      let displayName = item.name;
      if (displayName.length > 10) {
        displayName = displayName.substring(0, 8) + "..";
      }
      
      this.itemNameText.text = displayName;
      
      // Color by type
      let color = 0xffffff;
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
      this.itemNameText.style.fill = color;

      if (item.quantity > 1) {
        this.quantityText.text = `${item.quantity}`;
        this.quantityText.visible = true;
      } else {
        this.quantityText.visible = false;
      }
    } else {
      this.itemNameText.text = "";
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

class InventorySlotUI extends Container {
  private slotBackground: Graphics;
  private itemNameText: Text;
  private quantityText: Text;
  public slotIndex: number;
  private currentItem: InventoryItem | null = null;
  private isHighlighted = false;
  private slotSize: number;

  constructor(slotIndex: number, x: number, y: number, size: number) {
    super();

    this.slotIndex = slotIndex;
    this.slotSize = size;
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
        fontSize: 10,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: size - 6,
      },
    });
    this.itemNameText.x = 3;
    this.itemNameText.y = 3;
    this.addChild(this.itemNameText);

    // Quantity
    this.quantityText = new Text({
      text: "",
      style: {
        fontSize: 12,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.quantityText.anchor.set(1, 1);
    this.quantityText.x = size - 3;
    this.quantityText.y = size - 3;
    this.addChild(this.quantityText);
  }

  private updateBackground() {
    this.slotBackground.clear();
    this.slotBackground.rect(0, 0, this.slotSize, this.slotSize);
    this.slotBackground.fill({ color: 0x2a2a2a });
    
    if (this.isHighlighted) {
      this.slotBackground.stroke({ color: 0xffff00, width: 3 });
    } else {
      this.slotBackground.stroke({ color: 0x444444, width: 1 });
    }
  }

  public setItem(item: InventoryItem | null) {
    this.currentItem = item;

    if (item) {
      let displayName = item.name;
      if (displayName.length > 12) {
        displayName = displayName.substring(0, 10) + "..";
      }
      
      this.itemNameText.text = displayName;
      
      // Color by type
      let color = 0xffffff;
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
      this.itemNameText.style.fill = color;

      if (item.quantity > 1) {
        this.quantityText.text = `${item.quantity}`;
        this.quantityText.visible = true;
      } else {
        this.quantityText.visible = false;
      }
    } else {
      this.itemNameText.text = "";
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

class EquipmentSlotUI extends Container {
  private slotBackground: Graphics;
  private labelText: Text;
  private itemNameText: Text;
  private currentItem: InventoryItem | null = null;
  private isHighlighted = false;

  constructor(label: string, x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // Slot background (60x60)
    this.slotBackground = new Graphics();
    this.updateBackground();
    this.addChild(this.slotBackground);

    // Label
    this.labelText = new Text({
      text: label,
      style: {
        fontSize: 8,
        fill: 0x888888,
      },
    });
    this.labelText.x = 3;
    this.labelText.y = 3;
    this.addChild(this.labelText);

    // Item name
    this.itemNameText = new Text({
      text: "",
      style: {
        fontSize: 10,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: 54,
      },
    });
    this.itemNameText.x = 3;
    this.itemNameText.y = 20;
    this.addChild(this.itemNameText);
  }

  private updateBackground() {
    this.slotBackground.clear();
    this.slotBackground.rect(0, 0, 60, 60);
    this.slotBackground.fill({ color: 0x1a1a1a });
    
    if (this.isHighlighted) {
      this.slotBackground.stroke({ color: 0xffff00, width: 3 });
    } else {
      this.slotBackground.stroke({ color: 0x555555, width: 2 });
    }
  }

  public setItem(item: InventoryItem | null) {
    this.currentItem = item;

    if (item) {
      let displayName = item.name;
      if (displayName.length > 10) {
        displayName = displayName.substring(0, 8) + "..";
      }
      
      this.itemNameText.text = displayName;
      
      // Color by type
      let color = 0xffffff;
      if (item.type === ItemType.Helmet || item.type === ItemType.BodyArmor) {
        color = 0x4488ff;
      } else if (item.type === ItemType.Weapon) {
        color = 0xff4444;
      }
      this.itemNameText.style.fill = color;
    } else {
      this.itemNameText.text = "Empty";
      this.itemNameText.style.fill = 0x666666;
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
