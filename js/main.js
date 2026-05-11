/* ============================================================
   Happie Fungi Fusion — Main JS  (fixed: all handlers global)
   ============================================================ */

// ---- Cart state ----
let cart = JSON.parse(localStorage.getItem('ff_cart') || '[]');

const PRODUCT_IMAGES = {
  'Blue Raspberry 12-pack': 'images/can-blue-raspberry.png',
  'Blue Raspberry Single':  'images/can-blue-raspberry.png',
  'Mango Mimosa 12-pack':   'images/can-mango-mimosa.png',
  'Watermelon 12-pack':     'images/can-watermelon.png',
  'Variety Pack 12-pack':   'images/can-blue-raspberry.png',
};
const PRODUCT_BG = {
  'Blue Raspberry 12-pack': '#DDD5F5',
  'Blue Raspberry Single':  '#DDD5F5',
  'Mango Mimosa 12-pack':   '#FFF3CD',
  'Watermelon 12-pack':     '#D5F5E3',
  'Variety Pack 12-pack':   '#DDD5F5',
};

function saveCart() {
  localStorage.setItem('ff_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = 'Shop·' + count;
  });
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name: name, price: parseFloat(price), qty: 1 });
  }
  saveCart();
  updateCartCount();
  showToast('Added ' + name + ' to cart 🍄');
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
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.classList.remove('show'); }, 2800);
}

// ---- Expose to window so inline onclick attributes work ----
window.showToast = showToast;

window.removeFromCart = function(name) {
  cart = cart.filter(function(i) { return i.name !== name; });
  saveCart();
  updateCartCount();
  renderCheckout();
};

window.changeQty = function(name, delta) {
  const item = cart.find(function(i) { return i.name === name; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    window.removeFromCart(name);
    return;
  }
  saveCart();
  updateCartCount();
  renderCheckout();
};

window.applyPromo = function() {
  const input = document.getElementById('promo-input');
  const msg   = document.getElementById('promo-msg');
  if (!input || !msg) return;
  const code = input.value.trim().toUpperCase();
  if (code === 'FUNGI10') {
    promoApplied  = true;
    promoDiscount = getSubtotal() * 0.10;
    msg.style.display = 'block';
    msg.style.color   = '#2D6A4F';
    msg.textContent   = '✓ 10% discount applied!';
    updateTotals();
  } else if (code === 'FREESHIP') {
    shippingCost = 0;
    msg.style.display = 'block';
    msg.style.color   = '#2D6A4F';
    msg.textContent   = '✓ Free shipping applied!';
    updateTotals();
  } else {
    msg.style.display = 'block';
    msg.style.color   = '#e53e3e';
    msg.textContent   = '✗ Invalid code. Try FUNGI10 for 10% off.';
  }
};

window.goStep = function(n) {
  const steps = document.querySelectorAll('.co-step');
  steps.forEach(function(el, i) {
    el.style.display = (i === n) ? '' : 'none';
  });
  currentStep = n;

  // Update breadcrumb
  const crumbs = ['co-step-contact','co-step-shipping','co-step-payment'];
  const titles = ['Cart','Contact','Shipping','Payment','Confirmed'];
  const lbl = document.getElementById('co-step-label');
  if (lbl) lbl.textContent = titles[n] || 'Cart';
  crumbs.forEach(function(id, i) {
    const el = document.getElementById(id);
    if (!el) return;
    if (i < n) {
      el.style.opacity = '1'; el.style.fontWeight = '700'; el.style.color = '#2D6A4F';
    } else {
      el.style.opacity = '0.4'; el.style.fontWeight = '400'; el.style.color = '';
    }
  });

  if (n === 0) renderCheckout();
  window.scrollTo(0, 0);
};

window.validateContact = function() {
  const fname = (document.getElementById('co-fname') || {}).value || '';
  const lname = (document.getElementById('co-lname') || {}).value || '';
  const email = (document.getElementById('co-email') || {}).value || '';
  if (!fname.trim()) { alert('Please enter your first name.'); return; }
  if (!lname.trim()) { alert('Please enter your last name.'); return; }
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    alert('Please enter a valid email address.'); return;
  }
  window.goStep(2);
};

