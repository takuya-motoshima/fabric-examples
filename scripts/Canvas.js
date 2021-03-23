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
    this._wrapper = $(`#${options.canvasEl}`).parent();

    // fabric object.
    this._canvas = new fabric.Canvas(options.canvasEl, {selection: false, editable: false});

    // Added canvas to global object for debugging.
    globalThis.canvas = this._canvas;

    // Line thickness input element.
    this._linewidthEl = $(`#${options.linewidthEl}`);

    // If the actual dimensions of the Canvas are larger than the apparent size, increase the line width.
    this._lineScale = 1;

    // Initialization of the line drawing process.
    this._initDrawLine();

    // Initialize the cursor to be displayed on the canvas.
    this._initCursor();

    // Initialize the cursor to be displayed on the canvas.
    this._isUndo = false;

    // True if Redo operation was performed immediately before.
    this._isRedo = false;

    // Stack of modified image information.
    this._stack = [];

    // Monitor the operation of adding objects to the canvas.
    this._canvas.on('object:added', () => {
      if (!this._isRedo) this._stack.length = 0;
      this._isRedo = false;
      this._handles.added();
    });

    // Event handler.
    this._handles = {};
  }

  /**
   * Set event.
   */
  on(type, callback) {
    this._handles[type] = callback;
  }

  /**
   * Draw canvas image.
   */
  async draw(url) {
    // Image MimeType.
    this.mimetype = url.split('.').pop();
    // console.log(`Mimetype: ${this.mimetype}`);

    // file name.
    this.filename = url.split("/").pop();
    // console.log(`Filename: ${this.filename}`);

    // The crossOrigin attribute is required to edit images of other domains with Canvas and output (canvas # toDataURL).
    const img = new Image();
    img.crossOrigin  = 'use-credentials';
    img.src = url;
    await new Promise(resolve => $(img).on('load', resolve));

    // Calculate the image size that fits in the window.
    const wrapperWidth = this._wrapper.width();
    const wrapperHeight = this._wrapper.height();
    const imgWidth = img.width;
    const imgHeight = img.height;
    let cssWidth = imgWidth;
    let cssHeight = imgHeight;
    // console.log(`Wrapper width: ${wrapperWidth}`);
    // console.log(`Wrapper height: ${wrapperHeight}`);
    // console.log(`Img width: ${imgWidth}`);
    // console.log(`Img height: ${imgHeight}`);
    if (imgWidth > wrapperWidth || imgHeight > wrapperHeight) {
      if (imgWidth > imgHeight) {
        // If the image is landscape.
        cssWidth = wrapperWidth;
        cssHeight = imgHeight * wrapperWidth / imgWidth;
      } else {
        // If the image is portrait.
        cssWidth = imgWidth * wrapperHeight / imgHeight;
        cssHeight = wrapperHeight;
      }
    }
    // console.log(`CSS width: ${cssWidth}`);
    // console.log(`CSS height: ${cssHeight}`);

    // Draw image on canvas.
    this._canvas
      .remove(...this._canvas.getObjects())
      .setBackgroundImage(new fabric.Image(img))
      .setDimensions({width: imgWidth, height: imgHeight}, {backstoreOnly: true})
      // .setDimensions({width: cssWidth, height: cssHeight}, {cssOnly: true})
      .renderAll();
    // I couldn't change the canvas CSS size with setDimensions (cssOnly: true) in fabric.js, so set the CSS size directly.
    $(this._canvas.lowerCanvasEl).css({width: cssWidth, height: cssHeight});
    $(this._canvas.upperCanvasEl).css({width: cssWidth, height: cssHeight});
    $(this._canvas.wrapperEl).css({width: cssWidth, height: cssHeight});

    // Set line width scale.
    this._lineScale = imgWidth / cssWidth;
    // console.log(`LineScale: ${this._lineScale}`);
  }

  /**
   * Download canvas image.
   */
  download() {
    const dataURL = this._canvas.toDataURL({format: this.mimetype, left: 0, top: 0});
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
    if (!this._canvas._objects.length) return false;
    this._isUndo = true;
    this._stack.push(this._canvas._objects.pop());
    this._canvas.renderAll();
    return true;
  }

  /**
   * Redo.
   */
  redo() {
    if (!this.hasStack()) return false;
    this._isRedo = true;
    this._isUndo = false;
    this._canvas.add(this._stack.pop());
    return true;
  }

  /**
   * Reset.
   */
  reset() {
    // this.canvas.clear();
    this._canvas.remove(...this._canvas.getObjects());
    this._isUndo = false;
    this._isRedo = false;
    this._stack.length = 0;

  }

  /**
   * Returns TRUE if a stack exists.
   */
  hasStack() {
    return this._stack.length > 0;
  }

  /**
   * Returns TRUE if there is a drawing object..
   */
  hasDrawingObject() {
    return this._canvas._objects.length > 0;
  }

  /**
   * Initialization of the line drawing process..
   */
  _initDrawLine() {
    const canvas = this._canvas;
    let line = undefined;
    let active = false;
    canvas
      .on('mouse:down', o => {
        active = true;
        const pointer = canvas.getPointer(o.e);
        const points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
        line = new fabric.Line(points, {
          strokeWidth: parseInt(this._linewidthEl.val(), 10) * this._lineScale,
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
    const stage = $(this._canvas.getElement()).parent();
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
        let value = parseInt(this._linewidthEl.val(), 10) + (event.originalEvent.wheelDelta > 0 ? 1 : -1);
        const min = parseInt(this._linewidthEl.attr('min'), 10);
        const max = parseInt(this._linewidthEl.attr('max'), 10);
        if (min > value) value = min;
        else if (max < value) value = max;
        this._linewidthEl.val(value);
        follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
      });
    const value = parseInt(this._linewidthEl.val(), 10);
    follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
  }
}