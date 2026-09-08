# ============================================================================
#  SIPERPUS - Sistem Informasi Peminjaman Buku
#
#  Manajer paket : Bun   (pemasangan dependensi)
#  Runtime       : Node  (menjalankan hasil kompilasi NestJS)
#
#  Pembagian ini dipilih karena Bun jauh lebih cepat saat memasang dependensi,
#  sementara Node tetap dipakai sebagai runtime agar dukungan decorator dan
#  emitDecoratorMetadata milik NestJS/TypeORM berjalan sepenuhnya stabil.
# ============================================================================

# ---------- Stage 1: Dependensi lengkap (termasuk devDependencies) ----------
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- Stage 2: Dependensi produksi saja -------------------------------
FROM oven/bun:1-alpine AS deps-prod
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---------- Stage 3: Kompilasi TypeScript -----------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json nest-cli.json ./
COPY src ./src
COPY views ./views
COPY public ./public

# Vendoring aset frontend ke public/vendor supaya aplikasi tetap tampil walau tidak memiliki koneksi internet
RUN mkdir -p public/vendor/bootstrap/css public/vendor/bootstrap/js \
             public/vendor/chartjs public/vendor/bootstrap-icons/font/fonts \
 && cp node_modules/bootstrap/dist/css/bootstrap.min.css          public/vendor/bootstrap/css/ \
 && cp node_modules/bootstrap/dist/js/bootstrap.bundle.min.js     public/vendor/bootstrap/js/ \
 && cp node_modules/chart.js/dist/chart.umd.js                    public/vendor/chartjs/ \
 && cp node_modules/bootstrap-icons/font/bootstrap-icons.min.css  public/vendor/bootstrap-icons/font/ \
 && cp -r node_modules/bootstrap-icons/font/fonts/.               public/vendor/bootstrap-icons/font/fonts/

RUN ./node_modules/.bin/nest build

# ---------- Stage 4: Image akhir yang dijalankan ----------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder   /app/dist         ./dist
COPY --from=builder   /app/views        ./views
COPY --from=builder   /app/public       ./public
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
