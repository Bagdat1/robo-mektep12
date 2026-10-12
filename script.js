// ===== Язык / Тіл / Language =====
let lang = 'ru';
try { lang = localStorage.getItem('runsmart_lang') || ''; } catch(e){}
if (!I18N[lang]){
  const nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
  lang = nav === 'kk' ? 'kz' : (nav === 'en' ? 'en' : 'ru');
}
// t('ключ', аргумент...) — текст на текущем языке; {0} заменяется аргументом
const t = (k, ...a) => (I18N[lang][k] ?? I18N.ru[k] ?? k).replace(/\{(\d)\}/g, (_, i) => a[i]);
const tRu = (k, ...a) => I18N.ru[k].replace(/\{(\d)\}/g, (_, i) => a[i]);

// ===== Каталог =====
const moreKeys = ['more1', 'more2', 'more3', 'more4'];
// Модели и цены (в рублях). Для вкладок «Для бега» и «Для триатлона» — примеры, замените своими
const catalog = {
  fitness: [
    {n:'Polar FT1', old:'4 750', price:'4 500'},
    {n:'Suunto M2', old:'6 690', price:'6 641'},
    {n:'Polar FT4', old:'7 390', price:'7 021'},
    {n:'Polar FT1', old:'4 750', price:'4 500'},
    {n:'Suunto M2', old:'6 690', price:'6 641'},
    {n:'Polar FT4', old:'6 690', price:'6 641'}
  ],
  run: [
    {n:'Polar RC3 GPS', old:'12 990', price:'11 900'},
    {n:'Garmin Forerunner 220', old:'14 500', price:'13 990'},
    {n:'Suunto Ambit2 R', old:'16 200', price:'15 400'},
    {n:'Polar RC3', old:'10 490', price:'9 900'},
    {n:'Garmin Forerunner 15', old:'8 990', price:'8 490'},
    {n:'Suunto Quest', old:'9 800', price:'9 300'}
  ],
  tri: [
    {n:'Garmin Forerunner 920XT', old:'27 900', price:'26 500'},
    {n:'Polar V800', old:'29 500', price:'27 990'},
    {n:'Suunto Ambit3 Sport', old:'31 000', price:'29 900'},
    {n:'Garmin Forerunner 620', old:'22 500', price:'21 400'},
    {n:'Polar M400', old:'11 990', price:'11 190'},
    {n:'Suunto Ambit3 Run', old:'24 900', price:'23 700'}
  ]
};
const IMG = {fitness:'img/watch-fitness.png', run:'img/watch-run.png', tri:'img/watch-tri.png'};

const grid = document.getElementById('grid');
const fullName = c => t('hr') + ' ' + c.n;
const foot = c => `<div class="foot"><div><span class="old">${c.old} ${t('cur')}</span><span class="new">${c.price} ${t('cur')}</span></div><button type="button" class="btn buy" data-buy="${c.n}">${t('buy')}</button></div>`;
// Каждая карточка = две стороны (лицевая и обратная); «Подробнее» поворачивает её вокруг ребра
const cardHTML = (c, cat) => `<div class="flip"><div class="inner">
  <div class="card front"><div class="pic" style="background-image:url(${IMG[cat]})"></div><h4>${fullName(c)}</h4><p>${t('desc')}</p><a href="#" class="more">${t('moreLink')}</a>${foot(c)}</div>
  <div class="card back"><ul>${moreKeys.map(k => `<li>${t(k)}</li>`).join('')}</ul><div class="back-link"><a href="#" class="less">${t('back')}</a></div>${foot(c)}</div>
</div></div>`;

function render(cat){
  curCat = cat;
  grid.dataset.cat = cat;
  grid.innerHTML = catalog[cat].map(c => cardHTML(c, cat)).join('');
}
let curCat = 'fitness';
render(curCat);

grid.addEventListener('click', e => {
  const buy = e.target.closest('[data-buy]');
  if (buy) return openModal({titleKey:'modalBuy', model:buy.dataset.buy, textKey:'modalBuyText'});
  const a = e.target.closest('.more, .less');
  if (!a) return;
  e.preventDefault();
  a.closest('.flip').classList.toggle('turned', a.classList.contains('more'));
});

document.getElementById('tabs').addEventListener('click', e => {
  const t = e.target.closest('.tab');
  if (!t) return;
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  render(t.dataset.cat);
});

