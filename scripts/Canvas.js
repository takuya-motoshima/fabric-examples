/**
 * Canvas editing module.
 */
export default class {

  /**
   * Initialize the module.
   */
  constructor(options) {
    // Initialize options.
    options = Object.assign({canvasEl: 'canvas', linewidthEl: 'linewidth'}, options);

    // Wrapper element.
    this.wrapper = $(`#${options.canvasEl}`).parent();
    console.log('this.wrapper=', this.wrapper);

    // fabric object.
    this.canvas = new fabric.Canvas(options.canvasEl, {selection: false, editable: false});

    // Line thickness input element.
    this.linewidthEl = $(`#${options.linewidthEl}`);

    // Initialization of the line drawing process.
    this._initDrawLine();

    // Initialize the cursor to be displayed on the canvas.
    this._initCursor();

    // Initialize the cursor to be displayed on the canvas.
    this.isundo = false;

    // True if Redo operation was performed immediately before.
    this.isredo = false;

    // Stack of modified image information.
    this.stack = [];

    // Monitor the operation of adding objects to the canvas.
    this.canvas.on('object:added', () => {
      if (!this.isredo) this.stack.length = 0;
      this.isredo = false;
      this.handles.added();
    });

    // Event handler.
    this.handles = {};
  }

  /**
   * Set event.
   */
  on(type, callback) {
    this.handles[type] = callback;
  }

  /**
   * Draw canvas image.
   */
  async draw(url) {
    // Image MimeType.
    this.mimetype = url.split('.').pop();
    console.log(`Mimetype: ${this.mimetype}`);

    // file name.
    this.filename = url.split("/").pop();
    console.log(`Filename: ${this.filename}`);

    // The crossOrigin attribute is required to edit images of other domains with Canvas and output (canvas # toDataURL).
    const img = new Image();
    img.crossOrigin  = 'use-credentials';
    img.src = url;
    await new Promise(resolve => $(img).on('load', resolve));

    // Draw image on canvas.
    this.canvas
      .remove(...this.canvas.getObjects())
      .setDimensions({ width: img.width, height: img.height })
      .setBackgroundImage(new fabric.Image(img))
      .renderAll();
  }

  /**
   * Download canvas image.
   */
  download() {
    const dataURL = this.canvas.toDataURL({format: this.mimetype, left: 0, top: 0});
    const bin = atob(dataURL.split(',')[1]);
    const buffer = new Uint8Array(bin.length);
    for (let i=0; i<bin.length; i++)
      buffer[i] = bin.charCodeAt(i);
    const blob = new Blob([buffer.buffer], {type: `image/${this.mimetype}`});
    const link = $('<a />', {href: URL.createObjectURL(blob), download: this.filename});
    link.get(0).click();
  }

  /**
   * Undo.
   */
  undo() {
    if (!this.canvas._objects.length) return false;
    this.isundo = true;
    this.stack.push(this.canvas._objects.pop());
    this.canvas.renderAll();
    return true;
  }

  /**
   * Redo.
   */
  redo() {
    if (!this.hasStack()) return false;
    this.isredo = true;
    this.isundo = false;
    this.canvas.add(this.stack.pop());
    return true;
  }

  /**
   * Reset.
   */
  reset() {
    // this.canvas.clear();
    this.canvas.remove(...this.canvas.getObjects());
    this.isundo = false;
    this.isredo = false;
    this.stack.length = 0;

  }

  /**
   * Returns TRUE if a stack exists.
   */
  hasStack() {
    return this.stack.length > 0;
  }

  /**
   * Returns TRUE if there is a drawing object..
   */
  hasDrawingObject() {
    return this.canvas._objects.length > 0;
  }

  /**
   * Initialization of the line drawing process..
   */
  _initDrawLine() {
    const canvas = this.canvas;
    let line = undefined;
    let active = false;
    canvas
      .on('mouse:down', o => {
        active = true;
        const pointer = canvas.getPointer(o.e);
        const points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
        line = new fabric.Line(points, {
          strokeWidth: parseInt(this.linewidthEl.val(), 10),
          fill: 'black',
          stroke: 'black',
          originX: 'center',
          originY: 'center'
        });
        canvas.add(line);
      })
      .on('mouse:move', o => {
        if (!active) return;
        const { x: x2, y: y2 } = canvas.getPointer(o.e);
        line.set({ x2, y2 });
        canvas.renderAll();
      })
      .on('mouse:up', o => active = false);
  }

  /**
   * Initialize the cursor to be displayed on the canvas.
   */
  _initCursor() {
    const stage = $(this.canvas.getElement()).parent();
    const cursor = $('<div />', { class: 'cursor' }).appendTo(stage);
    const follow = $('<div />', { class: 'follow' }).appendTo(stage);
    stage
      .on('mouseenter', () => stage.addClass('active'))
      .on('mouseleave', () => stage.removeClass('active'))
      .on('mousemove', event => {
        const { left, top } = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - left;
        const y = event.clientY - top;
        cursor.css('transform', `translate(${x}px, ${y}px)`);
        follow.css('transform', `translate(${x}px, ${y}px)`);
      })
      .on('wheel', event => {
        event.preventDefault();
        let value = parseInt(this.linewidthEl.val(), 10) + (event.originalEvent.wheelDelta > 0 ? 1 : -1);
        const min = parseInt(this.linewidthEl.attr('min'), 10);
        const max = parseInt(this.linewidthEl.attr('max'), 10);
        if (min > value) value = min;
        else if (max < value) value = max;
        this.linewidthEl.val(value);
        follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
      });
    const value = parseInt(this.linewidthEl.val(), 10);
    follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
  }
}