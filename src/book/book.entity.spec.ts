import { Book, BookCategory } from './book.entity';

/**
 * PENGUJIAN UNIT — entitas Book
 * Unit kompetensi J.620100.033.02 "Melaksanakan Pengujian Unit Program".
 *
 * Menguji method domain milik entitas {@link Book}, terutama aturan
 * pengelolaan stok yang menjadi penjaga agar jumlah eksemplar tidak pernah
 * bernilai tidak masuk akal (negatif atau melebihi stok total).
 */
describe('Book — pengelolaan stok', () => {
  /**
   * Membuat objek Book siap uji.
   *
   * @param stock     Jumlah total eksemplar.
   * @param available Jumlah eksemplar yang ada di rak.
   */
  function makeBook(stock: number, available: number): Book {
    const book = new Book();
    book.code = 'BK-001';
    book.title = 'Clean Code';
    book.author = 'Robert C. Martin';
    book.publishedYear = 2008;
    book.category = BookCategory.TECHNOLOGY;
    book.stock = stock;
    book.available = available;
    return book;
  }

  it('menyatakan buku dapat dipinjam selama stok tersedia masih ada', () => {
    expect(makeBook(3, 3).isBorrowable()).toBe(true);
    expect(makeBook(3, 1).isBorrowable()).toBe(true);
  });

  it('menyatakan buku tidak dapat dipinjam ketika stok tersedia habis', () => {
    expect(makeBook(3, 0).isBorrowable()).toBe(false);
  });

  it('mengurangi stok tersedia sebanyak satu saat buku dipinjam', () => {
    const book = makeBook(3, 3);

    book.decreaseStock();

    expect(book.available).toBe(2);
    expect(book.stock).toBe(3); // stok total tidak boleh ikut berubah
  });

  it('menolak pengurangan stok ketika stok tersedia sudah habis', () => {
    const book = makeBook(2, 0);

    expect(() => book.decreaseStock()).toThrow(/habis/i);
    expect(book.available).toBe(0); // nilai tetap, tidak menjadi negatif
  });

  it('menambah stok tersedia sebanyak satu saat buku dikembalikan', () => {
    const book = makeBook(3, 1);

    book.increaseStock();

    expect(book.available).toBe(2);
  });

  it('tidak menambah stok tersedia melebihi stok total', () => {
    const book = makeBook(3, 3);

    book.increaseStock();

    expect(book.available).toBe(3);
  });

  it('menghitung jumlah eksemplar yang sedang berada di tangan peminjam', () => {
    expect(makeBook(5, 2).borrowedCount()).toBe(3);
    expect(makeBook(5, 5).borrowedCount()).toBe(0);
  });

  it('menjaga konsistensi stok setelah rangkaian pinjam dan kembali', () => {
    const book = makeBook(2, 2);

    book.decreaseStock();
    book.decreaseStock();
    expect(book.isBorrowable()).toBe(false);
    expect(book.borrowedCount()).toBe(2);

    book.increaseStock();
    book.increaseStock();
    expect(book.available).toBe(2);
    expect(book.borrowedCount()).toBe(0);
  });
});
