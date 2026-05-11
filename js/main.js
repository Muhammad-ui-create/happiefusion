/* ============================================================
   Happie Fungi Fusion — Main JS
   ============================================================ */

// ---- Cart state ----
let cart = JSON.parse(localStorage.getItem('ff_cart') || '[]');

const PRODUCT_IMAGES = {
  'Blue Raspberry 12-pack':  'images/can-blue-raspberry.png',
  'Blue Raspberry Single':   'images/can-blue-raspberry.png',
  'Mango Mimosa 12-pack':    'images/can-mango-mimosa.png',
  'Watermelon 12-pack':      'images/can-watermelon.png',
  'Variety Pack 12-pack':    'images/can-blue-raspberry.png',
};
const PRODUCT_BG = {
  'Blue Raspberry 12-pack':  '#DDD5F5',
  'Blue Raspberry Single':   '#DDD5F5',
  'Mango Mimosa 12-pack':    '#FFF3CD',
  'Watermelon 12-pack':      '#D5F5E3',
  'Variety Pack 12-pack':    '#DDD5F5',
};

function saveCart() { localStorage.setItem('ff_cart', JSON.stringify(cart)); }

function updateCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = `Shop·${count}`;
  });
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; } else { cart.push({ name, price: parseFloat(price), qty: 1 }); }
  saveCart(); updateCartCount();
  showToast(`Added ${name} to cart 🍄`);
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  saveCart(); updateCartCount(); renderCheckout();
}

function changeQty(name, delta) {
  const item = cart.find(i => i.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(name); return; }
  saveCart(); updateCartCount(); renderCheckout();
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ---- Checkout rendering ----
let promoApplied = false;
let promoDiscount = 0;
let shippingCost = 0;

function getSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }

function renderCheckout() {
  const list = document.getElementById('cart-items-list');
  const emptyMsg = document.getElementById('cart-empty');
  const cartActions = document.getElementById('cart-actions');
  const summaryItems = document.getElementById('summary-items');
  if (!list) return;

  if (cart.length === 0) {
    list.style.display = 'none';
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (cartActions) cartActions.style.display = 'none';
  } else {
    list.style.display = 'flex';
    if (emptyMsg) emptyMsg.style.display = 'none';
    if (cartActions) cartActions.style.display = 'flex';

    list.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <div class="cart-item-img" style="background:${PRODUCT_BG[item.name] || '#f5f0e8'};">
          <img src="${PRODUCT_IMAGES[item.name] || ''}" alt="${item.name}" onerror="this.style.display='none'" />
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="item-price">$${item.price.toFixed(2)} each</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${item.name}', -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.name}', 1)">+</button>
        </div>
        <div class="item-total">$${(item.price * item.qty).toFixed(2)}</div>
        <button class="remove-btn" onclick="removeFromCart('${item.name}')" title="Remove">✕</button>
      </div>
    `).join('');

    if (summaryItems) {
      summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item-row">
          <div class="summary-item-thumb" style="background:${PRODUCT_BG[item.name] || '#f5f0e8'};">
            <img src="${PRODUCT_IMAGES[item.name] || ''}" alt="${item.name}" onerror="this.style.display='none'" />
            <span class="badge-qty">${item.qty}</span>
          </div>
          <span class="summary-item-name">${item.name}</span>
          <span class="summary-item-price">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `).join('');
    }
  }

  updateTotals();
  updateShippingFreeLabel();
}

