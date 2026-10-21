(function () {
  'use strict';
  var nav = document.getElementById('nav'), row = document.getElementById('row'), toast = document.getElementById('toast');
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 2200); }
  window.addEventListener('scroll', function () { nav.classList.toggle('solid', window.scrollY > 30); });
  document.getElementById('prev').addEventListener('click', function () { row.scrollBy({ left: -560 }); });
  document.getElementById('next').addEventListener('click', function () { row.scrollBy({ left: 560 }); });
  document.getElementById('cta').addEventListener('submit', function (e) { e.preventDefault(); say('Demo only: no account is created.'); });
  document.getElementById('signin').addEventListener('click', function () { say('Demo only: sign-in is not real.'); });
  Array.prototype.forEach.call(document.querySelectorAll('.card'), function (c) { c.addEventListener('click', function (e) { e.preventDefault(); say('Posters are original demo art.'); }); });
  Array.prototype.forEach.call(document.querySelectorAll('.q'), function (q) {
    q.addEventListener('click', function () { q.nextElementSibling.classList.toggle('open'); });
  });
})();
