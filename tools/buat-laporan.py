# -*- coding: utf-8 -*-
"""Menyusun laporan Tugas Praktik Demonstrasi dalam format PDF.

Membaca docs/DOKUMENTASI.md, merendernya menjadi PDF ber-halaman rapi, dan
menyisipkan tangkapan layar pada Bab 8 (Tampilan Aplikasi).

Dijalankan dari direktori akar proyek:
    python buat-laporan.py
"""
import io
import os
import re
import sys

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

# ============================================================================
#  Konfigurasi
# ============================================================================

ROOT = os.path.abspath('.')
SOURCE = os.path.join(ROOT, 'docs', 'DOKUMENTASI.md')
OUTPUT = os.path.join(ROOT, 'docs', 'Laporan_TPD_SIPERPUS.pdf')

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

BLUE = colors.HexColor('#0d6efd')
DARK = colors.HexColor('#1b2431')
GREY = colors.HexColor('#6b7688')
LINE = colors.HexColor('#dbe0e8')
CODE_BG = colors.HexColor('#f6f8fa')
HEAD_BG = colors.HexColor('#eef2f7')
ZEBRA = colors.HexColor('#fafbfc')

WIN_FONTS = 'C:/Windows/Fonts'

# Tangkapan layar yang disisipkan pada Bab 8, beserta keterangannya.
FIGURES = [
    ('Halaman Aplikasi/Dashboard.png',
     'Halaman 1 — Dashboard. Kartu statistik, grafik batang peminjaman per '
     'bulan dan grafik lingkaran komposisi koleksi (Chart.js), serta daftar '
     'transaksi terbaru.'),
    ('Halaman Aplikasi/Data Buku.png',
     'Halaman 2 — Data Buku (/books). Tabel koleksi dengan pencarian, lencana '
     'kategori, indikator stok, serta tombol ubah dan hapus.'),
    ('Halaman Aplikasi/Form Buku.png',
     'Halaman 3 — Form Buku (/books/new). Satu templat dipakai untuk mode '
     'tambah maupun ubah.'),
    ('Halaman Aplikasi/Transaksi Peminjaman.png',
     'Halaman 4 — Transaksi Peminjaman (/loans). Ringkasan angka, filter '
     'status, dan lencana berwarna sesuai kondisi transaksi.'),
    ('Halaman Aplikasi/Form Peminjaman.png',
     'Halaman 5 — Form Peminjaman (/loans/new). Hanya buku dengan stok '
     'tersedia yang muncul pada daftar pilihan.'),
    ('Halaman Aplikasi/Detail Peminjaman.png',
     'Halaman 6 — Detail Peminjaman (/loans/3). Transaksi yang melewati jatuh '
     'tempo ditandai merah beserta perkiraan dendanya.'),
    ('Halaman Aplikasi/Laporan & Cetak.png',
     'Halaman 7 — Laporan & Cetak (/reports). Filter periode, tombol unduh '
     'PDF, dan tombol kirim surel pengingat.'),
    ('Halaman Aplikasi/Form Ubah Transaksi.png',
     'Halaman 8 — Form Ubah Transaksi (/loans/3/edit). Pengubahan identitas, '
     'jatuh tempo, dan status peminjaman.'),
    ('Bukti Fitur/Berkas PDF.png',
     'Berkas PDF hasil cetak laporan, dibuat memakai library pdfmake.'),
    ('Bukti Fitur/Kotak masuk surel.png',
     'Kotak masuk Mailpit berisi surel yang dikirim aplikasi lewat Nodemailer.'),
    ('Bukti Fitur/Hasil pengujian.png',
     'Hasil perintah bun run test — 55 pengujian lolos pada 4 berkas spec.'),
    ('Bukti Fitur/Halaman tidak di temukan.png',
     'Halaman error 404 berbahasa Indonesia, tanpa membocorkan pesan teknis.'),
    ('Tambahan/Validasi.png',
     'Validasi sisi server menolak penyimpanan buku berkode ganda. Isian sudah '
     'lengkap sehingga lolos pemeriksaan peramban, namun ditolak aplikasi.'),
    ('Tambahan/Integritas data.png',
     'Penolakan penghapusan buku yang masih memiliki riwayat transaksi.'),
    ('Tambahan/Container.png',
     'Empat container berjalan: nginx, app, db, dan mailpit.'),
    ('Tambahan/Skema database.png',
     'Struktur tabel loans beserta indeks dan foreign key ke tabel books.'),
]

