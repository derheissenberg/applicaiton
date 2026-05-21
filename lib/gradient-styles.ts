/** Shared cyan → blue animated gradient (matches portfolio “Three highlights.” / faster.) */
export const accentGradientAnimated =
  "bg-[linear-gradient(to_right,#22d3ee,#3b82f6,#22d3ee)] bg-[length:300%_auto] [background-position:0%_50%] animate-gradient-shift";

export const accentGradientText = `${accentGradientAnimated} bg-clip-text text-transparent`;

export const accentGradientButton = `${accentGradientAnimated} transition-[transform,filter] duration-200 ease-out hover:scale-[1.02] hover:brightness-[1.08] disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100`;
