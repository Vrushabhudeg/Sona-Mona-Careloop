import React from "react";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const AppLogo: React.FC<AppLogoProps> = ({ className, size = "md" }) => {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20"
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${dimensions[size]} ${className || ""}`}>
      {/* Inline styles for cute floating and pulse effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.1); }
        }
        .cute-logo-svg {
          animation: logoFloat 3.5s ease-in-out infinite;
        }
        .cute-logo-glow {
          animation: glowPulse 3.5s ease-in-out infinite;
        }
      `}} />

      {/* Glow Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7597] to-[#9B86FA] rounded-[30%] blur-md cute-logo-glow pointer-events-none" />
      
      {/* SVG Mascot Container */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_4px_12px_rgba(255,117,151,0.3)] hover:scale-110 transition-transform duration-300 ease-out cute-logo-svg"
      >
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7597" />
            <stop offset="100%" stopColor="#9B86FA" />
          </linearGradient>
          <linearGradient id="sproutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67E8A5" />
            <stop offset="100%" stopColor="#2AD58A" />
          </linearGradient>
        </defs>
        
        {/* Sprout Leaves (Top Right) */}
        <path
          d="M 52,24 C 52,10 65,5 72,12 C 77,17 73,30 60,26 Z"
          fill="url(#sproutGradient)"
        />
        <path
          d="M 58,26 C 62,15 75,18 78,25 C 80,31 71,36 62,30 Z"
          fill="url(#sproutGradient)"
        />

        {/* Stem */}
        <path
          d="M 55,25 Q 56,33 50,38"
          stroke="#67E8A5"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Heart Base */}
        <path
          d="M 50,88 C 45,83 15,55 15,36 C 15,22 26,14 36,14 C 43,14 47,19 50,22 C 53,19 57,14 64,14 C 74,14 85,22 85,36 C 85,55 55,83 50,88 Z"
          fill="url(#heartGradient)"
        />
        
        {/* Cute Mascot Face Details */}
        {/* Happy Curved Closed Eyes */}
        <path
          d="M 33,36 Q 36,32 39,36"
          stroke="#FFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 61,36 Q 64,32 67,36"
          stroke="#FFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Sweet Blushing Cheeks */}
        <circle cx="28" cy="43" r="5.5" fill="#FFE1E8" opacity="0.85" />
        <circle cx="72" cy="43" r="5.5" fill="#FFE1E8" opacity="0.85" />
        
        {/* Happy Curved Mouth */}
        <path
          d="M 46,44 Q 50,48 54,44"
          stroke="#FFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
