/** Format angka ke Rupiah. Contoh: 50000 → "Rp 50.000" */
export const formatRp = (v) =>
  'Rp ' + Number(v ?? 0).toLocaleString('id-ID')

/** Format ISO date ke string lokal singkat. */
export const formatDate = (iso) =>
  new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

/** Format ISO date ke tanggal saja (tanpa jam). */
export const formatDateShort = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

/** Potong string dan tambahkan ellipsis jika melebihi panjang. */
export const truncate = (str, n = 40) =>
  (str?.length ?? 0) > n ? str.slice(0, n) + '…' : (str ?? '')
