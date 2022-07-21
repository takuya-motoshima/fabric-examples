import loadImage from './loadImage.js';

export default class {
  #wrapper = null;
  #fabric = null;
  #lineThickness = null;
  #lineThicknessScale = 1;// If the actual dimensions of the Canvas are larger than the apparent size, increase the line width.
  #isUndo = false;
  #isRedo = false;
  #editHistoryStack = [];  // Stack of modified image information.
  #handles = {};
  #mime = null;

  /**
   * Initialize the module.
   */
  constructor(canvas, lineThickness) {
    this.#wrapper = canvas.parentElement;
    this.#lineThickness = lineThickness;
    this.#fabric = new fabric.Canvas(canvas, {selection: false, editable: false});

    // Initialize mask line.
    this.#initDrawLine();

    // Initialize the cursor to follow the mouse.
    this.#initCursor();

    // Monitor the operation of adding objects to the canvas.
    this.#fabric.on('object:added', () => {
      if (!this.#isRedo)
        this.#editHistoryStack.length = 0;
      this.#isRedo = false;
      this.#handles.added();
    });
  }

  /**
   * Draw canvas image.
   */
  async drawImage(imgUrl) {
    // Get MIME type.
    if (/^data:image\/[a-z]+;base64,..*$/.test(imgUrl))
      this.#mime = imgUrl.match(/^data:image\/([a-z]+);base64,..*$/)[1];
    else
      // In the case of URL.
      this.#mime = imgUrl.split('.').pop();
    
    // Load image.
    const img = await loadImage(imgUrl);

    // Calculate the size of the canvas on which the image fits.
    let canvasWidth = img.width;
    let canvasHeight = img.height;
    const wrapperWidth = this.#wrapper.clientWidth;
    const wrapperHeight = this.#wrapper.clientHeight;
    if (img.width > wrapperWidth || img.height > wrapperHeight) {
      // Calculate the dimensions of the canvas.
      canvasWidth = wrapperWidth;
      canvasHeight = wrapperHeight;
      if (img.width > img.height)
        canvasHeight = img.height * wrapperWidth / img.width;
      else
        canvasWidth = img.width * wrapperHeight / img.height;

      // Adjust to a height and width where the canvas does not overhang the wrapper.
      const ratio = Math.min(wrapperWidth / canvasWidth, wrapperHeight / canvasHeight);
      if (ratio < 1.) {
        canvasHeight *= ratio;
        canvasWidth *= ratio;
      }
    }
    // Draw an image on the canvas.
    this.#fabric
      .remove(...this.#fabric.getObjects())
      .setBackgroundImage(new fabric.Image(img))
      .setDimensions({width: img.width, height: img.height}, {backstoreOnly: true})
      .renderAll();

    // Apply the calculated dimensions to the canvas.
    this.#fabric.lowerCanvasEl.style.width = `${canvasWidth}px`;
    this.#fabric.lowerCanvasEl.style.height = `${canvasHeight}px`;
    this.#fabric.upperCanvasEl.style.width = `${canvasWidth}px`;
    this.#fabric.upperCanvasEl.style.height = `${canvasHeight}px`;
    this.#fabric.wrapperEl.style.width = `${canvasWidth}px`;
    this.#fabric.wrapperEl.style.height = `${canvasHeight}px`;

    // Set line width scale.
    this.#lineThicknessScale = img.width / canvasWidth;

    // Wait until the image has been rendered to the canvas.
    await new Promise(resolve => {
      this.#fabric.renderAll();
      resolve();
    });
  }

  /**
   * Save image.
   */
  saveImage() {
    // Data URL of the current image.
    const dataUrl = this.#fabric.toDataURL({format: this.#mime, left: 0, top: 0});

    // Get the data part of the data URL.
    const bin = atob(dataUrl.split(',')[1]);
    const buffer = new Uint8Array(bin.length);
    for (let i=0; i<bin.length; i++)
      buffer[i] = bin.charCodeAt(i);
    const blob = new Blob([buffer.buffer], {type: `image/${this.#mime}`});

    // Generate link for download.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `image.${this.#mime}`;
    link.click();

    // Release object URLs in memory.
    URL.revokeObjectURL(link.href);
  }

  /**
   * Undo one edit.
   */
  undoOneEdit() {
    if (!this.#fabric._objects.length)
      return false;
    this.#isUndo = true;
    this.#editHistoryStack.push(this.#fabric._objects.pop());
    this.#fabric.renderAll();
    return true;
  }

  /**
   * Redo one edit.
   */
  redoOneEdit() {
    if (!this.hasEditHistoryStack())
      return false;
    this.#isRedo = true;
    this.#isUndo = false;
    this.#fabric.add(this.#editHistoryStack.pop());
    return true;
  }

  /**
   * Undo all edits.
   */
  undoAllEdits() {
    // this.canvas.clear();
    this.#fabric.remove(...this.#fabric.getObjects());
    this.#isUndo = false;
    this.#isRedo = false;
    this.#editHistoryStack.length = 0;
  }

  /**
   * Is there an edit history?
   */
  hasEditHistoryStack() {
    return this.#editHistoryStack.length > 0;
  }

  /**
   * Returns TRUE if there is a drawing object..
   */
  hasDrawingObject() {
    return this.#fabric._objects.length > 0;
  }

  /**
   * Set event handler.
   */
  on(type, callback) {
    this.#handles[type] = callback;
  }

  /**
   * Did you undo the image just before?
   */
  get isUndo() {
    return this.#isUndo;
  }

  /**
   * Initialize mask line.
   */
  #initDrawLine() {
    let lineObject;
    let mouseDownInProgress = false;
    this.#fabric
      .on('mouse:down', o => {
        mouseDownInProgress = true;
        const pointer = this.#fabric.getPointer(o.e);
        lineObject = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          strokeWidth: parseInt(this.#lineThickness.value, 10) * this.#lineThicknessScale,
          fill: 'black',
          stroke: 'black',
          originX: 'center',
          originY: 'center'
        });
        this.#fabric.add(lineObject);
      })
      .on('mouse:move', o => {
        if (!mouseDownInProgress)
          return;
        const {x: x2, y: y2} = this.#fabric.getPointer(o.e);
        lineObject.set({x2, y2});
        this.#fabric.renderAll();
      })
      .on('mouse:up', () => mouseDownInProgress = false);
  }

  /**
   * Initialize the cursor to follow the mouse.
   */
  #initCursor() {
    // A pointer element that follows the mouse.
    const cursor = document.createElement('div');
    cursor.classList.add('cursor');
    this.#fabric.wrapperEl.appendChild(cursor);

    // Element that follows the pointer that follows the mouse.
    const follow = document.createElement('div');
    follow.classList.add('follow');
    this.#fabric.wrapperEl.appendChild(follow);

    // Mouse press event.
    this.#fabric.wrapperEl.addEventListener('mouseenter', () => {
      this.#fabric.wrapperEl.classList.add('active');
    }, {passive: true});

    // Mouse away event.
    this.#fabric.wrapperEl.addEventListener('mouseleave', () => {
      this.#fabric.wrapperEl.classList.remove('active');
    }, {passive: true});

    // Mouse movement event.
    this.#fabric.wrapperEl.addEventListener('mousemove', evnt => {
      const {left, top} = evnt.target.getBoundingClientRect();
      const x = evnt.clientX - left;
      const y = evnt.clientY - top;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      follow.style.transform = `translate(${x}px, ${y}px)`;
    }, {passive: true});

    // Mouse wheel event.
    this.#fabric.wrapperEl.addEventListener('wheel', evnt => {
      evnt.preventDefault();

      // Resize pointer.
      this.#resizePointer(follow, evnt);
    }, {passive: false});

    // Resize pointer.
    this.#resizePointer(follow);
  }

  /**
   * Resize pointer.
   */
  #resizePointer(follow, wheelEvnt = undefined) {
    // Calculate pointer dimensions.
    let size = parseInt(this.#lineThickness.value, 10);
    if (wheelEvnt)
      size += (wheelEvnt.wheelDelta > 0 ? 1 : -1);
    const min = parseInt(this.#lineThickness.min, 10);
    const max = parseInt(this.#lineThickness.max, 10);
    if (min > size)
      size = min;
    else if (max < size)
      size = max;
    if (wheelEvnt)
      this.#lineThickness.value = size;

    // Apply the result of the calculation to the pointer dimensions.
    follow.style.width = `${size}px`;
    follow.style.height = `${size}px`;
    follow.style.left = `${-size / 2}px`;
    follow.style.top = `${-size / 2}px`;
  }
}