import Canvas from './Canvas.js';

(async () => {

  function reset() {
    canvas.reset();
    undobutton.prop('disabled', true);
    redobutton.prop('disabled', true);
  }

  function undo() {
    if (!canvas.undo()) return;
    undobutton.prop('disabled', !canvas.hasDrawingObject());
    redobutton.prop('disabled', !canvas.hasStack());
  }

  function redo() {
    if (!canvas.redo()) return;
    redobutton.prop('disabled', !canvas.hasStack());
  }

  function save(e) {
    if (e) e.preventDefault();
    alert('The image was saved.');
  }

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
      await canvas.draw(dataUrl);
    });
    input.trigger('click');
  }

  $('[data-toggle="tooltip"]').tooltip()
  const canvas = new Canvas();
  canvas.on('added', () => {
    if (canvas.isUndo) redobutton.prop('disabled', true);
    undobutton.prop('disabled', false);
  });

  await canvas.draw('media/photo.png');
  const undobutton = $('[on-undo]:first');
  const redobutton = $('[on-redo]:first');
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