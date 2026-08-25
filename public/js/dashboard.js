/* =========================================================================
   SIPERPUS — Skrip grafik halaman Dashboard
   Memakai library pihak ketiga Chart.js.

   Data tidak ditulis langsung di dalam berkas ini, melainkan dibaca dari
   atribut `data-*` pada elemen <canvas>. Nilai atribut tersebut diisi oleh
   controller dalam bentuk teks JSON. Pemisahan ini membuat berkas JavaScript
   tetap murni (tidak bercampur sintaks templat) sehingga aman diformat ulang
   oleh perkakas seperti Prettier.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  /**
   * Membaca data JSON dari atribut data-* sebuah elemen.
   *
   * @param {HTMLElement} element  Elemen yang menyimpan data.
   * @param {string}      name     Nama atribut data (tanpa awalan "data-").
   * @param {*}           fallback Nilai yang dipakai bila pembacaan gagal.
   */
  function readData(element, name, fallback) {
    try {
      return JSON.parse(element.dataset[name]);
    } catch (error) {
      console.error('Gagal membaca data grafik:', name, error);
      return fallback;
    }
  }

  // ----- Grafik batang: jumlah peminjaman per bulan -------------------------
  var monthlyCanvas = document.getElementById('monthlyChart');
  if (monthlyCanvas) {
    new Chart(monthlyCanvas, {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'Jumlah Peminjaman',
            data: readData(monthlyCanvas, 'values', []),
            backgroundColor: '#0d6efd',
            borderRadius: 5,
            maxBarThickness: 38,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  // ----- Grafik lingkaran: komposisi koleksi per kategori -------------------
  var categoryCanvas = document.getElementById('categoryChart');
  if (categoryCanvas) {
    new Chart(categoryCanvas, {
      type: 'doughnut',
      data: {
        labels: readData(categoryCanvas, 'labels', []),
        datasets: [
          {
            data: readData(categoryCanvas, 'values', []),
            backgroundColor: [
              '#0d6efd',
              '#0dcaf0',
              '#ffc107',
              '#198754',
              '#6c757d',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }
});
