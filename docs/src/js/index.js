import Editor from './Editor.js';
import fileToDataURL from './fileToDataURL.js';
import hotkeys from './libs/hotkeys.js';

(async () => {
  /**
   * Undo all edits.
   */
  function undoAllHandler() {
    editor.undoAllEdits();
    undoButton.setAttribute('disabled', 'disabled');
    redoButton.setAttribute('disabled', 'disabled');
  }

  /**
   * Undo one edit.
   */
  function undoHandler() {
    // Undo one edit.
    if (!editor.undoOneEdit())
      return;
    if (editor.hasDrawingObject())
      undoButton.removeAttribute('disabled');
    else
      undoButton.setAttribute('disabled', 'disabled');
    if (editor.hasEditHistoryStack())
      redoButton.removeAttribute('disabled');
    else
      redoButton.setAttribute('disabled', 'disabled');
  }

  /**
   * Redo one edit.
   */
  function redoHandler() {
    // Redo one edit.
    if (!editor.redoOneEdit())
      return;
    if (editor.hasEditHistoryStack())
      redoButton.removeAttribute('disabled');
    else
      redoButton.setAttribute('disabled', 'disabled');
  }

  /**
   * Image Upload.
   */
  function uploadHandler() {
    // Generate file input element.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    // Once the file is selected.
    input.addEventListener('change', async evnt => {
      // Get an object of the selected file.
      const file = evnt.target.files[0];

      // Clear input values so that the same file can be selected consecutively.
      input.value = '';

      // Get DataURL from the selected file.
      const dataUrl = await fileToDataURL(file);

      // Undo all edits.
      undoAllHandler();

      // Draws the selected image file on the canvas.
      await editor.drawImage(dataUrl, file.name);
    }, {passive: true});

    // Open the file selection window.
    input.click();
  }

  // Image editing object.
  const editor = new Editor(document.querySelector('#canvas'), document.querySelector('#lineThickness'));

  // Image editing event.
  editor.on('added', () => {
    // Deactivate the redo button if it was undo just before.
    if (editor.isUndo)
      redoButton.setAttribute('disabled', 'disabled');

    // Activate the undo button.
    undoButton.removeAttribute('disabled');
  });

  // Draw an image.
  await editor.drawImage('src/img/sample.png');

  // Undo button.
  const undoButton = document.querySelector('[data-on-undo]');

  // Redo button.
  const redoButton = document.querySelector('[data-on-redo]');
  
  // Shortcut key events.
  hotkeys('ctrl+0,ctrl+z,ctrl+y,ctrl+s,ctrl+u',(evnt, handler) => {
    evnt.preventDefault() 
    switch (handler.key) {
    case 'ctrl+0':
      undoAllHandler();
      break;
    case 'ctrl+z':
      undoHandler();
      break;
    case 'ctrl+y':
      redoHandler();
      break;
    case 'ctrl+s':
      editor.saveImage();
      break;
    case 'ctrl+u':
      uploadHandler();
      break;
    }
  });

  // An event that undoes all edits.
  document.querySelector('[data-on-undo-all]').addEventListener('click', () => {
    undoAllHandler();
  });

  // One undo event.
  document.querySelector('[data-on-undo]').addEventListener('click', () => {
    undoHandler();
  });

  // One redo event.
  document.querySelector('[data-on-redo]').addEventListener('click', () => {
    redoHandler();
  });

  // Save image event.
  document.querySelector('[data-on-save]').addEventListener('click', () => {
    // Save image.
    editor.saveImage();
  });

  // Image Upload Event.
  document.querySelector('[data-on-upload]').addEventListener('click', () => {
    uploadHandler();
  });
})();