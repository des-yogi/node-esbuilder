document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('[href^="#"][data-scroll-link]');
  links.forEach(link => {
    link.addEventListener('click', function (e) {
      const hash = this.href.replace(/[^#]*(.*)/, '$1');
      if (hash && hash !== '#') {
        e.preventDefault();
        const scroll = window.pageYOffset;
        const targetElem = document.querySelector(hash);
        if (!targetElem) return;
        const targetTop = getOffsetRect(targetElem).top - 10;
        const scrollDiff = targetTop - scroll;
        animate({
          duration: 500,
          timing: timeFraction => Math.pow(timeFraction, 4),
          draw: progress => {
            const scrollNow = scroll + progress * scrollDiff;
            window.scrollTo(0, scrollNow);
          }
        });
      }
    }, false);
  });

  function animate({ timing, draw, duration }) {
    const start = performance.now();
    function frame(time) {
      let timeFraction = (time - start) / duration;
      if (timeFraction > 1) timeFraction = 1;
      const progress = timing(timeFraction);
      draw(progress);
      if (timeFraction < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }

  function getOffsetRect(elem) {
    const box = elem.getBoundingClientRect();
    const body = document.body;
    const docElem = document.documentElement;
    const scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
    const clientTop = docElem.clientTop || body.clientTop || 0;
    const clientLeft = docElem.clientLeft || body.clientLeft || 0;
    const top = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;
    return { top: Math.round(top), left: Math.round(left) };
  }
});