window.validateShipping = function() {
  const address = (document.getElementById('co-address') || {}).value || '';
  const city    = (document.getElementById('co-city')    || {}).value || '';
  const zip     = (document.getElementById('co-zip')     || {}).value || '';
  const state   = (document.getElementById('co-state')   || {}).value || '';
  if (!address.trim()) { alert('Please enter your street address.'); return; }
  if (!city.trim())    { alert('Please enter your city.'); return; }
  if (!state)          { alert('Please select your state.'); return; }
  if (!zip.trim() || !/^\d{5}(-\d{4})?$/.test(zip.trim())) {
    alert('Please enter a valid ZIP code (e.g. 10001).'); return;
  }
  const picked = document.querySelector('input[name="shipping"]:checked');
  shippingCost = (picked && picked.value === 'expedited') ? 12.99
                 : (getSubtotal() >= 60 ? 0 : 5.99);
  updateTotals();

  const apt  = (document.getElementById('co-apt') || {}).value || '';
  const pEmail = document.getElementById('pay-email-display');
  const pAddr  = document.getElementById('pay-address-display');
  const emailVal = (document.getElementById('co-email') || {}).value || '';
  if (pEmail) pEmail.textContent = emailVal;
  if (pAddr)  pAddr.textContent  = address.trim() + (apt ? ', ' + apt : '') + ', ' + city + ', ' + state + ' ' + zip;
  window.goStep(3);
};

window.validatePayment = function() {
  const cardname = ((document.getElementById('co-cardname') || {}).value || '').trim();
  const cardnum  = ((document.getElementById('co-cardnum')  || {}).value || '').replace(/\s/g,'');
  const expiry   = ((document.getElementById('co-expiry')   || {}).value || '').trim();
  const cvv      = ((document.getElementById('co-cvv')      || {}).value || '').trim();
  if (!cardname)              { alert('Please enter the name on your card.'); return; }
  if (cardnum.length < 13)    { alert('Please enter a valid card number.'); return; }
  if (!/^\d{2}\s*\/\s*\d{2}$/.test(expiry)) { alert('Please enter a valid expiry date MM / YY.'); return; }
  if (cvv.length < 3)         { alert('Please enter your CVV (3–4 digits).'); return; }

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Processing…'; btn.style.opacity = '0.7'; btn.disabled = true; }
  setTimeout(function() {
    placeOrder();
    if (btn) { btn.textContent = 'Place order →'; btn.style.opacity = '1'; btn.disabled = false; }
  }, 1800);
};

// ---- Checkout internals ----
let currentStep = 0;
let promoApplied = false;
let promoDiscount = 0;
let shippingCost = 0;

function getSubtotal() {
  return cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
}

function updateTotals() {
  const sub      = getSubtotal();
  const disc     = promoApplied ? promoDiscount : 0;
  const discSub  = Math.max(0, sub - disc);
  const tax      = discSub * 0.08;
  const total    = discSub + shippingCost + tax;

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  set('summary-subtotal', '$' + sub.toFixed(2));
  const shipEl = document.getElementById('summary-shipping');
  if (shipEl) {
    shipEl.textContent = shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2);
    shipEl.style.color = shippingCost === 0 ? '#2D6A4F' : '#111';
  }
  set('summary-tax',   '$' + tax.toFixed(2));
  set('summary-total', '$' + total.toFixed(2));

  // Discount row
  let discRow = document.getElementById('summary-discount-row');
  if (promoApplied && disc > 0) {
    if (!discRow) {
      const container = document.getElementById('summary-shipping');
      if (container && container.parentElement) {
        discRow = document.createElement('div');
        discRow.id = 'summary-discount-row';
        discRow.style.cssText = 'display:flex;justify-content:space-between;font-size:14px;color:#2D6A4F;margin-top:4px;';
        discRow.innerHTML = '<span>Promo discount</span><span style="font-weight:700;">-$' + disc.toFixed(2) + '</span>';
        container.parentElement.insertBefore(discRow, container.nextSibling);
      }
    }
  } else if (discRow) {
    discRow.remove();
  }
}

