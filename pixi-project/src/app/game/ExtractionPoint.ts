import { Container, Graphics, Text } from "pixi.js";

export class ExtractionPoint extends Container {
  private zone: Graphics;
  private progressCircle: Graphics;
  private statusText: Text;
  private radius = 60;
  private extractionTime = 10; // seconds
  private currentProgress = 0;
  private isExtracting = false;
  private onExtractionComplete?: () => void;

  constructor(x: number, y: number) {
    super();

    this.x = x;
    this.y = y;

    // Create extraction zone
    this.zone = new Graphics();
    this.zone.circle(0, 0, this.radius);
    this.zone.fill({ color: 0x00ff00, alpha: 0.2 });
    this.zone.stroke({ color: 0x00ff00, width: 3 });
    this.addChild(this.zone);

    // Progress circle
    this.progressCircle = new Graphics();
    this.addChild(this.progressCircle);

    // Status text
    this.statusText = new Text({
      text: "Extraction Zone",
      style: {
        fontSize: 18,
        fill: 0x00ff00,
        fontWeight: "bold",
      },
    });
    this.statusText.anchor.set(0.5);
    this.statusText.y = -80;
    this.addChild(this.statusText);
  }

  public checkPlayerInZone(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < this.radius;
  }

  public startExtraction(callback: () => void) {
    console.log("Starting extraction...");
    this.isExtracting = true;
    this.currentProgress = 0;
    this.onExtractionComplete = callback;
    this.updateStatusText();
  }

  public cancelExtraction() {
    this.isExtracting = false;
    this.currentProgress = 0;
    this.updateStatusText();
    this.updateProgressCircle();
  }

  public update(deltaTime: number, playerInZone: boolean) {
    if (!playerInZone && this.isExtracting) {
      console.log("Player left extraction zone, canceling...");
      this.cancelExtraction();
      return;
    }

    if (this.isExtracting && playerInZone) {
      this.currentProgress += deltaTime;
      console.log(
        `Extraction progress: ${this.currentProgress.toFixed(2)}/${this.extractionTime}`
      );

      if (this.currentProgress >= this.extractionTime) {
        console.log("Extraction time reached! Completing extraction...");
        this.completeExtraction();
      } else {
        this.updateStatusText();
        this.updateProgressCircle();
      }
    }
  }

  private updateStatusText() {
    if (this.isExtracting) {
      const remaining = Math.ceil(this.extractionTime - this.currentProgress);
      this.statusText.text = `Extracting... ${remaining}s`;
    } else {
      this.statusText.text = "Extraction Zone";
    }
  }

  private updateProgressCircle() {
    this.progressCircle.clear();

    if (this.isExtracting && this.currentProgress > 0) {
      const progress = this.currentProgress / this.extractionTime;
      const endAngle = -Math.PI / 2 + Math.PI * 2 * progress;

      this.progressCircle.moveTo(0, 0);
      this.progressCircle.arc(0, 0, this.radius + 5, -Math.PI / 2, endAngle);
      this.progressCircle.lineTo(0, 0);
      this.progressCircle.fill({ color: 0xffaa00, alpha: 0.5 });
    }
  }

  private completeExtraction() {
    console.log("Extraction completed! Calling callback...");
    this.isExtracting = false;
    this.currentProgress = 0;
    this.updateProgressCircle();

    if (this.onExtractionComplete) {
      console.log("Executing extraction complete callback");
      this.onExtractionComplete();
    } else {
      console.error("No extraction complete callback found!");
    }
  }

  public isCurrentlyExtracting(): boolean {
    return this.isExtracting;
  }
}
