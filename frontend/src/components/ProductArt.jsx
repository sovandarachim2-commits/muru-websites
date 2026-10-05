import { useId } from "react"

const tones = {
  pink: { light: "#ffe4ef", body: "#f7b4cc", deep: "#ee7ea6" },
  blue: { light: "#eef6fd", body: "#c5dff3", deep: "#8ebfe4" },
  rose: { light: "#fff0f5", body: "#f8c3d6", deep: "#f09ab8" },
  cream: { light: "#fff", body: "#fff7fa", deep: "#f6d5e3" },
}

export default function ProductArt({ variant = "pump", tone = "pink", image, alt = "Product photo" }) {
  const rawId = useId().replace(/:/g, "")
  const color = tones[tone] ?? tones.pink
  const gradient = `muru-${rawId}`

  if (image) return <img src={image} alt={alt} className="h-full w-full object-contain" />

  return (
    <svg viewBox="0 0 200 250" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="42%" stopColor={color.body} />
          <stop offset="100%" stopColor={color.deep} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="232" rx="48" ry="8" fill="#f7c3d6" opacity="0.55" />
      {variant === "jar" && <Jar gradient={gradient} color={color} />}
      {variant === "dropper" && <Dropper gradient={gradient} color={color} />}
      {variant === "compact" && <Compact gradient={gradient} color={color} />}
      {variant === "tube" && <Tube gradient={gradient} color={color} />}
      {variant === "bottle" && <Bottle gradient={gradient} color={color} />}
      {(variant === "pump" || !["jar", "dropper", "compact", "tube", "bottle"].includes(variant)) && (
        <Pump gradient={gradient} color={color} />
      )}
    </svg>
  )
}

function Brand({ y }) {
  return (
    <text
      x="100"
      y={y}
      textAnchor="middle"
      fontSize="13"
      fontFamily="Manrope, sans-serif"
      fontWeight="700"
      fill="#e45488"
      letterSpacing="3"
    >
      MURU
    </text>
  )
}

function Pump({ gradient, color }) {
  return (
    <g>
      <rect x="86" y="26" width="28" height="12" rx="3" fill="#fff" />
      <rect x="96" y="38" width="8" height="16" fill={color.light} />
      <rect x="76" y="52" width="48" height="12" rx="4" fill="#fff" />
      <rect x="58" y="64" width="84" height="150" rx="30" fill={`url(#${gradient})`} />
      <rect x="74" y="108" width="52" height="48" rx="8" fill="#fff" opacity="0.92" />
      <Brand y="138" />
    </g>
  )
}

function Bottle({ gradient }) {
  return (
    <g>
      <rect x="88" y="34" width="24" height="28" rx="6" fill="#fff" />
      <rect x="64" y="60" width="72" height="154" rx="26" fill={`url(#${gradient})`} />
      <rect x="78" y="112" width="44" height="46" rx="8" fill="#fff" opacity="0.92" />
      <Brand y="140" />
    </g>
  )
}

function Jar({ gradient, color }) {
  return (
    <g>
      <rect x="58" y="78" width="84" height="22" rx="8" fill={color.deep} />
      <rect x="50" y="96" width="100" height="112" rx="22" fill={`url(#${gradient})`} />
      <rect x="70" y="128" width="60" height="40" rx="8" fill="#fff" opacity="0.92" />
      <Brand y="154" />
    </g>
  )
}

function Dropper({ gradient, color }) {
  return (
    <g>
      <rect x="92" y="28" width="16" height="28" rx="6" fill="#fff" />
      <rect x="84" y="52" width="32" height="16" rx="4" fill={color.deep} />
      <path d="M70 78h60l-8 130a22 22 0 0 1-44 0L70 78Z" fill={`url(#${gradient})`} />
      <rect x="78" y="124" width="44" height="40" rx="8" fill="#fff" opacity="0.92" />
      <Brand y="150" />
    </g>
  )
}

function Compact({ gradient, color }) {
  return (
    <g>
      <ellipse cx="100" cy="118" rx="62" ry="28" fill={color.deep} />
      <ellipse cx="100" cy="148" rx="70" ry="46" fill={`url(#${gradient})`} />
      <ellipse cx="100" cy="146" rx="40" ry="22" fill="#f3d2b0" />
      <ellipse cx="100" cy="146" rx="28" ry="14" fill="#f8e6d4" />
      <Brand y="196" />
    </g>
  )
}

function Tube({ gradient }) {
  return (
    <g>
      <rect x="78" y="36" width="44" height="16" rx="4" fill="#fff" />
      <path d="M70 52h60l-8 150a16 16 0 0 1-44 0L70 52Z" fill={`url(#${gradient})`} />
      <rect x="82" y="108" width="36" height="44" rx="8" fill="#fff" opacity="0.92" />
      <Brand y="136" />
    </g>
  )
}
