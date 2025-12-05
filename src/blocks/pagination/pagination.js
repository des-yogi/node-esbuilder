document.addEventListener('DOMContentLoaded', function(){
  (function(){
    // указатель на текущую страницу
    const pagination = document.querySelector('.pagination');

    if (!pagination) return;

    const btns = pagination.querySelectorAll('.pagination__item');
    Array.prototype.forEach.call(btns, function (item) {
      var link = item.children[0];
      if (item.classList.contains('active')) {
        link.setAttribute('aria-current', 'page');
      }
      else {
        link.removeAttribute('aria-current');
      }
    });
  }());
});
