(function () {
  const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

  let pilKopi = null;
  let pilJenis = null;
  let pilVarian = null;
  let qty = 1;
  const keranjang = []; // { kopi, jenis, varian, qty, harga }

  function hitungHarga(produk, varian) {
    return Math.round(produk.harga_1kg * varian.pengali);
  }

  // ── Render pilihan kopi ──
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

  // ── Render chips ──
  function renderChips(containerId, items, selected, onSelect, labelKey) {
    const el = document.getElementById(containerId);
    el.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("div");
      chip.className = "chip" + (selected && selected.id === item.id ? " aktif" : "");
      chip.textContent = item[labelKey || "label"];
      chip.onclick = () => onSelect(item);
      el.appendChild(chip);
    });
  }

  // ── Ringkasan ──
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

  // ── Keranjang ──
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

  // ── Render semua ──
  function renderAll() {
    renderKopi();
    renderChips("daftar-jenis", window.JENIS, pilJenis, (j) => { pilJenis = j; renderAll(); });
    renderChips("daftar-varian", window.VARIAN, pilVarian, (v) => { pilVarian = v; renderAll(); });
    renderRingkasan();
    renderKeranjang();
  }

  // ── Qty buttons ──
  document.getElementById("qty-minus").onclick = () => { if (qty > 1) { qty--; renderRingkasan(); } };
  document.getElementById("qty-plus").onclick = () => { qty++; renderRingkasan(); };

  // ── Tambah ke keranjang ──
  document.getElementById("btn-tambah").onclick = () => {
    if (!pilKopi || !pilJenis || !pilVarian) return;
    keranjang.push({
      kopi: pilKopi.nama,
      jenis: pilJenis.label,
      varian: pilVarian.label,
      qty: qty,
      harga: hitungHarga(pilKopi, pilVarian)
    });
    // Reset pilihan
    pilJenis = null;
    pilVarian = null;
    qty = 1;
    renderAll();
  };

  // ── Pesan via WA ──
  document.getElementById("lanjut").onclick = () => {
    const nama = document.getElementById("nama").value.trim();
    const catatan = document.getElementById("catatan").value.trim();
    if (!nama) { alert("Isi nama pemesan dulu ya."); return; }

    let teks = `*Pesanan Kopi Muria*\nNama: ${nama}\n\n`;
    let grand = 0;
    keranjang.forEach((item, i) => {
      const sub = item.harga * item.qty;
      grand += sub;
      teks += `${i + 1}. ${item.kopi} — ${item.jenis} — ${item.varian}\n   ${item.qty}× ${rupiah(item.harga)} = ${rupiah(sub)}\n`;
    });
    teks += `\n*Total: ${rupiah(grand)}*`;
    if (catatan) teks += `\nCatatan: ${catatan}`;

    const wa = window.TOKO.whatsapp;
    if (wa) {
      const url = `https://wa.me/${wa}?text=${encodeURIComponent(teks)}`;
      window.open(url, "_blank");
    } else {
      alert("Nomor WhatsApp belum diatur.\n\n" + teks);
    }
  };

  renderAll();
})();
