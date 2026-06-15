/** Format angka ke Rupiah. Contoh: 50000 → "Rp 50.000" */
export const formatRp = (v) =>
  'Rp ' + Number(v ?? 0).toLocaleString('id-ID')

/** Format ISO date ke string lokal singkat. */
export const formatDate = (iso) =>
  new Date(iso).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

/** Potong string dan tambahkan ellipsis jika melebihi panjang. */
export const truncate = (str, n = 40) =>
  (str?.length ?? 0) > n ? str.slice(0, n) + '…' : (str ?? '')
