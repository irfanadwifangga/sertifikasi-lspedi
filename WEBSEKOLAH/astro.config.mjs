// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

/**
 * Konfigurasi Astro untuk situs SMKS YP 96 Bukit Kemuning.
 *
 * Astro dipilih karena memakai ROUTING BERBASIS BERKAS: satu berkas di dalam
 * `src/pages/` otomatis menjadi satu halaman. Susunan ini langsung memenuhi
 * ketentuan "setiap menu utama memiliki halaman tersendiri" pada soal.
 */
export default defineConfig({
  site: "https://smk-wira-teknologi.vercel.app/",
  vite: {
    plugins: [tailwindcss()]
  }
});
