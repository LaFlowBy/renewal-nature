import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { ExtractionPoint } from "../game/ExtractionPoint";
import { InputController } from "../game/InputController";
import { Player } from "../game/Player";
import { LootContainer } from "../game/LootContainer";
import { Building } from "../game/Building";
import { InventoryUI } from "../ui/InventoryUI";
import { LootContainerUI } from "../ui/LootContainerUI";

/** The loot run world where players can gather resources */
export class LootRunWorld extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private player: Player;
  private extractionPoints: ExtractionPoint[] = [];
  private inputController: InputController;
  private worldBounds = { width: 2400, height: 2000 };
  private camera: Container;
  private ground: Graphics;
  private uiContainer: Container;
  private statusText: Text;
  private inventoryText: Text;
  private lootContainers: LootContainer[] = [];
  private buildings: Building[] = [];
  private inventoryUI: InventoryUI;
  private lootContainerUI: LootContainerUI;
  private currentOpenContainer: LootContainer | null = null;
  private currentLootSlotIndex = 0;
  private currentBuilding: Building | null = null;
  private fogOverlay: Graphics;

  constructor() {
    super();

    // Create camera container
    this.camera = new Container();
    this.addChild(this.camera);

    // Create ground - more industrial/abandoned look
    this.ground = new Graphics();
    this.ground.rect(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.ground.fill({ color: 0x2a2a2a }); // Dark gray
    this.camera.addChild(this.ground);

    // Generate procedural environment
    this.generateProceduralWorld();

    // Create player
    this.player = new Player();
    this.player.x = 200; // Spawn near edge
    this.player.y = 200;
    this.camera.addChild(this.player);

    // Create fog overlay (initially hidden)
    this.fogOverlay = new Graphics();
    this.fogOverlay.rect(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.fogOverlay.fill({ color: 0x000000, alpha: 0.7 });
    this.fogOverlay.visible = false;
    this.camera.addChild(this.fogOverlay);

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
      text: "E: Open/Interact | F: Take Item | TAB: Inventory | Arrows: Navigate",
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
      return;
    }

    // Try to enter/exit building
    for (const building of this.buildings) {
      if (building.checkPlayerProximity(this.player.x, this.player.y)) {
        this.enterBuilding(building);
        return;
      }
    }

    // Try to open a container
    this.tryOpenLootContainer();
  }

  private enterBuilding(building: Building) {
    if (this.currentBuilding === building) {
      // Exit building
      const exitPos = building.getExteriorSpawnPoint();
      this.player.x = exitPos.x;
      this.player.y = exitPos.y;
      this.currentBuilding = null;

      // Hide fog overlay
      this.fogOverlay.visible = false;

      // Ensure player is visible and on top layer
      this.camera.removeChild(this.player);
      this.camera.addChild(this.player);

      console.log("Exited building");
    } else {
      // Enter building
      const enterPos = building.getInteriorSpawnPoint();
      this.player.x = enterPos.x;
      this.player.y = enterPos.y;
      this.currentBuilding = building;

      // Show fog overlay to hide outside
      this.fogOverlay.visible = true;

      // Reorganize layers: fog should be below player and current building
      // Remove and re-add to ensure correct order
      this.camera.removeChild(building);
      this.camera.removeChild(this.player);

      // Add back in correct order (building above fog, player above building)
      this.camera.addChild(building);
      this.camera.addChild(this.player);

      // Move loot containers inside this building above fog
      for (const container of this.lootContainers) {
        if (building.isPlayerInsideBuilding(container.x, container.y)) {
          this.camera.removeChild(container);
          this.camera.addChild(container);
        }
      }

      console.log("Entered building");
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

  private generateProceduralWorld() {
    const numBuildings = 5 + Math.floor(Math.random() * 5); // 5-9 buildings
    const minBuildingDistance = 500;
    const safeSpawnRadius = 400; // Keep spawn area clear
    const buildingPositions: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];

    // Generate buildings
    for (let i = 0; i < numBuildings; i++) {
      let attempts = 0;
      let validPosition = false;
      let bx, by, bw, bh;

      while (!validPosition && attempts < 50) {
        bw = 150 + Math.random() * 200; // Width: 150-350
        bh = 150 + Math.random() * 200; // Height: 150-350
        bx = 100 + Math.random() * (this.worldBounds.width - bw - 200);
        by = 100 + Math.random() * (this.worldBounds.height - bh - 200);

        // Check distance from spawn
        const distFromSpawn = Math.sqrt(
          Math.pow(bx - 200, 2) + Math.pow(by - 200, 2)
        );
        if (distFromSpawn < safeSpawnRadius) {
          attempts++;
          continue;
        }

        // Check distance from other buildings
        validPosition = true;
        for (const existing of buildingPositions) {
          const distX = Math.abs(bx - existing.x);
          const distY = Math.abs(by - existing.y);
          if (distX < minBuildingDistance && distY < minBuildingDistance) {
            validPosition = false;
            break;
          }
        }

        attempts++;
      }

      if (validPosition) {
        buildingPositions.push({ x: bx!, y: by!, width: bw!, height: bh! });

        // Random door side
        const doorSides: ("left" | "right" | "top" | "bottom")[] = [
          "left",
          "right",
          "top",
          "bottom",
        ];
        const doorSide =
          doorSides[Math.floor(Math.random() * doorSides.length)];

        const building = new Building(bx!, by!, bw!, bh!, doorSide);
        this.buildings.push(building);
        this.camera.addChild(building);

        // Add loot containers inside the building
        const numInteriorContainers = 1 + Math.floor(Math.random() * 3); // 1-3 containers per building
        for (let j = 0; j < numInteriorContainers; j++) {
          const cx =
            building.interiorBounds.x +
            30 +
            Math.random() * (building.interiorBounds.width - 60);
          const cy =
            building.interiorBounds.y +
            30 +
            Math.random() * (building.interiorBounds.height - 60);
          const container = new LootContainer(cx, cy);
          this.lootContainers.push(container);
          this.camera.addChild(container);
        }

        // Add loot containers outside the building (1-2 per building)
        const numExteriorContainers = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numExteriorContainers; j++) {
          const side = Math.floor(Math.random() * 4);
          let cx, cy;

          switch (side) {
            case 0: // Top
              cx = bx! + Math.random() * bw!;
              cy = by! - 40 - Math.random() * 30;
              break;
            case 1: // Bottom
              cx = bx! + Math.random() * bw!;
              cy = by! + bh! + 40 + Math.random() * 30;
              break;
            case 2: // Left
              cx = bx! - 40 - Math.random() * 30;
              cy = by! + Math.random() * bh!;
              break;
            default: // Right
              cx = bx! + bw! + 40 + Math.random() * 30;
              cy = by! + Math.random() * bh!;
              break;
          }

          const container = new LootContainer(cx, cy);
          this.lootContainers.push(container);
          this.camera.addChild(container);
        }
      }
    }

    // Add debris/details
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * this.worldBounds.width;
      const y = Math.random() * this.worldBounds.height;
      const size = 3 + Math.random() * 8;
      this.ground.circle(x, y, size);
      this.ground.fill({ color: 0x3a3a3a, alpha: 0.5 });
    }

    // Create extraction points (always 3)
    this.createExtractionPoints();
  }

  private createExtractionPoints() {
    // Always create exactly 3 extraction points in different areas
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

  public prepare() {
    // Reset loot run state - regenerate world each time
    this.buildings.forEach((b) => b.destroy());
    this.buildings = [];
    this.lootContainers.forEach((c) => c.destroy());
    this.lootContainers = [];
    this.extractionPoints.forEach((e) => e.destroy());
    this.extractionPoints = [];

    // Clear ground graphics
    this.ground.clear();
    this.ground.rect(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.ground.fill({ color: 0x2a2a2a });

    // Regenerate world
    this.generateProceduralWorld();

    // Reset player position
    this.player.x = 200;
    this.player.y = 200;
  }

  public update(time: Ticker) {
    const deltaTime = time.deltaTime / 60;

    // Only allow player movement if loot container is NOT open
    if (!this.lootContainerUI.visible) {
      // Update input
      const movement = this.inputController.getMovementVector();
      this.player.setMovement(movement.x, movement.y);

      // Store old position for collision detection
      const oldX = this.player.x;
      const oldY = this.player.y;

      this.player.update(deltaTime);

      // Check collision with buildings
      const playerRadius = 20; // Player's visual radius

      if (this.currentBuilding) {
        // Player is inside a building - keep them within interior bounds
        const bounds = this.currentBuilding.interiorBounds;
        if (
          this.player.x - playerRadius < bounds.x ||
          this.player.x + playerRadius > bounds.x + bounds.width ||
          this.player.y - playerRadius < bounds.y ||
          this.player.y + playerRadius > bounds.y + bounds.height
        ) {
          // Player trying to leave interior - revert to old position
          this.player.x = oldX;
          this.player.y = oldY;
        }
      } else {
        // Player is outside - check collision with building exteriors
        for (const building of this.buildings) {
          if (
            this.player.x + playerRadius > building.x &&
            this.player.x - playerRadius <
              building.x + building.buildingWidth &&
            this.player.y + playerRadius > building.y &&
            this.player.y - playerRadius < building.y + building.buildingHeight
          ) {
            // Collision detected - revert to old position
            this.player.x = oldX;
            this.player.y = oldY;
            break;
          }
        }
      }

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

    // Update buildings
    this.buildings.forEach((building) => {
      building.checkPlayerProximity(this.player.x, this.player.y);
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
