/**
 * q5.js
 */
export abstract class Q5 {
  /**
   * The parent element.
   */
  private _el: HTMLElement;

  /**
   * The canvas element.
   */
  private _canvas?: HTMLCanvasElement;

  /**
   * The 2D context.
   */
  private _context?: CanvasRenderingContext2D | null;

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
    if (this._canvas?.isConnected) {
      const now = performance.now();

      if ((now - time) / (1000 / this._frameRate) >= 1) {
        this.draw();

        requestAnimationFrame(() => this._loop(now - (now - time) % (1000 / this._frameRate)));
      } else {
        requestAnimationFrame(() => this._loop(time));
      }
    }
  }

  /**
   * Create the canvas element.
   */
  createCanvas(width: number, height: number) {
    // create canvas element
    this._canvas = document.createElement('canvas');

    // get 2d context
    this._context = this._canvas.getContext('2d');

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
        // set canvas size as integer
        Object.assign(this._canvas, { [key]: Math.ceil(value) });

        // set canvas style
        this._canvas.style.setProperty(key, `${value}px`);
      }
    });

    if (!noRedraw) {
      this.draw();
    }
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
    if (this._context && this._canvas) {
      // fill
      this._context.fillStyle = color;
      this._context.fillRect(
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
    if (this._context) {
      // set line path
      this._context.beginPath();
      this._context.moveTo(x1, y1);
      this._context.lineTo(x2, y2);

      // stroke
      this._context.strokeStyle = this._stroke;
      this._context.stroke();
    }
  }

  /**
   * Draw the rectangle.
   */
  rect(x: number, y: number, width: number, height: number, radius?: number) {
    if (this._context) {
      // set rectangle path
      this._context.beginPath();
      this._context.roundRect(x, y, width, height, radius);

      // fill
      this._context.fillStyle = this._fill;
      this._context.fill();

      // stroke
      this._context.strokeStyle = this._stroke;
      this._context.stroke();
    }
  }

  /**
   * Draw the text.
   */
  text(text: string, x: number, y: number) {
    if (this._context) {
      // set font
      this._context.font = [
        this._textSize,
        this._textFont,
      ].join('px ');

      // fill
      this._context.fillStyle = this._fill;
      this._context.fillText(text, x, y);

      // stroke
      this._context.strokeStyle = this._stroke;
      this._context.strokeText(text, x, y);
    }
  }
}