function renderCheckout() {
  const list       = document.getElementById('cart-items-list');
  const emptyMsg   = document.getElementById('cart-empty');
  const cartActs   = document.getElementById('cart-actions');
  const summaryEl  = document.getElementById('summary-items');
  if (!list) return;

  if (cart.length === 0) {
    list.style.display    = 'none';
    if (emptyMsg)  emptyMsg.style.display  = 'block';
    if (cartActs)  cartActs.style.display  = 'none';
    if (summaryEl) summaryEl.innerHTML     = '';
  } else {
    list.style.display    = 'flex';
    if (emptyMsg)  emptyMsg.style.display  = 'none';
    if (cartActs)  cartActs.style.display  = 'flex';

    list.innerHTML = cart.map(function(item) {
      var img = PRODUCT_IMAGES[item.name] ? '<img src="' + PRODUCT_IMAGES[item.name] + '" alt="' + item.name + '" style="height:64px;width:auto;object-fit:contain;" />' : '🛒';
      var bg  = PRODUCT_BG[item.name] || '#f5f0e8';
      return '<div class="cart-item-row">'
        + '<div class="cart-item-img" style="background:' + bg + ';">' + img + '</div>'
        + '<div class="cart-item-info"><h4>' + item.name + '</h4><div class="item-price">$' + item.price.toFixed(2) + ' each</div></div>'
        + '<div class="cart-item-controls">'
        +   '<button class="qty-btn" onclick="changeQty(\'' + item.name + '\',-1)">−</button>'
        +   '<span class="qty-num">' + item.qty + '</span>'
        +   '<button class="qty-btn" onclick="changeQty(\'' + item.name + '\',1)">+</button>'
        + '</div>'
        + '<div class="item-total">$' + (item.price * item.qty).toFixed(2) + '</div>'
        + '<button class="remove-btn" onclick="removeFromCart(\'' + item.name + '\')" title="Remove">✕</button>'
        + '</div>';
    }).join('');

    if (summaryEl) {
      summaryEl.innerHTML = cart.map(function(item) {
        var img = PRODUCT_IMAGES[item.name] ? '<img src="' + PRODUCT_IMAGES[item.name] + '" alt="' + item.name + '" style="height:38px;width:auto;object-fit:contain;" />' : '🛒';
        var bg  = PRODUCT_BG[item.name] || '#f5f0e8';
        return '<div class="summary-item-row">'
          + '<div class="summary-item-thumb" style="background:' + bg + ';">' + img
          + '<span class="badge-qty">' + item.qty + '</span></div>'
          + '<span class="summary-item-name">' + item.name + '</span>'
          + '<span class="summary-item-price">$' + (item.price * item.qty).toFixed(2) + '</span>'
          + '</div>';
      }).join('');
    }
  }

  // Free shipping label
  const stdPrice = document.getElementById('ship-std-price');
  if (stdPrice) {
    stdPrice.textContent = getSubtotal() >= 60 ? 'FREE' : '$5.99';
  }
  updateTotals();
}

function placeOrder() {
  var orderNum = 'FF-' + Math.random().toString(36).substr(2,6).toUpperCase();
  var fname    = ((document.getElementById('co-fname') || {}).value || 'Friend').trim();
  var email    = ((document.getElementById('co-email') || {}).value || '').trim();
  var sub      = getSubtotal();
  var disc     = promoApplied ? promoDiscount : 0;
  var tax      = (sub - disc) * 0.08;
  var total    = (sub - disc) + shippingCost + tax;

  var numEl = document.getElementById('confirm-order-num');
  if (numEl) numEl.textContent = 'Order ' + orderNum;

  var sumEl = document.getElementById('confirm-summary');
  if (sumEl) {
    var rows = cart.map(function(i) {
      return '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.06);">'
           + '<span>' + i.name + ' × ' + i.qty + '</span>'
           + '<span style="font-weight:700;">$' + (i.price * i.qty).toFixed(2) + '</span></div>';
    }).join('');
    sumEl.innerHTML = '<div style="font-weight:700;margin-bottom:12px;">Hi ' + fname + '! Here\'s what you ordered:</div>'
      + rows
      + '<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(0,0,0,0.06);">'
      + '<span>Shipping</span><span style="font-weight:700;color:#2D6A4F;">' + (shippingCost === 0 ? 'FREE' : '$' + shippingCost.toFixed(2)) + '</span></div>'
      + '<div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:900;">'
      + '<span>Total</span><span style="color:#2D6A4F;">$' + total.toFixed(2) + '</span></div>'
      + '<div style="margin-top:10px;font-size:13px;color:#6B6B6B;">Confirmation sent to <strong>' + email + '</strong> · Ships in 1–2 business days</div>';
  }

  cart = []; saveCart(); updateCartCount();
  promoApplied = false; promoDiscount = 0; shippingCost = 0;
  window.goStep(4);
}

