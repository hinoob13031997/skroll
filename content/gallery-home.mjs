// Home: a short dive into the light of the hero star, then the six worlds on a curved wall (src/gallery.js).
// The wall starts from the world of the time of day; scroll or swipe turns it, a click opens the world full screen.
// Without JS / WebGL the worlds are simply stacked as cards with links.
const nm=p=>p.name.charAt(0)+p.name.slice(1).toLowerCase(); // LUNA → Luna
// how a person would say it — care, not treatment (these are supplements)
export const phrases={luna:'Хочу спокойно уснуть',saturn:'Не хватает энергии',venus:'Хочу гармонии с собой',mars:'Нужно больше сил',earth:'Хочу, чтобы кожа сияла',neptune:'Хочу сохранить молодость'};

export function buildGallery({products}){
  const worlds=products.map((p,i)=>`<li class="gx-item" data-world="${p.id}" style="--accent:${p.color}">
      <a class="gx-card" href="/worlds/${p.id}/" data-world="${p.id}">
        <img src="/assets/film/${p.id}.webp" width="2880" height="1620" alt="Банка Moonvit ${p.name} в мире ${nm(p)}" loading="${i<2?'eager':'lazy'}" decoding="async">
      </a>
      <div class="gx-copy">
        <p class="gx-phrase">«${phrases[p.id]}»</p>
        <h2 class="gx-name">${nm(p)}</h2>
        <p class="gx-cat">${p.category}</p>
        <a class="gx-open" href="/worlds/${p.id}/" data-world="${p.id}">Открыть мир <span aria-hidden="true">→</span></a>
      </div>
    </li>`).join('');
  // the world a card opens: its cinematic still + the essentials to choose and buy
  const layers=products.map((p,i)=>{
    const prev=products[(i+5)%6],next=products[(i+1)%6];
    return `<article class="sys-world" data-world="${p.id}" style="--accent:${p.color}" aria-labelledby="sw-${p.id}" hidden>
      <img class="sw-img" src="/assets/film/${p.id}.webp" alt="" loading="lazy" decoding="async">
      <div class="sw-copy">
        <p class="sw-count">${i+1} из 6 <span>${p.category}</span></p>
        <h2 class="sw-name" id="sw-${p.id}">${nm(p)}</h2>
        <p class="sw-line">${p.tagline}</p>
        <ul class="sw-effect" aria-label="Эффект — по этикетке">${p.effect.map(e=>`<li>${e}</li>`).join('')}</ul>
        <dl class="sw-facts"><div><dt>Вкус</dt><dd>${p.taste}</dd></div><div><dt>Формула</dt><dd>${p.keys}</dd></div><div><dt>Приём</dt><dd>Две жевательные пастилки в день, без воды</dd></div></dl>
        <div class="sw-buy">
          <a class="sw-btn sw-btn-main" href="/worlds/${p.id}/">Состав и покупка</a>
          <a class="sw-btn" href="${p.wb}" target="_blank" rel="noopener noreferrer">Wildberries ↗</a>
          <a class="sw-btn" href="${p.ozon}" target="_blank" rel="noopener noreferrer">Ozon ↗</a>
        </div>
      </div>
      <nav class="sw-nav" aria-label="Другие миры">
        <button type="button" class="sw-close" data-sys-close>← Все миры</button>
        <span class="sw-step"><button type="button" data-sys-go="${prev.id}" aria-label="Предыдущий мир: ${nm(prev)}">←</button><button type="button" data-sys-go="${next.id}" aria-label="Следующий мир: ${nm(next)}">${nm(next)} →</button></span>
      </nav>
    </article>`;}).join('');
  return `<section class="gx" id="worlds" aria-labelledby="gx-title">
    <div class="gx-stage">
      <img class="gx-sky" src="/assets/system/sky.webp" width="2560" height="1440" alt="">
      <div class="gx-hero">
        <img class="gx-hero-img" src="/assets/film/hero.webp" width="2880" height="1620" alt="Огромная тёмная планета и восходящая звезда над чёрной водой" fetchpriority="high">
        <div class="gx-hello">
          <p class="gx-greet" data-greet>Шесть миров Moonvit</p>
          <h1 class="gx-title" id="gx-title" data-greet-title>Твоя вселенная <em>начинается внутри</em></h1>
          <p class="gx-lead">Жевательные витамины для ежедневного ритуала заботы о себе. Выбери свой мир.</p>
        </div>
        <p class="gx-hint" aria-hidden="true">Листай</p>
      </div>
      <div class="gx-flash" aria-hidden="true"></div>
      <p class="gx-giant" aria-hidden="true"></p>
      <ol class="gx-list" aria-label="Шесть миров Moonvit">${worlds}</ol>
      <nav class="gx-rail" aria-label="Перейти к миру">${products.map(p=>`<button type="button" data-gx-go="${p.id}" style="--accent:${p.color}"><span>${nm(p)}</span></button>`).join('')}</nav>
      <div class="gx-film" aria-hidden="true"></div>
    </div>
    <div class="sys-worlds" role="dialog" aria-modal="true" aria-label="Мир Moonvit" hidden>${layers}</div>
  </section>`;
}
