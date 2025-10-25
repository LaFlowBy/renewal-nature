import type { EquipmentSlots, InventoryItem } from "../game/InventoryItem";

const STORAGE_KEYS = {
  PLAYER_BACKPACK: "renewal_nature_player_backpack",
  PLAYER_EQUIPMENT: "renewal_nature_player_equipment",
  STASH: "renewal_nature_stash",
};

export class PersistentStorage {
  /**
   * Save player backpack to localStorage
   */
  public static savePlayerBackpack(backpack: InventoryItem[]): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PLAYER_BACKPACK,
        JSON.stringify(backpack)
      );
    } catch (error) {
      console.error("Failed to save player backpack:", error);
    }
  }

  /**
   * Load player backpack from localStorage
   */
  public static loadPlayerBackpack(): InventoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYER_BACKPACK);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load player backpack:", error);
      return [];
    }
  }

  /**
   * Save player equipment to localStorage
   */
  public static savePlayerEquipment(equipment: EquipmentSlots): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.PLAYER_EQUIPMENT,
        JSON.stringify(equipment)
      );
    } catch (error) {
      console.error("Failed to save player equipment:", error);
    }
  }

  /**
   * Load player equipment from localStorage
   */
  public static loadPlayerEquipment(): EquipmentSlots {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYER_EQUIPMENT);
      return data
        ? JSON.parse(data)
        : { helmet: null, bodyArmor: null, mainHand: null };
    } catch (error) {
      console.error("Failed to load player equipment:", error);
      return { helmet: null, bodyArmor: null, mainHand: null };
    }
  }

  /**
   * Save stash to localStorage
   */
  public static saveStash(stash: InventoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STASH, JSON.stringify(stash));
    } catch (error) {
      console.error("Failed to save stash:", error);
    }
  }

  /**
   * Load stash from localStorage
   */
  public static loadStash(): InventoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STASH);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load stash:", error);
      return [];
    }
  }

  /**
   * Clear all saved data (for debugging/reset)
   */
  public static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.PLAYER_BACKPACK);
      localStorage.removeItem(STORAGE_KEYS.PLAYER_EQUIPMENT);
      localStorage.removeItem(STORAGE_KEYS.STASH);
      console.log("All save data cleared!");
    } catch (error) {
      console.error("Failed to clear save data:", error);
    }
  }
}
