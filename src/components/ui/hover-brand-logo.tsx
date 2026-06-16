"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Actual SVG components provided by the user.
const SiSupabase = ({ className }: any) => (
  <svg className={className} viewBox="0 0 201 208" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_104_426)">
      <path d="M117.815 202.632C112.568 209.239 101.93 205.619 101.803 197.182L99.9548 73.7852H182.927C197.955 73.7852 206.337 91.1431 196.992 102.913L117.815 202.632Z" fill="url(#paint0_linear_104_426)"/>
      <path d="M117.815 202.632C112.568 209.239 101.93 205.619 101.803 197.182L99.9548 73.7852H182.927C197.955 73.7852 206.337 91.1431 196.992 102.913L117.815 202.632Z" fill="url(#paint1_linear_104_426)" fillOpacity="0.2"/>
      <path d="M84.0703 4.07565C89.3171 -2.53242 99.9556 1.08833 100.082 9.52514L100.892 132.922H18.9586C3.92971 132.922 -4.45218 115.564 4.89324 103.794L84.0703 4.07565Z" fill="#3ECF8E"/>
    </g>
    <defs>
      <linearGradient id="paint0_linear_104_426" x1="99.9548" y1="101.145" x2="173.697" y2="132.073" gradientUnits="userSpaceOnUse">
        <stop stopColor="#249361"/>
        <stop offset="1" stopColor="#3ECF8E"/>
      </linearGradient>
      <linearGradient id="paint1_linear_104_426" x1="67.2613" y1="56.382" x2="100.892" y2="119.69" gradientUnits="userSpaceOnUse">
        <stop/>
        <stop offset="1" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="clip0_104_426">
        <rect width="200" height="207.339" fill="white" transform="translate(0.920166 0.275391)"/>
      </clipPath>
    </defs>
  </svg>
);

