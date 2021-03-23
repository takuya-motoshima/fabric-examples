import Canvas from './Canvas.js';

(async () => {

  function reset() {
    canvas.reset();
    undobtn.prop('disabled', true);
    redobtn.prop('disabled', true);
  }

  function undo() {
    if (!canvas.undo()) return;
    undobtn.prop('disabled', !canvas.hasDrawingObject());
    redobtn.prop('disabled', !canvas.hasStack());
  }

  function redo() {
    if (!canvas.redo()) return;
    redobtn.prop('disabled', !canvas.hasStack());
  }

  function save(event) {
    if (event) event.preventDefault();
    canvas.download();
  }

  function upload(event) {
    if (event) event.preventDefault();
    const input = $('<input />', { type: 'file', accept: 'image/*' }).on('change', async event => {
      const file = event.currentTarget.files[0];
      input.val('');
      const dataURL = await new Promise(resolve => {
        const reader = new FileReader();
        $(reader).on('load', () => resolve(reader.result));
        reader.readAsDataURL(file);
      });
      reset();
      await canvas.draw(dataURL, file.name);
    });
    input.trigger('click');
  }

  $('[data-toggle="tooltip"]').tooltip()
  const canvas = new Canvas();
  canvas.on('added', () => {
    if (canvas.isUndo) redobtn.prop('disabled', true);
    undobtn.prop('disabled', false);
  });

  // await canvas.draw('images/sample.png');
  await canvas.draw('images/large.jpg');
  const undobtn = $('[on-undo]:first');
  const redobtn = $('[on-redo]:first');
  $(document)
    .on('keydown', null, 'Ctrl+0', () => reset())
    .on('keydown', null, 'Ctrl+z', () => undo())
    .on('keydown', null, 'Ctrl+y', () => redo())
    .on('keydown', null, 'Ctrl+s', event => save(event))
    .on('keydown', null, 'Ctrl+u', event => upload(event))
    .on('click', '[on-reset]', () => reset())
    .on('click', '[on-undo]', () => undo())
    .on('click', '[on-save]', () => save())
    .on('click', '[on-upload]', () => upload());
})();