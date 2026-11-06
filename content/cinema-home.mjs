// One journey: hero → one approach per planet → six product worlds → the whole system.
// No second gallery or repeated passing shots. Each next world opens from the focus point of its scene with a
// feathered circular reveal while the previous one keeps flying in. Stills: dist/assets/film/*.webp.
// Without JS, with reduced motion or with motion switched off, the scenes simply stack as full-screen sections.
const FILM='/assets/film';
export {buildHomeRest} from './home-rest.mjs';
// focus of every still (% of the frame): where the jar / planet sits — the camera zooms toward it and the next world opens from it
const focus={hero:[62,40],luna:[50,42],saturn:[51,42],venus:[50,52],mars:[48,52],earth:[46,48],neptune:[49,52],final:[50,42],
 // frames "on the way" (сайт2/assets/plates/path_*.png): open space, the camera flies to the planet's centre
 'path-luna':[55,47],'path-saturn':[55,46],'path-venus':[56,47],'path-mars':[61,48],'path-earth':[62,47],'path-neptune':[62,47]};
const fs=id=>`--fx:${focus[id][0]}%;--fy:${focus[id][1]}%`;
// vertical placement of the copy, so the text does not sit in one spot for the whole film
const place={luna:'low',saturn:'high',venus:'mid',mars:'low',earth:'mid',neptune:'high'};
const nm=p=>p.name.charAt(0)+p.name.slice(1).toLowerCase(); // LUNA → Luna
const formula=p=>p.keys.split('·').map(component=>`<span class="vg-component">${component.trim()}</span>`).join('');
// Only the hero has a real src before script startup. Hidden live scenes share the viewport, so native
// loading="lazy" alone would still request every frame. The loader assigns data-vg-src on demand;
// noscript keeps the ordinary, vertically stacked experience complete without JavaScript.
const img=(id,alt,i)=>{const attrs=`class="vg-img" width="1672" height="941" alt="${alt}" decoding="async"`;
 return i===0?`<img ${attrs} src="${FILM}/hero-clean-v2.webp" fetchpriority="high">`:
 `<img ${attrs} src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" data-vg-src="${FILM}/${id}.webp"><noscript><img ${attrs} src="${FILM}/${id}.webp" loading="lazy"></noscript>`;};
const onWay={luna:'серебристой Луне',saturn:'Сатурну с золотыми кольцами',venus:'жемчужно-розовой Венере',mars:'красному Марсу',earth:'зелёно-голубой Земле',neptune:'синему Нептуну'};
const path=(p,i)=>`<section class="vg-scene vg-path" data-scene="path-${p.id}" style="${fs('path-'+p.id)};--accent:${p.color}" aria-label="Полёт к миру ${nm(p)}">
      ${img('path-'+p.id,`Полёт сквозь пояс астероидов к ${onWay[p.id]}`,i)}
      <div class="vg-copy"><p class="vg-course">Курс <span>${nm(p)}</span></p></div>
    </section>`;
const alts={hero:'Огромная тёмная планета с восходящей звездой над чёрной водой',luna:'Банка Moonvit Luna среди ледяных скал у чёрной воды, за ней серебристая луна',saturn:'Банка Moonvit Saturn среди астероидов, за ней золотые кольца Сатурна',venus:'Банка Moonvit Venus в жидком перламутре на фоне розовой планеты',mars:'Банка Moonvit Mars на красном каменистом склоне под Марсом',earth:'Банка Moonvit Earth на мокрых камнях с мхом у водопада',neptune:'Банка Moonvit Neptune в синих волнах жидкого стекла под Нептуном',final:'Шесть планет выстроились над краем Земли'};
export function buildCinemaHome({products,picture,orb,lineup,trio,link}){
  const worlds=products.map((p,i)=>`${path(p,i+1)}
    <section class="vg-scene" id="world-${p.id}" data-scene="${p.id}" data-place="${place[p.id]}" style="${fs(p.id)};--accent:${p.color}" aria-labelledby="vg-${p.id}">
      ${i===0?'<span id="worlds" class="vg-worlds-anchor" aria-hidden="true"></span>':''}${img(p.id,alts[p.id],i+1)}
      <div class="vg-copy">
        <p class="vg-count">${i+1} из 6 <span>${p.state}</span></p>
        <h2 class="vg-name" id="vg-${p.id}">${nm(p)}</h2>
        <p class="vg-line">${p.tagline}</p>
        <dl class="vg-facts"><div><dt>Формула</dt><dd class="vg-formula">${formula(p)}</dd></div><div><dt>Вкус</dt><dd>${p.taste}</dd></div></dl>
        <a class="vg-link" href="/worlds/${p.id}/">Открыть мир ${nm(p)}</a>
      </div>
    </section>`).join('');
  return `<div class="voyage" id="top" aria-label="Путешествие по шести мирам Moonvit">
  <div class="vg-stage">
    <section class="vg-scene vg-hero" data-scene="hero" style="${fs('hero')}" aria-labelledby="vg-hero">
      ${img('hero',alts.hero,0)}
      <div class="vg-copy">
        <h1 class="vg-title" id="vg-hero">Твоя вселенная начинается внутри</h1>
        <p class="vg-lead">Шесть жевательных комплексов Moonvit — шесть миров для ежедневного ритуала заботы о себе.</p>
        <div class="vg-actions"><a class="vg-start" href="#world-luna" data-vg-go="luna">Начать путешествие</a><a class="vg-direct" href="#catalog" data-vg-exit>Сразу к комплексам ↗</a></div>
      </div>
    </section>
    ${worlds}
    <section class="vg-scene vg-final" data-scene="final" style="${fs('final')}" aria-labelledby="vg-final">
      ${img('final',alts.final,7)}
      <div class="vg-copy">
        <h2 class="vg-title" id="vg-final">Шесть миров. Один ты.</h2>
        <a class="vg-start" href="#route" data-vg-exit>Найти свой мир</a>
      </div>
    </section>
    <nav class="vg-rail" aria-label="Миры Moonvit">${products.map(p=>`<a href="#world-${p.id}" data-vg-go="${p.id}" style="--accent:${p.color}"><span>${nm(p)}</span></a>`).join('')}<i class="vg-progress" aria-hidden="true"><b></b></i></nav>
    <p class="vg-hint" aria-hidden="true">Листай вниз</p>
    <a class="vg-skip" href="#ritual" data-vg-exit>Пропустить полёт</a>
  </div>
</div>
  <a class="vg-top" href="#top" aria-label="В начало путешествия">В начало ↑</a>
  <a class="vg-catalog" href="/catalog/">К комплексам <span aria-hidden="true">↗</span></a>`;
}
