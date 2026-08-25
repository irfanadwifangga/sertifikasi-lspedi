import { LoanService } from './loan.service';
import { Loan, LoanStatus } from './loan.entity';

/**
 * PENGUJIAN UNIT — LoanService dan entitas Loan
 * Unit kompetensi J.620100.033.02 "Melaksanakan Pengujian Unit Program".
 *
 * Berkas ini menguji logika bisnis paling kritis pada aplikasi: perhitungan
 * denda keterlambatan, pembentukan kode transaksi, pengaruh perubahan status
 * terhadap stok, dan penyiapan data untuk templat.
 *
 * Method yang diuji bersifat STATIS dan MURNI (tidak menyentuh basis data
 * maupun jaringan), sehingga pengujian berjalan cepat dan hasilnya selalu
 * sama setiap kali dijalankan.
 */
describe('LoanService — perhitungan denda', () => {
  const RATE = 1000;

  it('tidak mengenakan denda bila buku dikembalikan tepat pada jatuh tempo', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10'),
      new Date('2026-08-10'),
      RATE,
    );

    expect(fine).toBe(0);
  });

  it('tidak mengenakan denda bila buku dikembalikan lebih awal', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10'),
      new Date('2026-08-07'),
      RATE,
    );

    expect(fine).toBe(0);
  });

  it('mengenakan denda satu hari bila terlambat satu hari', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10'),
      new Date('2026-08-11'),
      RATE,
    );

    expect(fine).toBe(1000);
  });

  it('mengalikan jumlah hari keterlambatan dengan tarif per hari', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10'),
      new Date('2026-08-17'),
      RATE,
    );

    // Terlambat 7 hari x Rp 1.000 = Rp 7.000
    expect(fine).toBe(7000);
  });

  it('mengabaikan komponen jam sehingga selisih tetap dihitung per hari', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10T23:00:00'),
      new Date('2026-08-11T01:00:00'),
      RATE,
    );

    // Selisih hanya 2 jam, tetapi sudah berbeda hari -> terlambat 1 hari.
    expect(fine).toBe(1000);
  });

  it('tetap bekerja benar ketika keterlambatan melewati pergantian bulan', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-30'),
      new Date('2026-09-02'),
      RATE,
    );

    expect(fine).toBe(3000);
  });

  it('menyesuaikan hasil bila tarif denda per hari diubah', () => {
    const fine = LoanService.calculateFine(
      new Date('2026-08-10'),
      new Date('2026-08-15'),
      2500,
    );

    expect(fine).toBe(12500);
  });
});

describe('LoanService — pembentukan kode transaksi', () => {
  it('membentuk kode dengan format PJM-YYYYMMDD-NNN', () => {
    expect(LoanService.buildCode(new Date('2026-08-25'), 7)).toBe(
      'PJM-20260825-007',
    );
  });

  it('menambahkan angka nol di depan pada tanggal satu digit', () => {
    expect(LoanService.buildCode(new Date('2026-01-05'), 1)).toBe(
      'PJM-20260105-001',
    );
  });

  it('tidak memotong nomor urut yang sudah tiga digit', () => {
    expect(LoanService.buildCode(new Date('2026-12-31'), 128)).toBe(
      'PJM-20261231-128',
    );
  });
});

describe('LoanService — pengaruh perubahan status terhadap stok', () => {
  const BORROWED = LoanStatus.BORROWED;
  const RETURNED = LoanStatus.RETURNED;

  it('menambah stok ketika status berubah dari Dipinjam ke Dikembalikan', () => {
    expect(LoanService.stockEffect(BORROWED, RETURNED)).toBe('increase');
  });

  it('mengurangi stok ketika status berubah dari Dikembalikan ke Dipinjam', () => {
    expect(LoanService.stockEffect(RETURNED, BORROWED)).toBe('decrease');
  });

  it('tidak mengubah stok ketika status disimpan tanpa perubahan', () => {
    expect(LoanService.stockEffect(BORROWED, BORROWED)).toBe('none');
    expect(LoanService.stockEffect(RETURNED, RETURNED)).toBe('none');
  });

  it('menjaga stok tetap seimbang setelah perubahan status bolak-balik', () => {
    // Setiap 'decrease' selalu punya pasangan 'increase', sehingga jumlah stok
    // kembali ke nilai semula setelah rangkaian perubahan status.
    const transitions: [LoanStatus, LoanStatus][] = [
      [BORROWED, RETURNED],
      [RETURNED, BORROWED],
      [BORROWED, RETURNED],
      [RETURNED, BORROWED],
    ];

    let stock = 0;
    for (const [oldStatus, newStatus] of transitions) {
      const effect = LoanService.stockEffect(oldStatus, newStatus);
      if (effect === 'increase') {
        stock += 1;
      } else if (effect === 'decrease') {
        stock -= 1;
      }
    }

    expect(stock).toBe(0);
  });
});

