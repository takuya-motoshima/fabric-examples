export default class {

  constructor(options) {
    options = Object.assign({
      id: 'canvas',
      lineWidthInputId: 'lineWidth'
    }, options);
    this.canvas = new fabric.Canvas(options.id, {
      selection: false,
      editable: false
    });
    this.lineWidth = $(`#${options.lineWidthInputId}`);
    this.drawLine();
    this.showCursor();
    this.isUndo = false;
    this.isRedo = false;
    this.stack = [];
    this.canvas.on('object:added', () => {
      if (!this.isRedo) this.stack.length = 0;
      this.isRedo = false;
      this.handles.added();
    });
    this.handles = {};
  }

  /**
   * Set event.
   */
  on(type, callback) {
    this.handles[type] = callback;
  }

  /**
   * Draw a line on the canvas.
   */
  drawLine() {
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
   * Show line width cursor.
   */
  showCursor() {
    const stage = $(this.canvas.getElement()).parent();
    const cursor = $('<div />', { class: 'cursor' }).appendTo(stage);
    const follow = $('<div />', { class: 'follow' }).appendTo(stage);
    stage
      .on('mouseenter', () => stage.addClass('active'))
      .on('mouseleave', () => stage.removeClass('active'))
      .on('mousemove', e => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        cursor.css('transform', `translate(${x}px, ${y}px)`);
        follow.css('transform', `translate(${x}px, ${y}px)`);
      })
      .on('wheel', e => {
        e.preventDefault();
        let value = parseInt(this.lineWidth.val(), 10) + (e.originalEvent.wheelDelta > 0 ? 1 : -1);
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
  async drawCanvas(url) {
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