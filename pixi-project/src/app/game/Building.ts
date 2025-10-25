import { Container, Graphics, Text } from "pixi.js";

export class Building extends Container {
  private building: Graphics;
  private door: Graphics;
  private doorX: number;
  private doorY: number;
  private doorWidth = 40;
  private doorHeight = 60;
  private isPlayerNear = false;
  private promptText: Text;
  public buildingWidth: number;
  public buildingHeight: number;
  public interiorBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  public isInterior = false;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    doorSide: "left" | "right" | "top" | "bottom" = "bottom"
  ) {
    super();

    this.x = x;
    this.y = y;
    this.buildingWidth = width;
    this.buildingHeight = height;

    // Calculate interior bounds (slightly smaller than building for walls)
    this.interiorBounds = {
      x: x + 10,
      y: y + 10,
      width: width - 20,
      height: height - 20,
    };

    // Create building rectangle
    this.building = new Graphics();
    this.building.rect(0, 0, width, height);
    this.building.fill({ color: 0x1a1a1a });
    this.building.stroke({ color: 0x444444, width: 3 });
    this.addChild(this.building);

    // Add windows
    const windowSize = 20;
    const windowSpacing = 40;
    for (
      let wx = windowSpacing;
      wx < width - windowSize;
      wx += windowSpacing + windowSize
    ) {
      for (
        let wy = windowSpacing;
        wy < height - windowSize;
        wy += windowSpacing + windowSize
      ) {
        this.building.rect(wx, wy, windowSize, windowSize);
        this.building.fill({ color: 0x222222 });
        this.building.stroke({ color: 0x666666, width: 1 });
      }
    }

    // Create door based on side
    switch (doorSide) {
      case "bottom":
        this.doorX = width / 2 - this.doorWidth / 2;
        this.doorY = height - this.doorHeight;
        break;
      case "top":
        this.doorX = width / 2 - this.doorWidth / 2;
        this.doorY = 0;
        break;
      case "left":
        this.doorX = 0;
        this.doorY = height / 2 - this.doorHeight / 2;
        break;
      case "right":
        this.doorX = width - this.doorWidth;
        this.doorY = height / 2 - this.doorHeight / 2;
        break;
    }

    this.door = new Graphics();
    this.door.rect(this.doorX, this.doorY, this.doorWidth, this.doorHeight);
    this.door.fill({ color: 0x4a2a0a }); // Brown door
    this.door.stroke({ color: 0x2a1a0a, width: 2 });

    // Add door handle
    const handleX = this.doorX + this.doorWidth - 10;
    const handleY = this.doorY + this.doorHeight / 2;
    this.door.circle(handleX, handleY, 4);
    this.door.fill({ color: 0xccaa00 });

    this.addChild(this.door);

    // Proximity text
    this.promptText = new Text({
      text: "Press E to enter",
      style: {
        fontSize: 14,
        fill: 0xffff00,
        fontWeight: "bold",
      },
    });
    this.promptText.anchor.set(0.5, 0.5);
    this.promptText.x = width / 2;
    this.promptText.y = -20;
    this.promptText.visible = false;
    this.addChild(this.promptText);
  }

  public checkPlayerProximity(playerX: number, playerY: number): boolean {
    // Calculate door position in world space
    const worldDoorX = this.x + this.doorX + this.doorWidth / 2;
    const worldDoorY = this.y + this.doorY + this.doorHeight / 2;

    const distance = Math.sqrt(
      Math.pow(playerX - worldDoorX, 2) + Math.pow(playerY - worldDoorY, 2)
    );

    this.isPlayerNear = distance < 80;
    this.promptText.visible = this.isPlayerNear;

    return this.isPlayerNear;
  }

  public getDoorWorldPosition(): { x: number; y: number } {
    return {
      x: this.x + this.doorX + this.doorWidth / 2,
      y: this.y + this.doorY + this.doorHeight / 2,
    };
  }

  public isPlayerInsideBuilding(playerX: number, playerY: number): boolean {
    return (
      playerX >= this.interiorBounds.x &&
      playerX <= this.interiorBounds.x + this.interiorBounds.width &&
      playerY >= this.interiorBounds.y &&
      playerY <= this.interiorBounds.y + this.interiorBounds.height
    );
  }

  public getInteriorSpawnPoint(): { x: number; y: number } {
    // Return a point just inside the door
    return {
      x: this.interiorBounds.x + this.interiorBounds.width / 2,
      y: this.interiorBounds.y + this.interiorBounds.height / 2,
    };
  }

  public getExteriorSpawnPoint(): { x: number; y: number } {
    // Return a point just outside the door
    const doorPos = this.getDoorWorldPosition();

    // Offset based on door position
    if (this.doorY === 0) {
      // Top door
      return { x: doorPos.x, y: doorPos.y - 60 };
    } else if (this.doorY === this.buildingHeight - this.doorHeight) {
      // Bottom door
      return { x: doorPos.x, y: doorPos.y + 60 };
    } else if (this.doorX === 0) {
      // Left door
      return { x: doorPos.x - 60, y: doorPos.y };
    } else {
      // Right door
      return { x: doorPos.x + 60, y: doorPos.y };
    }
  }
}