const SiReact = ({ className }: any) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.6789 15.9759C18.6789 14.5415 17.4796 13.3785 16 13.3785C14.5206 13.3785 13.3211 14.5415 13.3211 15.9759C13.3211 17.4105 14.5206 18.5734 16 18.5734C17.4796 18.5734 18.6789 17.4105 18.6789 15.9759Z" fill="#53C1DE"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M24.7004 11.1537C25.2661 8.92478 25.9772 4.79148 23.4704 3.39016C20.9753 1.99495 17.7284 4.66843 16.0139 6.27318C14.3044 4.68442 10.9663 2.02237 8.46163 3.42814C5.96751 4.82803 6.73664 8.8928 7.3149 11.1357C4.98831 11.7764 1 13.1564 1 15.9759C1 18.7874 4.98416 20.2888 7.29698 20.9289C6.71658 23.1842 5.98596 27.1909 8.48327 28.5877C10.9973 29.9932 14.325 27.3945 16.0554 25.7722C17.7809 27.3864 20.9966 30.0021 23.4922 28.6014C25.9956 27.1963 25.3436 23.1184 24.7653 20.8625C27.0073 20.221 31 18.7523 31 15.9759C31 13.1835 26.9903 11.7923 24.7004 11.1537ZM24.4162 19.667C24.0365 18.5016 23.524 17.2623 22.8971 15.9821C23.4955 14.7321 23.9881 13.5088 24.3572 12.3509C26.0359 12.8228 29.7185 13.9013 29.7185 15.9759C29.7185 18.07 26.1846 19.1587 24.4162 19.667ZM22.85 27.526C20.988 28.571 18.2221 26.0696 16.9478 24.8809C17.7932 23.9844 18.638 22.9422 19.4625 21.7849C20.9129 21.6602 22.283 21.4562 23.5256 21.1777C23.9326 22.7734 24.7202 26.4763 22.85 27.526ZM9.12362 27.5111C7.26143 26.47 8.11258 22.8946 8.53957 21.2333C9.76834 21.4969 11.1286 21.6865 12.5824 21.8008C13.4123 22.9332 14.2816 23.9741 15.1576 24.8857C14.0753 25.9008 10.9945 28.557 9.12362 27.5111ZM2.28149 15.9759C2.28149 13.874 5.94207 12.8033 7.65904 12.3326C8.03451 13.5165 8.52695 14.7544 9.12123 16.0062C8.51925 17.2766 8.01977 18.5341 7.64085 19.732C6.00369 19.2776 2.28149 18.0791 2.28149 15.9759ZM9.1037 4.50354C10.9735 3.45416 13.8747 6.00983 15.1159 7.16013C14.2444 8.06754 13.3831 9.1006 12.5603 10.2265C11.1494 10.3533 9.79875 10.5569 8.55709 10.8297C8.09125 9.02071 7.23592 5.55179 9.1037 4.50354ZM20.3793 11.5771C21.3365 11.6942 22.2536 11.85 23.1147 12.0406C22.8562 12.844 22.534 13.6841 22.1545 14.5453C21.6044 13.5333 21.0139 12.5416 20.3793 11.5771ZM16.0143 8.0481C16.6054 8.66897 17.1974 9.3623 17.7798 10.1145C16.5985 10.0603 15.4153 10.0601 14.234 10.1137C14.8169 9.36848 15.414 8.67618 16.0143 8.0481ZM9.8565 14.5444C9.48329 13.6862 9.16398 12.8424 8.90322 12.0275C9.75918 11.8418 10.672 11.69 11.623 11.5748C10.9866 12.5372 10.3971 13.5285 9.8565 14.5444ZM11.6503 20.4657C10.6679 20.3594 9.74126 20.2153 8.88556 20.0347C9.15044 19.2055 9.47678 18.3435 9.85796 17.4668C10.406 18.4933 11.0045 19.4942 11.6503 20.4657ZM16.0498 23.9915C15.4424 23.356 14.8365 22.6531 14.2448 21.8971C15.4328 21.9423 16.6231 21.9424 17.811 21.891C17.2268 22.6608 16.6369 23.3647 16.0498 23.9915ZM22.1667 17.4222C22.5677 18.3084 22.9057 19.1657 23.1742 19.9809C22.3043 20.1734 21.3652 20.3284 20.3757 20.4435C21.015 19.4607 21.6149 18.4536 22.1667 17.4222ZM18.7473 20.5941C16.9301 20.72 15.1016 20.7186 13.2838 20.6044C12.2509 19.1415 11.3314 17.603 10.5377 16.0058C11.3276 14.4119 12.2404 12.8764 13.2684 11.4158C15.0875 11.2825 16.9178 11.2821 18.7369 11.4166C19.7561 12.8771 20.6675 14.4086 21.4757 15.9881C20.6771 17.5812 19.7595 19.1198 18.7473 20.5941ZM22.8303 4.4666C24.7006 5.51254 23.8681 9.22726 23.4595 10.8426C22.2149 10.5641 20.8633 10.3569 19.4483 10.2281C18.6239 9.09004 17.7698 8.05518 16.9124 7.15949C18.1695 5.98441 20.9781 3.43089 22.8303 4.4666Z" fill="#53C1DE"/>
  </svg>
);

