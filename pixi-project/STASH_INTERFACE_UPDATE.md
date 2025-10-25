# Stash Interface Update - Dual Panel Design

## Overview
The stash interface has been updated to show both the player's inventory (left side) and the stash (right side) simultaneously, allowing for easy item transfers between them.

## New Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  INVENTORY & STASH                          Press E to close     │
│  Tab: Switch sides | Arrow keys: Navigate | Enter: Transfer item│
├─────────────────────────────┬───────────────────────────────────┤
│  YOUR INVENTORY             │  STASH (200 SLOTS)                │
│                             │                                   │
│  ┌──────┬──────┬──────┐    │  ┌───┬───┬───┬───┬───┬───┬───┐  │
│  │Helmet│Armor │Main  │    │  │   │   │   │   │   │   │   │  │
│  │      │      │Hand  │    │  ├───┼───┼───┼───┼───┼───┼───┤  │
│  └──────┴──────┴──────┘    │  │   │   │   │   │   │   │   │  │
│                             │  ├───┼───┼───┼───┼───┼───┼───┤  │
│  BACKPACK (4x5 = 20 slots) │  │  ... (10x20 = 200 slots)   │  │
│  ┌───┬───┬───┬───┐         │  │                             │  │
│  │   │   │   │   │         │  └───┴───┴───┴───┴───┴───┴───┘  │
│  ├───┼───┼───┼───┤         │                                   │
│  │   │   │   │   │         │                                   │
│  └───┴───┴───┴───┘         │                                   │
└─────────────────────────────┴───────────────────────────────────┘
```

## Controls

### Opening the Stash
- Walk to the green stash container in the main world
- Press **E** to open the stash interface

### Navigation
- **Tab** - Switch between inventory (left) and stash (right) panels
- **Arrow Keys** - Navigate through slots
  - In equipment: Left/Right to cycle through helmet → body armor → main hand
  - In equipment: Down to move to backpack
  - In backpack: Up from top row to go back to equipment
  - In backpack: Arrow keys navigate the 4×5 grid
  - In stash: Arrow keys navigate the 10×20 grid
- **Enter** - Transfer selected item
  - From stash → player inventory
  - From player inventory → stash
- **E** - Close the stash interface

### Visual Feedback
- **Yellow highlight** - Current selected slot on inventory side
- **Green highlight** - Current selected slot on stash side
- **Color-coded items**:
  - Blue: Helmet, Body Armor
  - Red: Weapons
  - Green: Seeds
  - Gray: Machine Parts
  - Orange: Components
  - White: Resources

## How It Works

### 1. Opening the Stash
When you press E near the stash:
- Both panels are displayed side by side
- Player inventory shows equipment (top) and backpack (bottom)
- Stash shows all 200 storage slots
- Focus starts on the stash side (right)
- First non-empty slot is automatically highlighted

### 2. Switching Sides
Press **Tab** to switch focus:
- **Inventory side (left)** - Yellow highlight appears
  - Starts at helmet equipment slot
  - Navigate with arrows
- **Stash side (right)** - Green highlight appears
  - Navigate through 200 slots
  - Slot positions persist when switching back

### 3. Transferring Items

#### From Stash to Player
1. Navigate to desired stash slot (right side)
2. Press **Enter**
3. Item moves to player inventory (auto-equips if applicable, otherwise goes to backpack)
4. If inventory is full, shows "Player inventory full!" message

#### From Player to Stash
1. Press **Tab** to switch to inventory (left side)
2. Navigate to desired equipment or backpack slot
3. Press **Enter**
4. Item moves from player to stash
5. If stash is full (200 items), shows "Stash is full!" message

### 4. Equipment vs Backpack
- Equipment items can be directly selected and transferred
- Backpack items are stored in a 4×5 grid
- Equipment slots show "Empty" when no item equipped
- All transfers automatically update both displays

## Technical Changes

### StashUI Component
- Now includes both inventory and stash displays
- Size increased from 800×700 to 1400×750
- Added `InventorySlotUI` class for backpack (20 slots)
- Added `EquipmentSlotUI` class for equipment (3 slots)
- Methods added:
  - `setPlayerInventory(backpack, equipment)` - Updates left side
  - `highlightInventorySlot(index)` - Highlights backpack slot
  - `highlightEquipmentSlot(type)` - Highlights equipment slot
  - `setFocusedSide(side)` - Changes active panel
  - `getFirstNonEmptyInventorySlotIndex()` - Finds first item in backpack

### GameWorld Updates
- New state variables:
  - `currentInventorySlotIndex` - Selected backpack slot (0-19)
  - `currentEquipmentSlot` - Selected equipment ("helmet" | "bodyArmor" | "mainHand")
  - `stashFocusedSide` - Which panel is active ("inventory" | "stash")
- New methods:
  - `switchStashSide()` - Handles Tab key to switch panels
  - `navigateStash(delta)` - Smart navigation based on active panel
  - `transferItem()` - Routes Enter key to appropriate transfer method
- Updated methods:
  - `openStash()` - Now updates both panels and registers Tab handler
  - `storeToStash()` - Works with selected slot instead of priority order
  - `takeFromStash()` - Updates both panels after transfer

### Input Handling
- Tab key now has dual purpose:
  - In main world: Toggle inventory UI
  - In stash interface: Switch between panels
- Enter key added to preventDefault list in InputController
- Arrow keys used for navigation in both panels

## Benefits

1. **Visual Clarity** - See both inventories at once, no guessing what you have
2. **Efficient Transfers** - Select exactly what you want to move
3. **Equipment Management** - Directly access equipment slots without priority system
4. **Better UX** - Tab to switch sides is intuitive, Enter to transfer is simple
5. **Persistent State** - Both inventories save automatically on transfer or close

## Future Enhancements

Potential improvements:
- Shift+Click for quick transfer
- Drag and drop support
- Search/filter in stash
- Sort options (by type, name, quantity)
- Item details tooltip on hover
- Bulk transfer selection (Ctrl+Click)
- Item comparison (compare equipment stats)