// Слайдер: стрелки сдвигают слайды вбок
const track = document.getElementById('track');
const total = track.children.length;
let pos = 0;
const move = d => {
  pos = (pos + d + total) % total;
  track.style.transform = `translateX(-${pos * 100}%)`;
};
document.getElementById('next').onclick = () => move(1);
document.getElementById('prev').onclick = () => move(-1);

// ===== Заявки =====
// Чтобы заявки уходили на ваш сервер/Formspree/Google Script, вставьте адрес сюда:
const FORM_URL = '';

function submitForm(form, msg, topic){
  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();
  const email = form.elements.email.value.trim();
  [...form.querySelectorAll('input')].forEach(i => i.classList.remove('bad'));
  const say = (key, cls, arg) => { msg.hidden = false; msg.dataset.k = key; msg.dataset.a = arg || ''; msg.textContent = t(key, arg); msg.className = 'msg ' + cls; };
  if (!name){ form.elements.name.classList.add('bad'); return say('errName', 'err'); }
  if (phone.replace(/\D/g, '').length < 10){ form.elements.phone.classList.add('bad'); return say('errPhone', 'err'); }
  if (email && !/^\S+@\S+\.\S+$/.test(email)){ form.elements.email.classList.add('bad'); return say('errEmail', 'err'); }

  const data = {name, phone, email, topic: topic || 'Консультация', lang, date: new Date().toISOString()};
  try { const all = JSON.parse(localStorage.getItem('runsmart_leads') || '[]'); all.push(data); localStorage.setItem('runsmart_leads', JSON.stringify(all)); } catch(e){}
  if (FORM_URL) fetch(FORM_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)}).catch(() => {});
  say('thanks', 'ok', name);
  form.reset();
}

document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  submitForm(e.target, document.getElementById('msg'), 'Консультация (форма на странице)');
});

// ===== Всплывающее окно =====
const modal = document.getElementById('modal'), mform = document.getElementById('mform'), mmsg = document.getElementById('mmsg');
let lastFocus, modalState = {titleKey:'consult'};
function paintModal(){
  const m = modalState;
  document.getElementById('mt').textContent = t(m.titleKey, m.model && (t('hr') + ' ' + m.model));
  document.getElementById('mp').textContent = t(m.textKey || 'modalText');
}
// openModal('consult') или openModal({titleKey, model, textKey})
function openModal(o){
  lastFocus = document.activeElement;
  modalState = typeof o === 'string' ? {titleKey:o} : o;
  paintModal();
  mform.elements.topic.value = tRu(modalState.titleKey, modalState.model && (tRu('hr') + ' ' + modalState.model)); // в заявке тема всегда по-русски
  mmsg.hidden = true; mform.reset();
  modal.hidden = false;
  mform.elements.name.focus();
}
function closeModal(){ modal.hidden = true; if (lastFocus) lastFocus.focus(); }
document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.open)));
document.getElementById('mx').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
mform.addEventListener('submit', e => {
  e.preventDefault();
  submitForm(mform, mmsg, mform.elements.topic.value);
  if (mmsg.classList.contains('ok')) setTimeout(closeModal, 2200);
});

// ===== Кнопка «наверх» =====
const toTop = document.getElementById('toTop');
const onScroll = () => toTop.classList.toggle('show', window.scrollY > 400);
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

// ===== Переключение языка =====
function applyLang(l){
  lang = l;
  try { localStorage.setItem('runsmart_lang', l); } catch(e){}
  document.documentElement.lang = LANGS[l].html;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', t(el.dataset.i18nTitle)));
  document.querySelectorAll('#lang button').forEach(b => {
    const on = b.dataset.lang === l;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  // каталог: перерисовываем, сохранив перевёрнутые карточки
  const turned = [...grid.querySelectorAll('.flip')].map(f => f.classList.contains('turned'));
  render(curCat);
  grid.querySelectorAll('.flip').forEach((f, i) => f.classList.toggle('turned', !!turned[i]));
  // открытое окно и сообщения форм
  paintModal();
  document.querySelectorAll('.msg[data-k]').forEach(m => { m.textContent = t(m.dataset.k, m.dataset.a); });
  // карта: язык подписей Google Maps
  const map = document.querySelector('.map-frame');
  if (map){
    const u = map.getAttribute('src').replace(/([?&]hl=)[a-z-]+/, '$1' + LANGS[l].map);
    if (u !== map.getAttribute('src')) map.setAttribute('src', u);
  }
}
document.getElementById('lang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]');
  if (b && b.dataset.lang !== lang) applyLang(b.dataset.lang);
});
applyLang(lang);
