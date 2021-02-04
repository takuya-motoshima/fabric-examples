export default class {

  constructor(options) {

    // Initialize options.
    options = Object.assign({
      id: 'canvas',
      lineWidthInputId: 'lineWidth'
    }, options);

    // fabric object.
    window.canvas = this.canvas = new fabric.Canvas(options.id, {
      selection: false,
      editable: false
    });

    // Line thickness input element.
    this.lineWidth = $(`#${options.lineWidthInputId}`);

    // Initialization of the line drawing process.
    this.initDrawLine();

    // Initialize the cursor to be displayed on the canvas.
    this.initCursor();

    // Initialize the cursor to be displayed on the canvas.
    this.isUndo = false;

    // True if Redo operation was performed immediately before.
    this.isRedo = false;

    // Stack of modified image information.
    this.stack = [];

    // Monitor the operation of adding objects to the canvas.
    this.canvas.on('object:added', () => {
      if (!this.isRedo) this.stack.length = 0;
      this.isRedo = false;
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
   * Initialization of the line drawing process..
   */
  initDrawLine() {
    const canvas = this.canvas;
    let line = undefined;
    let active = false;
    canvas
      .on('mouse:down', o => {
        active = true;
        const pointer = canvas.getPointer(o.e);
        const points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
        line = new fabric.Line(points, {
          strokeWidth: parseInt(this.lineWidth.val(), 10),
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
  initCursor() {
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
        let value = parseInt(this.lineWidth.val(), 10) + (event.originalEvent.wheelDelta > 0 ? 1 : -1);
        const min = parseInt(this.lineWidth.attr('min'), 10);
        const max = parseInt(this.lineWidth.attr('max'), 10);
        if (min > value) value = min;
        else if (max < value) value = max;
        this.lineWidth.val(value);
        follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
      });
    const value = parseInt(this.lineWidth.val(), 10);
    follow.css({ width: value, height: value, left: -value / 2, top: -value / 2 });
  }

  /**
   * Draw canvas image.
   */
  async draw(url) {
    const img = new Image();
    img.src = url;
    await new Promise(resolve => $(img).on('load', resolve));
    this.canvas
      .remove(...this.canvas.getObjects())
      .setDimensions({ width: img.width, height: img.height })
      .setBackgroundImage(new fabric.Image(img))
      .renderAll();
  }

  /**
   * Undo.
   */
  undo() {
    if (!this.canvas._objects.length) return false;
    this.isUndo = true;
    this.stack.push(this.canvas._objects.pop());
    this.canvas.renderAll();
    return true;
  }

  /**
   * Redo.
   */
  redo() {
    if (!this.hasStack()) return false;
    this.isRedo = true;
    this.isUndo = false;
    this.canvas.add(this.stack.pop());
    return true;
  }

  /**
   * Reset.
   */
  reset() {
    // this.canvas.clear();
    this.canvas.remove(...this.canvas.getObjects());
    this.isUndo = false;
    this.isRedo = false;
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
}