import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  TrendingDown,
  Monitor,
  Wallet,
  ChevronRight,
  ArrowRight,
  Shield,
  Star,
  Users,
  DollarSign,
  Play,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  Radio,
  Cpu,
  Globe,
} from 'lucide-react';

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Fitur', href: '#features' },
    { label: 'Simulasi Potongan', href: '#simulation' },
    { label: 'Pembayaran', href: '#payment' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-lg shadow-black/20 py-3'
          : 'bg-transparent py-4'
      }`}
      id="navbar"
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" id="nav-logo" className="flex items-center gap-2.5 group select-none">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center transition-colors group-hover:bg-violet-500">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider text-zinc-50">
            NYAWER
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              id={`nav-link-${link.label.toLowerCase().replace(/\s/g, '-')}`}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            id="nav-btn-masuk"
            onClick={() => navigate('/login')}
            className="btn-glass px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Masuk
          </button>
          <button
            id="nav-btn-daftar"
            onClick={() => navigate('/register')}
            className="btn-neon px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Daftar Gratis
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          id="nav-mobile-toggle"
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden glass-nav border-t border-zinc-800/40 transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 py-2 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-2.5 pt-3 border-t border-zinc-800/40">
            <button
              onClick={() => { navigate('/login'); setMobileOpen(false); }}
              className="btn-glass flex-1 py-2 text-xs font-semibold"
            >
              Masuk
            </button>
            <button
              onClick={() => { navigate('/register'); setMobileOpen(false); }}
              className="btn-neon flex-1 py-2 text-xs font-semibold"
            >
              Daftar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────── */
function HeroSection() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  // Animate percentage counter
  useEffect(() => {
    let frame;
    let start = null;
    const target = 4;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, 600);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-grid pt-16"
      style={{ background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(124, 58, 237, 0.04) 0%, transparent 60%), #09090b' }}
    >
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-20">
        {/* Badge */}
        <div className="flex justify-center mb-6 animate-slide-up">
          <div className="badge-neon">
            <span className="dot" />
            Platform Donasi Streamer Indonesia
          </div>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-black leading-none mb-6 animate-slide-up delay-100 text-zinc-50"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight">
            SUPPORT STREAMER-MU
          </span>
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-2 font-black text-zinc-400">
            CUMA KENA <span className="text-violet-500">{count}%</span>
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto mb-8 font-normal leading-relaxed animate-slide-up delay-200"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          Potongan flat 4% tanpa biaya tersembunyi. Dukungan Anda terkirim penuh ke streamer favorit, bukan ke kantong platform.
        </p>

        {/* Stats row */}
        <div
          className="flex flex-wrap justify-center gap-8 mb-10 animate-slide-up delay-200"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          {[
            { label: 'Streamer Aktif', value: '12K+', icon: Users },
            { label: 'Donasi Tersalur', value: 'Rp 8M+', icon: DollarSign },
            { label: 'Rating Kepuasan', value: '4.9 / 5', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon size={13} className="text-zinc-500" />
                <span className="text-xl font-display font-extrabold text-zinc-100">
                  {value}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3.5 justify-center items-center animate-slide-up delay-300"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          <button
            id="hero-btn-mulai"
            onClick={() => navigate('/register')}
            className="btn-neon px-6 py-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Zap size={15} className="fill-current" />
            Mulai Nyawer
            <ArrowRight size={15} />
          </button>

          <button
            id="hero-btn-demo"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-glass px-6 py-3.5 rounded-lg text-sm font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Play size={14} className="text-zinc-400" />
            Lihat Demo
          </button>
        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap justify-center gap-6 mt-12 animate-fade-in delay-500"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          {[
            { icon: Shield, text: 'Transaksi Aman & Terenkripsi' },
            { icon: CheckCircle2, text: 'Tanpa Biaya Admin Tambahan' },
            { icon: Globe, text: 'Dukungan 24/7' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              <Icon size={12} className="text-zinc-500" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEATURE CARDS SECTION
───────────────────────────────────────── */
function FeatureCard({ icon: Icon, iconColor, iconBg, title, description, points }) {
  return (
    <div className="glass-card-hover p-6 flex flex-col gap-5 relative overflow-hidden">
      {/* Icon */}
      <div className={`relative w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>

      {/* Content */}
      <div>
        <h3 className="font-display font-bold text-lg text-zinc-100 mb-1.5">{title}</h3>
        <p className="text-zinc-400 text-xs leading-relaxed">{description}</p>
      </div>

      {/* Points */}
      <ul className="flex flex-col gap-2 mt-1">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-zinc-400">
            <CheckCircle2 size={13} className={`mt-0.5 flex-shrink-0 ${iconColor}`} />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: TrendingDown,
      iconColor: 'text-violet-400',
      iconBg: 'bg-zinc-800/60 border border-zinc-700/30',
      title: 'Potongan Flat 4%',
      description:
        'Berbeda dari platform lain dengan sistem tiering rumit, Nyawer hanya mengenakan potongan flat 4% dari setiap donasi.',
      points: [
        'Tidak ada tingkatan potongan atau biaya admin tambahan',
        'Tidak ada biaya transaksi tersembunyi',
        'Payout otomatis setiap hari kerja langsung ke rekening',
      ],
    },
    {
      icon: Monitor,
      iconColor: 'text-violet-400',
      iconBg: 'bg-zinc-800/60 border border-zinc-700/30',
      title: 'Real-time OBS Alert',
      description:
        'Setiap donasi muncul langsung di layar stream Anda dalam hitungan detik. Kustomisasi font, warna, suara, dan animasi.',
      points: [
        'Respons instan di bawah 3 detik di stream',
        'Integrasi langsung ke OBS, Streamlabs, dan XSplit',
        'TTS (text-to-speech) terintegrasi dengan berbagai pilihan suara',
      ],
    },
    {
      icon: Wallet,
      iconColor: 'text-violet-400',
      iconBg: 'bg-zinc-800/60 border border-zinc-700/30',
      title: 'Dukungan QRIS & E-Wallet',
      description:
        'Mendukung semua metode pembayaran populer di Indonesia untuk memudahkan penonton memberikan dukungan.',
      points: [
        'QRIS universal untuk seluruh bank dan aplikasi e-wallet',
        'Dukungan GoPay, OVO, DANA, ShopeePay, dan LinkAja',
        'Transfer bank virtual account (BCA, Mandiri, BNI, BRI)',
      ],
    },
  ];

  return (
    <section id="features" className="relative py-20 border-t border-zinc-800/40 bg-zinc-950/20">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="badge-neon mx-auto mb-4 w-fit">
            <Sparkles size={11} className="text-zinc-400" />
            Fitur Utama
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-zinc-100 mb-3 leading-tight">
            Dibuat Khusus untuk Streamer
          </h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Tiga pilar utama yang menjadikan Nyawer pilihan terbaik untuk mendukung kelangsungan stream Anda.
          </p>
        </div>

        <div className="divider-neon mb-12" />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Comparison teaser */}
        <div className="mt-16 glass-card p-6 md:p-8 max-w-2xl mx-auto" id="simulation">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <h3 className="font-display font-bold text-xl text-zinc-100">
              Simulasi Potongan Donasi
            </h3>
          </div>

          <p className="text-zinc-500 text-xs mb-6">
            Bandingkan potongan donasi dari platform kami dengan penyedia layanan serupa lainnya secara langsung.
          </p>

          <FeeSimulator />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEE SIMULATOR
