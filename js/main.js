/* ============================================================
   Happie Fungi Fusion — Main JS
   ============================================================ */

// ---- Cart state ----
let cart = JSON.parse(localStorage.getItem('ff_cart') || '[]');

function updateCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = `Shop·${count}`;
  });
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price, qty: 1 }); }
  localStorage.setItem('ff_cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`Added ${name} to cart`);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- Mobile menu ----
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!hamburger || !menu) return;
  hamburger.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

// ---- FAQ accordion ----
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ---- Newsletter form ----
function initNewsletter() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (input && input.value.trim()) {
        showToast('Thanks! You\'re in. 🍄');
        input.value = '';
      }
    });
  });
}

// ---- Contact form ----
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast('Message sent! We\'ll reply within 24 hours.');
    form.reset();
  });
}

// ---- Smooth scroll for anchor links ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

// ---- Page routing (SPA-like) ----
const PAGES = ['home', 'shop', 'mushrooms', 'science', 'reviews', 'journal', 'about', 'faq', 'contact', 'shipping', 'privacy', 'terms', 'pdp-blue', 'pdp-mango', 'pdp-watermelon'];

function showPage(pageId) {
  if (!PAGES.includes(pageId)) pageId = 'home';
  PAGES.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = (p === pageId) ? '' : 'none';
  });
  window.scrollTo(0, 0);
  document.querySelectorAll('[data-page]').forEach(a => {
    a.classList.toggle('active-link', a.dataset.page === pageId);
  });
}

function initRouter() {
  document.querySelectorAll('[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const page = a.dataset.page;
      history.pushState({ page }, '', `#${page}`);
      showPage(page);
      document.querySelector('.mobile-menu')?.classList.remove('open');
    });
  });
  window.addEventListener('popstate', e => showPage(e.state?.page || 'home'));
  const hash = location.hash.replace('#', '') || 'home';
  showPage(hash);
}

// ---- Add-to-cart buttons ----
function initCartButtons() {
  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.addCart;
      const price = parseFloat(btn.dataset.price || '36');
      addToCart(name, price);
    });
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initMobileMenu();
  initFaq();
  initNewsletter();
  initContactForm();
  initSmoothScroll();
  initRouter();
  initCartButtons();
});
