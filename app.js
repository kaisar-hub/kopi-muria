(function () {
  const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

  // ══════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════
  let pilKopi = null;
  let pilJenis = null;
  let pilVarian = null;
  let qty = 1;
  const keranjang = [];

  let metode = null;       // "antar" | "ambil"
  let lokasiPelanggan = null; // { lat, lng }
  let jarakKm = null;
  let ongkir = 0;

  function hitungHarga(produk, varian) {
    return Math.round(produk.harga_1kg * varian.pengali);
  }

  function totalKeranjang() {
    return keranjang.reduce((s, i) => s + i.harga * i.qty, 0);
  }

  // ══════════════════════════════════════
  //  PAGE NAVIGATION
  // ══════════════════════════════════════
  function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ══════════════════════════════════════
  //  PAGE 1: KATALOG
  // ══════════════════════════════════════
  function renderKopi() {
    const el = document.getElementById("daftar-kopi");
    el.innerHTML = "";
    window.PRODUK.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card" + (pilKopi && pilKopi.id === p.id ? " aktif" : "");
      card.innerHTML = `
        <div class="nama">${p.nama}</div>
        <div class="desk">${p.deskripsi}</div>
        <div class="harga-info">${rupiah(p.harga_1kg)}/kg</div>`;
      card.onclick = () => { pilKopi = p; renderAll(); };
      el.appendChild(card);
    });
  }

  function renderChips(containerId, items, selected, onSelect) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("div");
      chip.className = "chip" + (selected && selected.id === item.id ? " aktif" : "");
      chip.textContent = item.label;
      chip.onclick = () => onSelect(item);
      el.appendChild(chip);
    });
  }

  function renderRingkasan() {
    const el = document.getElementById("ringkasan");
    if (!pilKopi || !pilJenis || !pilVarian) { el.style.display = "none"; return; }
    el.style.display = "block";
    const harga = hitungHarga(pilKopi, pilVarian);
    document.getElementById("detail-ringkasan").textContent =
      `${pilKopi.nama} · ${pilJenis.label} · ${pilVarian.label}`;
    document.getElementById("harga-satuan").textContent =
      `${rupiah(harga)} × ${qty} = ${rupiah(harga * qty)}`;
    document.getElementById("qty-val").textContent = qty;
  }

  function renderKeranjang() {
    const isi = document.getElementById("isi-keranjang");
    isi.innerHTML = "";
    if (keranjang.length === 0) {
      isi.innerHTML = '<div class="kosong">Belum ada pesanan</div>';
    }
    let grand = 0;
    keranjang.forEach((item, i) => {
      const sub = item.harga * item.qty;
      grand += sub;
      const row = document.createElement("div");
      row.className = "baris-item";
      row.innerHTML = `
        <span>${item.qty}× ${item.kopi} · ${item.jenis} · ${item.varian} — ${rupiah(sub)}</span>
        <span class="hapus" data-i="${i}">✕</span>`;
      row.querySelector(".hapus").onclick = () => { keranjang.splice(i, 1); renderKeranjang(); };
      isi.appendChild(row);
    });
    document.getElementById("grand-total").textContent = rupiah(grand);
    document.getElementById("lanjut").disabled = keranjang.length === 0;
  }

  function renderAll() {
    renderKopi();
    renderChips("daftar-jenis", window.JENIS, pilJenis, (j) => { pilJenis = j; renderAll(); });
    renderChips("daftar-varian", window.VARIAN, pilVarian, (v) => { pilVarian = v; renderAll(); });
    renderRingkasan();
    renderKeranjang();
  }

  // Qty buttons
  document.getElementById("qty-minus").onclick = () => { if (qty > 1) { qty--; renderRingkasan(); } };
  document.getElementById("qty-plus").onclick = () => { qty++; renderRingkasan(); };

  // Tambah ke keranjang
  document.getElementById("btn-tambah").onclick = () => {
    if (!pilKopi || !pilJenis || !pilVarian) return;
    keranjang.push({
      kopi: pilKopi.nama,
      jenis: pilJenis.label,
      varian: pilVarian.label,
      qty: qty,
      harga: hitungHarga(pilKopi, pilVarian)
    });
    pilJenis = null;
    pilVarian = null;
    qty = 1;
    renderAll();
  };

  // Lanjut ke payment
  document.getElementById("lanjut").onclick = () => {
    const nama = document.getElementById("nama").value.trim();
    if (!nama) { alert("Isi nama pemesan dulu ya."); return; }
    // Reset payment state
    metode = null;
    lokasiPelanggan = null;
    jarakKm = null;
    ongkir = 0;
    renderPayment();
    showPage("page-payment");
  };

  // ══════════════════════════════════════
  //  PAGE 2: PAYMENT
  // ══════════════════════════════════════
  function renderPayment() {
    // Reset UI
    document.getElementById("metode-antar").classList.remove("aktif");
    document.getElementById("metode-ambil").classList.remove("aktif");
    document.getElementById("bagian-lokasi").style.display = "none";
    document.getElementById("bagian-rincian").style.display = "none";
    document.getElementById("bagian-qris").style.display = "none";
    document.getElementById("lokasi-result").style.display = "none";
    document.getElementById("btn-sudah-bayar").disabled = true;

    if (metode) {
      document.getElementById("metode-" + metode).classList.add("aktif");
      if (metode === "antar") {
        document.getElementById("bagian-lokasi").style.display = "block";
      }
      if (metode === "ambil" || (metode === "antar" && jarakKm !== null)) {
        renderRincian();
      }
    }
  }

  // Pilih metode
  document.getElementById("metode-antar").onclick = () => {
    metode = "antar";
    lokasiPelanggan = null;
    jarakKm = null;
    ongkir = 0;
    renderPayment();
  };
  document.getElementById("metode-ambil").onclick = () => {
    metode = "ambil";
    ongkir = 0;
    jarakKm = null;
    lokasiPelanggan = null;
    renderPayment();
  };

  // Bagikan lokasi
  document.getElementById("btn-lokasi").onclick = () => {
    const btn = document.getElementById("btn-lokasi");
    btn.innerHTML = '<span class="spinner"></span> Mendapatkan lokasi...';
    btn.disabled = true;

    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung GPS.");
      btn.textContent = "📍 Bagikan Lokasi";
      btn.disabled = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lokasiPelanggan = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        hitungJarak();
      },
      (err) => {
        alert("Gagal mendapatkan lokasi: " + err.message);
        btn.textContent = "📍 Bagikan Lokasi";
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Hitung jarak via OSRM
  function hitungJarak() {
    const toko = window.TOKO;
    const url = `https://router.project-osrm.org/route/v1/driving/${toko.lng},${toko.lat};${lokasiPelanggan.lng},${lokasiPelanggan.lat}?overview=false`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.code !== "Ok" || !data.routes || !data.routes.length) {
          // Fallback: haversine
          jarakKm = haversine(toko.lat, toko.lng, lokasiPelanggan.lat, lokasiPelanggan.lng);
        } else {
          jarakKm = Math.round(data.routes[0].distance / 100) / 10; // 1 decimal
        }
        tentukanOngkir();
        tampilkanLokasi();
        renderRincian();
      })
      .catch(() => {
        // Fallback haversine
        jarakKm = haversine(toko.lat, toko.lng, lokasiPelanggan.lat, lokasiPelanggan.lng);
        tentukanOngkir();
        tampilkanLokasi();
        renderRincian();
      });
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  }

  function tentukanOngkir() {
    for (const tier of window.ONGKIR) {
      if (jarakKm <= tier.max) {
        ongkir = tier.biaya;
        return;
      }
    }
  }

  function tampilkanLokasi() {
    const el = document.getElementById("lokasi-result");
    el.style.display = "block";

    const tier = window.ONGKIR.find(t => jarakKm <= t.max);
    const isEkspedisi = tier && tier.biaya === -1;
    const badgeClass = isEkspedisi ? "ekspedisi" : (tier && tier.biaya === 0 ? "gratis" : "");

    el.innerHTML = `
      <div class="lokasi-info">
        <div>📍 Lokasi diterima</div>
        <div style="margin-top:6px">Jarak: <span class="jarak">${jarakKm} km</span></div>
        <div style="margin-top:6px">Ongkir: <span class="ongkir-badge ${badgeClass}">${tier.label}</span></div>
        ${isEkspedisi ? '<div style="margin-top:8px;color:var(--danger);font-size:0.85rem">Jarak terlalu jauh untuk antar langsung. Akan dikirim via ekspedisi (biaya menyusul).</div>' : ''}
      </div>`;

    document.getElementById("btn-lokasi").textContent = "📍 Perbarui Lokasi";
    document.getElementById("btn-lokasi").disabled = false;
  }

  function renderRincian() {
    const box = document.getElementById("bagian-rincian");
    const isi = document.getElementById("rincian-isi");
    box.style.display = "block";

    const sub = totalKeranjang();
    const isEkspedisi = ongkir === -1;
    const ongkirFinal = isEkspedisi ? 0 : ongkir;
    const grand = sub + ongkirFinal;

    let html = "";
    keranjang.forEach(item => {
      html += `<div class="row"><span>${item.qty}× ${item.kopi} · ${item.jenis} · ${item.varian}</span><span>${rupiah(item.harga * item.qty)}</span></div>`;
    });

    if (metode === "antar" && jarakKm !== null) {
      const ongkirLabel = isEkspedisi ? "Via ekspedisi" : (ongkir === 0 ? "Gratis" : rupiah(ongkir));
      html += `<div class="row"><span>Ongkir (${jarakKm} km)</span><span>${ongkirLabel}</span></div>`;
    }

    html += `<div class="row total-row"><span>Total</span><span>${isEkspedisi ? rupiah(sub) + " + ongkir" : rupiah(grand)}</span></div>`;
    isi.innerHTML = html;

    // Tampilkan QRIS
    const qrisBox = document.getElementById("bagian-qris");
    if (metode === "ambil" || (metode === "antar" && jarakKm !== null)) {
      qrisBox.style.display = "block";
      document.getElementById("btn-sudah-bayar").disabled = false;
    }
  }

  // Sudah bayar → kirim WA
  document.getElementById("btn-sudah-bayar").onclick = () => {
    const nama = document.getElementById("nama").value.trim();
    const catatan = document.getElementById("catatan").value.trim();
    const sub = totalKeranjang();
    const isEkspedisi = ongkir === -1;
    const ongkirFinal = isEkspedisi ? 0 : ongkir;
    const grand = sub + ongkirFinal;

    let teks = `*☕ Pesanan Kopi Muria*\n`;
    teks += `Nama: ${nama}\n`;
    teks += `Metode: ${metode === "antar" ? "Pesan Antar / COD" : "Ambil Sendiri"}\n`;
    if (metode === "antar" && jarakKm !== null) {
      teks += `Jarak: ${jarakKm} km\n`;
      teks += `Ongkir: ${isEkspedisi ? "Via ekspedisi (biaya menyusul)" : (ongkir === 0 ? "Gratis" : rupiah(ongkir))}\n`;
      if (lokasiPelanggan) {
        teks += `Lokasi: https://maps.google.com/?q=${lokasiPelanggan.lat},${lokasiPelanggan.lng}\n`;
      }
    }
    teks += `\n`;

    keranjang.forEach((item, i) => {
      const s = item.harga * item.qty;
      teks += `${i + 1}. ${item.kopi} — ${item.jenis} — ${item.varian}\n   ${item.qty}× ${rupiah(item.harga)} = ${rupiah(s)}\n`;
    });

    teks += `\n*Total: ${isEkspedisi ? rupiah(sub) + " + ongkir ekspedisi" : rupiah(grand)}*`;
    if (catatan) teks += `\nCatatan: ${catatan}`;
    teks += `\n\n✅ Sudah bayar via QRIS`;

    const wa = window.TOKO.whatsapp;
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(teks)}`;
    window.open(url, "_blank");

    showPage("page-sukses");
  };

  // Kembali
  document.getElementById("btn-kembali").onclick = () => {
    showPage("page-katalog");
  };

  // Pesan lagi
  document.getElementById("btn-pesan-lagi").onclick = () => {
    keranjang.length = 0;
    pilKopi = null;
    pilJenis = null;
    pilVarian = null;
    qty = 1;
    document.getElementById("nama").value = "";
    document.getElementById("catatan").value = "";
    renderAll();
    showPage("page-katalog");
  };

  // ══════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════
  renderAll();
})();
