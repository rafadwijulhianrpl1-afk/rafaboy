// Kategori layanan. Huruf menjadi awalan nomor (A001, B001, C001)
// dan tiap kategori punya hitungan sendiri.
const KATEGORI = {
  A: { nama: 'Tata Usaha', ket: 'Surat keterangan, legalisir' },
  B: { nama: 'Keuangan',   ket: 'SPP dan pembayaran' },
  C: { nama: 'Kesiswaan',  ket: 'Data dan kartu siswa' }
};
const KUNCI = 'antrian-sekolah-v1';
const $ = id => document.getElementById(id);

let pilih = 'A';   // kategori yang sedang dipilih pengunjung
let s = muat();    // seluruh data antrian

function baru() {
  return { hitung: { A: 0, B: 0, C: 0 }, antrian: [], sekarang: null, riwayat: [] };
}

function muat() {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI));
    if (d && d.hitung && Array.isArray(d.antrian)) return d;
  } catch (e) {}
  return baru();
}

function simpan() {
  try { localStorage.setItem(KUNCI, JSON.stringify(s)); } catch (e) {}
}

const kode = t => t.k + String(t.n).padStart(3, '0');
const jam = () => new Date()
  .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  .replace('.', ':');

// ===== Ambil nomor: nomor dibuat otomatis, naik satu per kategori =====
function ambilNomor() {
  s.hitung[pilih]++;
  const t = { k: pilih, n: s.hitung[pilih], jam: jam() };
  s.antrian.push(t);
  const didepan = s.antrian.length - 1;
  simpan();
  render();

  const el = $('tiket');
  el.hidden = false;
  el.innerHTML = 'Nomor Anda<br><b>' + kode(t) + '</b><br>' + KATEGORI[pilih].nama + ', ' +
    (didepan ? didepan + ' antrian di depan Anda' : 'Anda yang berikutnya');
}

// ===== Panggil berikutnya: ambil antrian paling depan =====
function panggilBerikutnya() {
  if (!s.antrian.length) {
    $('layanan').textContent = 'Antrian kosong, belum ada yang menunggu.';
    return;
  }
  if (s.sekarang) s.riwayat.unshift(s.sekarang);
  s.riwayat = s.riwayat.slice(0, 5);
  s.sekarang = s.antrian.shift();
  simpan();
  render(true);
  ucapkan();
}

// ===== Suara panggilan dengan Web Speech API =====
function ucapkan() {
  if (!s.sekarang || !$('suara').checked || !('speechSynthesis' in window)) return;
  const t = s.sekarang;
  const u = new SpeechSynthesisUtterance(
    'Nomor antrian ' + t.k + ' ' + t.n + ', layanan ' + KATEGORI[t.k].nama +
    ', silakan menuju loket');
  u.lang = 'id-ID';
  u.rate = 0.9;

  const suaraId = speechSynthesis.getVoices()
    .find(v => v.lang.toLowerCase().startsWith('id'));
  if (suaraId) u.voice = suaraId;

  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ===== Reset: hapus semua antrian dan mulai nomor dari awal =====
function reset() {
  if (!confirm('Reset semua antrian dan mulai nomor dari awal?')) return;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  s = baru();
  simpan();
  $('tiket').hidden = true;
  render();
}

// ===== Tampilan =====
const baris = t =>
  '<li class="row"><b>' + kode(t) + '</b><span>' + KATEGORI[t.k].nama +
  '</span><small>' + t.jam + '</small></li>';

function render(kedip) {
  const n = $('nomor');
  n.textContent = s.sekarang ? kode(s.sekarang) : '---';
  n.classList.remove('baru');
  if (kedip) { void n.offsetWidth; n.classList.add('baru'); }

  $('layanan').textContent = s.sekarang
    ? KATEGORI[s.sekarang.k].nama
    : 'Belum ada yang dipanggil';

  $('daftarKat').innerHTML = Object.keys(KATEGORI).map(k => {
    const menunggu = s.antrian.filter(t => t.k === k).length;
    return '<button class="kat" data-k="' + k + '" aria-pressed="' + (k === pilih) + '">' +
      '<span>' + k + '. ' + KATEGORI[k].nama + '<br><small>' + KATEGORI[k].ket + '</small></span>' +
      '<small>' + menunggu + ' menunggu</small></button>';
  }).join('');

  $('jumlah').textContent = s.antrian.length ? '(' + s.antrian.length + ' menunggu)' : '';

  $('antrian').innerHTML = s.antrian.length
    ? s.antrian.map(baris).join('')
    : '<li class="kosong">Belum ada yang mengantri. Ambil nomor untuk memulai.</li>';

  $('riwayat').innerHTML = s.riwayat.length
    ? s.riwayat.map(baris).join('')
    : '<li class="kosong">Belum ada nomor yang selesai dipanggil.</li>';
}

// ===== Event tombol =====
$('daftarKat').addEventListener('click', e => {
  const b = e.target.closest('.kat');
  if (!b) return;
  pilih = b.dataset.k;
  document.querySelectorAll('.kat').forEach(x => x.setAttribute('aria-pressed', x === b));
});
$('btnAmbil').addEventListener('click', ambilNomor);
$('btnNext').addEventListener('click', panggilBerikutnya);
$('btnUlang').addEventListener('click', ucapkan);
$('btnReset').addEventListener('click', reset);

render();