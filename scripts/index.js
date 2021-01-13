import Canvas from './Canvas.js';

(async () => {

  /**
   * Undo all edits on the canvas.
   */
  function reset() {
    canvas.reset();
    undoBtn.prop('disabled', true);
    redoBtn.prop('disabled', true);
  }

  /**
   * Undo.
   */
  function undo() {
    if (!canvas.undo()) return;
    undoBtn.prop('disabled', !canvas.hasDrawingObject());
    redoBtn.prop('disabled', !canvas.hasStack());
  }

  /**
   * Redo.
   */
  function redo() {
    if (!canvas.redo()) return;
    redoBtn.prop('disabled', !canvas.hasStack());
  }

  /**
   * Save.
   */
  function save(e) {
    if (e) e.preventDefault();
    alert('The image was saved.');
  }

  /**
   * Upload image.
   */
  function upload(e) {
    if (e) e.preventDefault();
    const input = $('<input />', { type: 'file', accept: 'image/*' }).on('change', async e => {
      const  file = e.currentTarget.files[0];
      input.val('');
      const dataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        $(reader).on('load', () => resolve(reader.result));
        reader.readAsDataURL(file);
      });
      reset();
      await canvas.drawCanvas(dataUrl);
    });
    input.trigger('click');
  }

  // Main procedure.
  $('[data-toggle="tooltip"]').tooltip()
  const canvas = new Canvas();
  canvas.on('added', () => {
    if (canvas.isUndo) redoBtn.prop('disabled', true);
    undoBtn.prop('disabled', false);
  });
  await canvas.drawCanvas('media/photo.png');
  const undoBtn = $('[on-undo]:first');
  const redoBtn = $('[on-redo]:first');
  $(document)
    .on('keydown', null, 'Ctrl+0', () => reset())
    .on('keydown', null, 'Ctrl+z', () => undo())
    .on('keydown', null, 'Ctrl+y', () => redo())
    .on('keydown', null, 'Ctrl+s', e => save(e))
    .on('keydown', null, 'Ctrl+u', e => upload(e))
    .on('click', '[on-reset]', () => reset())
    .on('click', '[on-undo]', () => undo())
    .on('click', '[on-save]', () => save())
    .on('click', '[on-upload]', () => upload());

   window.canvas = canvas;

})();