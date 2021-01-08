(async () => {
  async function setupCanvas() {
    const canvas = new fabric.Canvas('canvas', {
      selection: false,
      editable: false
    });
    const img = new Image();
    img.src = 'photo.jpg';
    await new Promise(resolve => $(img).on('load', () => resolve(img)));
    canvas.setDimensions({
      width: img.width,
      height:img.height
    });
    canvas.setBackgroundImage(new fabric.Image(img));
    canvas.renderAll();
    setupLine(canvas);
    setupCursor();
    setShortcut(canvas);
    return canvas;
  }

  function setupCursor() {
    function setLineWidth(lineWidth = undefined) {
      if (!lineWidth) lineWidth = parseInt($lineWidth.val(), 10);
      $lineWidth.val(lineWidth);
      $lineWidthText.text(lineWidth);
      $follow.css({
        width: lineWidth,
        height: lineWidth,
        left: -lineWidth / 2,
        top: -lineWidth / 2
      });
    }
    const $stage = $('#stage');
    const $cursor = $('#cursor');
    const $follow = $('#follow');
    const $lineWidthText = $('#lineWidthText');
    $stage
      .on('mouseenter', () => $stage.addClass('active'))
      .on('mouseleave', () => $stage.removeClass('active'))
      .on('mousemove', event => {
        const { left, top } = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - left;
        const y = event.clientY - top;
        $cursor.css('transform', `translate(${x}px, ${y}px)`);
        $follow.css('transform', `translate(${x}px, ${y}px)`);
      })
      .on('wheel', event => {
        event.preventDefault();
        let lineWidth = parseInt($lineWidth.val(), 10) + (event.originalEvent.wheelDelta > 0 ? 1 : -1);
        let min = parseInt($lineWidth.attr('min'), 10);
        let max = parseInt($lineWidth.attr('max'), 10);
        if (min > lineWidth) lineWidth = min;
        else if (max < lineWidth) lineWidth = max;
        setLineWidth(lineWidth);
      });
    setLineWidth();
  }

  function setupLine(canvas) {
    let line = undefined;
    let isDown = false;
    canvas.on('mouse:down', o => {
      isDown = true;
      const pointer = canvas.getPointer(o.e);
      const points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
      line = new fabric.Line(points, {
        strokeWidth: parseInt($lineWidth.val(), 10),
        fill: 'black',
        stroke: 'black',
        originX: 'center',
        originY: 'center'
      });
      canvas.add(line);
    });
    canvas.on('mouse:move', o => {
      if (!isDown) return;
      const pointer = canvas.getPointer(o.e);
      line.set({
        x2: pointer.x,
        y2: pointer.y
      });
      canvas.renderAll();
    });
    canvas.on('mouse:up', o => {
      isDown = false;
    });
  }

  function setShortcut(canvas) {
    function reset() {
      canvas.remove(...canvas.getObjects());
      isUndo = false;
      isRedo = false;
      stack.length = 0;
      $undo.prop('disabled', true);
      $redo.prop('disabled', true);
    }

    function undo() {
      if (!canvas._objects.length) return;
      isUndo = true;
      stack.push(canvas._objects.pop());
      canvas.renderAll();
      $undo.prop('disabled', !canvas._objects.length);
      $redo.prop('disabled', !stack.length);
    }

    function redo() {
      if (!stack.length) return;
      isRedo = true;
      isUndo = false;
      canvas.add(stack.pop());
      $redo.prop('disabled', !stack.length);
    }

    function save() {
      alert('保存しました。');
    }

    const stack = [];
    let isUndo = false;
    let isRedo = false;
    const $undo = $('[action-undo]:first');
    const $redo = $('[action-redo]:first');
    canvas.on('object:added', () => {
      if (!isRedo) stack.length = 0;
      if (isUndo) $redo.prop('disabled', true);
      isRedo = false;
      $undo.prop('disabled', false);
    });
    $(document)
      .on('keydown', null, 'Ctrl+0', () => reset())
      .on('keydown', null, 'Ctrl+z', () => undo())
      .on('keydown', null, 'Ctrl+y', () => redo())
      .on('keydown', null, 'Ctrl+s', () => save())
      .on('click', '[action-reset]', () => reset())
      .on('click', '[action-undo]', () => undo())
      .on('click', '[action-save]', () => save());
  }

  const $lineWidth = $('#lineWidth');
  $('[data-toggle="tooltip"]').tooltip()
  const canvas = await setupCanvas();
  window.canvas = canvas;
})();
