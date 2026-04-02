(function ()
{
  function closest(el, selector) {
    var matchesFn;

    // find vendor prefix
    ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
      if (typeof document.body[fn] == 'function') {
        matchesFn = fn;
        return true;
      }
      return false;
    })

    var parent;

    // traverse parents
    while (el) {
      parent = el.parentElement;
      if (parent && parent[matchesFn](selector)) {
        return parent;
      }
      el = parent;
    }

    return null;
  }

  var inputs = document.querySelectorAll('.field-file__input');
  Array.prototype.forEach.call(inputs, function(input)
  {
    const label = closest(input, '.field-file').querySelector('.field-file__name-text');
    const labelVal = label.innerHTML;

    input.addEventListener('change', function(e) {
      const fileName = (this.files && this.files.length > 1)
        ? (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length)
        : e.target.value.split('\\').pop();

      if (fileName) {
        label.innerHTML = `<span class="field-file__file-name">${fileName}</span>`;
      }
      else {
        label.innerHTML = `<span class="field-file__file-name">${labelVal}</span>`;
      }
    });
  });
}());