───────────────────────────────────────── */
function FeeSimulator() {
  const [amount, setAmount] = useState(50000);

  const platforms = [
    { name: 'Nyawer (Kami)', rate: 0.04, color: '#7c3aed' },
    { name: 'Saweria', rate: 0.05, color: '#e2e8f0', note: 1000 },
    { name: 'Trakteer', rate: 0.07, color: '#71717a' },
  ];

  const formatRp = (val) =>
    'Rp ' + Math.round(val).toLocaleString('id-ID');

  const presets = [10000, 25000, 50000, 100000, 250000];

  return (
    <div>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-5">
        {presets.map((p) => (
          <button
            key={p}
            id={`sim-preset-${p}`}
            onClick={() => setAmount(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              amount === p
                ? 'bg-violet-950/60 border border-violet-700/50 text-violet-300'
                : 'bg-zinc-900 border border-zinc-800/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/40'
            }`}
          >
            {formatRp(p)}
          </button>
        ))}
      </div>

      {/* Range input */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Jumlah Donasi</span>
          <span className="font-display font-extrabold text-xl text-zinc-100">
            {formatRp(amount)}
          </span>
        </div>
        <input
          id="sim-range-input"
          type="range"
          min="5000"
          max="1000000"
          step="5000"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800"
          style={{
            background: `linear-gradient(90deg, #7c3aed 0%, #7c3aed ${((amount - 5000) / 995000) * 100}%, #27272a ${((amount - 5000) / 995000) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-zinc-600">Rp 5.000</span>
          <span className="text-[10px] text-zinc-600">Rp 1.000.000</span>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="flex flex-col gap-4">
        {platforms.map((p) => {
          const fee = p.rate * amount + (p.note ? p.note : 0);
          const received = amount - fee;
          const pct = (received / amount) * 100;
          const isNyawer = p.name.includes('Nyawer');
          return (
            <div key={p.name} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className={`text-xs font-semibold ${isNyawer ? 'text-zinc-100' : 'text-zinc-400'}`}>{p.name}</span>
                  {isNyawer && (
                    <span className="text-[9px] font-bold text-violet-400 bg-violet-950/40 border border-violet-800/40 rounded-full px-1.5 py-0.5">
                      PASTI UNTUNG
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${isNyawer ? 'text-zinc-100 font-mono' : 'text-zinc-400 font-mono'}`}>{formatRp(received)}</div>
                </div>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: p.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PAYMENT MARQUEE
───────────────────────────────────────── */
function PaymentMarquee() {
  const methods = [
    { name: 'QRIS', symbol: '◻' },
    { name: 'GoPay', symbol: '◻' },
    { name: 'OVO', symbol: '◻' },
    { name: 'DANA', symbol: '◻' },
    { name: 'ShopeePay', symbol: '◻' },
    { name: 'LinkAja', symbol: '◻' },
    { name: 'BCA', symbol: '◻' },
    { name: 'Mandiri', symbol: '◻' },
    { name: 'BNI', symbol: '◻' },
    { name: 'BRI', symbol: '◻' },
    { name: 'Visa', symbol: '◻' },
    { name: 'Mastercard', symbol: '◻' },
  ];

  const doubled = [...methods, ...methods, ...methods];

  return (
    <section id="payment" className="relative py-16 overflow-hidden bg-zinc-950/40 border-t border-zinc-800/20">
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="text-center">
          <div className="badge-neon mx-auto mb-3 w-fit">
            <Wallet size={11} className="text-zinc-400" />
            Integrasi Pembayaran
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-zinc-100 mb-2">
            Mendukung Berbagai Pilihan Pembayaran
          </h2>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            Kemudahan bagi para pendukung untuk mengirim donasi melalui berbagai metode pembayaran populer.
          </p>
        </div>
      </div>

      {/* Marquee row - left */}
      <div className="marquee-container mb-3 opacity-60">
        <div className="marquee-inner">
          {doubled.map((m, i) => (
            <div
              key={`a-${i}`}
              className="mx-2 px-4 py-2 bg-zinc-900 border border-zinc-800/40 rounded-lg inline-flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee row - right (reverse) */}
      <div className="marquee-container opacity-60">
        <div className="marquee-inner" style={{ animationDirection: 'reverse', animationDuration: '24s' }}>
          {[...doubled].reverse().map((m, i) => (
            <div
              key={`b-${i}`}
              className="mx-2 px-4 py-2 bg-zinc-900 border border-zinc-800/40 rounded-lg inline-flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS SECTION
───────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: Users,
      title: 'Pendaftaran Akun',
      desc: 'Buat akun Nyawer Anda dalam hitungan detik. Cukup isi email dan dapatkan halaman donasi kustom Anda.',
    },
    {
      step: '02',
      icon: Monitor,
      title: 'Integrasikan Ke OBS',
      desc: 'Salin URL widget alert dari dashboard Anda, lalu tambahkan sebagai browser source di software streaming.',
    },
    {
      step: '03',
      icon: Zap,
      title: 'Terima Dukungan',
      desc: 'Penonton dapat langsung berdonasi. Alert akan muncul di layar secara real-time dan dana masuk ke rekening.',
    },
  ];

  return (
    <section className="relative py-20 border-t border-zinc-800/20 bg-zinc-950/20">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="badge-neon mx-auto mb-4 w-fit">
            <ChevronRight size={11} className="text-zinc-400" />
            Alur Layanan
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-zinc-100 mb-3">
            Mulai Dalam Tiga Langkah Mudah
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-zinc-800"
            style={{
              left: '20%',
              right: '20%',
            }}
          />

          {steps.map(({ step, icon: Icon, title, desc }, i) => (
            <div
              key={step}
              className="glass-card-hover p-6 text-center relative"
            >
              {/* Step number */}
              <div className="text-[40px] font-display font-black leading-none absolute top-4 right-5 select-none text-zinc-800/30">
                {step}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <Icon size={20} className="text-violet-400" />
              </div>

              <h3 className="font-display font-bold text-base text-zinc-100 mb-2">{title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   CTA SECTION
───────────────────────────────────────── */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-20 border-t border-zinc-800/20 bg-zinc-950/40">
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Glass card */}
        <div className="glass-card p-10 md:p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="badge-neon mx-auto mb-5 w-fit">
              <Sparkles size={11} className="text-zinc-400" />
              Gabung Sekarang
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-zinc-100 mb-4 leading-tight">
              Mulai Terima Dukungan Lebih Maksimal
            </h2>

            <p className="text-zinc-400 text-xs mb-8 max-w-md mx-auto leading-relaxed">
              Bergabunglah dengan ribuan streamer lainnya. Pendaftaran gratis, pengaturan cepat dalam 5 menit, dan langsung siap terima donasi hari ini.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                id="cta-btn-daftar"
                onClick={() => navigate('/register')}
                className="btn-neon px-6 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Zap size={14} className="fill-current" />
                Daftar Akun Gratis
                <ArrowRight size={14} />
              </button>
              <a
                id="cta-btn-tanya"
                href="https://wa.me/6281234567890?text=Halo+Nyawer%2C+saya+ingin+tanya+lebih+lanjut"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass px-6 py-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center"
              >
                Tanya WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative py-10 border-t border-zinc-800/20 bg-zinc-950/80">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="font-display font-bold text-sm tracking-wider text-zinc-100">
              NYAWER
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500 font-medium">
            {['Tentang Kami', 'Kebijakan Privasi', 'Syarat & Ketentuan', 'Kontak', 'Blog'].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-zinc-300 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-zinc-600 font-medium">
            © {year} Nyawer. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   LANDING PAGE ROOT
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="noise-overlay min-h-screen bg-zinc-950" id="app-root">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <PaymentMarquee />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
