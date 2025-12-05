// document.addEventListener('DOMContentLoaded', function(){});
// (function(){
// код
// }());

(function() {
  const btn = document.querySelector('.test-block__btn');
  const style = getComputedStyle(btn);
  console.log(style.color);
})();
