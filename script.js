// Beispielzeiten – ersetze später durch DB/API
const times = ["07:00","08:00","09:00","10:00","11:00","12:00"];

(function initTimeDropdown(){
  const dd = document.querySelector('#timeDropdown');
  if (!dd) return;

  const toggle  = dd.querySelector('.dropdown__toggle');
  const labelEl = dd.querySelector('.dropdown__label');
  const menu    = dd.querySelector('.dropdown__menu');

  // Liste aufbauen
  menu.innerHTML = times.map(t => `
    <li><button type="button" class="dropdown__item" role="option" data-value="${t}">${t}</button></li>
  `).join('');

  const open = () => {
    dd.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.focus({preventScroll:true});
  };
  const close = () => {
    dd.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  // Toggle
  toggle.addEventListener('click', () => {
    dd.classList.contains('open') ? close() : open();
  });

  // Auswahl
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('.dropdown__item');
    if (!btn) return;
    const val = btn.dataset.value;
    labelEl.textContent = `${val} Uhr`;
    menu.querySelectorAll('.dropdown__item').forEach(i => i.removeAttribute('aria-selected'));
    btn.setAttribute('aria-selected','true');
    close();

    // HIER später deinen Daten-Load triggern:
    // loadDataForTime(val);
  });

  // außerhalb klicken
  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target)) close();
  });

  // Esc schließt
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
})();
