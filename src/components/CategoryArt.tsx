import { useId, type ReactNode } from 'react';
import { PLACE_ART } from '../lib/art';
import type { Category } from '../lib/types';

/**
 * Hand-drawn (code-drawn) cover illustrations, one scene per kind of place.
 * Flat, modern and consistent, so the app has real visual identity without stock photos.
 */
const SKY: Record<Category, [string, string]> = {
  bank: ['#0f766e', '#5eead4'],
  barber: ['#fb923c', '#fde3cf'],
  pharmacy: ['#059669', '#a7f3d0'],
  government: ['#4338ca', '#c7d2fe'],
  clinic: ['#2563eb', '#bfdbfe'],
  shop: ['#f59e0b', '#fef3c7'],
  restaurant: ['#9a3412', '#fed7aa'],
  school: ['#ca8a04', '#fef08a'],
  service: ['#334155', '#cbd5e1'],
  other: ['#0d9488', '#99f6e4'],
};

const W = '#ffffff';
const SHADE = '#e2e8f0';
const INK = '#1e293b';

function Tree({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} 100) scale(${s})`}>
      <rect x={-1.2} y={-12} width={2.4} height={12} fill="#7c5a3a" />
      <circle cx={0} cy={-16} r={7} fill="#15803d" />
      <circle cx={-3} cy={-19} r={4} fill="#22c55e" opacity={0.7} />
    </g>
  );
}

function Windows({ x, y, cols, rows, w = 9, h = 8, gap = 5, fill = '#bae6fd' }: { x: number; y: number; cols: number; rows: number; w?: number; h?: number; gap?: number; fill?: string }) {
  const out: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push(<rect key={`${r}-${c}`} x={x + c * (w + gap)} y={y + r * (h + gap)} width={w} height={h} rx={1.5} fill={fill} />);
  return <>{out}</>;
}

const SCENES: Record<Category, (id: string) => ReactNode> = {
  bank: () => (
    <g>
      <rect x={56} y={94} width={88} height={6} fill={SHADE} />
      <rect x={60} y={90} width={80} height={4} fill="#f1f5f9" />
      <rect x={64} y={58} width={72} height={32} fill={W} />
      <polygon points="56,58 100,34 144,58" fill={W} />
      <polygon points="70,55 100,40 130,55" fill="#0f766e" opacity={0.18} />
      {[69, 83, 109, 123].map((x) => (
        <rect key={x} x={x} y={61} width={8} height={29} rx={1} fill={SHADE} />
      ))}
      <rect x={95} y={68} width={10} height={22} rx={5} fill="#0f766e" />
      <circle cx={158} cy={36} r={10} fill="#fbbf24" />
      <circle cx={158} cy={36} r={7} fill="none" stroke="#fde68a" strokeWidth={1.5} />
      <text x={158} y={40} textAnchor="middle" fontSize={10} fontWeight={800} fill="#92400e">$</text>
    </g>
  ),
  barber: (id) => (
    <g>
      <rect x={50} y={46} width={100} height={8} rx={2} fill={INK} />
      <rect x={55} y={54} width={90} height={46} fill={W} />
      <rect x={70} y={33} width={60} height={12} rx={3} fill={INK} />
      <text x={100} y={41.5} textAnchor="middle" fontSize={7} fontWeight={800} letterSpacing={1.5} fill={W}>BARBER</text>
      <rect x={62} y={62} width={36} height={24} rx={2} fill="#bae6fd" />
      <path d="M70 86 v-8 h10 v8 M75 78 v-6" stroke="#64748b" strokeWidth={2} fill="none" />
      <rect x={106} y={64} width={22} height={36} rx={1.5} fill={INK} />
      <circle cx={123} cy={83} r={1.4} fill="#fbbf24" />
      <defs>
        <clipPath id={`pole${id}`}>
          <rect x={138} y={56} width={9} height={36} rx={4.5} />
        </clipPath>
      </defs>
      <rect x={138} y={56} width={9} height={36} rx={4.5} fill={W} />
      <g clipPath={`url(#pole${id})`}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <polygon key={k} points={`136,${58 + k * 7} 150,${51 + k * 7} 150,${54.5 + k * 7} 136,${61.5 + k * 7}`} fill={k % 2 ? '#2563eb' : '#ef4444'} />
        ))}
      </g>
      <circle cx={142.5} cy={55} r={4} fill="#94a3b8" />
      <circle cx={142.5} cy={93} r={3.5} fill="#94a3b8" />
    </g>
  ),
  pharmacy: () => (
    <g>
      <circle cx={100} cy={30} r={16} fill="#34d399" opacity={0.35} />
      <rect x={91} y={21} width={18} height={18} rx={4} fill="#10b981" />
      <rect x={98} y={24} width={4} height={12} rx={1} fill={W} />
      <rect x={94} y={28} width={12} height={4} rx={1} fill={W} />
      <rect x={52} y={46} width={96} height={7} rx={2} fill="#065f46" />
      <rect x={56} y={53} width={88} height={47} fill={W} />
      <Windows x={63} y={60} cols={2} rows={1} w={20} h={16} gap={6} fill="#d1fae5" />
      <rect x={117} y={64} width={20} height={36} rx={1.5} fill="#065f46" />
      <g transform="rotate(-25 160 80)">
        <rect x={150} y={76} width={20} height={9} rx={4.5} fill={W} />
        <path d="M160 76 h5.5 a4.5 4.5 0 0 1 0 9 h-5.5 z" fill="#f43f5e" />
      </g>
    </g>
  ),
  government: () => (
    <g>
      <line x1={100} y1={14} x2={100} y2={30} stroke={INK} strokeWidth={1.2} />
      <rect x={100.5} y={14} width={13} height={8} fill="#f59e0b" />
      <path d="M80 54 A20 20 0 0 1 120 54 Z" fill={W} />
      <rect x={78} y={52} width={44} height={8} fill={SHADE} />
      <polygon points="48,62 100,58 152,62" fill={W} />
      <rect x={50} y={62} width={100} height={38} fill={W} />
      {[56, 68, 80, 112, 124, 136].map((x) => (
        <rect key={x} x={x} y={66} width={7} height={34} rx={1} fill={SHADE} />
      ))}
      <rect x={93} y={72} width={14} height={28} rx={7} fill="#4338ca" />
      <rect x={44} y={98} width={112} height={4} fill={SHADE} />
    </g>
  ),
  clinic: () => (
    <g>
      <path d="M14 30 h22 l5 -9 l6 18 l5 -9 h18" stroke={W} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <rect x={60} y={44} width={80} height={56} rx={2} fill={W} />
      <rect x={56} y={40} width={88} height={6} rx={2} fill="#1d4ed8" />
      <Windows x={67} y={52} cols={4} rows={2} w={11} h={9} gap={6} fill="#dbeafe" />
      <rect x={86} y={80} width={28} height={20} rx={1.5} fill="#bfdbfe" />
      <rect x={82} y={76} width={36} height={5} rx={2} fill="#1d4ed8" />
      <circle cx={100} cy={28} r={10} fill={W} />
      <rect x={98} y={22} width={4} height={12} rx={1} fill="#ef4444" />
      <rect x={94} y={26} width={12} height={4} rx={1} fill="#ef4444" />
    </g>
  ),
  shop: () => (
    <g>
      <rect x={56} y={48} width={88} height={52} fill={W} />
      {Array.from({ length: 8 }, (_, k) => (
        <g key={k}>
          <rect x={56 + k * 11} y={44} width={11} height={14} fill={k % 2 ? '#fed7aa' : '#f97316'} />
          <circle cx={61.5 + k * 11} cy={58} r={5.5} fill={k % 2 ? '#fed7aa' : '#f97316'} />
        </g>
      ))}
      <rect x={52} y={40} width={96} height={6} rx={2} fill="#9a3412" />
      <rect x={63} y={68} width={44} height={24} rx={2} fill="#fef3c7" />
      <rect x={68} y={78} width={8} height={14} rx={1} fill="#f97316" />
      <rect x={79} y={74} width={9} height={18} rx={1} fill="#38bdf8" />
      <rect x={91} y={80} width={10} height={12} rx={1} fill="#a3e635" />
      <rect x={115} y={66} width={21} height={34} rx={1.5} fill={INK} />
      <circle cx={131} cy={84} r={1.4} fill="#fbbf24" />
    </g>
  ),
  restaurant: () => (
    <g>
      <path d="M92 18 q3 -5 0 -10 M100 18 q3 -5 0 -10 M108 18 q3 -5 0 -10" stroke={W} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.8} />
      <path d="M88 22 h24 v10 a12 12 0 0 1 -24 0 z" fill={W} />
      <path d="M112 25 a5 5 0 0 1 0 10" stroke={W} strokeWidth={2.5} fill="none" />
      <rect x={56} y={50} width={88} height={50} fill={W} />
      <rect x={52} y={46} width={96} height={10} rx={2} fill="#9a3412" />
      {Array.from({ length: 8 }, (_, k) => (
        <circle key={k} cx={58 + k * 12} cy={56} r={6} fill="#9a3412" />
      ))}
      <rect x={63} y={66} width={46} height={22} rx={2} fill="#ffedd5" />
      <rect x={117} y={64} width={20} height={36} rx={1.5} fill="#7c2d12" />
      <circle cx={160} cy={92} r={7} fill={W} />
      <rect x={159} y={92} width={2} height={8} fill={W} />
      <circle cx={168} cy={97} r={3} fill="#fed7aa" />
    </g>
  ),
  school: () => (
    <g>
      <line x1={36} y1={52} x2={36} y2={100} stroke={INK} strokeWidth={1.3} />
      <rect x={36.6} y={52} width={14} height={9} fill="#ef4444" />
      <rect x={46} y={60} width={108} height={40} fill={W} />
      <polygon points="42,62 100,52 158,62" fill="#b91c1c" />
      <rect x={88} y={34} width={24} height={28} fill={W} />
      <polygon points="84,35 100,20 116,35" fill="#b91c1c" />
      <circle cx={100} cy={45} r={6.5} fill={W} stroke={INK} strokeWidth={1.3} />
      <path d="M100 45 v-4 M100 45 l3 2" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <Windows x={52} y={68} cols={3} rows={2} w={9} h={8} gap={5} fill="#fef3c7" />
      <Windows x={121} y={68} cols={2} rows={2} w={9} h={8} gap={5} fill="#fef3c7" />
      <rect x={92} y={78} width={16} height={22} rx={8} fill="#b91c1c" />
    </g>
  ),
  service: () => (
    <g>
      <g transform="translate(158 32)">
        {Array.from({ length: 8 }, (_, k) => (
          <rect key={k} x={-2.5} y={-13} width={5} height={6} rx={1} fill={W} opacity={0.8} transform={`rotate(${k * 45})`} />
        ))}
        <circle r={9} fill={W} opacity={0.8} />
        <circle r={3.5} fill="#334155" />
      </g>
      <rect x={50} y={44} width={100} height={8} rx={2} fill={INK} />
      <rect x={54} y={52} width={92} height={48} fill={W} />
      <rect x={62} y={62} width={48} height={38} rx={1.5} fill="#64748b" />
      {[68, 74, 80, 86, 92].map((y) => (
        <line key={y} x1={62} x2={110} y1={y} y2={y} stroke="#94a3b8" strokeWidth={1.2} />
      ))}
      <rect x={118} y={64} width={20} height={36} rx={1.5} fill={INK} />
      <rect x={78} y={30} width={44} height={11} rx={3} fill="#0ea5e9" />
      <g transform="rotate(-35 100 35.5)">
        <rect x={92} y={33.5} width={18} height={4} rx={2} fill={W} />
        <circle cx={92} cy={35.5} r={3.6} fill={W} />
        <circle cx={90.6} cy={35.5} r={1.5} fill="#0ea5e9" />
      </g>
    </g>
  ),
  other: () => (
    <g>
      <ellipse cx={100} cy={100} rx={30} ry={5} fill="#0f172a" opacity={0.15} />
      <path d="M100 98 C 84 78, 78 66, 78 56 a22 22 0 0 1 44 0 c0 10 -6 22 -22 42 z" fill={W} />
      <circle cx={100} cy={56} r={9} fill="#0d9488" />
    </g>
  ),
};