const SiVite = ({ className }: any) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path d="M29.8836 6.146L16.7418 29.6457c-.2714.4851-.9684.488-1.2439.0052L2.0956 6.1482c-.3-.5262.1498-1.1635.746-1.057l13.156 2.3516a.7144.7144 0 00.2537-.0004l12.8808-2.3478c.5942-.1083 1.0463.5241.7515 1.0513z" fill="url(#paint0_linear_vite)"/>
    <path d="M22.2644 2.0069l-9.7253 1.9056a.3571.3571 0 00-.2879.3294l-.5982 10.1038c-.014.238.2045.4227.4367.3691l2.7077-.6248c.2534-.0585.4823.1647.4302.4194l-.8044 3.9393c-.0542.265.1947.4918.4536.4132l1.6724-.5082c.2593-.0787.5084.1487.4536.414l-1.2784 6.1877c-.08.387.4348.598.6495.2662L16.5173 25 24.442 9.1848c.1327-.2648-.096-.5667-.387-.5106l-2.787.5379c-.262.0505-.4848-.1934-.4109-.4497l1.8191-6.306c.074-.2568-.1496-.5009-.4118-.4495z" fill="url(#paint1_linear_vite)"/>
    <defs>
      <linearGradient id="paint0_linear_vite" x1="6.0002" y1="32.9999" x2="235" y2="344" gradientUnits="userSpaceOnUse" gradientTransform="matrix(.07142 0 0 .07142 1.3398 1.8944)">
        <stop stopColor="#41D1FF"/>
        <stop offset="1" stopColor="#BD34FE"/>
      </linearGradient>
      <linearGradient id="paint1_linear_vite" x1="194.651" y1="8.8182" x2="236.076" y2="292.989" gradientUnits="userSpaceOnUse" gradientTransform="matrix(.07142 0 0 .07142 1.3398 1.8944)">
        <stop stopColor="#FFEA83"/>
        <stop offset=".0833" stopColor="#FFDD35"/>
        <stop offset="1" stopColor="#FFA800"/>
      </linearGradient>
    </defs>
  </svg>
);

const SiTypescript = ({ className }: any) => (
  <svg className={className} fill="none" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#3178c6" height="512" rx="50" width="512"/>
    <path clipRule="evenodd" d="m316.939 407.424v50.061c8.138 4.172 17.763 7.3 28.875 9.386s22.823 3.129 35.135 3.129c11.999 0 23.397-1.147 34.196-3.442 10.799-2.294 20.268-6.075 28.406-11.342 8.138-5.266 14.581-12.15 19.328-20.65s7.121-19.007 7.121-31.522c0-9.074-1.356-17.026-4.069-23.857s-6.625-12.906-11.738-18.225c-5.112-5.319-11.242-10.091-18.389-14.315s-15.207-8.213-24.18-11.967c-6.573-2.712-12.468-5.345-17.685-7.9-5.217-2.556-9.651-5.163-13.303-7.822-3.652-2.66-6.469-5.476-8.451-8.448-1.982-2.973-2.974-6.336-2.974-10.091 0-3.441.887-6.544 2.661-9.308s4.278-5.136 7.512-7.118c3.235-1.981 7.199-3.52 11.894-4.615 4.696-1.095 9.912-1.642 15.651-1.642 4.173 0 8.581.313 13.224.938 4.643.626 9.312 1.591 14.008 2.894 4.695 1.304 9.259 2.947 13.694 4.928 4.434 1.982 8.529 4.276 12.285 6.884v-46.776c-7.616-2.92-15.937-5.084-24.962-6.492s-19.381-2.112-31.066-2.112c-11.895 0-23.163 1.278-33.805 3.833s-20.006 6.544-28.093 11.967c-8.086 5.424-14.476 12.333-19.171 20.729-4.695 8.395-7.043 18.433-7.043 30.114 0 14.914 4.304 27.638 12.912 38.172 8.607 10.533 21.675 19.45 39.204 26.751 6.886 2.816 13.303 5.579 19.25 8.291s11.086 5.528 15.415 8.448c4.33 2.92 7.747 6.101 10.252 9.543 2.504 3.441 3.756 7.352 3.756 11.733 0 3.233-.783 6.231-2.348 8.995s-3.939 5.162-7.121 7.196-7.147 3.624-11.894 4.771c-4.748 1.148-10.303 1.721-16.668 1.721-10.851 0-21.597-1.903-32.24-5.71-10.642-3.806-20.502-9.516-29.579-17.13zm-84.159-123.342h64.22v-41.082h-179v41.082h63.906v182.918h50.874z" fill="#fff" fillRule="evenodd"/>
  </svg>
);