# Karakter yang tidak tersedia pada font, diganti padanan teksnya.
CHAR_MAP = {
    u'\u2705': u'Sesuai',
    u'\u2212': u'-',
}


# ============================================================================
#  Font
# ============================================================================

def register_fonts():
    """Mendaftarkan Arial dan Consolas bila tersedia, jika tidak pakai bawaan."""
    body, mono = 'Helvetica', 'Courier'
    try:
        pdfmetrics.registerFont(TTFont('Body', WIN_FONTS + '/arial.ttf'))
        pdfmetrics.registerFont(TTFont('Body-Bold', WIN_FONTS + '/arialbd.ttf'))
        pdfmetrics.registerFont(TTFont('Body-Italic', WIN_FONTS + '/ariali.ttf'))
        pdfmetrics.registerFontFamily(
            'Body', normal='Body', bold='Body-Bold', italic='Body-Italic')
        body = 'Body'
    except Exception as exc:
        print('  ! Arial tidak dipakai:', exc)
    try:
        pdfmetrics.registerFont(TTFont('Mono', WIN_FONTS + '/consola.ttf'))
        pdfmetrics.registerFont(TTFont('Mono-Bold', WIN_FONTS + '/consolab.ttf'))
        pdfmetrics.registerFontFamily('Mono', normal='Mono', bold='Mono-Bold')
        mono = 'Mono'
    except Exception as exc:
        print('  ! Consolas tidak dipakai:', exc)
    return body, mono


BODY, MONO = register_fonts()


# ============================================================================
#  Gaya
# ============================================================================

def build_styles():
    ss = getSampleStyleSheet()
    s = {}
    s['body'] = ParagraphStyle(
        'body', parent=ss['Normal'], fontName=BODY, fontSize=9.2, leading=13.6,
        alignment=TA_JUSTIFY, spaceAfter=6, textColor=colors.HexColor('#22272e'))
    s['h1'] = ParagraphStyle(
        'h1', parent=s['body'], fontName=BODY + '-Bold' if BODY != 'Helvetica' else 'Helvetica-Bold',
        fontSize=19, leading=24, alignment=TA_CENTER, textColor=DARK,
        spaceAfter=4, spaceBefore=0)
    s['h2'] = ParagraphStyle(
        'h2', parent=s['h1'], fontSize=13.5, leading=17, alignment=0,
        textColor=BLUE, spaceBefore=16, spaceAfter=2)
    s['h3'] = ParagraphStyle(
        'h3', parent=s['h1'], fontSize=11, leading=14.5, alignment=0,
        textColor=DARK, spaceBefore=11, spaceAfter=3)
    s['h4'] = ParagraphStyle(
        'h4', parent=s['h1'], fontSize=9.8, leading=13, alignment=0,
        textColor=colors.HexColor('#3d4757'), spaceBefore=9, spaceAfter=3)
    s['li'] = ParagraphStyle(
        'li', parent=s['body'], leftIndent=13, bulletIndent=3, spaceAfter=2.5,
        alignment=0)
    s['li2'] = ParagraphStyle('li2', parent=s['li'], leftIndent=26, bulletIndent=16)
    s['quote'] = ParagraphStyle(
        'quote', parent=s['body'], leftIndent=9, fontSize=8.8, leading=12.8,
        textColor=colors.HexColor('#4a5568'), alignment=0, spaceAfter=3)
    s['code'] = ParagraphStyle(
        'code', parent=ss['Code'], fontName=MONO, fontSize=7.4, leading=10.2,
        textColor=colors.HexColor('#24292f'))
    s['th'] = ParagraphStyle(
        'th', parent=s['body'], fontName=BODY + '-Bold' if BODY != 'Helvetica' else 'Helvetica-Bold',
        fontSize=7.9, leading=10.4, alignment=0, spaceAfter=0,
        textColor=DARK)
    s['td'] = ParagraphStyle(
        'td', parent=s['body'], fontSize=7.9, leading=10.4, alignment=0,
        spaceAfter=0)
    s['caption'] = ParagraphStyle(
        'caption', parent=s['body'], fontSize=8.2, leading=11.5,
        alignment=TA_CENTER, textColor=GREY, spaceBefore=4, spaceAfter=12)
    s['cover-title'] = ParagraphStyle(
        'cover-title', parent=s['h1'], fontSize=25, leading=31, spaceAfter=8)
    s['cover-sub'] = ParagraphStyle(
        'cover-sub', parent=s['body'], fontSize=12, leading=17,
        alignment=TA_CENTER, textColor=GREY, spaceAfter=3)
    return s