function updateTotals() {
  const sub = getSubtotal();
  const discount = promoApplied ? promoDiscount : 0;
  const discountedSub = Math.max(0, sub - discount);
  const tax = discountedSub * 0.08;
  const total = discountedSub + shippingCost + tax;

  const el = id => document.getElementById(id);
  if (el('summary-subtotal')) el('summary-subtotal').textContent = `$${sub.toFixed(2)}`;
  if (el('summary-shipping')) {
    el('summary-shipping').textContent = shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`;
    el('summary-shipping').style.color = shippingCost === 0 ? '#2D6A4F' : '#111';
  }
  if (el('summary-tax')) el('summary-tax').textContent = `$${tax.toFixed(2)}`;
  if (el('summary-total')) el('summary-total').textContent = `$${total.toFixed(2)}`;

  // show discount row
  let discEl = document.getElementById('summary-discount-row');
  if (promoApplied && discount > 0) {
    if (!discEl) {
      const container = document.getElementById('summary-shipping')?.parentElement?.parentElement;
      if (container) {
        discEl = document.createElement('div');
        discEl.id = 'summary-discount-row';
        discEl.style.cssText = 'display:flex;justify-content:space-between;font-size:14px;color:#2D6A4F;';
        discEl.innerHTML = `<span>Promo (FUNGI10)</span><span id="summary-discount" style="font-weight:700;">-$${discount.toFixed(2)}</span>`;
        container.insertBefore(discEl, container.children[1]);
      }
    }
  } else if (discEl) discEl.remove();
}

function updateShippingFreeLabel() {
  const sub = getSubtotal();
  const stdPrice = document.getElementById('ship-std-price');
  if (stdPrice) {
    if (sub >= 60) { stdPrice.textContent = 'FREE'; shippingCost = 0; }
    else { stdPrice.textContent = '$5.99'; }
  }
}

function applyPromo() {
  const code = (document.getElementById('promo-input')?.value || '').trim().toUpperCase();
  const msg = document.getElementById('promo-msg');
  if (!msg) return;
  if (code === 'FUNGI10') {
    promoApplied = true; promoDiscount = getSubtotal() * 0.10;
    msg.style.display = 'block'; msg.style.color = '#2D6A4F';
    msg.textContent = '✓ 10% discount applied!';
    updateTotals();
  } else if (code === 'FREESHIP') {
    shippingCost = 0;
    msg.style.display = 'block'; msg.style.color = '#2D6A4F';
    msg.textContent = '✓ Free shipping applied!';
    updateTotals();
  } else {
    msg.style.display = 'block'; msg.style.color = '#e53e3e';
    msg.textContent = '✗ Invalid promo code. Try FUNGI10 for 10% off.';
  }
}

// ---- Checkout steps ----
let currentStep = 0;

function goStep(n) {
  document.querySelectorAll('.co-step').forEach((el, i) => {
    el.style.display = i === n ? '' : 'none';
  });
  currentStep = n;
  updateStepHeader(n);
  if (n === 0) renderCheckout();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepHeader(n) {
  const steps = ['co-step-contact','co-step-shipping','co-step-payment'];
  const labels = ['co-step-label'];
  const labelTexts = ['Cart', 'Contact', 'Shipping', 'Payment'];
  const label = document.getElementById('co-step-label');
  if (label) label.textContent = labelTexts[n] || labelTexts[0];
  steps.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      if (i < n - 1) { el.style.opacity = '1'; el.style.fontWeight = '600'; el.style.color = '#2D6A4F'; }
      else if (i === n - 1) { el.classList.add('co-step-active'); }
      else { el.style.opacity = '0.4'; el.style.fontWeight = '400'; el.style.color = ''; el.classList.remove('co-step-active'); }
    }
  });
}

function validateContact() {
  const fname = document.getElementById('co-fname')?.value.trim();
  const lname = document.getElementById('co-lname')?.value.trim();
  const email = document.getElementById('co-email')?.value.trim();
  if (!fname) { alert('Please enter your first name.'); return; }
  if (!lname) { alert('Please enter your last name.'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email address.'); return; }
  goStep(2);
}

function validateShipping() {
  const address = document.getElementById('co-address')?.value.trim();
  const city = document.getElementById('co-city')?.value.trim();
  const zip = document.getElementById('co-zip')?.value.trim();
  const state = document.getElementById('co-state')?.value;
  if (!address) { alert('Please enter your street address.'); return; }
  if (!city) { alert('Please enter your city.'); return; }
  if (!state) { alert('Please select your state.'); return; }
  if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) { alert('Please enter a valid ZIP code.'); return; }

  // Check expedited shipping selection
  const expedited = document.querySelector('input[name="shipping"]:checked')?.value === 'expedited';
  shippingCost = expedited ? 12.99 : (getSubtotal() >= 60 ? 0 : 5.99);
  updateTotals();

  // Populate payment page summary
  const email = document.getElementById('co-email')?.value.trim();
  const apt = document.getElementById('co-apt')?.value.trim();
  const payEmail = document.getElementById('pay-email-display');
  const payAddr = document.getElementById('pay-address-display');
  if (payEmail) payEmail.textContent = email;
  if (payAddr) payAddr.textContent = `${address}${apt ? ', ' + apt : ''}, ${city}, ${state} ${zip}`;
  goStep(3);
}

function validatePayment() {
  const cardname = document.getElementById('co-cardname')?.value.trim();
  const cardnum = document.getElementById('co-cardnum')?.value.replace(/\s/g,'');
  const expiry = document.getElementById('co-expiry')?.value.trim();
  const cvv = document.getElementById('co-cvv')?.value.trim();
  if (!cardname) { alert('Please enter the name on your card.'); return; }
  if (!cardnum || cardnum.length < 13) { alert('Please enter a valid card number.'); return; }
  if (!expiry || !/^\d{2}\s*\/\s*\d{2}$/.test(expiry)) { alert('Please enter a valid expiry date (MM / YY).'); return; }
  if (!cvv || cvv.length < 3) { alert('Please enter a valid CVV.'); return; }

  // Simulate processing
  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Processing…'; btn.style.opacity = '0.7'; btn.disabled = true; }

  setTimeout(() => {
    placeOrder();
    if (btn) { btn.textContent = 'Place order →'; btn.style.opacity = '1'; btn.disabled = false; }
  }, 1800);
}

function placeOrder() {
  const orderNum = 'FF-' + Math.random().toString(36).substr(2,6).toUpperCase();
  const fname = document.getElementById('co-fname')?.value.trim();
  const email = document.getElementById('co-email')?.value.trim();
  const sub = getSubtotal();
  const discount = promoApplied ? promoDiscount : 0;
  const tax = (sub - discount) * 0.08;
  const total = (sub - discount) + shippingCost + tax;

  const numEl = document.getElementById('confirm-order-num');
  if (numEl) numEl.textContent = `Order ${orderNum}`;

  const sumEl = document.getElementById('confirm-summary');
  if (sumEl) {
    sumEl.innerHTML = `
      <div style="font-weight:700;margin-bottom:12px;">Hi ${fname}! Here's what you ordered:</div>
      ${cart.map(i => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
        <span>${i.name} × ${i.qty}</span><span style="font-weight:700;">$${(i.price * i.qty).toFixed(2)}</span>
      </div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
        <span>Shipping</span><span style="font-weight:700;color:#2D6A4F;">${shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:18px;font-weight:900;margin-top:4px;">
        <span>Total</span><span style="color:#2D6A4F;">$${total.toFixed(2)}</span>
      </div>
      <div style="margin-top:10px;font-size:13px;color:#6B6B6B;">Confirmation sent to <strong>${email}</strong> · Ships in 1–2 business days</div>
    `;
  }

  // Clear cart
  cart = []; saveCart(); updateCartCount();
  promoApplied = false; promoDiscount = 0; shippingCost = 0;
  goStep(4);
}

// ---- Card number auto-format ----
function initCardFormatting() {
  const cardInput = document.getElementById('co-cardnum');
  if (cardInput) {
    cardInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,16);
      e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
    });
  }
  const expInput = document.getElementById('co-expiry');
  if (expInput) {
    expInput.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g,'').substring(0,4);
      if (v.length >= 3) v = v.substring(0,2) + ' / ' + v.substring(2);
      e.target.value = v;
    });
  }
  const cvvInput = document.getElementById('co-cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g,'').substring(0,4);
    });
  }
  // Shipping radio switch updates cost
  document.querySelectorAll('input[name="shipping"]').forEach(r => {
    r.addEventListener('change', () => {
      const isExp = r.value === 'expedited';
      shippingCost = isExp ? 12.99 : (getSubtotal() >= 60 ? 0 : 5.99);
      updateTotals();
    });
  });
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
      if (input && input.value.trim()) { showToast("Thanks! You're in. 🍄"); input.value = ''; }
    });
  });
}

// ---- Contact form ----
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    showToast("Message sent! We'll reply within 24 hours.");
    form.reset();
  });
}

// ---- Page routing ----
const PAGES = ['home','shop','mushrooms','science','reviews','journal','about','faq','contact','shipping','privacy','terms','pdp-blue','pdp-mango','pdp-watermelon','checkout'];

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
  if (pageId === 'checkout') {
    goStep(0);
    renderCheckout();
    initCardFormatting();
  }
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
  const hash = location.hash.replace('#','') || 'home';
  showPage(hash);
}

// ---- Add-to-cart buttons ----
function initCartButtons() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-cart]');
    if (btn) {
      e.preventDefault();
      addToCart(btn.dataset.addCart, btn.dataset.price || '36');
    }
  });
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initMobileMenu();
  initFaq();
  initNewsletter();
  initContactForm();
  initRouter();
  initCartButtons();
});