const SiGroq = ({ className }: any) => (
  <svg fill="currentColor" fillRule="evenodd" className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z"></path>
  </svg>
);

const SiGemini = ({ className }: any) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/>
    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-0-_R_0_)"/>
    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-1-_R_0_)"/>
    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-2-_R_0_)"/>
    <defs>
      <linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-0-_R_0_" x1="7" x2="11" y1="15.5" y2="12">
        <stop stopColor="#08B962"/>
        <stop offset="1" stopColor="#08B962" stopOpacity="0"/>
      </linearGradient>
      <linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-1-_R_0_" x1="8" x2="11.5" y1="5.5" y2="11">
        <stop stopColor="#F94543"/>
        <stop offset="1" stopColor="#F94543" stopOpacity="0"/>
      </linearGradient>
      <linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-2-_R_0_" x1="3.5" x2="17.5" y1="13.5" y2="12">
        <stop stopColor="#FABC12"/>
        <stop offset=".46" stopColor="#FABC12" stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const SiAdobe = ({ className }: any) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.86 3H23v19zM9.14 3H1v19zM11.992 9.998L17.182 22h-3.394l-1.549-3.813h-3.79z" fill="#EB1000"/>
  </svg>
);

const SiCopyleaks = ({ className }: any) => (
  <img src="/Copyleaks.png" alt="Copyleaks" className={className} />
);

const brands = [
  { id: 'adobe', name: 'Adobe', Icon: SiAdobe },
  { id: 'copyleaks', name: 'Copyleaks', Icon: SiCopyleaks },
  { id: 'gemini', name: 'Gemini', Icon: SiGemini },
  { id: 'groq', name: 'Groq', Icon: SiGroq },
  { id: 'react', name: 'React', Icon: SiReact },
  { id: 'supabase', name: 'Supabase', Icon: SiSupabase },
  { id: 'typescript', name: 'Typescript', Icon: SiTypescript },
  { id: 'vite', name: 'Vite', Icon: SiVite },
];

export default function HoverBrandLogo({ className }: { className?: string }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);

  // Calculate the longest name to ensure the container is always wide enough
  const longestName = [...brands].sort((a, b) => b.name.length - a.name.length)[0].name;

  // Auto-play interval
  useEffect(() => {
    // If the user is hovering, we stop the auto-play
    if (hoveredId !== null) return;
    
    const interval = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % brands.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [hoveredId]);

  // Determine active brand based on hover, otherwise fallback to auto-play index
  const activeId = hoveredId !== null ? hoveredId : brands[autoIndex].id;
  const activeBrand = brands.find(b => b.id === activeId);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 w-full max-w-6xl mx-auto py-4", className)}>
      {/* Left: text */}
      <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mb-0 tracking-tight">
          Powered by
        </p>
        <div className="relative">
          <p
            aria-hidden
            className="text-2xl lg:text-3xl font-bold tracking-tight whitespace-nowrap opacity-0 pointer-events-none select-none leading-none sm:leading-tight"
          >
            {longestName}
          </p>
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeId ?? 'default'}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none sm:leading-tight tracking-tight whitespace-nowrap"
              >
                {activeBrand?.name ?? 'next-gen tech'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: icon grid */}
      <div className="grid grid-cols-5 sm:flex sm:flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto md:mt-6 sm:mt-0">
        {brands.map(({ id, name, Icon }) => {
          const isActive = activeId === id;
          const isDimmed = activeId !== null && !isActive;
          return (
            <button
              key={id}
              aria-label={name}
              className={cn(
                'flex items-center justify-center p-2.5 sm:p-3 lg:p-3.5 rounded-lg border transition-all duration-200',
                isActive
                  ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
                isDimmed ? 'opacity-40 ' : ''
              )}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <Icon className="w-6 h-6 sm:w-5 sm:h-5" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
