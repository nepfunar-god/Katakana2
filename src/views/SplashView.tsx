import { motion } from 'motion/react';

export default function SplashView() {
  return (
    <motion.div 
      initial={{ opacity: 1 }} 
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeOut" } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050811] text-[#dae2fd] overflow-hidden"
    >
      <style>{`
        @keyframes globe-spin {
            0% { transform: rotateX(15deg) rotateY(0deg); }
            100% { transform: rotateX(15deg) rotateY(360deg); }
        }

        @keyframes bounce-dots {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
            40% { transform: translateY(-8px); opacity: 1; }
        }

        @keyframes holo-shift {
            0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
            50% { background-position: 100% 50%; filter: hue-rotate(180deg); }
            100% { background-position: 0% 50%; filter: hue-rotate(360deg); }
        }

        @keyframes text-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }

        @keyframes speed-line {
            0% { transform: translateY(-100vh) scaleY(0); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(100vh) scaleY(2); opacity: 0; }
        }

        .animate-globe {
            animation: globe-spin 4s linear infinite;
            transform-style: preserve-3d;
        }

        .animate-holo-shell {
            background: linear-gradient(-45deg, rgba(208, 188, 255, 0.4), rgba(137, 206, 255, 0.4), rgba(177, 117, 236, 0.4), rgba(0, 162, 230, 0.4));
            background-size: 400% 400%;
            animation: holo-shift 5s ease infinite;
            box-shadow: 0 0 20px rgba(208, 188, 255, 0.2), inset 0 0 15px rgba(255,255,255,0.1);
        }

        .text-gradient-flow {
            background: linear-gradient(90deg, #d0bcff, #89ceff, #b175ec, #d0bcff);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: text-flow 3s linear infinite;
        }

        .dot-delay-1 { animation: bounce-dots 1.4s infinite ease-in-out both; animation-delay: -0.32s; }
        .dot-delay-2 { animation: bounce-dots 1.4s infinite ease-in-out both; animation-delay: -0.16s; }
        .dot-delay-3 { animation: bounce-dots 1.4s infinite ease-in-out both; }

        .speed-line {
            position: absolute;
            width: 1px;
            height: 150px;
            background: linear-gradient(to bottom, transparent, rgba(208, 188, 255, 0.4), transparent);
            animation: speed-line linear infinite;
        }

        .perspective-1000 {
            perspective: 1000px;
        }

        .glass-shell {
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .squircle {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0,50 C0,10 10,0 50,0 C90,0 100,10 100,50 C100,90 90,100 50,100 C10,100 0,90 0,50'/%3E%3C/svg%3E");
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
            border-radius: 42px;
        }
      `}</style>
      
      {/* Pulsing Background Streaks */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="speed-line left-[10%]" style={{ animationDuration: '2.5s', animationDelay: '0s' }}></div>
        <div className="speed-line left-[25%] opacity-30" style={{ animationDuration: '4s', animationDelay: '1.2s' }}></div>
        <div className="speed-line left-[45%]" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="speed-line left-[65%] opacity-20" style={{ animationDuration: '5s', animationDelay: '2.1s' }}></div>
        <div className="speed-line left-[85%]" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        <div className="speed-line left-[95%] opacity-40" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
      </div>

      {/* Atmospheric Background Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d0bcff]/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* 3D Logo Section */}
      <div className="perspective-1000 flex flex-col items-center z-10">
        <div className="animate-globe relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
          {/* Front Face: Holographic Glass Shell */}
          <div className="absolute inset-0 squircle animate-holo-shell glass-shell flex items-center justify-center" style={{ transform: 'translateZ(20px)' }}>
            <span className="text-white text-6xl md:text-7xl font-bold font-sans select-none drop-shadow-[0_0_15px_rgba(208,188,255,0.8)]">ア</span>
          </div>
          {/* Back Face: Visible and transparent */}
          <div className="absolute inset-0 squircle bg-white/5 glass-shell flex items-center justify-center" style={{ transform: 'translateZ(-20px) rotateY(180deg)' }}>
            <span className="text-white/40 text-6xl md:text-7xl font-bold font-sans select-none transform scale-x-[-1]">ア</span>
          </div>
          {/* Connecting Sides (Visual depth) */}
          <div className="absolute inset-0 squircle border-2 border-[#d0bcff]/30" style={{ transform: 'translateZ(0px)' }}></div>
        </div>

        {/* App Name */}
        <div className="mt-14 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase text-gradient-flow">
            KATAKANA PRO
          </h1>
          <p className="mt-3 text-[#d0bcff]/80 text-xs uppercase tracking-[0.5em] font-semibold">
            By Rajiv Gautam
          </p>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="absolute bottom-20 flex space-x-4 items-center z-10">
        <div className="w-2 h-2 rounded-full bg-[#d0bcff] dot-delay-1"></div>
        <div className="w-2 h-2 rounded-full bg-[#89ceff] dot-delay-2"></div>
        <div className="w-2 h-2 rounded-full bg-[#ddb8ff] dot-delay-3"></div>
      </div>

      {/* Background Decorative Element */}
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#050811] via-[#050811]/80 to-transparent pointer-events-none"></div>

      {/* Visual Polish: Subtle noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAq88Fz4DdbpRiah6-AlhmRbrw4fQL_7Q1uHM0Sl4bzMdtbxerMNbWXXXgcNeBG9abMnb3bkpp1g5c-A2pTZZZVSigNd8DZFpXBgx3k6WAoDnxmQ6PXGKX9GdPmpzraf6BW9c2bKLWSOnTB0yKi4Ssp1w5vp3x-nUdDxMpwsWxT36o9Y2g4m3-yoOBy4LN6q4uVlpHDxQ40SJNt0jzCPuWdPv9D-Mx4chaRehpH2ESp2hMLtHx0Ox2lG1lv6k7SsOHfAMdPI5rMORou')" }}></div>
    </motion.div>
  );
}
