/* =========================================================
   Yum Ricebites — frontend prototype (tanpa backend)
   - Header / footer / keranjang disisipkan lewat JS (satu sumber)
   - Keranjang disimpan di localStorage
   - Diskon bundling dihitung otomatis (kombinasi paling hemat)
   ========================================================= */
(function () {
  "use strict";

  var D = window.RB;
  var S = D.shop;
  var page = document.body.getAttribute("data-page") || "home";

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function rupiah(n) { return "Rp" + Math.round(n).toLocaleString("id-ID"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(id) { return D.menu.filter(function (m) { return m.id === id; })[0]; }
  function fmtPhone(p) { return p.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3"); }

  /* ---------- icons ---------- */
  var I = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    tt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c.3 2.4 1.8 3.9 4 4.1v3.1c-1.5 0-2.9-.5-4-1.3v6.2a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v3.2a2.9 2.9 0 1 0 2 2.7V3h3.1z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
  };

  /* ---------- cart state ---------- */
  var KEY = "rb_cart_v1";
  var cart = loadCart();
  var listeners = [];

  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      var out = {};
      D.menu.forEach(function (m) {
        var q = parseInt(raw[m.id], 10);
        if (q > 0) out[m.id] = Math.min(q, 99);
      });
      return out;
    } catch (e) { return {}; }
  }
  function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function qtyOf(id) { return cart[id] || 0; }
  function setQty(id, q) {
    q = Math.max(0, Math.min(99, q));
    if (q === 0) delete cart[id]; else cart[id] = q;
    saveCart();
    emit();
  }
  function clearCart() { cart = {}; saveCart(); emit(); }
  function emit() {
    refreshControls();
    updateBadge();
    renderDrawer();
    listeners.forEach(function (fn) { fn(); });
  }
  function totalQty(c) {
    return Object.keys(c).reduce(function (s, k) { return s + c[k]; }, 0);
  }
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { cart = loadCart(); emit(); }
  });

  /* ---------- pricing: kombinasi bundling paling hemat (DP) ---------- */
  function priceQty(n) {
    var unit = D.basePrice;
    var packs = [{ qty: 1, price: unit, name: null }].concat(D.bundles);
    var best = [0], pick = [null], i, j;
    for (i = 1; i <= n; i++) {
      best[i] = Infinity;
      for (j = 0; j < packs.length; j++) {
        var p = packs[j];
        if (p.qty <= i && best[i - p.qty] + p.price < best[i]) {
          best[i] = best[i - p.qty] + p.price;
          pick[i] = p;
        }
      }
    }
    var used = {}, r = n;
    while (r > 0) { var pk = pick[r]; used[pk.qty] = (used[pk.qty] || 0) + 1; r -= pk.qty; }
    var lines = D.bundles.slice().sort(function (a, b) { return b.qty - a.qty; })
      .filter(function (b) { return used[b.qty]; })
      .map(function (b) { return { name: b.name, count: used[b.qty], qty: b.qty }; });
    return { qty: n, subtotal: n * unit, total: n ? best[n] : 0, discount: n ? n * unit - best[n] : 0, singles: used[1] || 0, lines: lines };
  }
  function nextBundleHint(n) {
    var next = D.bundles.slice().sort(function (a, b) { return a.qty - b.qty; })
      .filter(function (b) { return b.qty > n; })[0];
    if (!next || n === 0) return null;
    var need = next.qty - n;
    var save = priceQty(next.qty).discount;
    if (save <= priceQty(n).discount) return null;
    return { need: need, bundle: next, save: save };
  }
  function summaryHTML(p) {
    var disc = p.discount > 0
      ? '<div class="sum-row sum-disc"><span>Diskon bundling<small>' +
        p.lines.map(function (l) { return l.count + "× " + esc(l.name); }).join(", ") +
        '</small></span><b>−' + rupiah(p.discount) + "</b></div>"
      : "";
    return '<div class="sum-row"><span>Subtotal (' + p.qty + " pcs)</span><b>" + rupiah(p.subtotal) + "</b></div>" +
      disc +
      '<div class="sum-row sum-total"><span>Total</span><b>' + rupiah(p.total) + "</b></div>";
  }
  function hintHTML(n) {
    var h = nextBundleHint(n);
    if (!h) return "";
    return '<p class="nudge">✨ Tambah <b>' + h.need + " pcs</b> lagi untuk dapat <b>" + esc(h.bundle.name) +
      "</b> — hemat " + rupiah(h.save) + ".</p>";
  }

  /* ---------- shared UI shell ---------- */
  var NAV = [
    ["home", "index.html", "Beranda"],
    ["menu", "menu.html", "Menu"],
    ["promo", "promo.html", "Promo Bundling"],
    ["kontak", "kontak.html", "Lokasi & Kontak"]
  ];

  function renderHeader() {
    var host = $("#app-header");
    if (!host) return;
    var marquee = ["NOW AVAILABLE!", "ONLY 8K", S.freeDelivery ? "FREE DELIVERY" : "", "DM FOR ORDER!"]
      .filter(Boolean);
    var track = marquee.map(function (t) { return "<span>" + t + "</span>"; }).join("");
    host.innerHTML =
      '<div class="band-pink" aria-hidden="true"></div>' +
      '<div class="band-green" aria-label="Info promo"><div class="marquee"><div class="marquee-track">' +
      track + track + track + track + "</div></div></div>" +
      '<nav class="nav" aria-label="Navigasi utama"><div class="container nav-inner">' +
      '<a class="brand" href="index.html" aria-label="Yum Ricebites — beranda"><img src="assets/logo.png" alt="" width="44" height="44"><span>Yum <em>Ricebites</em></span></a>' +
      '<ul class="nav-links" id="nav-links">' +
      NAV.map(function (n) {
        return '<li><a href="' + n[1] + '"' + (n[0] === page ? ' class="active" aria-current="page"' : "") + ">" + n[2] + "</a></li>";
      }).join("") +
      '<li class="nav-cta"><a class="btn btn-pink btn-sm" href="pesan.html">Pesan Sekarang</a></li></ul>' +
      '<div class="nav-actions">' +
      '<button class="icon-btn cart-btn" type="button" data-open-cart aria-label="Buka keranjang">' + I.bag + '<span class="badge-count" id="cart-count" hidden>0</span></button>' +
      '<button class="icon-btn nav-toggle" type="button" data-nav-toggle aria-label="Buka menu navigasi" aria-expanded="false" aria-controls="nav-links">' + I.menu + "</button>" +
      "</div></div></nav>";
  }

  function renderFooter() {
    var host = $("#app-footer");
    if (!host) return;
    host.innerHTML =
      '<div class="stripes" aria-hidden="true"></div>' +
      '<footer class="footer"><div class="container footer-grid">' +
      '<div><a class="brand brand-light" href="index.html"><img src="assets/logo.png" alt="" width="52" height="52"><span>Yum <em>Ricebites</em></span></a>' +
      "<p>" + esc(S.tagline) + "<br>Rice on the go — cuma 5K.</p></div>" +
      "<div><h4>Jelajahi</h4><ul>" +
      NAV.map(function (n) { return '<li><a href="' + n[1] + '">' + n[2] + "</a></li>"; }).join("") +
      '<li><a href="pesan.html">Pesan Online</a></li></ul></div>' +
      "<div><h4>Kunjungi kami</h4><p>" + esc(S.address) + "</p><p><b>Buka:</b> " + S.hours.openLabel + " – " + S.hours.closeLabel + " WIB</p></div>" +
      "<div><h4>Ikuti kami</h4><div class=\"social\">" +
      '<a href="https://wa.me/' + S.whatsappIntl + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wa + "</a>" +
      '<a href="https://instagram.com/' + S.instagram + '" target="_blank" rel="noopener" aria-label="Instagram">' + I.ig + "</a>" +
      '<a href="https://www.tiktok.com/@' + S.tiktok + '" target="_blank" rel="noopener" aria-label="TikTok">' + I.tt + "</a>" +
      "</div><p class=\"muted\">@" + esc(S.instagram) + "</p></div>" +
      '</div><div class="container copy">© <span id="yr"></span> ' + esc(S.name) + ". Prototype website — frontend only.</div></footer>";
    var yr = $("#yr");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  function renderShell() {
    // drawer + overlay + toast
    var shell = document.createElement("div");
    shell.innerHTML =
      '<div class="overlay" data-close-cart hidden></div>' +
      '<aside class="drawer" id="drawer" aria-label="Keranjang" aria-hidden="true">' +
      '<div class="drawer-head"><h2>Keranjang</h2><button class="icon-btn" type="button" data-close-cart aria-label="Tutup keranjang">' + I.close + "</button></div>" +
      '<div class="drawer-body" id="drawer-body"></div>' +
      '<div class="drawer-foot" id="drawer-foot"></div></aside>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
    while (shell.firstChild) document.body.appendChild(shell.firstChild);
  }

  /* ---------- cart controls (card buttons / steppers) ---------- */
  function stepperHTML(id, size) {
    var q = qtyOf(id);
    return '<div class="stepper' + (size ? " " + size : "") + '" role="group" aria-label="Jumlah">' +
      '<button type="button" data-dec="' + id + '" aria-label="Kurangi">−</button>' +
      "<span>" + q + "</span>" +
      '<button type="button" data-inc="' + id + '" aria-label="Tambah">+</button></div>';
  }
  function controlHTML(id) {
    return qtyOf(id) > 0
      ? stepperHTML(id)
      : '<button class="btn btn-green btn-sm" type="button" data-add="' + id + '">+ Tambah</button>';
  }
  function refreshControls() {
    $$("[data-ctl]").forEach(function (el) { el.innerHTML = controlHTML(el.getAttribute("data-ctl")); });
  }
  function updateBadge() {
    var n = totalQty(cart), el = $("#cart-count");
    if (!el) return;
    el.textContent = n;
    el.hidden = n === 0;
  }

  function renderDrawer() {
    var body = $("#drawer-body"), foot = $("#drawer-foot");
    if (!body) return;
    var ids = Object.keys(cart);
    if (!ids.length) {
      body.innerHTML = '<div class="empty"><img src="assets/logo.png" alt="" width="96" height="96"><p>Keranjangmu masih kosong.</p><a class="btn btn-pink" href="menu.html">Lihat menu</a></div>';
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = '<ul class="cart-list">' + ids.map(function (id) {
      var m = byId(id);
      return '<li><div class="cart-info"><b>' + esc(m.name) + "</b><small>" + rupiah(D.basePrice) + " / pcs</small></div>" +
        stepperHTML(id, "sm") +
        '<button class="icon-btn danger" type="button" data-remove="' + id + '" aria-label="Hapus ' + esc(m.name) + '">' + I.trash + "</button></li>";
    }).join("") + "</ul>" + hintHTML(totalQty(cart));
    var p = priceQty(totalQty(cart));
    foot.innerHTML = '<div class="summary">' + summaryHTML(p) + "</div>" +
      '<a class="btn btn-pink btn-block" href="pesan.html">Lanjut pesan</a>';
  }

  function openCart() {
    $("#drawer").classList.add("open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $(".overlay").hidden = false;
    document.body.classList.add("no-scroll");
  }
  function closeCart() {
    $("#drawer").classList.remove("open");
    $("#drawer").setAttribute("aria-hidden", "true");
    $(".overlay").hidden = true;
    document.body.classList.remove("no-scroll");
  }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  /* ---------- global click handling ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-add],[data-inc],[data-dec],[data-remove],[data-open-cart],[data-close-cart],[data-nav-toggle]");
    if (!t) {
      var nl = $("#nav-links");
      if (nl && nl.classList.contains("open") && !e.target.closest(".nav")) toggleNav(false);
      return;
    }
    var id;
    if ((id = t.getAttribute("data-add"))) {
      setQty(id, qtyOf(id) + 1);
      toast(byId(id).name + " ditambahkan ke keranjang");
    } else if ((id = t.getAttribute("data-inc"))) {
      setQty(id, qtyOf(id) + 1);
    } else if ((id = t.getAttribute("data-dec"))) {
      setQty(id, qtyOf(id) - 1);
    } else if ((id = t.getAttribute("data-remove"))) {
      setQty(id, 0);
    } else if (t.hasAttribute("data-open-cart")) {
      openCart();
    } else if (t.hasAttribute("data-close-cart")) {
      closeCart();
    } else if (t.hasAttribute("data-nav-toggle")) {
      toggleNav();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeCart(); toggleNav(false); }
  });
  function toggleNav(force) {
    var nl = $("#nav-links"), btn = $("[data-nav-toggle]");
    if (!nl) return;
    var open = typeof force === "boolean" ? force : !nl.classList.contains("open");
    nl.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  /* ---------- open / closed status ---------- */
  function jakartaMinutes() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var h = 0, m = 0;
    parts.forEach(function (p) {
      if (p.type === "hour") h = parseInt(p.value, 10) % 24;
      if (p.type === "minute") m = parseInt(p.value, 10);
    });
    return h * 60 + m;
  }
  function updateStatus() {
    var now = jakartaMinutes(), open = now >= S.hours.openMin && now < S.hours.closeMin;
    $$("[data-open-status]").forEach(function (el) {
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
      el.innerHTML = '<i></i>' + (open
        ? "Buka sekarang · tutup " + S.hours.closeLabel
        : "Sedang tutup · buka " + S.hours.openLabel + " WIB");
    });
  }

  /* ---------- hydrate static pages with shop data ---------- */
  function hydrate() {
    $$("[data-shop]").forEach(function (el) {
      var k = el.getAttribute("data-shop"), v;
      if (k === "hours") v = S.hours.openLabel + " – " + S.hours.closeLabel + " WIB";
      else if (k === "whatsapp") v = fmtPhone(S.whatsapp);
      else if (k === "instagram") v = "@" + S.instagram;
      else if (k === "tiktok") v = "@" + S.tiktok;
      else v = S[k];
      if (v != null) el.textContent = v;
    });
    var links = {
      wa: "https://wa.me/" + S.whatsappIntl + "?text=" + encodeURIComponent("Halo Yum Ricebites, saya mau tanya menu & pemesanan 🙂"),
      ig: "https://instagram.com/" + S.instagram,
      tt: "https://www.tiktok.com/@" + S.tiktok,
      map: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.mapQuery)
    };
    $$("[data-href]").forEach(function (el) { el.href = links[el.getAttribute("data-href")]; });
    var frame = $("#map-frame");
    if (frame) frame.src = "https://www.google.com/maps?q=" + encodeURIComponent(S.mapQuery) + "&output=embed";
    $$("[data-icon]").forEach(function (el) { el.innerHTML = I[el.getAttribute("data-icon")] || ""; });
    $$("[data-if]").forEach(function (el) { el.hidden = !S[el.getAttribute("data-if")]; });
  }

  /* ---------- menu cards & promo tiers ---------- */
  function cardHTML(m) {
    var img = m.img
      ? '<img src="' + m.img + '" alt="' + esc(m.name) + '" loading="lazy">'
      : '<img class="ph" src="assets/logo.png" alt="Placeholder foto ' + esc(m.name) + '" loading="lazy">';
    return '<article class="card reveal"><div class="card-img">' + img +
      (m.badge ? '<span class="badge">' + esc(m.badge) + "</span>" : "") + "</div>" +
      '<div class="card-body"><h3>' + esc(m.name) + "</h3><p>" + esc(m.desc) + "</p>" +
      '<div class="card-foot"><span class="price">' + rupiah(D.basePrice) + '</span><div data-ctl="' + m.id + '">' + controlHTML(m.id) + "</div></div></div></article>";
  }
  function renderMenu(el, limit) {
    if (!el) return;
    el.innerHTML = D.menu.slice(0, limit || D.menu.length).map(cardHTML).join("");
  }
  function renderTiers(el, linkHref) {
    if (!el) return;
    el.innerHTML = D.bundles.map(function (b, i) {
      var normal = b.qty * D.basePrice, save = normal - b.price;
      return '<article class="tier reveal' + (i === 1 ? " tier-hot" : "") + '">' +
        (b.tag ? '<span class="tier-tag">' + esc(b.tag) + "</span>" : "") +
        "<h3>" + esc(b.name) + '</h3><p class="tier-qty">' + b.qty + " pcs · campur rasa bebas</p>" +
        '<p class="tier-price"><s>' + rupiah(normal) + "</s> <b>" + rupiah(b.price) + "</b></p>" +
        '<p class="tier-save">Hemat ' + rupiah(save) + " · " + rupiah(b.price / b.qty) + "/pcs</p>" +
        '<a class="btn ' + (i === 1 ? "btn-pink" : "btn-green") + ' btn-block" href="' + linkHref + '">Racik paketmu</a></article>';
    }).join("");
  }

  /* ---------- promo page: paket builder ---------- */
  function initBuilder() {
    var el = $("#builder");
    if (!el) return;
    var bq = {};
    function render() {
      var n = totalQty(bq), p = priceQty(n);
      el.innerHTML =
        '<div class="builder-list">' + D.menu.map(function (m) {
          var q = bq[m.id] || 0;
          return '<div class="b-row"><div><b>' + esc(m.name) + "</b><small>" + rupiah(D.basePrice) + ' / pcs</small></div>' +
            '<div class="stepper sm"><button type="button" data-b-dec="' + m.id + '" aria-label="Kurangi ' + esc(m.name) + '">−</button><span>' + q +
            '</span><button type="button" data-b-inc="' + m.id + '" aria-label="Tambah ' + esc(m.name) + '">+</button></div></div>';
        }).join("") + "</div>" +
        '<div class="builder-sum"><h3>Ringkasan paket</h3>' +
        (n ? '<div class="summary">' + summaryHTML(p) + "</div>" + hintHTML(n) :
          '<p class="muted">Pilih rasa dulu — diskon dihitung otomatis.</p>') +
        '<div class="builder-actions"><button class="btn btn-pink btn-block" type="button" id="b-add"' + (n ? "" : " disabled") + '>Masukkan ke keranjang</button>' +
        '<button class="btn btn-ghost btn-block" type="button" id="b-reset"' + (n ? "" : " disabled") + ">Reset</button></div></div>";
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-b-inc],[data-b-dec],#b-add,#b-reset");
      if (!b) return;
      var id;
      if ((id = b.getAttribute("data-b-inc"))) bq[id] = Math.min(99, (bq[id] || 0) + 1);
      else if ((id = b.getAttribute("data-b-dec"))) { bq[id] = Math.max(0, (bq[id] || 0) - 1); if (!bq[id]) delete bq[id]; }
      else if (b.id === "b-reset") bq = {};
      else if (b.id === "b-add") {
        Object.keys(bq).forEach(function (k) { cart[k] = Math.min(99, (cart[k] || 0) + bq[k]); });
        saveCart(); bq = {}; emit();
        toast("Paket masuk keranjang 🎉");
        openCart();
      }
      render();
    });
    render();
  }

  /* ---------- order page ---------- */
  function buildWaMessage(o) {
    var lines = ["Halo Yum Ricebites! Saya mau pesan 🍙", ""];
    o.items.forEach(function (it, i) { lines.push((i + 1) + ". " + it.name + " × " + it.qty); });
    lines.push("");
    lines.push("Subtotal: " + rupiah(o.price.subtotal));
    if (o.price.discount > 0) lines.push("Diskon bundling: -" + rupiah(o.price.discount));
    lines.push("Total: " + rupiah(o.price.total));
    lines.push("");
    lines.push("Nama: " + o.name);
    lines.push("No. HP: " + o.phone);
    lines.push("Alamat: " + o.address);
    if (o.note) lines.push("Catatan: " + o.note);
    lines.push("", "Kode pesanan: " + o.code);
    return lines.join("\n");
  }

  function initOrder() {
    var form = $("#order-form");
    if (!form) return;
    var listEl = $("#order-cart");

    function renderOrderCart() {
      var ids = Object.keys(cart);
      if (!ids.length) {
        listEl.innerHTML = '<div class="empty"><img src="assets/logo.png" alt="" width="96" height="96"><p>Belum ada produk di keranjang.</p><a class="btn btn-pink" href="menu.html">Pilih menu</a></div>';
        return;
      }
      var p = priceQty(totalQty(cart));
      listEl.innerHTML = '<ul class="cart-list">' + ids.map(function (id) {
        var m = byId(id);
        return '<li><div class="cart-info"><b>' + esc(m.name) + "</b><small>" + rupiah(D.basePrice) + " / pcs</small></div>" +
          stepperHTML(id, "sm") +
          '<button class="icon-btn danger" type="button" data-remove="' + id + '" aria-label="Hapus ' + esc(m.name) + '">' + I.trash + "</button></li>";
      }).join("") + "</ul>" + hintHTML(p.qty) + '<div class="summary">' + summaryHTML(p) + "</div>" +
        '<a class="link-more" href="promo.html">Lihat promo bundling →</a>';
    }
    listeners.push(renderOrderCart);
    renderOrderCart();

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Nama minimal 2 karakter."; },
      phone: function (v) {
        return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Masukkan nomor HP Indonesia yang valid, mis. 0812xxxxxxx.";
      },
      address: function (v) { return v.trim().length >= 8 ? "" : "Alamat pengantaran minimal 8 karakter."; }
    };
    function validate(field) {
      var input = form.elements[field], msg = rules[field](input.value);
      var err = $("#err-" + field);
      err.textContent = msg;
      input.classList.toggle("invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }
    Object.keys(rules).forEach(function (f) {
      form.elements[f].addEventListener("blur", function () { validate(f); });
      form.elements[f].addEventListener("input", function () { if (form.elements[f].classList.contains("invalid")) validate(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = Object.keys(rules).map(validate).every(Boolean);
      if (!Object.keys(cart).length) {
        toast("Keranjang masih kosong — pilih menu dulu ya.");
        listEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (!ok) {
        var first = form.querySelector(".invalid");
        if (first) first.focus();
        return;
      }
      var items = Object.keys(cart).map(function (id) { return { id: id, name: byId(id).name, qty: cart[id] }; });
      var order = {
        code: "RB-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        address: form.elements.address.value.trim(),
        note: form.elements.note.value.trim(),
        items: items,
        price: priceQty(totalQty(cart)),
        createdAt: new Date().toISOString()
      };
      try { localStorage.setItem("rb_last_order", JSON.stringify(order)); } catch (err) {}
      showSuccess(order);
    });

    function showSuccess(o) {
      var wa = "https://wa.me/" + S.whatsappIntl + "?text=" + encodeURIComponent(buildWaMessage(o));
      var modal = document.createElement("div");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "m-title");
      modal.innerHTML =
        '<div class="modal-card"><div class="m-check">' + I.check + "</div>" +
        '<h2 id="m-title">Pesanan siap dikirim!</h2>' +
        '<p class="muted">Kode pesanan <b>' + o.code + "</b></p>" +
        '<ul class="m-items">' + o.items.map(function (it) { return "<li><span>" + esc(it.name) + "</span><b>×" + it.qty + "</b></li>"; }).join("") + "</ul>" +
        '<div class="summary">' + summaryHTML(o.price) + "</div>" +
        '<p class="m-note">Ini prototype tanpa server — klik tombol di bawah untuk mengirim detail pesananmu ke WhatsApp penjual.</p>' +
        '<a class="btn btn-pink btn-block" href="' + wa + '" target="_blank" rel="noopener">Kirim pesanan via WhatsApp</a>' +
        '<button class="btn btn-ghost btn-block" type="button" id="m-done">Selesai</button></div>';
      document.body.appendChild(modal);
      document.body.classList.add("no-scroll");
      $("#m-done", modal).focus();
      $("#m-done", modal).addEventListener("click", function () {
        modal.remove();
        document.body.classList.remove("no-scroll");
        form.reset();
        clearCart();
      });
    }
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    var els = $$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- boot ---------- */
  renderHeader();
  renderFooter();
  renderShell();
  renderMenu($("#menu-grid"));
  renderMenu($("#featured"), 4);
  renderTiers($("#tiers"), "promo.html#builder");
  renderTiers($("#tiers-promo"), "#builder");
  hydrate();
  initBuilder();
  initOrder();
  updateBadge();
  renderDrawer();
  updateStatus();
  setInterval(updateStatus, 60000);
  initReveal();

  // expose for debugging / unit tests
  window.RBApp = { priceQty: priceQty, rupiah: rupiah };
})();