ST = build_styles()
BOLD_FONT = BODY + '-Bold' if BODY != 'Helvetica' else 'Helvetica-Bold'


# ============================================================================
#  Konversi markup sebaris
# ============================================================================

CODE_RE = re.compile(r'`([^`]+)`')
LINK_RE = re.compile(r'\[([^\]]*)\]\(([^)]+)\)')
AUTO_RE = re.compile(r'<((?:https?|mailto):[^>]+)>')
BOLD_RE = re.compile(r'\*\*(.+?)\*\*')
ITAL_RE = re.compile(r'(?<![\*\w])\*([^*\n]+)\*(?!\*)')


def esc(text):
    return (text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def inline(text):
    """Mengubah markup markdown sebaris menjadi markup mini reportlab."""
    for bad, good in CHAR_MAP.items():
        text = text.replace(bad, good)

    slots = []

    def stash(markup):
        slots.append(markup)
        return u'\x00%d\x00' % (len(slots) - 1)

    text = CODE_RE.sub(
        lambda m: stash(u'<font face="%s" size="8.1" color="#b02a5b">%s</font>'
                        % (MONO, esc(m.group(1)))), text)
    text = LINK_RE.sub(
        lambda m: stash(u'<link href="%s" color="#0d6efd">%s</link>'
                        % (esc(m.group(2)), esc(m.group(1)) or esc(m.group(2)))),
        text)
    text = AUTO_RE.sub(
        lambda m: stash(u'<link href="%s" color="#0d6efd">%s</link>'
                        % (esc(m.group(1)), esc(m.group(1)))), text)

    text = esc(text)
    text = BOLD_RE.sub(lambda m: u'<b>%s</b>' % m.group(1), text)
    text = ITAL_RE.sub(lambda m: u'<i>%s</i>' % m.group(1), text)

    return re.sub(u'\x00(\\d+)\x00', lambda m: slots[int(m.group(1))], text)


# ============================================================================
#  Tabel
# ============================================================================

def split_row(line):
    return [c.strip() for c in line.strip().strip('|').split('|')]


def make_table(rows):
    """Membentuk tabel reportlab dengan lebar kolom proporsional isinya."""
    header, body = rows[0], rows[1:]
    ncol = len(header)

    # Lebar kolom ditentukan dua tahap.
    #
    # Tahap 1 - LANTAI: setiap kolom dijamin cukup lebar untuk menampung kata
    # terpanjangnya secara utuh. Tanpa ini, pengenal seperti
    # "loan.service.spec.ts" akan terpotong di tengah kata.
    #
    # Tahap 2 - PROPORSI: sisa ruang dibagi menurut panjang isi tiap kolom,
    # sehingga kolom berisi kalimat panjang mendapat porsi lebih besar.
    CHAR_W = 4.7      # perkiraan lebar satu karakter pada ukuran tabel
    PAD = 11          # padding kiri dan kanan sel

    floors, weights = [], []
    for i in range(ncol):
        column = [header[i]] + [r[i] for r in body if i < len(r)]
        longest_word = 0
        longest_text = len(header[i])
        for cell in column:
            plain = re.sub(r'[`*]', '', cell)
            for word in plain.split():
                longest_word = max(longest_word, len(word))
            longest_text = max(longest_text, min(len(plain), 90))
        floors.append(min(longest_word * CHAR_W + PAD, CONTENT_W * 0.42))
        weights.append(max(longest_text, 6))

    if sum(floors) >= CONTENT_W:
        # Lantai saja sudah melebihi lebar halaman: kecilkan seluruhnya.
        scale = CONTENT_W / sum(floors)
        widths = [f * scale for f in floors]
    else:
        spare = CONTENT_W - sum(floors)
        total = float(sum(weights))
        widths = [floors[i] + spare * weights[i] / total for i in range(ncol)]

    data = [[Paragraph(inline(c), ST['th']) for c in header]]
    for r in body:
        cells = list(r) + [''] * (ncol - len(r))
        data.append([Paragraph(inline(c), ST['td']) for c in cells[:ncol]])

    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), HEAD_BG),
        ('LINEBELOW', (0, 0), (-1, 0), 0.8, BLUE),
        ('GRID', (0, 0), (-1, -1), 0.35, LINE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(('BACKGROUND', (0, i), (-1, i), ZEBRA))
    t.setStyle(TableStyle(style))
    return t


def make_code(lines, lang):
    """Membentuk blok kode dengan latar abu-abu dan garis tepi kiri."""
    text = u'\n'.join(lines).rstrip()
    for bad, good in CHAR_MAP.items():
        text = text.replace(bad, good)
    inner = Preformatted(text, ST['code'])
    t = Table([[inner]], colWidths=[CONTENT_W], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, LINE),
        ('LINEBEFORE', (0, 0), (0, -1), 2, BLUE),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def make_quote(lines):
    body = []
    for l in lines:
        if l.strip():
            body.append(Paragraph(inline(l), ST['quote']))
    if not body:
        return None
    t = Table([[body]], colWidths=[CONTENT_W], hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fbfcfd')),
        ('LINEBEFORE', (0, 0), (0, -1), 2.2, colors.HexColor('#c9d3e0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 9),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t


def make_figure(path, caption, number):
    """Menyisipkan satu tangkapan layar beserta keterangannya."""
    im = PILImage.open(path)
    w = CONTENT_W
    h = w * im.height / float(im.width)

    # Batasi tinggi agar gambar beserta keterangannya muat dalam satu halaman.
    max_h = PAGE_H - 2 * MARGIN - 60
    if h > max_h:
        h = max_h
        w = h * im.width / float(im.height)

    img = Image(path, width=w, height=h)
    img.hAlign = 'CENTER'
    cap = Paragraph(u'<b>Gambar %d.</b> %s' % (number, inline(caption)),
                    ST['caption'])
    return KeepTogether([img, cap])


# ============================================================================
#  Parser markdown
# ============================================================================

def parse(md):
    story = []
    lines = md.split('\n')
    i = 0
    skip_quote = False   # melewati daftar placeholder tangkapan layar di Bab 8

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # ---- blok kode ----
        if stripped.startswith('```'):
            lang = stripped[3:].strip()
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                buf.append(lines[i])
                i += 1
            i += 1
            story.append(Spacer(1, 3))
            story.append(make_code(buf, lang))
            story.append(Spacer(1, 7))
            continue

        # ---- tabel ----
        if stripped.startswith('|'):
            buf = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                buf.append(lines[i])
                i += 1
            rows = [split_row(b) for b in buf]
            rows = [r for r in rows
                    if not all(re.fullmatch(r':?-{2,}:?', c or '-') for c in r)]
            if rows:
                story.append(Spacer(1, 3))
                story.append(make_table(rows))
                story.append(Spacer(1, 9))
            continue

        # ---- kutipan ----
        if stripped.startswith('>'):
            buf = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                buf.append(re.sub(r'^\s*>\s?', '', lines[i]))
                i += 1
            if not skip_quote:
                q = make_quote(buf)
                if q:
                    story.append(q)
                    story.append(Spacer(1, 8))
            else:
                skip_quote = False
            continue

        # ---- judul ----
        m = re.match(r'^(#{1,4})\s+(.*)$', stripped)
        if m:
            level, text = len(m.group(1)), m.group(2)
            if level == 1:
                story.append(Paragraph(inline(text), ST['h1']))
            elif level == 2:
                if text.startswith('9.'):
                    story.append(PageBreak())
                story.append(Spacer(1, 4))
                story.append(Paragraph(inline(text), ST['h2']))
                story.append(HRFlowable(width='100%', thickness=1.1,
                                        color=BLUE, spaceBefore=1,
                                        spaceAfter=7))
                # Bab 8 diisi tangkapan layar sungguhan.
                if text.startswith('8.'):
                    story.append(Paragraph(
                        'Berikut tangkapan layar seluruh halaman aplikasi dan '
                        'bukti berjalannya setiap fitur yang telah dibangun.',
                        ST['body']))
                    story.append(Spacer(1, 6))
                    for n, (rel, cap) in enumerate(FIGURES, start=1):
                        path = os.path.join(ROOT, 'docs', rel)
                        if not os.path.exists(path):
                            print('  ! gambar hilang:', rel)
                            continue
                        story.append(make_figure(path, cap, n))
                    skip_quote = True
            elif level == 3:
                story.append(Paragraph(inline(text), ST['h3']))
            else:
                story.append(Paragraph(inline(text), ST['h4']))
            i += 1
            continue

        # ---- garis pemisah ----
        if re.fullmatch(r'-{3,}', stripped):
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width='100%', thickness=0.4, color=LINE,
                                    spaceBefore=2, spaceAfter=8))
            i += 1
            continue

        # ---- daftar berbutir ----
        m = re.match(r'^(\s*)[-*]\s+(.*)$', line)
        if m:
            indent, text = len(m.group(1)), m.group(2)
            buf = [text]
            i += 1
            # gabungkan baris lanjutan
            while (i < len(lines) and lines[i].strip()
                   and not re.match(r'^\s*[-*]\s+', lines[i])
                   and not lines[i].strip().startswith(('#', '|', '>', '```'))
                   and lines[i].startswith(' ')):
                buf.append(lines[i].strip())
                i += 1
            style = ST['li2'] if indent >= 2 else ST['li']
            story.append(Paragraph(inline(' '.join(buf)), style,
                                   bulletText=u'\u2022'))
            continue

        # ---- daftar bernomor ----
        m = re.match(r'^(\s*)(\d+)\.\s+(.*)$', line)
        if m:
            indent, num, text = len(m.group(1)), m.group(2), m.group(3)
            style = ST['li2'] if indent >= 2 else ST['li']
            story.append(Paragraph(inline(text), style, bulletText=num + '.'))
            i += 1
            continue

        # ---- paragraf ----
        if stripped:
            buf = [stripped]
            i += 1
            while (i < len(lines) and lines[i].strip()
                   and not lines[i].strip().startswith(('#', '|', '>', '```', '- ', '* '))
                   and not re.match(r'^\s*\d+\.\s', lines[i])
                   and not re.fullmatch(r'-{3,}', lines[i].strip())):
                buf.append(lines[i].strip())
                i += 1
            story.append(Paragraph(inline(' '.join(buf)), ST['body']))
            continue

        i += 1

    return story


# ============================================================================
#  Halaman sampul
# ============================================================================

def cover():
    st = []
    st.append(Spacer(1, 42 * mm))
    st.append(Paragraph('LAPORAN', ST['cover-sub']))
    st.append(Paragraph('Tugas Praktik Demonstrasi', ST['cover-title']))
    st.append(Spacer(1, 3))
    st.append(Paragraph('FR.IA.02 &mdash; Kelompok Pekerjaan 1 &amp; 2',
                        ST['cover-sub']))
    st.append(Spacer(1, 10 * mm))
    st.append(HRFlowable(width='55%', thickness=1.6, color=BLUE,
                         spaceAfter=10 * mm, hAlign='CENTER'))
    st.append(Paragraph('<b>SIPERPUS</b>', ParagraphStyle(
        'x', parent=ST['cover-title'], fontSize=20, textColor=BLUE)))
    st.append(Paragraph('Sistem Informasi Peminjaman Buku', ST['cover-sub']))
    st.append(Spacer(1, 16 * mm))

    rows = [
        ['Skema Sertifikasi', 'Pemrogram Junior (Junior Coder)'],
        ['Jenis Skema', 'Okupasi — Level KKNI 2'],
        ['Nomor Skema', '16-05/SSO/020502/X/2021'],
        ['Tempat Uji Kompetensi', 'POLINELA, Bandar Lampung'],
        ['Lembaga', 'LSP Entrepreneur Digital Indonesia'],
        ['Nama Asesi', 'Irfana Dwi Fangga'],
        ['Tanggal', '26 Agustus 2026'],
        ['Repository', 'https://github.com/irfanadwifangga/sertifikasi-lspedi'],
    ]
    data = [[Paragraph('<b>%s</b>' % k, ST['td']), Paragraph(v, ST['td'])]
            for k, v in rows]
    t = Table(data, colWidths=[46 * mm, 92 * mm], hAlign='CENTER')
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.35, LINE),
        ('BACKGROUND', (0, 0), (0, -1), HEAD_BG),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5.5),
    ]))
    st.append(t)
    st.append(NextPageTemplate('isi'))
    st.append(PageBreak())
    return st


