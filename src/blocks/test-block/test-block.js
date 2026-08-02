// document.addEventListener('DOMContentLoaded', function(){});
// (function(){
// код
// }());
(function() {
  const title = document.querySelector('.test-card__title');
  const style = getComputedStyle(title);
  console.log(style.color);
  console.log(style.backgroundColor);
})();
