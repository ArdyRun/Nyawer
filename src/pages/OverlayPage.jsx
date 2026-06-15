/**
 * OverlayPage.jsx — DEPRECATED
 *
 * File ini sudah tidak dipakai. Semua overlay OBS kini tersedia sebagai
 * komponen terpisah di src/pages/overlay/:
 *
 *   /overlay/alert/:streamerId   → AlertOverlay.jsx   (popup donasi + TTS)
 *   /overlay/marquee/:streamerId → MarqueeOverlay.jsx (running text donasi)
 *   /overlay/qr/:streamerId      → QROverlay.jsx      (QR code donasi)
 *
 * Routing sudah dikonfigurasi di src/router.jsx.
 * File ini bisa dihapus dengan aman.
 */

export default function OverlayPage() {
  return null
}
