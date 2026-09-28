// BeatShuffle site: 言語切替・スクロール演出・テーマカラー
(function () {
  var root = document.documentElement;

  // ---- 言語 ----
  function currentLang() { return root.classList.contains('ja') ? 'ja' : 'en'; }
  function applyLang(l) {
    root.classList.toggle('ja', l === 'ja');
    root.lang = l;
    try { localStorage.setItem('bs-lang', l); } catch (e) {}
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === l);
    });
    // アプリ画面のスクショを言語に合わせて差し替え
    document.querySelectorAll('img[data-shot]').forEach(function (img) {
      img.src = 'assets/shots/' + img.dataset.shot.replace('{l}', l) + '.jpg';
    });
    renderSwatchName();
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.dataset.lang); });
  });

  // ---- テーマカラー（アプリと同じ7色） ----
  var COLORS = [
    { hex: '#E8424D', en: 'Red',    ja: '赤' },
    { hex: '#F2801F', en: 'Orange', ja: 'オレンジ' },
    { hex: '#DBA305', en: 'Yellow', ja: '黄' },
    { hex: '#2EAD66', en: 'Green',  ja: '緑' },
    { hex: '#2185F2', en: 'Blue',   ja: '青' },
    { hex: '#595EE0', en: 'Indigo', ja: '藍' },
    { hex: '#9E5CE6', en: 'Violet', ja: '紫' }
  ];
  var selected = 6;
  var box = document.getElementById('swatches');
  function renderSwatchName() {
    var el = document.getElementById('swatchName');
    if (el) el.textContent = COLORS[selected][currentLang()];
  }
  function pick(i) {
    selected = i;
    root.style.setProperty('--accent', COLORS[i].hex);
    box.querySelectorAll('.swatch').forEach(function (s, j) { s.classList.toggle('on', j === i); });
    renderSwatchName();
    window.dispatchEvent(new CustomEvent('bs-accent', { detail: COLORS[i].hex }));
  }
  if (box) {
    COLORS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'swatch';
      b.style.background = c.hex;
      b.style.setProperty('--sw', c.hex);
      b.setAttribute('aria-label', c.en);
      b.addEventListener('click', function () { pick(i); });
      box.appendChild(b);
    });
  }

  // ---- ヘッダー ----
  var header = document.getElementById('top');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 20); }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- スクロールで現れる ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---- 端末モックを傾ける（マウス位置に追従） ----
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.stage').forEach(function (stage) {
      var phone = stage.querySelector('.phone.tilt');
      if (!phone) return;
      var base = phone.style.transform || '';
      stage.addEventListener('mousemove', function (e) {
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        phone.style.transform = base + ' rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 10) + 'deg)';
      });
      stage.addEventListener('mouseleave', function () { phone.style.transform = base; });
    });
  }

  applyLang(currentLang());
  pick(selected);
  onScroll();
})();
