import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookCategory } from './book.entity';
import { validateDto } from '../common/validation';
import { errorMessage } from '../common/error';

/**
 * BookController — kelas pengendali yang menangani seluruh request HTTP
 * pada rute `/books` (HALAMAN 2 dan HALAMAN 3 aplikasi).
 *
 * Penerapan konsep OOP:
 *  - Dependency Injection: {@link BookService} disuntikkan lewat constructor.
 *  - Enkapsulasi         : controller hanya mengurus alur request-response;
 *                          logika bisnis sepenuhnya didelegasikan ke service.
 */
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  /**
   * HALAMAN 2 — Data Buku.
   * Menampilkan tabel seluruh koleksi buku beserta fasilitas pencarian.
   *
   * @param search  Kata kunci pencarian dari query string.
   * @param success Pesan notifikasi hasil operasi sebelumnya.
   */
  @Get()
  @Render('book/index')
  async index(
    @Query('search') search?: string,
    @Query('success') success?: string,
  ) {
    const books = await this.bookService.findAll(search);
    return {
      title: 'Data Buku',
      menu: 'books',
      books,
      search: search ?? '',
      total: books.length,
      success,
    };
  }

  /**
   * HALAMAN 3 — Form Buku (mode tambah).
   */
  @Get('new')
  @Render('book/form')
  newForm() {
    return {
      title: 'Tambah Buku',
      menu: 'books',
      mode: 'new',
      action: '/books',
      book: {
        category: BookCategory.GENERAL,
        stock: 1,
        publishedYear: new Date().getFullYear(),
      },
      categories: Object.values(BookCategory),
      errors: [],
    };
  }

  /**
   * Memproses penyimpanan buku baru (operasi CREATE).
   *
   * Alur: validasi DTO -> bila gagal tampilkan ulang form beserta pesan error,
   * bila berhasil simpan ke basis data lalu alihkan ke halaman daftar buku.
   */
  @Post()
  async store(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const rerender = (messages: string[]) =>
      res.render('book/form', {
        title: 'Tambah Buku',
        menu: 'books',
        mode: 'new',
        action: '/books',
        book: body,
        categories: Object.values(BookCategory),
        errors: messages,
      });

    const { dto, errors } = await validateDto(CreateBookDto, body);
    if (errors.length > 0) {
      return rerender(errors);
    }

    try {
      await this.bookService.create(dto);
    } catch (error) {
      return rerender([errorMessage(error)]);
    }

    return res.redirect(
      '/books?success=' + encodeURIComponent('Data buku berhasil ditambahkan.'),
    );
  }

  /**
   * HALAMAN 3 — Form Buku (mode ubah).
   *
   * @param id ID buku yang akan diubah.
   */
  @Get(':id/edit')
  @Render('book/form')
  async editForm(@Param('id', ParseIntPipe) id: number) {
    const book = await this.bookService.findOne(id);
    return {
      title: 'Ubah Buku',
      menu: 'books',
      mode: 'edit',
      action: '/books/' + id,
      book,
      categories: Object.values(BookCategory),
      errors: [],
    };
  }

  /**
   * Memproses pengubahan data buku (operasi UPDATE).
   */
  @Post(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const rerender = (messages: string[]) =>
      res.render('book/form', {
        title: 'Ubah Buku',
        menu: 'books',
        mode: 'edit',
        action: '/books/' + id,
        book: { ...body, id },
        categories: Object.values(BookCategory),
        errors: messages,
      });

    const { dto, errors } = await validateDto(UpdateBookDto, body);
    if (errors.length > 0) {
      return rerender(errors);
    }

    try {
      await this.bookService.update(id, dto);
    } catch (error) {
      return rerender([errorMessage(error)]);
    }

    return res.redirect(
      '/books?success=' + encodeURIComponent('Data buku berhasil diperbarui.'),
    );
  }

  /**
   * Memproses penghapusan data buku (operasi DELETE).
   */
  @Post(':id/delete')
  async destroy(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.bookService.remove(id);
    } catch (error) {
      return res.redirect(
        '/books?success=' + encodeURIComponent(errorMessage(error)),
      );
    }
    return res.redirect(
      '/books?success=' + encodeURIComponent('Data buku berhasil dihapus.'),
    );
  }
}
