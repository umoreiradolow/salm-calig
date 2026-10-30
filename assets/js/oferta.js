// Página de vendas — Caligrafia Devocional

// Link do checkout (Wiapy). Os botões já levam a ele direto no HTML; aqui ele ganha os parâmetros do anúncio.
const CHECKOUT_URL = 'https://pay.wiapy.com/6Nu1cwRTnbSp';

const params = new URLSearchParams(location.search);
const fromQuiz = params.get('origem') === 'quiz';

// 1. Continuidade com o quiz: o bloco de preço retoma o cupom liberado.
document.querySelectorAll('[data-quiz]').forEach(el => {
  el.textContent = fromQuiz ? el.dataset.quiz : el.dataset.default;
});

// 2. Personalização leve do topo pela resposta 2 do quiz ("foco").
const FOCO_LINE = {
  biblia:  'Para a criança que você quer ver mais perto da Palavra.',
  telas:   'Uma troca saudável para o tempo de tela, de 7 a 12 anos.',
  escrita: 'Para a letra que precisa de prática, capricho e propósito.',
  rotina:  'Um momento de fé para viver em família, todos os dias.'
};
const foco = params.get('foco');
if (FOCO_LINE[foco]) document.getElementById('foco-line').textContent = FOCO_LINE[foco];

// 3. Botões de compra: levam ao checkout repassando os parâmetros do anúncio (UTMs, fbclid).
if (CHECKOUT_URL) {
  const url = new URL(CHECKOUT_URL);
  params.forEach((v, k) => { if (!url.searchParams.has(k)) url.searchParams.set(k, v); });
  document.querySelectorAll('.js-checkout').forEach(a => { a.href = url.toString(); });
}
// O InitiateCheckout da Meta é disparado pelo Pixel da UTMify ao clicar num link de checkout (pay.wiapy.com);
// aqui só vai o equivalente do GA4, para não contar em dobro na Meta.
document.querySelectorAll('.js-checkout').forEach(a => a.addEventListener('click', () => {
  try { if (window.gtag) gtag('event', 'begin_checkout', { currency: 'BRL', value: 19.90 }); } catch (e) {}
}));

// 4. Animação de entrada ao rolar
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// 5. Barra fixa: aparece depois do primeiro bloco de preço e some
//    enquanto um bloco de preço ou o rodapé estiver na tela.
const sticky = document.getElementById('sticky');
const firstPrice = document.querySelector('.price-card');
const hideZones = [...document.querySelectorAll('.js-price'), document.querySelector('.footer')];
const visible = new Set();
let passedFirst = false;

new IntersectionObserver(([e]) => {
  passedFirst = !e.isIntersecting && e.boundingClientRect.top < 0;
  updateSticky();
}).observe(firstPrice);

const zoneObserver = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
  updateSticky();
}, { threshold: 0.15 });
hideZones.forEach(z => z && zoneObserver.observe(z));

function updateSticky() {
  const on = passedFirst && visible.size === 0;
  sticky.classList.toggle('is-on', on);
  sticky.setAttribute('aria-hidden', String(!on));
  sticky.querySelector('a').tabIndex = on ? 0 : -1;
}

// 6. FAQ em sanfona: abrir uma pergunta fecha as outras do mesmo grupo.
document.querySelectorAll('.faq').forEach(group => {
  group.addEventListener('toggle', ev => {
    if (!ev.target.open) return;
    group.querySelectorAll('details[open]').forEach(d => { if (d !== ev.target) d.open = false; });
  }, true);
});

// 7. Fotos ampliadas: toque numa foto ("Como fica em casa" ou fotos dos depoimentos) para ver em tela cheia.
const zoom = document.getElementById('zoom');
if (zoom) {
  const zoomImg = zoom.querySelector('img');
  document.addEventListener('click', ev => {
    const alvo = ev.target.closest('.js-zoom');
    if (!alvo) return;
    zoomImg.src = alvo.dataset.src;
    zoomImg.alt = alvo.querySelector('img')?.alt || '';
    zoom.showModal();
  });
  // fecha no X, tocando fora da foto ou com Esc (nativo do <dialog>)
  zoom.addEventListener('click', ev => { if (ev.target !== zoomImg) zoom.close(); });
}

// 8. Carrossel de atividades: passa sozinho a cada 3 s e volta ao início no fim; a bolinha acompanha a página
//    do centro. Pausa enquanto a pessoa mexe nele (retoma 5 s depois), com uma página ampliada ou fora da tela.
const carrossel = document.getElementById('carrossel');
if (carrossel) {
  const itens = [...carrossel.children];
  const dots = [...document.querySelectorAll('#carrossel-dots i')];
  let atual = 0, visivel = false, pausaAte = 0;
  const marcar = () => {
    const meio = carrossel.scrollLeft + carrossel.clientWidth / 2;
    atual = 0;
    itens.forEach((it, k) => {
      if (Math.abs(it.offsetLeft + it.offsetWidth / 2 - meio) < Math.abs(itens[atual].offsetLeft + itens[atual].offsetWidth / 2 - meio)) atual = k;
    });
    dots.forEach((d, k) => d.classList.toggle('is-on', k === atual));
  };
  const irPara = k => {
    const it = itens[k];
    atual = k;
    dots.forEach((d, i) => d.classList.toggle('is-on', i === k));
    carrossel.scrollTo({ left: it.offsetLeft - (carrossel.clientWidth - it.offsetWidth) / 2, behavior: 'smooth' });
  };
  carrossel.addEventListener('scroll', () => requestAnimationFrame(marcar), { passive: true });
  ['pointerdown', 'touchstart', 'wheel'].forEach(ev =>
    carrossel.addEventListener(ev, () => { pausaAte = Date.now() + 5000; }, { passive: true }));
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }, { threshold: .4 }).observe(carrossel);
  setInterval(() => {
    if (!visivel || Date.now() < pausaAte || document.getElementById('zoom')?.open) return;
    irPara((atual + 1) % itens.length);
  }, 3000);
  marcar();
}
