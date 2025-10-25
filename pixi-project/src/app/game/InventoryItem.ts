export enum ItemType {
  Helmet = "helmet",
  BodyArmor = "bodyArmor",
  Weapon = "weapon",
  Resource = "resource",
  Seed = "seed",
  MachinePart = "machinePart",
  Component = "component",
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quantity: number;
  description?: string;
  icon?: string;
}

export interface EquipmentSlots {
  helmet: InventoryItem | null;
  bodyArmor: InventoryItem | null;
  mainHand: InventoryItem | null;
}