describe('Loan — perilaku entitas', () => {
  /**
   * Membuat objek Loan untuk keperluan pengujian.
   *
   * @param dueAt      Tanggal jatuh tempo transaksi.
   * @param returnedAt Tanggal pengembalian (null bila belum dikembalikan).
   */
  function makeLoan(dueAt: Date, returnedAt: Date | null): Loan {
    const loan = new Loan();
    loan.dueAt = dueAt;
    loan.returnedAt = returnedAt;
    loan.status = returnedAt ? LoanStatus.RETURNED : LoanStatus.BORROWED;
    return loan;
  }

  it('menghitung nol hari keterlambatan bila belum melewati jatuh tempo', () => {
    const loan = makeLoan(new Date('2026-08-20'), null);

    expect(loan.overdueDays(new Date('2026-08-18'))).toBe(0);
    expect(loan.isOverdue(new Date('2026-08-18'))).toBe(false);
  });

  it('menghitung hari keterlambatan terhadap hari ini bila belum dikembalikan', () => {
    const loan = makeLoan(new Date('2026-08-20'), null);

    expect(loan.overdueDays(new Date('2026-08-25'))).toBe(5);
    expect(loan.isOverdue(new Date('2026-08-25'))).toBe(true);
  });

  it('menghitung hari keterlambatan terhadap tanggal kembali bila sudah dikembalikan', () => {
    const loan = makeLoan(new Date('2026-08-20'), new Date('2026-08-22'));

    // Meski hari ini sudah jauh lewat, acuannya tetap tanggal kembali.
    expect(loan.overdueDays(new Date('2026-09-30'))).toBe(2);
  });

  it('menampilkan label "Terlambat" untuk transaksi yang lewat jatuh tempo', () => {
    const loan = makeLoan(new Date('2026-08-20'), null);

    expect(loan.displayStatus(new Date('2026-08-25'))).toBe('Terlambat');
  });

  it('menampilkan label "Dipinjam" untuk transaksi yang masih dalam tenggat', () => {
    const loan = makeLoan(new Date('2026-08-20'), null);

    expect(loan.displayStatus(new Date('2026-08-15'))).toBe('Dipinjam');
  });

  it('menampilkan label "Dikembalikan" untuk transaksi yang sudah selesai', () => {
    const loan = makeLoan(new Date('2026-08-20'), new Date('2026-08-19'));

    expect(loan.displayStatus(new Date('2026-09-01'))).toBe('Dikembalikan');
    expect(loan.isOngoing()).toBe(false);
  });
});

describe('Loan — penyiapan data untuk templat (toView)', () => {
  /**
   * Membuat objek Loan siap uji.
   *
   * @param dueAt      Tanggal jatuh tempo transaksi.
   * @param returnedAt Tanggal pengembalian (null bila belum dikembalikan).
   */
  function makeLoan(dueAt: Date, returnedAt: Date | null): Loan {
    const loan = new Loan();
    loan.code = 'PJM-20260819-004';
    loan.borrowerName = 'Dewi Lestari';
    loan.borrowedAt = new Date('2026-08-19');
    loan.dueAt = dueAt;
    loan.returnedAt = returnedAt;
    loan.fine = 0;
    loan.status = returnedAt ? LoanStatus.RETURNED : LoanStatus.BORROWED;
    return loan;
  }

  it('mengubah hasil method domain menjadi properti biasa', () => {
    const view = makeLoan(new Date('2026-08-26'), null).toView(
      new Date('2026-08-25'),
    );

    // Mesin templat Handlebars tidak dapat diandalkan memanggil method kelas,
    // sehingga nilainya wajib sudah berupa properti biasa di sini.
    expect(typeof view.isOngoing).toBe('boolean');
    expect(typeof view.displayStatus).toBe('string');
    expect(typeof view.overdueDays).toBe('number');
    expect(typeof view.isOverdue).toBe('boolean');
  });

  it('menyertakan seluruh atribut data aslinya', () => {
    const view = makeLoan(new Date('2026-08-26'), null).toView();

    expect(view.code).toBe('PJM-20260819-004');
    expect(view.borrowerName).toBe('Dewi Lestari');
    expect(view.fine).toBe(0);
  });

  it('menandai transaksi yang masih dipinjam dan belum jatuh tempo', () => {
    const view = makeLoan(new Date('2026-08-26'), null).toView(
      new Date('2026-08-25'),
    );

    expect(view.isOngoing).toBe(true);
    expect(view.isOverdue).toBe(false);
    expect(view.overdueDays).toBe(0);
    expect(view.displayStatus).toBe('Dipinjam');
  });

  it('menandai transaksi yang masih dipinjam dan sudah lewat jatuh tempo', () => {
    const view = makeLoan(new Date('2026-08-22'), null).toView(
      new Date('2026-08-25'),
    );

    expect(view.isOngoing).toBe(true);
    expect(view.isOverdue).toBe(true);
    expect(view.overdueDays).toBe(3);
    expect(view.displayStatus).toBe('Terlambat');
  });

  it('menandai transaksi yang sudah dikembalikan', () => {
    const view = makeLoan(new Date('2026-08-26'), new Date('2026-08-24')).toView(
      new Date('2026-08-25'),
    );

    expect(view.isOngoing).toBe(false);
    expect(view.displayStatus).toBe('Dikembalikan');
  });

  it('menghasilkan objek biasa, bukan instance kelas Loan', () => {
    const view = makeLoan(new Date('2026-08-26'), null).toView();

    // Objek biasa inilah yang membuat Handlebars dapat membacanya, sebab
    // Handlebars 4.6+ memblokir akses ke anggota di prototype sebuah kelas.
    expect(view).not.toBeInstanceOf(Loan);
    expect(Object.getPrototypeOf(view)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(view, 'isOngoing')).toBe(true);
  });
});
