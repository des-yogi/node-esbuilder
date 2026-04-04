import autosize from 'autosize/dist/autosize.esm.js';

function initFieldText() {
  const textareas = document.querySelectorAll('.field-text textarea');

  if (!textareas.length) return;

  autosize(textareas);
}

initFieldText();