# ============================================================================
#  Kepala & kaki halaman
# ============================================================================

def decorate(canvas, doc):
    canvas.saveState()
    canvas.setFont(BODY, 7.6)
    canvas.setFillColor(GREY)

    canvas.drawString(MARGIN, PAGE_H - MARGIN + 6 * mm,
                      'Pemrogram Junior (Junior Coder)')
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - MARGIN + 6 * mm,
                           'LSP Entrepreneur Digital Indonesia')
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, PAGE_H - MARGIN + 4 * mm,
                PAGE_W - MARGIN, PAGE_H - MARGIN + 4 * mm)

    canvas.line(MARGIN, MARGIN - 4 * mm, PAGE_W - MARGIN, MARGIN - 4 * mm)
    canvas.drawCentredString(PAGE_W / 2.0, MARGIN - 8 * mm,
                             'Halaman %d' % canvas.getPageNumber())
    canvas.restoreState()


def blank(canvas, doc):
    pass


# ============================================================================
#  Main
# ============================================================================

def main():
    if not os.path.exists(SOURCE):
        sys.exit('Sumber tidak ditemukan: %s' % SOURCE)

    md = io.open(SOURCE, encoding='utf-8').read()

    doc = BaseDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title='Laporan Tugas Praktik Demonstrasi - SIPERPUS',
        author='LSP Entrepreneur Digital Indonesia',
        subject='FR.IA.02 Tugas Praktik Demonstrasi')

    frame = Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 2 * MARGIN, id='f')
    doc.addPageTemplates([
        PageTemplate(id='sampul', frames=[frame], onPage=blank),
        PageTemplate(id='isi', frames=[frame], onPage=decorate),
    ])

    story = cover() + parse(md)
    doc.build(story)

    size = os.path.getsize(OUTPUT) / 1024.0
    print('  PDF dibuat: %s (%.0f KB)' % (OUTPUT, size))


if __name__ == '__main__':
    main()