export default function CategoryArt({ category, className = '' }: { category: Category; className?: string }) {
  const uid = useId().replace(/:/g, '');
  const img = PLACE_ART[category];
  if (img) return <img src={img} alt="" aria-hidden="true" className={`${className} object-cover`} />;
  const [top, bottom] = SKY[category] ?? SKY.other;
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#sky${uid})`} />
      {/* Sky details */}
      <circle cx="30" cy="22" r="26" fill="#fff" opacity="0.08" />
      <g fill="#fff" opacity="0.45">
        <ellipse cx="40" cy="40" rx="14" ry="5" />
        <ellipse cx="50" cy="37" rx="9" ry="5" />
        <ellipse cx="168" cy="58" rx="12" ry="4" />
      </g>
      {/* Hills */}
      <path d="M0 92 C 30 78, 60 84, 90 90 S 160 76, 200 86 V120 H0 Z" fill="#fff" opacity="0.18" />
      {SCENES[category]?.(uid) ?? SCENES.other(uid)}
      <Tree x={30} s={1.1} />
      <Tree x={176} s={0.9} />
      <Tree x={188} s={0.7} />
      {/* Ground */}
      <rect y="100" width="200" height="20" fill="#0f172a" opacity="0.14" />
      <rect y="100" width="200" height="2" fill="#fff" opacity="0.35" />
    </svg>
  );
}