// ---- Card field auto-formatting ----
function initCardFormatting() {
  var cardInput = document.getElementById('co-cardnum');
  if (cardInput && !cardInput._formatted) {
    cardInput._formatted = true;
    cardInput.addEventListener('input', function(e) {
      var v = e.target.value.replace(/\D/g,'').substring(0,16);
      e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
    });
  }
  var expInput = document.getElementById('co-expiry');
  if (expInput && !expInput._formatted) {
    expInput._formatted = true;
    expInput.addEventListener('input', function(e) {
      var v = e.target.value.replace(/\D/g,'').substring(0,4);
      if (v.length >= 3) v = v.substring(0,2) + ' / ' + v.substring(2);
      e.target.value = v;
    });
  }
  var cvvInput = document.getElementById('co-cvv');
  if (cvvInput && !cvvInput._formatted) {
    cvvInput._formatted = true;
    cvvInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g,'').substring(0,4);
    });
  }
  document.querySelectorAll('input[name="shipping"]').forEach(function(r) {
    if (!r._bound) {
      r._bound = true;
      r.addEventListener('change', function() {
        shippingCost = (r.value === 'expedited') ? 12.99 : (getSubtotal() >= 60 ? 0 : 5.99);
        updateTotals();
      });
    }
  });
}

// ---- Mobile menu ----
function initMobileMenu() {
  var hamburger = document.querySelector('.hamburger');
  var menu = document.querySelector('.mobile-menu');
  if (!hamburger || !menu) return;
  hamburger.addEventListener('click', function() { menu.classList.toggle('open'); });
  menu.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { menu.classList.remove('open'); });
  });
}

// ---- FAQ accordion ----
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(function(item) {
    var q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function() {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ---- Newsletter ----
function initNewsletter() {
  document.querySelectorAll('.newsletter-form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var input = form.querySelector('input');
      if (input && input.value.trim()) { showToast("Thanks! You're in. 🍄"); input.value = ''; }
    });
  });
}

// ---- Contact form ----
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    showToast("Message sent! We'll reply within 24 hours.");
    form.reset();
  });
}

// ---- Router ----
var PAGES = ['home','shop','mushrooms','science','reviews','journal','about','faq','contact','shipping','privacy','terms','pdp-blue','pdp-mango','pdp-watermelon','checkout'];

function showPage(pageId) {
  if (PAGES.indexOf(pageId) === -1) pageId = 'home';
  PAGES.forEach(function(p) {
    var el = document.getElementById('page-' + p);
    if (el) el.style.display = (p === pageId) ? '' : 'none';
  });
  window.scrollTo(0, 0);
  document.querySelectorAll('[data-page]').forEach(function(a) {
    a.classList.toggle('active-link', a.dataset.page === pageId);
  });
  if (pageId === 'checkout') {
    window.goStep(0);
    renderCheckout();
    setTimeout(initCardFormatting, 100);
  }
}

function navigate(pageId) {
  history.pushState({ page: pageId }, '', '#' + pageId);
  showPage(pageId);
  document.querySelector('.mobile-menu') && document.querySelector('.mobile-menu').classList.remove('open');
}

function initRouter() {
  // Use a single delegated click handler so dynamically-rendered links work too
  document.addEventListener('click', function(e) {
    var link = e.target.closest('[data-page]');
    if (!link) return;
    // Don't intercept if it's a regular external link
    e.preventDefault();
    navigate(link.dataset.page);
  });

  window.addEventListener('popstate', function(e) {
    showPage((e.state && e.state.page) ? e.state.page : 'home');
  });

  var hash = location.hash.replace('#','') || 'home';
  showPage(hash);
}

// ---- Add-to-cart delegation ----
function initCartButtons() {
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-add-cart]');
    if (!btn) return;
    // Make sure this isn't also a data-page link
    if (btn.dataset.page) return;
    e.preventDefault();
    e.stopPropagation();
    addToCart(btn.dataset.addCart, btn.dataset.price || '36');
  });
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  initMobileMenu();
  initFaq();
  initNewsletter();
  initContactForm();
  initCartButtons();
  initRouter(); // must be last
});
