import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { ExtractionPoint } from "../game/ExtractionPoint";
import { InputController } from "../game/InputController";
import { Player } from "../game/Player";
import { LootContainer } from "../game/LootContainer";
import { InventoryUI } from "../ui/InventoryUI";
import { LootContainerUI } from "../ui/LootContainerUI";

/** The loot run world where players can gather resources */
export class LootRunWorld extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private player: Player;
  private extractionPoints: ExtractionPoint[] = [];
  private inputController: InputController;
  private worldBounds = { width: 2000, height: 1500 };
  private camera: Container;
  private ground: Graphics;
  private uiContainer: Container;
  private statusText: Text;
  private inventoryText: Text;
  private lootContainers: LootContainer[] = [];
  private inventoryUI: InventoryUI;
  private lootContainerUI: LootContainerUI;
  private currentOpenContainer: LootContainer | null = null;
  private currentLootSlotIndex = 0;

  constructor() {
    super();

    // Create camera container
    this.camera = new Container();
    this.addChild(this.camera);

    // Create ground - more industrial/abandoned look
    this.ground = new Graphics();
    this.ground.rect(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.ground.fill({ color: 0x2a2a2a }); // Dark gray

    // Add buildings/structures as obstacles
    this.createEnvironment();

    this.camera.addChild(this.ground);

    // Create player
    this.player = new Player();
    this.player.x = 200; // Spawn near edge
    this.player.y = 200;
    this.camera.addChild(this.player);

    // Create extraction points
    this.createExtractionPoints();

    // Create loot containers
    this.createLootContainers();

    // Create UI
    this.uiContainer = new Container();
    this.addChild(this.uiContainer);

    this.statusText = new Text({
      text: "LOOT RUN - Find the extraction zone!",
      style: {
        fontSize: 24,
        fill: 0xff0000,
        fontWeight: "bold",
      },
    });
    this.statusText.anchor.set(0.5, 0);
    this.uiContainer.addChild(this.statusText);

    this.inventoryText = new Text({
      text: "Inventory: 0/23",
      style: {
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.inventoryText.x = 20;
    this.inventoryText.y = 60;
    this.uiContainer.addChild(this.inventoryText);

    const warningText = new Text({
      text: "⚠️ If you die, you lose all items!",
      style: {
        fontSize: 18,
        fill: 0xffaa00,
        fontWeight: "bold",
      },
    });
    warningText.x = 20;
    warningText.y = 90;
    this.uiContainer.addChild(warningText);

    const controlsText = new Text({
      text: "E: Open/Close Container | F: Take Item | TAB: Inventory | Arrows: Navigate",
      style: {
        fontSize: 14,
        fill: 0xcccccc,
      },
    });
    controlsText.x = 20;
    controlsText.y = 120;
    this.uiContainer.addChild(controlsText);

    // Inventory UI
    this.inventoryUI = new InventoryUI();
    this.inventoryUI.x = 50;
    this.inventoryUI.y = 50;
    this.uiContainer.addChild(this.inventoryUI);

    // Loot Container UI
    this.lootContainerUI = new LootContainerUI();
    this.lootContainerUI.x = 700;
    this.lootContainerUI.y = 150;
    this.uiContainer.addChild(this.lootContainerUI);

    // Input controller
    this.inputController = new InputController();
    this.inputController.onKeyDown("e", () => this.tryInteractOrClose());
    this.inputController.onKeyDown("tab", () => this.toggleInventory());
    this.inputController.onKeyDown("f", () => this.tryTakeLoot());
  }

  private toggleInventory() {
    if (!this.lootContainerUI.visible) {
      this.inventoryUI.toggle();
      if (this.inventoryUI.visible) {
        this.updateInventoryUI();
      }
    }
  }

  private tryInteractOrClose() {
    if (this.lootContainerUI.visible) {
      // Close loot container
      this.closeLootContainer();
    } else {
      // Try to open a container
      this.tryOpenLootContainer();
    }
  }

  private tryOpenLootContainer() {
    for (const container of this.lootContainers) {
      if (
        container.checkPlayerProximity(this.player.x, this.player.y) &&
        !container.isOpen
      ) {
        this.openLootContainer(container);
        break;
      }
    }
  }

  private openLootContainer(container: LootContainer) {
    this.currentOpenContainer = container;
    container.open();
    this.lootContainerUI.setLootItems(container.items);
    this.lootContainerUI.show();
    this.currentLootSlotIndex =
      this.lootContainerUI.getFirstNonEmptySlotIndex();
    if (this.currentLootSlotIndex >= 0) {
      this.lootContainerUI.highlightSlot(this.currentLootSlotIndex);
    }

    // Register arrow key navigation
    this.inputController.onKeyDown("arrowup", () => this.navigateLootSlot(-2));
    this.inputController.onKeyDown("arrowdown", () => this.navigateLootSlot(2));
    this.inputController.onKeyDown("arrowleft", () =>
      this.navigateLootSlot(-1)
    );
    this.inputController.onKeyDown("arrowright", () =>
      this.navigateLootSlot(1)
    );
  }

  private closeLootContainer() {
    if (this.currentOpenContainer) {
      this.currentOpenContainer.close();
      if (this.currentOpenContainer.isEmpty()) {
        // Make the container visually empty/looted
        this.currentOpenContainer.alpha = 0.5;
      }
    }
    this.currentOpenContainer = null;
    this.lootContainerUI.hide();

    // Remove arrow key navigation
    this.inputController.removeKeyCallback("arrowup");
    this.inputController.removeKeyCallback("arrowdown");
    this.inputController.removeKeyCallback("arrowleft");
    this.inputController.removeKeyCallback("arrowright");
  }

  private navigateLootSlot(delta: number) {
    if (!this.currentOpenContainer || !this.lootContainerUI.visible) return;

    const totalSlots = 10; // 10 slots in loot container
    this.currentLootSlotIndex =
      (this.currentLootSlotIndex + delta + totalSlots) % totalSlots;
    this.lootContainerUI.highlightSlot(this.currentLootSlotIndex);
  }

  private tryTakeLoot() {
    if (!this.lootContainerUI.visible || !this.currentOpenContainer) return;

    const item = this.currentOpenContainer.takeItem(this.currentLootSlotIndex);
    if (item) {
      const added = this.player.addItem(item);
      if (added) {
        console.log(`Took ${item.name} x${item.quantity}`);
        this.lootContainerUI.setLootItems(this.currentOpenContainer.items);
        this.currentLootSlotIndex =
          this.lootContainerUI.getFirstNonEmptySlotIndex();
        if (this.currentLootSlotIndex >= 0) {
          this.lootContainerUI.highlightSlot(this.currentLootSlotIndex);
        }
      } else {
        console.log("Inventory full!");
        // Put the item back
        this.currentOpenContainer.items.splice(
          this.currentLootSlotIndex,
          0,
          item
        );
      }
    }
  }

  private createEnvironment() {
    // Add some buildings/structures
    const buildings = [
      { x: 400, y: 300, width: 200, height: 150 },
      { x: 900, y: 400, width: 250, height: 200 },
      { x: 1200, y: 800, width: 180, height: 180 },
      { x: 600, y: 900, width: 220, height: 160 },
      { x: 1500, y: 500, width: 200, height: 200 },
    ];

    buildings.forEach((building) => {
      this.ground.rect(building.x, building.y, building.width, building.height);
      this.ground.fill({ color: 0x1a1a1a });
      this.ground.stroke({ color: 0x444444, width: 2 });
    });

    // Add some debris/details
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.worldBounds.width;
      const y = Math.random() * this.worldBounds.height;
      const size = 3 + Math.random() * 8;
      this.ground.circle(x, y, size);
      this.ground.fill({ color: 0x3a3a3a, alpha: 0.5 });
    }
  }

  private createExtractionPoints() {
    // Create 3 extraction points
    const points = [
      { x: this.worldBounds.width - 300, y: 300 },
      { x: 300, y: this.worldBounds.height - 300 },
      { x: this.worldBounds.width - 300, y: this.worldBounds.height - 300 },
    ];

    points.forEach((point) => {
      const extractionPoint = new ExtractionPoint(point.x, point.y);
      this.extractionPoints.push(extractionPoint);
      this.camera.addChild(extractionPoint);
    });
  }

  private createLootContainers() {
    // Create 10 loot containers scattered around
    const positions = [
      { x: 500, y: 400 },
      { x: 800, y: 600 },
      { x: 1100, y: 300 },
      { x: 1400, y: 700 },
      { x: 700, y: 1000 },
      { x: 400, y: 700 },
      { x: 1600, y: 400 },
      { x: 300, y: 1100 },
      { x: 1300, y: 1100 },
      { x: 900, y: 900 },
    ];

    positions.forEach((pos) => {
      const container = new LootContainer(pos.x, pos.y);
      this.lootContainers.push(container);
      this.camera.addChild(container);
    });
  }

  public prepare() {
    // Reset loot run state
  }

  public update(time: Ticker) {
    const deltaTime = time.deltaTime / 60;

    // Only allow player movement if loot container is NOT open
    if (!this.lootContainerUI.visible) {
      // Update input
      const movement = this.inputController.getMovementVector();
      this.player.setMovement(movement.x, movement.y);
      this.player.update(deltaTime);

      // Keep player in bounds
      this.player.x = Math.max(
        50,
        Math.min(this.worldBounds.width - 50, this.player.x)
      );
      this.player.y = Math.max(
        50,
        Math.min(this.worldBounds.height - 50, this.player.y)
      );
    } else {
      // Stop player movement when container is open
      this.player.setMovement(0, 0);
    }

    // Update extraction points
    this.extractionPoints.forEach((point) => {
      const inZone = point.checkPlayerInZone(this.player.x, this.player.y);

      if (inZone && !point.isCurrentlyExtracting()) {
        console.log("Player entered extraction zone!");
        point.startExtraction(() => this.completeExtraction());
      }

      point.update(deltaTime, inZone);
    });

    // Update loot containers
    this.lootContainers.forEach((container) => {
      container.checkPlayerProximity(this.player.x, this.player.y);
    });

    // Update inventory UI
    this.inventoryText.text = `Inventory: ${this.player.getInventoryCount()}/${this.player.getTotalSlots()}`;

    if (this.inventoryUI.visible) {
      this.updateInventoryUI();
    }

    // Update camera
    this.updateCamera();
  }

  private async completeExtraction() {
    console.log("completeExtraction called!");
    console.log("Extraction complete! Returning to main world with loot.");
    console.log("Player backpack:", this.player.backpack);
    console.log("Player equipment:", this.player.equipment);

    // Store inventory in a temporary global store
    (window as any).__lootRunInventory = {
      backpack: this.player.backpack,
      equipment: this.player.equipment,
    };

    // Save player inventory
    this.player.saveInventory();

    // Transfer inventory to main world player
    const { GameWorld } = await import("./GameWorld");

    // Return to main world
    await engine().navigation.showScreen(GameWorld as any);
  }

  private updateInventoryUI() {
    this.inventoryUI.updateInventory(
      this.player.equipment,
      this.player.backpack
    );
  }

  private updateCamera() {
    const screenWidth = engine().screen.width;
    const screenHeight = engine().screen.height;

    let targetX = -this.player.x + screenWidth / 2;
    let targetY = -this.player.y + screenHeight / 2;

    targetX = Math.min(
      0,
      Math.max(targetX, -this.worldBounds.width + screenWidth)
    );
    targetY = Math.min(
      0,
      Math.max(targetY, -this.worldBounds.height + screenHeight)
    );

    this.camera.x = targetX;
    this.camera.y = targetY;
  }

  public async pause() {}

  public async resume() {}

  public reset() {}

  public resize(width: number, _height: number) {
    this.statusText.x = width / 2;
    this.statusText.y = 20;
  }

  public async show(): Promise<void> {
    // Show animation if needed
    // Re-register input handlers when screen is shown
    this.inputController.onKeyDown("e", () => this.tryInteractOrClose());
    this.inputController.onKeyDown("tab", () => this.toggleInventory());
    this.inputController.onKeyDown("f", () => this.tryTakeLoot());
  }

  public async hide() {
    // Hide animation if needed
    // Remove input handlers to prevent interference with other screens
    this.inputController.removeKeyCallback("e");
    this.inputController.removeKeyCallback("tab");
    this.inputController.removeKeyCallback("f");
    this.inputController.removeKeyCallback("arrowup");
    this.inputController.removeKeyCallback("arrowdown");
    this.inputController.removeKeyCallback("arrowleft");
    this.inputController.removeKeyCallback("arrowright");
  }

  public blur() {}

  public destroy() {
    this.inputController.destroy();
    super.destroy();
  }
}
