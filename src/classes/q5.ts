/**
 * q5.js
 */
export abstract class q5 {
  /**
   * The parent element.
   */
  private _el: HTMLElement;

  /**
   * The canvas element.
   */
  private _canvas?: HTMLCanvasElement;

  /**
   * The frame rate.
   */
  private _frameRate = 60;

  /**
   * The fill color.
   */
  private _fill = '#000';

  /**
   * The stroke color.
   */
  private _stroke = '#000';

  /**
   * The text font.
   */
  private _textFont = 'sans-serif';

  /**
   * The text size.
   */
  private _textSize = 10;

  /**
   * @param el The parent element.
   */
  constructor(el = document.body) {
    this._el = el;
    this.setup();
    this._loop();
  }

  /**
   * Get the parent element.
   */
  get el() {
    return this._el;
  }

  /**
   * Get the canvas element.
   */
  get canvas() {
    return this._canvas;
  }

  /**
   * Get the 2D context.
   */
  get context() {
    return this._canvas?.getContext?.('2d');
  }

  /**
   * Setup.
   */
  abstract setup(): void;

  /**
   * Draw.
   */
  abstract draw(): void;

  /**
   * Loop.
   */
  private _loop(time = 0) {
    const now = Date.now();

    if ((now - time) / (1000 / this._frameRate) >= .8) {
      this.draw();

      requestAnimationFrame(() => this._loop(now));
    } else {
      requestAnimationFrame(() => this._loop(time));
    }
  }

  /**
   * Create the canvas element.
   */
  createCanvas(width: number, height: number) {
    // create canvas element
    this._canvas = document.createElement('canvas');

    // resize canvas element
    this.resizeCanvas(width, height, true);

    // append canvas element to parent element
    return this._el.appendChild(this._canvas);
  }

  /**
   * Resize the canvas element.
   */
  resizeCanvas(width: number, height: number, noRedraw = false) {
    Object.entries({ width, height }).forEach(([key, value]) => {
      if (this._canvas) {
        Object.assign(this._canvas, { [key]: Math.ceil(value) });
      }
    });

    if (!noRedraw) {
      this.draw();
    }
  }

  /**
   * Remove the canvas element.
   */
  remove() {
    this._canvas?.remove?.();
    this._canvas = undefined;
  }

  /**
   * Set the frame rate.
   */
  frameRate(frameRate: number) {
    this._frameRate = frameRate;
  }

  /**
   * Set the fill color.
   */
  fill(color: string) {
    this._fill = color;
  }

  /**
   * Set the fill color to transparent.
   */
  noFill() {
    this.fill('transparent');
  }

  /**
   * Set the stroke color.
   */
  stroke(color: string) {
    this._stroke = color;
  }

  /**
   * Set the stroke color to transparent.
   */
  noStroke() {
    this.stroke('transparent');
  }

  /**
   * Set the text font.
   */
  textFont(textFont: string) {
    this._textFont = textFont;
  }

  /**
   * Set the text size.
   */
  textSize(textSize: number) {
    this._textSize = textSize;
  }

  /**
   * Set the background color.
   */
  background(color: string) {
    if (this.context && this._canvas) {
      // fill
      this.context.fillStyle = color;
      this.context.fillRect(
        0,
        0,
        this._canvas.width,
        this._canvas.height,
      );
    }
  }

  /**
   * Draw the line.
   */
  line(x1: number, y1: number, x2: number, y2: number) {
    if (this.context) {
      // set line path
      this.context.beginPath();
      this.context.moveTo(x1, y1);
      this.context.lineTo(x2, y2);

      // stroke
      this.context.strokeStyle = this._stroke;
      this.context.stroke();
    }
  }

  /**
   * Draw the rectangle.
   */
  rect(x: number, y: number, width: number, height: number, radius?: number) {
    if (this.context) {
      // set rectangle path
      this.context.beginPath();
      this.context.roundRect(x, y, width, height, radius);

      // fill
      this.context.fillStyle = this._fill;
      this.context.fill();

      // stroke
      this.context.strokeStyle = this._stroke;
      this.context.stroke();
    }
  }

  /**
   * Draw the text.
   */
  text(text: string, x: number, y: number) {
    if (this.context) {
      // set font
      this.context.font = [
        this._textSize,
        this._textFont,
      ].join('px ');

      // fill
      this.context.fillStyle = this._fill;
      this.context.fillText(text, x, y);

      // stroke
      this.context.strokeStyle = this._stroke;
      this.context.strokeText(text, x, y);
    }
  }
}
