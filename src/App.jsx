import { useState, useEffect, useRef } from 'react';
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-nav shadow-lg shadow-black/50 py-3'
          : 'bg-transparent py-5'
      }`}
      id="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#" id="nav-logo" className="flex items-center gap-2 group select-none">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-400 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity blur-sm" />
            <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
          </div>
          <span
            className="font-display font-black text-2xl tracking-widest"
            style={{
              background: 'linear-gradient(90deg, #e2e8f0 0%, #a855f7 30%, #22d3ee 60%, #e2e8f0 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}
          >
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
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-all duration-200 rounded-lg hover:bg-white/5 relative group"
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-px bg-gradient-to-r from-purple-500 to-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            id="nav-btn-masuk"
            onClick={() => navigate('/login')}
            className="btn-glass px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          >
            Masuk
          </button>
          <button
            id="nav-btn-daftar"
            onClick={() => navigate('/register')}
            className="btn-neon px-5 py-2 rounded-xl text-sm cursor-pointer"
          >
            <span>Daftar Gratis</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          id="nav-mobile-toggle"
          className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden glass-nav border-t border-white/5 transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/60 hover:text-white py-2 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-white/5">
            <button
              onClick={() => { navigate('/login'); setMobileOpen(false); }}
              className="btn-glass flex-1 py-2 rounded-xl text-sm font-semibold"
            >
              Masuk
            </button>
            <button
              onClick={() => { navigate('/register'); setMobileOpen(false); }}
              className="btn-neon flex-1 py-2 rounded-xl text-sm"
            >
              <span>Daftar</span>
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%), #050505' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Orb blobs */}
      <div
        className="orb w-[600px] h-[600px] animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <div
        className="orb w-[400px] h-[400px]"
        style={{
          background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)',
          bottom: '10%',
          right: '-10%',
          animation: 'glow-pulse 5s ease-in-out infinite 1s',
        }}
      />
      <div
        className="orb w-[300px] h-[300px]"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
          bottom: '20%',
          left: '-5%',
          animation: 'glow-pulse 7s ease-in-out infinite 2s',
        }}
      />

      {/* Floating decorative elements */}
      <div
        className="absolute top-32 right-24 w-20 h-20 rounded-2xl glass-card flex items-center justify-center animate-float opacity-60"
        style={{ animationDelay: '0s' }}
      >
        <Zap className="text-purple-400" size={28} />
      </div>
      <div
        className="absolute bottom-40 left-20 w-16 h-16 rounded-xl glass-card flex items-center justify-center animate-float opacity-50"
        style={{ animationDelay: '2s' }}
      >
        <Radio className="text-cyan-400" size={22} />
      </div>
      <div
        className="absolute top-48 left-32 w-14 h-14 rounded-xl glass-card flex items-center justify-center animate-float opacity-40"
        style={{ animationDelay: '4s' }}
      >
        <Cpu className="text-pink-400" size={20} />
      </div>

      {/* Rotating ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.04] animate-rotate-slow"
        style={{
          border: '1px solid rgba(168,85,247,0.8)',
          borderRadius: '50%',
          borderStyle: 'dashed',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.03]"
        style={{
          border: '1px solid rgba(34,211,238,0.8)',
          borderRadius: '50%',
          borderStyle: 'dashed',
          animation: 'rotate-slow 20s linear infinite reverse',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-20">
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <div className="badge-neon">
            <span className="dot" />
            Platform Donasi Streamer #1 Indonesia
          </div>
        </div>

        {/* Headline */}
        <h1
          className="font-display font-black leading-none mb-6 animate-slide-up delay-100"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          {/* Line 1: Chrome effect */}
          <span
            className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl chrome-text"
          >
            SUPPORT
          </span>

          {/* Line 2: Neon gradient + stroke combo */}
          <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-1">
            <span
              style={{
                WebkitTextStroke: '1px rgba(168,85,247,0.4)',
                color: 'transparent',
              }}
            >
              STREAMER
            </span>
            <span className="text-white"> MU</span>
          </span>

          {/* Line 3: with percentage counter */}
          <span className="block mt-3 text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-white/40">CUMA KENA</span>{' '}
            <span
              className="font-display font-black"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(168,85,247,0.6))',
              }}
            >
              {count}%
            </span>
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-slide-up delay-300"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          Flat <strong className="text-purple-400">4%</strong>. Titik. Tanpa tiering, tanpa biaya admin
          tersembunyi, tanpa alasan. Donasi kamu sampai penuh ke streamer — bukan ke kantong platform.
        </p>

        {/* Stats row */}
        <div
          className="flex flex-wrap justify-center gap-8 mb-12 animate-slide-up delay-300"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          {[
            { label: 'Streamer Aktif', value: '12K+', icon: Users },
            { label: 'Donasi Tersalur', value: 'Rp 8M+', icon: DollarSign },
            { label: 'Rating Kepuasan', value: '4.9 / 5', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon size={14} className="text-purple-400" />
                <span
                  className="text-2xl font-display font-black"
                  style={{
                    background: 'linear-gradient(135deg, #c084fc, #22d3ee)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {value}
                </span>
              </div>
              <span className="text-xs text-white/40 font-medium uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-400"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          <button
            id="hero-btn-mulai"
            onClick={() => navigate('/register')}
            className="btn-neon px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <span className="flex items-center gap-2">
              <Zap size={18} className="fill-current" />
              Mulai Nyawer
              <ArrowRight size={18} />
            </span>
          </button>

          <button
            id="hero-btn-demo"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-glass px-8 py-4 rounded-2xl text-base font-semibold flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Play size={16} className="text-cyan-400" />
            Lihat Demo OBS
          </button>
        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap justify-center gap-4 mt-10 animate-fade-in delay-600"
          style={{ opacity: 0, animationFillMode: 'forwards' }}
        >
          {[
            { icon: Shield, text: 'Transaksi Aman & Terenkripsi' },
            { icon: CheckCircle2, text: 'No Hidden Fees' },
            { icon: Globe, text: 'Support 24/7' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-white/35 font-medium">
              <Icon size={12} className="text-purple-400/70" />
              {text}
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-purple-400 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEATURE CARDS SECTION
───────────────────────────────────────── */
function FeatureCard({ icon: Icon, iconColor, iconBg, gradientFrom, gradientTo, badge, title, description, points, delay }) {
  return (
    <div
      className="glass-card-hover shimmer-border p-8 flex flex-col gap-5 relative overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Card glow background */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-[0.06] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${gradientFrom} 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <div className="absolute inset-0 rounded-2xl opacity-30 blur-md" style={{ background: iconBg }} />
        <Icon size={26} className={iconColor} />
      </div>

      {/* Badge */}
      {badge && (
        <div
          className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}22, ${gradientTo}22)`,
            border: `1px solid ${gradientFrom}44`,
            color: gradientFrom,
          }}
        >
          {badge}
        </div>
      )}

      {/* Content */}
      <div>
        <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Points */}
      <ul className="flex flex-col gap-2 mt-1">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-white/60">
            <CheckCircle2 size={14} className={`mt-0.5 flex-shrink-0 ${iconColor}`} />
            {point}
          </li>
        ))}
      </ul>

      {/* Bottom gradient line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${gradientFrom}60, ${gradientTo}60, transparent)` }}
      />
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: TrendingDown,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/15',
      gradientFrom: '#a855f7',
      gradientTo: '#7c3aed',
      badge: 'Transparansi 100%',
      title: 'Potongan Flat 4%',
      description:
        'Beda dari platform lain yang punya sistem tiering ribet, Nyawer cuma ambil 4% flat dari setiap donasi — tanpa syarat, tanpa minimum.',
      points: [
        'Tidak ada tiering berdasarkan jumlah donasi',
        'Tidak ada biaya admin tambahan',
        'Tidak ada charge per-transaksi tersembunyi',
        'Payout otomatis setiap hari kerja',
      ],
      delay: 0,
    },
    {
      icon: Monitor,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15',
      gradientFrom: '#22d3ee',
      gradientTo: '#0891b2',
      badge: '< 3 Detik',
      title: 'Real-time OBS Alert',
      description:
        'Setiap donasi muncul langsung di stream kamu dalam hitungan detik. Fully customizable — font, warna, sound, animasi.',
      points: [
        'Latency alert di bawah 3 detik',
        'Custom widget builder drag & drop',
        'Integrasi langsung ke OBS, Streamlabs, XSplit',
        'TTS (text-to-speech) built-in dengan 8 suara',
      ],
      delay: 0.15,
    },
    {
      icon: Wallet,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/15',
      gradientFrom: '#ec4899',
      gradientTo: '#be185d',
      badge: '10+ Metode',
      title: 'Support QRIS & E-Wallet',
      description:
        'Support semua metode pembayaran populer Indonesia. Penonton bisa donasi dari mana saja, kapan saja, tanpa ribet.',
      points: [
        'QRIS universal (semua bank & e-wallet)',
        'GoPay, OVO, DANA, ShopeePay, LinkAja',
        'Transfer bank (BCA, Mandiri, BNI, BRI)',
        'Kartu kredit / debit Visa & Mastercard',
      ],
      delay: 0.3,
    },
  ];

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 70%), #050505',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="badge-neon mx-auto mb-5 w-fit">
            <Sparkles size={12} />
            Kenapa Milih Nyawer?
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white mb-4 leading-tight">
            Dibuat untuk{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Streamer
            </span>
            ,<br />
            <span className="chrome-text">Bukan untuk Korporat</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Tiga pilar yang bikin Nyawer jadi pilihan wajib streamer Indonesia.
          </p>
        </div>

        {/* Divider */}
        <div className="divider-neon mb-16" />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Comparison teaser */}
        <div className="mt-20 glass-card p-8 max-w-3xl mx-auto" id="simulation">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
            <h3 className="font-display font-bold text-2xl text-white">
              Simulasi Potongan
            </h3>
          </div>

          <p className="text-white/50 text-sm mb-8">
            Coba hitung sendiri. Masukkan jumlah donasi dan lihat berapa yang sampai ke streamer.
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
    { name: 'Nyawer', rate: 0.04, color: '#a855f7', accent: '#22d3ee' },
    { name: 'Saweria', rate: 0.05, color: '#f59e0b', note: '+Rp 1.000 admin' },
    { name: 'Trakteer', rate: 0.07, color: '#ef4444' },
  ];

  const formatRp = (val) =>
    'Rp ' + Math.round(val).toLocaleString('id-ID');

  const presets = [10000, 25000, 50000, 100000, 250000];

  return (
    <div>
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map((p) => (
          <button
            key={p}
            id={`sim-preset-${p}`}
            onClick={() => setAmount(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              amount === p
                ? 'bg-purple-500/30 border border-purple-400/60 text-purple-300'
                : 'glass-card border border-white/5 text-white/40 hover:text-white hover:border-white/20'
            }`}
          >
            {formatRp(p)}
          </button>
        ))}
      </div>

      {/* Range input */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Jumlah Donasi</span>
          <span
            className="font-display font-black text-2xl"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
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
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(90deg, #a855f7 0%, #22d3ee ${((amount - 5000) / 995000) * 100}%, rgba(255,255,255,0.1) ${((amount - 5000) / 995000) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-white/20">Rp 5.000</span>
          <span className="text-[10px] text-white/20">Rp 1.000.000</span>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="flex flex-col gap-4">
        {platforms.map((p) => {
          const fee = p.rate * amount + (p.note ? 1000 : 0);
          const received = amount - fee;
          const pct = (received / amount) * 100;
          return (
            <div key={p.name} className="group">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}
                  />
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  {p.name === 'Nyawer' && (
                    <span className="text-[10px] font-bold text-purple-300 bg-purple-400/10 border border-purple-400/20 rounded-full px-2 py-0.5">
                      ✨ TERBAIK
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatRp(received)}</div>
                  <div className="text-[11px] text-white/30">Potongan: {formatRp(fee)}</div>
                </div>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    background: p.accent
                      ? `linear-gradient(90deg, ${p.color}, ${p.accent})`
                      : p.color,
                    boxShadow: `0 0 10px ${p.color}66`,
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
    { name: 'QRIS', symbol: '⊞' },
    { name: 'GoPay', symbol: '◈' },
    { name: 'OVO', symbol: '◉' },
    { name: 'DANA', symbol: '◎' },
    { name: 'ShopeePay', symbol: '◆' },
    { name: 'LinkAja', symbol: '◇' },
    { name: 'BCA', symbol: '▣' },
    { name: 'Mandiri', symbol: '▩' },
    { name: 'BNI', symbol: '▦' },
    { name: 'BRI', symbol: '▧' },
    { name: 'Visa', symbol: '▪' },
    { name: 'Mastercard', symbol: '▫' },
  ];

  const doubled = [...methods, ...methods, ...methods];

  return (
    <section id="payment" className="relative py-20 overflow-hidden">
      {/* Top divider */}
      <div className="divider-neon mb-16" />

      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="text-center">
          <div className="badge-neon mx-auto mb-4 w-fit">
            <Wallet size={12} />
            Metode Pembayaran
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
            Bayar dengan{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Apa Saja
            </span>
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Semua metode pembayaran populer Indonesia didukung. No ribet, no drama.
          </p>
        </div>
      </div>

      {/* Marquee row 1 - left */}
      <div className="marquee-container mb-4">
        <div className="marquee-inner">
          {doubled.map((m, i) => (
            <div
              key={`a-${i}`}
              className="mx-3 px-5 py-3 glass-card inline-flex items-center gap-3 flex-shrink-0 group hover:border-purple-500/30 transition-all duration-300"
            >
              <span className="text-white/20 text-lg group-hover:text-purple-400/50 transition-colors">{m.symbol}</span>
              <span className="text-sm font-bold text-white/30 group-hover:text-white/50 transition-colors tracking-widest uppercase">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee row 2 - right (reverse) */}
      <div className="marquee-container">
        <div className="marquee-inner" style={{ animationDirection: 'reverse', animationDuration: '20s' }}>
          {[...doubled].reverse().map((m, i) => (
            <div
              key={`b-${i}`}
              className="mx-3 px-5 py-3 glass-card inline-flex items-center gap-3 flex-shrink-0 group hover:border-cyan-500/30 transition-all duration-300"
            >
              <span className="text-white/15 text-lg group-hover:text-cyan-400/50 transition-colors">{m.symbol}</span>
              <span className="text-sm font-bold text-white/25 group-hover:text-white/40 transition-colors tracking-widest uppercase">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient fade edges */}
      <div className="absolute left-0 top-20 bottom-0 w-32 pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, #050505, transparent)' }} />
      <div className="absolute right-0 top-20 bottom-0 w-32 pointer-events-none z-10"
        style={{ background: 'linear-gradient(-90deg, #050505, transparent)' }} />

      {/* Bottom divider */}
      <div className="divider-neon mt-16" />
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
      title: 'Daftar Gratis',
      desc: 'Buat akun dalam 60 detik. Verifikasi identitas sekali, dan kamu siap menerima donasi.',
      color: '#a855f7',
    },
    {
      step: '02',
      icon: Monitor,
      title: 'Pasang Widget OBS',
      desc: 'Copy URL widget, paste ke OBS/Streamlabs. Done. Alert donasi langsung aktif.',
      color: '#22d3ee',
    },
    {
      step: '03',
      icon: Zap,
      title: 'Terima Donasi',
      desc: 'Penonton donasi via link page kamu. Cair otomatis ke rekeningmu setiap hari.',
      color: '#ec4899',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 20% 50%, rgba(34,211,238,0.05) 0%, transparent 70%), #050505',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="badge-neon mx-auto mb-5 w-fit">
            <ChevronRight size={12} />
            Cara Kerja
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white mb-4">
            Mulai Dalam{' '}
            <span className="chrome-text">3 Langkah</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div
            className="hidden md:block absolute top-16 left-1/6 right-1/6 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, #a855f7, #22d3ee, #ec4899, transparent)',
              top: '52px',
              left: '25%',
              right: '25%',
            }}
          />

          {steps.map(({ step, icon: Icon, title, desc, color }, i) => (
            <div
              key={step}
              className="glass-card-hover p-8 text-center relative"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Step number */}
              <div
                className="text-[80px] font-display font-black leading-none absolute top-4 right-5 select-none"
                style={{
                  color: `${color}08`,
                }}
              >
                {step}
              </div>

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 relative"
                style={{ background: `${color}18` }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-20 blur-lg"
                  style={{ background: color }}
                />
                <Icon size={28} style={{ color }} />
              </div>

              <h3 className="font-display font-bold text-lg text-white mb-3">{title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{desc}</p>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-8 right-8 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                }}
              />
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
    <section className="relative py-32 overflow-hidden">
      {/* Glow background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.18) 0%, rgba(34,211,238,0.06) 50%, transparent 80%), #050505',
        }}
      />

      {/* Rotating decorative ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.06] animate-rotate-slow rounded-full"
        style={{ border: '1px dashed rgba(168,85,247,0.8)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Glass card */}
        <div className="glass-card p-12 md:p-16 relative overflow-hidden">
          {/* Inner glow */}
          <div
            className="absolute inset-0 rounded-[20px] opacity-50"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.12) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="badge-neon mx-auto mb-6 w-fit">
              <Sparkles size={12} />
              Bergabung Sekarang — Gratis!
            </div>

            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white mb-4 leading-tight">
              Stop Bayar Lebih.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #a855f7 20%, #22d3ee 80%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Nyawer Sekarang.
              </span>
            </h2>

            <p className="text-white/45 text-lg mb-10 max-w-xl mx-auto">
              Ribuan streamer sudah beralih ke Nyawer. Daftar gratis, setup 5 menit,
              terima donasi hari ini.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                id="cta-btn-daftar"
                onClick={() => navigate('/register')}
                className="btn-neon px-10 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2"
              >
                <span className="flex items-center gap-2">
                  <Zap size={18} className="fill-current" />
                  Daftar Gratis Sekarang
                  <ArrowRight size={18} />
                </span>
              </button>
              <a
                id="cta-btn-tanya"
                href="https://wa.me/6281234567890?text=Halo+Nyawer%2C+saya+ingin+tanya+lebih+lanjut"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass px-10 py-4 rounded-2xl text-base font-semibold inline-flex items-center justify-center"
              >
                Tanya via WhatsApp
              </a>
            </div>

            <p className="mt-6 text-xs text-white/25">
              Tidak ada kartu kredit. Tidak ada kontrak. Cancel kapan saja.
            </p>
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
    <footer className="relative py-16 border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white fill-white" />
            </div>
            <span
              className="font-display font-black text-xl tracking-widest"
              style={{
                background: 'linear-gradient(90deg, #c084fc, #22d3ee)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              NYAWER
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/30 font-medium">
            {['Tentang Kami', 'Kebijakan Privasi', 'Syarat & Ketentuan', 'Kontak', 'Blog'].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-white/60 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/20 font-medium">
            © {year} Nyawer. All rights reserved.
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
    <div className="noise-overlay min-h-screen bg-[#050505]" id="app-root">
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
