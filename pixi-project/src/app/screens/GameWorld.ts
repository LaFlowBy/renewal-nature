import type { Ticker } from "pixi.js";
import { Container, Graphics, Text } from "pixi.js";

import { engine } from "../getEngine";
import { Helicopter } from "../game/Helicopter";
import { InputController } from "../game/InputController";
import { Player } from "../game/Player";
import { Stash } from "../game/Stash";
import { InventoryUI } from "../ui/InventoryUI";
import { StashUI } from "../ui/StashUI";
import { PersistentStorage } from "../utils/PersistentStorage";
import type { InventoryItem } from "../game/InventoryItem";

/** The main game world where the player can build and manage their factory */
export class GameWorld extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  private player: Player;
  private helicopter: Helicopter;
  private stash: Stash;
  private inputController: InputController;
  private worldBounds = { width: 1600, height: 1200 };
  private camera: Container;
  private ground: Graphics;
  private uiContainer: Container;
  private inventoryText: Text;
  private inventoryUI: InventoryUI;
  private stashUI: StashUI;
  private stashItems: InventoryItem[] = [];
  private currentStashSlotIndex = 0;
  private currentInventorySlotIndex = 0;
  private currentEquipmentSlot: "helmet" | "bodyArmor" | "mainHand" | null =
    null;
  private isOnStashSide = true;

  constructor() {
    super();

    // Create camera container for world scrolling
    this.camera = new Container();
    this.addChild(this.camera);

    // Create ground/world
    this.ground = new Graphics();
    this.ground.rect(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.ground.fill({ color: 0x8b7355 }); // Dry, dystopian brown

    // Add some visual detail to the ground
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.worldBounds.width;
      const y = Math.random() * this.worldBounds.height;
      const size = 5 + Math.random() * 15;
      this.ground.rect(x, y, size, size);
      this.ground.fill({ color: 0x6b5345, alpha: 0.3 });
    }

    this.camera.addChild(this.ground);

    // Create player
    this.player = new Player();
    this.player.x = this.worldBounds.width / 2;
    this.player.y = this.worldBounds.height / 2;
    this.camera.addChild(this.player);

    // Create helicopter
    this.helicopter = new Helicopter(
      this.worldBounds.width / 2 + 200,
      this.worldBounds.height / 2 - 100
    );
    this.camera.addChild(this.helicopter);

    // Create stash
    this.stash = new Stash(
      this.worldBounds.width / 2 - 250,
      this.worldBounds.height / 2 - 100
    );
    this.camera.addChild(this.stash);

    // Load stash from storage
    this.stashItems = PersistentStorage.loadStash();

    // Create UI container (stays fixed on screen)
    this.uiContainer = new Container();
    this.addChild(this.uiContainer);

    // Inventory display
    this.inventoryText = new Text({
      text: "Inventory: 0/20",
      style: {
        fontSize: 20,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    this.inventoryText.x = 20;
    this.inventoryText.y = 20;
    this.uiContainer.addChild(this.inventoryText);

    // Controls text
    const controlsText = new Text({
      text: "Controls: WASD/Arrows to move | E to interact | TAB for inventory",
      style: {
        fontSize: 16,
        fill: 0xcccccc,
      },
    });
    controlsText.x = 20;
    controlsText.y = 50;
    this.uiContainer.addChild(controlsText);

    // Inventory UI
    this.inventoryUI = new InventoryUI();
    this.inventoryUI.x = (engine().screen.width - 600) / 2;
    this.inventoryUI.y = (engine().screen.height - 700) / 2;
    this.uiContainer.addChild(this.inventoryUI);

    // Stash UI
    this.stashUI = new StashUI();
    this.stashUI.x = (engine().screen.width - 1400) / 2;
    this.stashUI.y = (engine().screen.height - 750) / 2;
    this.uiContainer.addChild(this.stashUI);

    // Input controller
    this.inputController = new InputController();
  }

  private toggleInventory() {
    if (!this.stashUI.visible) {
      this.inventoryUI.toggle();
      if (this.inventoryUI.visible) {
        this.updateInventoryUI();
      }
    }
  }

  private tryInteract() {
    if (this.stashUI.visible) {
      // Close stash
      this.closeStash();
      return;
    }

    console.log("E key pressed! Checking proximity...");
    console.log("Player position:", this.player.x, this.player.y);

    // Check if player is near stash
    const nearStash = this.stash.checkPlayerProximity(
      this.player.x,
      this.player.y
    );
    if (nearStash) {
      console.log("Opening stash!");
      this.openStash();
      return;
    }

    // Check if player is near helicopter
    console.log("Helicopter position:", this.helicopter.x, this.helicopter.y);
    const isNear = this.helicopter.checkPlayerProximity(
      this.player.x,
      this.player.y
    );
    console.log("Is player near helicopter?", isNear);

    if (isNear) {
      console.log("Starting loot run!");
      this.startLootRun();
    } else {
      console.log("Too far from helicopter and stash!");
    }
  }

  private openStash() {
    // Update both sides of the UI
    this.stashUI.setStashItems(this.stashItems);
    this.stashUI.setPlayerInventory(
      this.player.backpack,
      this.player.equipment
    );
    this.stashUI.show();

    // Start on stash side
    this.isOnStashSide = true;
    this.currentStashSlotIndex = this.stashUI.getFirstNonEmptyStashSlotIndex();
    if (this.currentStashSlotIndex < 0) this.currentStashSlotIndex = 0;
    this.stashUI.highlightStashSlot(this.currentStashSlotIndex);

    // Register stash controls
    this.inputController.onKeyDown("arrowup", () => this.navigateStash(-10));
    this.inputController.onKeyDown("arrowdown", () => this.navigateStash(10));
    this.inputController.onKeyDown("arrowleft", () => this.navigateStash(-1));
    this.inputController.onKeyDown("arrowright", () => this.navigateStash(1));
    this.inputController.onKeyDown("f", () => this.transferItem());
  }

  private closeStash() {
    this.stashUI.hide();
    PersistentStorage.saveStash(this.stashItems);
    this.player.saveInventory();
    console.log("Stash saved!");

    // Remove stash controls
    this.inputController.removeKeyCallback("arrowup");
    this.inputController.removeKeyCallback("arrowdown");
    this.inputController.removeKeyCallback("arrowleft");
    this.inputController.removeKeyCallback("arrowright");
    this.inputController.removeKeyCallback("f");
  }

  private navigateStash(delta: number) {
    if (!this.stashUI.visible) return;

    if (this.isOnStashSide) {
      // === NAVIGATING ON STASH SIDE ===
      if (delta === -1) {
        // Left arrow: check if at left edge of stash
        const col = this.currentStashSlotIndex % 10;
        if (col === 0) {
          // Move to inventory side - match row position
          const stashRow = Math.floor(this.currentStashSlotIndex / 10);
          this.isOnStashSide = false;

          // Map to backpack row (stash has 20 rows, backpack has 5 rows)
          const backpackRow = Math.min(4, Math.floor(stashRow / 4));
          this.currentInventorySlotIndex = backpackRow * 4 + 3; // Rightmost column (column 3)
          this.currentEquipmentSlot = null;
          this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
        } else {
          // Move left within stash
          this.currentStashSlotIndex--;
          this.stashUI.highlightStashSlot(this.currentStashSlotIndex);
        }
      } else {
        // Navigate within stash (up/down/right)
        const totalSlots = 200;
        this.currentStashSlotIndex =
          (this.currentStashSlotIndex + delta + totalSlots) % totalSlots;
        this.stashUI.highlightStashSlot(this.currentStashSlotIndex);
      }
    } else {
      // === NAVIGATING ON INVENTORY SIDE ===
      if (this.currentEquipmentSlot !== null) {
        // In equipment slots
        if (delta === 1) {
          // Right: move right within equipment or cross to stash
          const equipmentOrder: ("helmet" | "bodyArmor" | "mainHand")[] = [
            "helmet",
            "bodyArmor",
            "mainHand",
          ];
          const currentIndex = equipmentOrder.indexOf(
            this.currentEquipmentSlot
          );
          if (currentIndex === 2) {
            // At mainHand (rightmost), cross to stash
            this.isOnStashSide = true;
            this.currentStashSlotIndex = 0; // Top-left of stash
            this.stashUI.highlightStashSlot(this.currentStashSlotIndex);
          } else {
            // Move right within equipment
            this.currentEquipmentSlot = equipmentOrder[currentIndex + 1];
            this.stashUI.highlightEquipmentSlot(this.currentEquipmentSlot);
          }
        } else if (delta === -1) {
          // Left: move left within equipment
          const equipmentOrder: ("helmet" | "bodyArmor" | "mainHand")[] = [
            "helmet",
            "bodyArmor",
            "mainHand",
          ];
          const currentIndex = equipmentOrder.indexOf(
            this.currentEquipmentSlot
          );
          if (currentIndex > 0) {
            this.currentEquipmentSlot = equipmentOrder[currentIndex - 1];
            this.stashUI.highlightEquipmentSlot(this.currentEquipmentSlot);
          }
        } else if (delta === 10) {
          // Down: move to backpack
          this.currentEquipmentSlot = null;
          this.currentInventorySlotIndex = 0;
          this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
        }
      } else {
        // In backpack slots
        const col = this.currentInventorySlotIndex % 4;
        const row = Math.floor(this.currentInventorySlotIndex / 4);

        if (delta === 1) {
          // Right: move right or cross to stash
          if (col === 3) {
            // At right edge, cross to stash
            this.isOnStashSide = true;
            // Map backpack row to stash row (multiply by 4 since stash has more rows)
            const stashRow = row * 4;
            this.currentStashSlotIndex = stashRow * 10; // Leftmost column of that row
            this.stashUI.highlightStashSlot(this.currentStashSlotIndex);
          } else {
            // Move right within backpack
            this.currentInventorySlotIndex++;
            this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
          }
        } else if (delta === -1) {
          // Left: move left within backpack
          if (col > 0) {
            this.currentInventorySlotIndex--;
            this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
          }
        } else if (delta === -10) {
          // Up: move up or to equipment
          if (row === 0) {
            // Top row, go to equipment
            this.currentEquipmentSlot = "helmet";
            this.currentInventorySlotIndex = -1;
            this.stashUI.highlightEquipmentSlot("helmet");
          } else {
            // Move up within backpack
            this.currentInventorySlotIndex -= 4;
            this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
          }
        } else if (delta === 10) {
          // Down: move down within backpack
          if (row < 4) {
            this.currentInventorySlotIndex = Math.min(
              19,
              this.currentInventorySlotIndex + 4
            );
            this.stashUI.highlightInventorySlot(this.currentInventorySlotIndex);
          }
        }
      }
    }
  }

  private transferItem() {
    if (!this.stashUI.visible) return;

    if (this.isOnStashSide) {
      // Take from stash to player
      this.takeFromStash();
    } else {
      // Store from player to stash
      this.storeToStash();
    }
  }

  private takeFromStash() {
    if (this.currentStashSlotIndex >= this.stashItems.length) return;

    const item = this.stashItems[this.currentStashSlotIndex];
    if (!item) return;

    const added = this.player.addItem(item);
    if (added) {
      console.log(`Took ${item.name} from stash`);
      this.stashItems.splice(this.currentStashSlotIndex, 1);
      this.stashUI.setStashItems(this.stashItems);
      this.stashUI.setPlayerInventory(
        this.player.backpack,
        this.player.equipment
      );
      this.player.saveInventory();
    } else {
      console.log("Player inventory full!");
    }
  }

  private storeToStash() {
    if (this.stashItems.length >= 200) {
      console.log("Stash is full!");
      return;
    }

    let itemToStore = null;
    let itemType = "";

    // Check what's selected
    if (this.currentEquipmentSlot !== null) {
      // Store equipment item
      const equipment = this.player.equipment[this.currentEquipmentSlot];
      if (equipment) {
        itemToStore = { ...equipment };
        this.player.equipment[this.currentEquipmentSlot] = null;
        itemType = this.currentEquipmentSlot;
      }
    } else if (this.currentInventorySlotIndex >= 0) {
      // Store backpack item
      const item = this.player.backpack[this.currentInventorySlotIndex];
      if (item) {
        itemToStore = { ...item };
        this.player.backpack.splice(this.currentInventorySlotIndex, 1);
        itemType = "backpack item";
      }
    }

    if (itemToStore) {
      this.stashItems.push(itemToStore);
      this.stashUI.setStashItems(this.stashItems);
      this.stashUI.setPlayerInventory(
        this.player.backpack,
        this.player.equipment
      );
      this.player.saveInventory();
      console.log(`Stored ${itemType} in stash`);
    } else {
      console.log("No item selected!");
    }
  }

  private async startLootRun() {
    console.log("Starting loot run!");
    const { LootRunWorld } = await import("./LootRunWorld");
    await engine().navigation.showScreen(LootRunWorld as any);
  }

  public prepare() {
    // Reset player position when returning from loot run
    this.player.x = this.worldBounds.width / 2;
    this.player.y = this.worldBounds.height / 2;

    // Transfer inventory from loot run if available
    const lootInventory = (window as any).__lootRunInventory;
    if (lootInventory) {
      console.log("Transferring loot to main world:", lootInventory);

      if (lootInventory.backpack && Array.isArray(lootInventory.backpack)) {
        lootInventory.backpack.forEach((item: any) => {
          this.player.addItem(item);
        });
      }

      if (lootInventory.equipment) {
        if (lootInventory.equipment.helmet) {
          this.player.addItem(lootInventory.equipment.helmet);
        }
        if (lootInventory.equipment.bodyArmor) {
          this.player.addItem(lootInventory.equipment.bodyArmor);
        }
        if (lootInventory.equipment.mainHand) {
          this.player.addItem(lootInventory.equipment.mainHand);
        }
      }

      // Clear the temporary storage
      (window as any).__lootRunInventory = null;
    }
  }

  public update(time: Ticker) {
    const deltaTime = time.deltaTime / 60; // Convert to seconds (assuming 60 FPS target)

    // Only allow player movement if stash is NOT open
    if (!this.stashUI.visible) {
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

      // Update helicopter
      this.helicopter.update(deltaTime);
      this.helicopter.checkPlayerProximity(this.player.x, this.player.y);

      // Update stash
      this.stash.checkPlayerProximity(this.player.x, this.player.y);
    } else {
      // Stop player movement when stash is open
      this.player.setMovement(0, 0);
    }

    // Update inventory UI
    this.inventoryText.text = `Inventory: ${this.player.getInventoryCount()}/${this.player.getTotalSlots()}`;

    if (this.inventoryUI.visible) {
      this.updateInventoryUI();
    }

    // Update camera to follow player
    this.updateCamera();
  }

  private updateCamera() {
    // Center camera on player, but don't go out of world bounds
    const screenWidth = engine().screen.width;
    const screenHeight = engine().screen.height;

    let targetX = -this.player.x + screenWidth / 2;
    let targetY = -this.player.y + screenHeight / 2;

    // Clamp camera to world bounds
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

  private updateInventoryUI() {
    this.inventoryUI.updateInventory(
      this.player.equipment,
      this.player.backpack
    );
  }

  public async pause() {
    // Paused - no updates
  }

  public async resume() {
    // Resumed
  }

  public reset() {
    // Reset game state
  }

  public resize(width: number, height: number) {
    // UI elements position
    this.inventoryText.x = 20;
    this.inventoryText.y = 20;

    // Center inventory UI
    this.inventoryUI.x = (width - 600) / 2;
    this.inventoryUI.y = (height - 700) / 2;
  }

  public async show(): Promise<void> {
    // Show animation if needed
    // Re-register input handlers when screen is shown
    this.inputController.onKeyDown("e", () => this.tryInteract());
    this.inputController.onKeyDown("tab", () => this.toggleInventory());

    // Load and update inventories
    this.player.loadInventory();
    this.stashItems = PersistentStorage.loadStash();
  }

  public async hide() {
    // Hide animation if needed
    // Remove input handlers to prevent interference with other screens
    this.inputController.removeKeyCallback("e");
    this.inputController.removeKeyCallback("tab");

    // Save inventories
    this.player.saveInventory();
    PersistentStorage.saveStash(this.stashItems);
  }

  public blur() {
    // Window lost focus
  }

  public getPlayer(): Player {
    return this.player;
  }

  public destroy() {
    this.inputController.destroy();
    super.destroy();
  }
}
