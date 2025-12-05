(function(){
  const langSwitcher = document.getElementById('lang-switcher');
  let togglerBtn = document.getElementById('lang-switcher-toggler');
  let page = document.documentElement;
  let lang = page.lang;

  if (langSwitcher) {
    const langChangeHandler = function () {
      togglerBtn.innerHTML = lang;
    };

    langChangeHandler();
  }
}());
