import Editor from './Editor.js';

(async () => {

  /**
   * Undo all edits on the canvas.
   */
  function reset() {
    editor.reset();
    undoButton.prop('disabled', true);
    redoButton.prop('disabled', true);
  }

  /**
   * Undo.
   */
  function undo() {
    if (!editor.undo()) return;
    undoButton.prop('disabled', !editor.hasDrawingObject());
    redoButton.prop('disabled', !editor.hasStack());
  }

  /**
   * Redo.
   */
  function redo() {
    if (!editor.redo()) return;
    redoButton.prop('disabled', !editor.hasStack());
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
      await editor.draw(dataUrl);
    });
    input.trigger('click');
  }

  // Main procedure.
  $('[data-toggle="tooltip"]').tooltip()
  const editor = new Editor();
  editor.on('added', () => {
    if (editor.isUndo) redoButton.prop('disabled', true);
    undoButton.prop('disabled', false);
  });

  await editor.draw('media/photo.png');
  const undoButton = $('[on-undo]:first');
  const redoButton = $('[on-redo]:first');


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
})();