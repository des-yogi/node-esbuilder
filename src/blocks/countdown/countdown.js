document.addEventListener('DOMContentLoaded', function () {

  const countdownArr = document.getElementsByClassName('countdown');
  if (!countdownArr) { return; }

  function getTimeRemaining(endtime) {
    let t = Date.parse(endtime) - Date.parse(new Date());
    let seconds = Math.floor((t / 1000) % 60);
    let minutes = Math.floor((t / 1000 / 60) % 60);
    let hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    let days = Math.floor(t / (1000 * 60 * 60 * 24));
    return {
      'total': t,
      'days': days,
      'hours': hours,
      'minutes': minutes,
      'seconds': seconds
    };
  }

  function initializeClock(id, endtime) {
    const clock = id;
    const daysSpan = clock.querySelector('.days');
    const hoursSpan = clock.querySelector('.hours');
    const minutesSpan = clock.querySelector('.minutes');
    const secondsSpan = clock.querySelector('.seconds');
    const countdownContainer = clock.querySelector('.countdown__inner');
    const deadlineMessage = clock.querySelector('.countdown__deadline-message');
    const timeinterval = setInterval(updateClock, 1000);

    function updateClock() {
      let t = getTimeRemaining(endtime);

      daysSpan.innerHTML = t.days;
      hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
      minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
      secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

      if (t.total <= 0) {
        countdownContainer.classList.add('hidden');
        deadlineMessage.classList.add('visible');
        clearInterval(timeinterval);
        return true;
      }
    }
    updateClock();
  }

  // var deadline = new Date(Date.parse(new Date()) + 15 * 24 * 60 * 60 * 1000); // for endless timer
  //const deadline = 'August 31 2021 18:59:00 GMT+0300'; //GMT+0300 - летнее время

  for (let j = 0; j < countdownArr.length; j++) {
    let currentItem = countdownArr[j];
    let currentItemDeadline = currentItem.dataset.deadline;
    if (currentItemDeadline === '') {
      continue;
    }
    initializeClock(currentItem, currentItemDeadline);
  }

/**
 * Взято за основу https://denis-creative.com/jstimer/
 * Добавлен функционал инициализации множественных объектов,
 * каждый из которых имеет свой атрибут - deadline
 *
 * Формат вывода даты ISO 8601:
 * var deadline = '2025-12-31';
 *
 * Вывод даты с точным временем и часовым поясом:
 * var deadline="September 01 2021 00:00:00 GMT+0300";
 *
 * Вывод таймера для лендингов – таймер все время будет выводить,
 * что осталось 15 дней (можно указать любое время)
 * var deadline = new Date(Date.parse(new Date()) + 15 * 24 * 60 * 60 * 1000);
 */
});
