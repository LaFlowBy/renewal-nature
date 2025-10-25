# Stash System Implementation

## Overview
The stash system provides persistent storage for items in the main game world. It features 200 slots and uses browser localStorage to persist data across page reloads.

## Features Implemented

### 1. Persistent Storage (`src/app/utils/PersistentStorage.ts`)
- **localStorage wrapper** for saving/loading game data
- **Three storage keys**:
  - `renewal_nature_player_backpack` - Player's 20-slot backpack
  - `renewal_nature_player_equipment` - Player's equipped items (helmet, body armor, main hand)
  - `renewal_nature_stash` - 200-slot stash storage
- **Methods**:
  - `savePlayerBackpack()` / `loadPlayerBackpack()` - Save/load player backpack
  - `savePlayerEquipment()` / `loadPlayerEquipment()` - Save/load equipped items
  - `saveStash()` / `loadStash()` - Save/load stash items
  - `clearAll()` - Clear all saved data (for debugging)

### 2. Stash Entity (`src/app/game/Stash.ts`)
- **Visual representation** - Green storage container in game world
- **Proximity detection** - Shows "Press E to access Stash" when player is within 80px
- **Position** - Placed at `(worldWidth/2 - 250, worldHeight/2 - 100)` in main world

### 3. Stash UI (`src/app/ui/StashUI.ts`)
- **200-slot grid** - 10 columns × 20 rows
- **50px slots** - Larger than inventory slots for better visibility
- **Color-coded items** by type:
  - Helmet: 0x4444FF (blue)
  - BodyArmor: 0x44FF44 (green)
  - Weapon: 0xFF4444 (red)
  - Seed: 0xFFFF44 (yellow)
  - MachinePart: 0xFF44FF (magenta)
  - Component: 0x44FFFF (cyan)
  - Resource: 0xFFFFFF (white)
- **Item display** - Shows item name and quantity
- **Slot highlighting** - Yellow border on selected slot for navigation

### 4. Player Integration (`src/app/game/Player.ts`)
- **loadInventory()** - Loads backpack and equipment from localStorage on game start
- **saveInventory()** - Saves backpack and equipment to localStorage
- Called automatically in constructor and after inventory changes

### 5. GameWorld Integration (`src/app/screens/GameWorld.ts`)
- **Stash entity** added to world near player spawn
- **StashUI** added to UI container
- **E key interaction**:
  - If near stash → opens stash UI
  - If near helicopter → starts loot run
  - If stash is already open → closes stash UI
- **Arrow key navigation** when stash is open (Up/Down/Left/Right)
- **Enter key** - Take item from stash to player inventory
- **F key** - Store item from player to stash (prioritizes main hand → body armor → helmet → backpack)
- **Movement lock** - Player cannot move when stash UI is open
- **Auto-save on close** - Stash is saved to localStorage when closed
- **Auto-load on show** - Stash and player inventory loaded from localStorage when screen is shown
- **Auto-save on hide** - Both stash and player inventory saved when leaving screen

### 6. Input Controller Update (`src/app/game/InputController.ts`)
- Added **Enter key** to preventDefault list to prevent browser default behavior

## Controls

### Main World
- **WASD / Arrow Keys** - Move player (disabled when stash is open)
- **E** - Interact with stash or helicopter
- **Tab** - Toggle player inventory (disabled when stash is open)

### Stash UI (when open)
- **Arrow Keys** - Navigate between 200 slots (Up/Down/Left/Right with wrapping)
- **Enter** - Take selected item from stash to player inventory
- **F** - Store item from player to stash
- **E** - Close stash UI

## Item Transfer Logic

### Taking from Stash (Enter key)
1. Get item at current slot index
2. Try to add to player inventory using `player.addItem()`
3. If successful, remove from stash and save both inventories
4. If player inventory full, show "Player inventory full!" message

### Storing to Stash (F key)
1. Check player equipment slots in priority order:
   - Main hand weapon
   - Body armor
   - Helmet
   - Last item in backpack
2. Remove item from player inventory
3. Add to stash (if stash has space < 200 items)
4. Save both inventories

## Persistence Flow

### On Game Start
1. `GameWorld.constructor()` creates all entities including stash
2. `GameWorld.constructor()` loads stash from localStorage: `PersistentStorage.loadStash()`
3. `Player.constructor()` calls `loadInventory()` to load player data

### During Gameplay
1. When stash is opened, current stash items are displayed
2. When items are transferred, both stash and player inventories are updated
3. When stash is closed, `PersistentStorage.saveStash()` is called

### On Screen Transitions
- **GameWorld.show()** - Loads both stash and player inventory
- **GameWorld.hide()** - Saves both stash and player inventory
- **LootRunWorld after extraction** - Saves player inventory before returning

### On Page Reload
1. Browser localStorage persists all data
2. On next load, `PersistentStorage.loadStash()` and `player.loadInventory()` restore state

## Storage Format

### Player Backpack
```json
[
  {"type": "Seed", "name": "Wheat Seed", "quantity": 5},
  {"type": "Resource", "name": "Iron Ore", "quantity": 10}
]
```

### Player Equipment
```json
{
  "helmet": {"type": "Helmet", "name": "Combat Helmet", "quantity": 1},
  "bodyArmor": {"type": "BodyArmor", "name": "Plate Carrier", "quantity": 1},
  "mainHand": {"type": "Weapon", "name": "AK-47", "quantity": 1}
}
```

### Stash
```json
[
  {"type": "MachinePart", "name": "Engine Part", "quantity": 1},
  {"type": "Component", "name": "Circuit Board", "quantity": 3}
]
```

## Testing Checklist

- [x] Stash appears in main world
- [x] "Press E to access Stash" prompt shows when near stash
- [x] E key opens stash UI
- [x] Arrow keys navigate stash slots
- [x] Enter key takes items from stash
- [x] F key stores items to stash
- [x] E key closes stash
- [x] Player cannot move when stash is open
- [x] Stash saves on close
- [x] Player inventory saves after loot run
- [ ] Stash items persist after page reload (needs testing)
- [ ] Player items persist after page reload (needs testing)
- [ ] Stash can hold exactly 200 items (needs testing)
- [ ] Item transfer handles full inventory gracefully (needs testing)

## Known Limitations

1. **No item stacking in stash** - Each item occupies one slot, even if quantities could be combined
2. **No drag-and-drop** - Only keyboard-based item transfer
3. **Store priority** - F key always takes from equipment/backpack in fixed order
4. **No stash sorting** - Items stay in the order they were added
5. **No item filtering** - Cannot search or filter stash items

## Future Enhancements

- Add item stacking in stash (combine same items)
- Add drag-and-drop support
- Add search/filter functionality
- Add sorting options (by type, name, quantity)
- Add item splitting (divide stacks)
- Add visual feedback for full inventory/stash
- Add sound effects for item transfer
- Add item tooltips showing stats/description
