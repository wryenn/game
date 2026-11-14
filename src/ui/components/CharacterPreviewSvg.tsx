import React from 'react';
import { CHARACTER_COLORS } from '../../content/constants';
import { CostumeConfig } from '../../sim/types';

interface CharacterPreviewSvgProps {
  costume: CostumeConfig;
  size?: number;
  celebrating?: boolean;
  className?: string;
}

const BODY_ROWS: [number, number][] = [
  [-26, 4],
  [-25, 6],
  [-24, 7],
  [-23, 8],
  [-22, 8],
  [-21, 9],
  [-20, 9],
  [-19, 9],
  [-18, 9],
  [-17, 10],
  [-16, 10],
  [-15, 10],
  [-14, 10],
  [-13, 10],
  [-12, 10],
  [-11, 10],
  [-10, 10],
  [-9, 10],
  [-8, 10],
  [-7, 9],
  [-6, 9],
  [-5, 8],
  [-4, 7],
  [-3, 5],
];

export const CharacterPreviewSvg: React.FC<CharacterPreviewSvgProps> = ({
  costume,
  size = 84,
  celebrating = false,
  className = '',
}) => {
  const theme = CHARACTER_COLORS[costume.colorId];

  return (
    <svg
      width={size}
      height={size}
      viewBox="-18 -46 36 50"
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <g className={celebrating ? 'animate-bounce' : ''}>
        {/* Back Accessories: Pelerin / Kalkan / Kanat */}
        {costume.accessoryId === 'pelerin' && (
          <g>
            <rect x="-13" y="-18" width="9" height="14" fill={theme.dark} />
            <rect x="-12" y="-17" width="7" height="12" fill="#B91C1C" />
            <rect x="-12" y="-7" width="7" height="2" fill="#FACC15" />
          </g>
        )}
        {costume.accessoryId === 'kalkan' && (
          <g>
            <rect x="-13" y="-20" width="8" height="12" fill={theme.dark} />
            <rect x="-12" y="-19" width="6" height="10" fill="#94A3B8" />
            <rect x="-10" y="-16" width="2" height="4" fill={theme.trim} />
          </g>
        )}
        {costume.accessoryId === 'kanat' && (
          <g>
            <rect x="-16" y="-21" width="7" height="7" fill={theme.dark} />
            <rect x="-15" y="-20" width="5" height="5" fill="#F8FAFC" />
            <rect x="-15" y="-17" width="5" height="2" fill="#CBD5E1" />
            <rect x="9" y="-21" width="7" height="7" fill={theme.dark} />
            <rect x="10" y="-20" width="5" height="5" fill="#F8FAFC" />
            <rect x="10" y="-17" width="5" height="2" fill="#CBD5E1" />
          </g>
        )}

        {/* Pixel ground shadow */}
        <rect x="-10" y="0" width="20" height="2" fill="rgba(9, 14, 26, 0.55)" />

        {/* Chubby pixel feet */}
        <rect x="-7" y="-4" width="6" height="4" fill={theme.dark} />
        <rect x="-6" y="-3" width="4" height="2" fill={theme.secondary} />
        <rect x="-6" y="-3" width="2" height="1" fill={theme.light} />

        <rect x="1" y="-4" width="6" height="4" fill={theme.dark} />
        <rect x="2" y="-3" width="4" height="2" fill={theme.secondary} />
        <rect x="2" y="-3" width="2" height="1" fill={theme.light} />

        {/* Chubby pixel arms */}
        <rect x="-13" y="-13" width="4" height="5" fill={theme.dark} />
        <rect x="-12" y="-12" width="3" height="3" fill={theme.primary} />
        <rect x="9" y="-13" width="4" height="5" fill={theme.dark} />
        <rect x="9" y="-12" width="3" height="3" fill={theme.primary} />

        {/* Outer dark outline for Pou squircle */}
        <rect x="-4" y="-27" width="8" height="1" fill={theme.dark} />
        {BODY_ROWS.map(([y, hw]) => (
          <rect
            key={`out-${y}`}
            x={-hw - 1}
            y={y}
            width={(hw + 1) * 2}
            height="1"
            fill={theme.dark}
          />
        ))}
        <rect x="-5" y="-2" width="10" height="1" fill={theme.dark} />

        {/* Base clay body */}
        {BODY_ROWS.map(([y, hw]) => (
          <rect
            key={`fill-${y}`}
            x={-hw}
            y={y}
            width={hw * 2}
            height="1"
            fill={theme.primary}
          />
        ))}

        {/* Bottom-right 3D pixel shading */}
        <rect x="-8" y="-5" width="16" height="2" fill={theme.secondary} />
        <rect x="-5" y="-3" width="10" height="1" fill={theme.secondary} />
        <rect x="5" y="-16" width="5" height="10" fill={theme.secondary} />
        <rect x="7" y="-20" width="2" height="5" fill={theme.secondary} />

        {/* Top-left glossy clay highlight */}
        <rect x="-6" y="-24" width="5" height="2" fill={theme.light} />
        <rect x="-8" y="-22" width="3" height="4" fill={theme.light} />
        <rect x="-6" y="-23" width="3" height="1" fill="rgba(255,255,255,0.75)" />
        <rect x="-7" y="-22" width="1" height="2" fill="rgba(255,255,255,0.75)" />

        {/* Ottoman sash/belt */}
        <rect x="-10" y="-10" width="20" height="4" fill={theme.secondary} />
        <rect x="-10" y="-9" width="20" height="2" fill={theme.trim} />
        <rect x="-1" y="-10" width="3" height="4" fill={theme.trim} />

        {/* Big shiny pixel eyes */}
        <rect x="-5" y="-19" width="3" height="4" fill="#FFFFFF" />
        <rect x="-4" y="-18" width="2" height="3" fill="#0F172A" />
        <rect x="-4" y="-18" width="1" height="1" fill="#FFFFFF" />

        <rect x="2" y="-19" width="3" height="4" fill="#FFFFFF" />
        <rect x="3" y="-18" width="2" height="3" fill="#0F172A" />
        <rect x="3" y="-18" width="1" height="1" fill="#FFFFFF" />

        {/* Blushing cheeks & smile */}
        <rect x="-7" y="-15" width="2" height="1" fill="rgba(255,110,140,0.55)" />
        <rect x="5" y="-15" width="2" height="1" fill="rgba(255,110,140,0.55)" />
        <rect x="-1" y="-13" width="3" height="1" fill="#0F172A" />

        {/* Ottoman pixel mustache */}
        {costume.mustacheStyle === 'kaytan' && (
          <g fill="#241814">
            <rect x="-5" y="-15" width="10" height="1" />
            <rect x="-7" y="-16" width="3" height="1" />
            <rect x="4" y="-16" width="3" height="1" />
          </g>
        )}
        {costume.mustacheStyle === 'pala' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="12" height="2" />
            <rect x="-8" y="-14" width="3" height="2" />
            <rect x="5" y="-14" width="3" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'burgu' && (
          <g fill="#241814">
            <rect x="-5" y="-15" width="10" height="2" />
            <rect x="-7" y="-16" width="2" height="2" />
            <rect x="5" y="-16" width="2" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'cember' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="5" height="3" />
            <rect x="1" y="-15" width="5" height="3" />
            <rect x="-1" y="-15" width="2" height="2" />
          </g>
        )}
        {costume.mustacheStyle === 'sultan_sakal' && (
          <g fill="#241814">
            <rect x="-6" y="-15" width="12" height="2" />
            <rect x="-5" y="-13" width="10" height="3" />
            <rect x="-3" y="-10" width="6" height="2" />
            <rect x="-2" y="-12" width="4" height="2" fill="#475569" />
          </g>
        )}

        {/* Front Accessory: Gözlük */}
        {costume.accessoryId === 'gozluk' && (
          <g>
            <rect x="-6" y="-20" width="5" height="6" fill="#0F172A" />
            <rect x="1" y="-20" width="5" height="6" fill="#0F172A" />
            <rect x="-1" y="-18" width="2" height="1" fill="#0F172A" />
            <rect x="-5" y="-19" width="3" height="4" fill="#38BDF8" />
            <rect x="2" y="-19" width="3" height="4" fill="#38BDF8" />
            <rect x="-5" y="-19" width="1" height="2" fill="#E0F2FE" />
            <rect x="2" y="-19" width="1" height="2" fill="#E0F2FE" />
          </g>
        )}

        {/* Color-harmonized pixel Headgear */}
        {(costume.fesStyle === 'klasik_fes' || costume.fesStyle === 'puskullu_fes') && (() => {
          const h = costume.fesStyle === 'puskullu_fes' ? 10 : 8;
          const fezCol = costume.fesStyle === 'puskullu_fes' ? theme.secondary : theme.primary;
          return (
            <g>
              <rect x="-5" y={-26 - h - 1} width="10" height="1" fill={theme.dark} />
              <rect x="-6" y={-26 - h} width="12" height={h - 2} fill={theme.dark} />
              <rect x="-7" y="-29" width="14" height="4" fill={theme.dark} />

              <rect x="-5" y={-26 - h} width="10" height={h} fill={fezCol} />
              <rect x="-6" y="-29" width="12" height="3" fill={fezCol} />
              <rect x="-4" y={-25 - h} width="2" height={h - 3} fill="rgba(255,255,255,0.35)" />

              {costume.fesStyle === 'puskullu_fes' && (
                <rect x="-6" y="-28" width="12" height="2" fill={theme.trim} />
              )}

              <rect x="-1" y={-26 - h - 1} width="2" height="2" fill={theme.trim} />
              <rect x="-4" y={-26 - h} width="2" height="2" fill="#1E1B18" />
              <rect x="-5" y={-24 - h} width="2" height="5" fill="#1E1B18" />
            </g>
          );
        })()}

        {costume.fesStyle === 'yeniceri_bork' && (
          <g>
            <rect x="-9" y="-34" width="5" height="9" fill={theme.dark} />
            <rect x="-8" y="-33" width="3" height="7" fill="#E2E8F0" />

            <rect x="-5" y="-38" width="10" height="1" fill={theme.dark} />
            <rect x="-6" y="-37" width="12" height="12" fill={theme.dark} />
            <rect x="-5" y="-37" width="10" height="11" fill="#F8FAFC" />

            <rect x="1" y="-33" width="2" height="7" fill={theme.trim} />
            <rect x="2" y="-38" width="3" height="5" fill={theme.primary} />
            <rect x="0" y="-40" width="3" height="2" fill={theme.primary} />
          </g>
        )}

        {costume.fesStyle === 'saray_kavuk' && (
          <g>
            <rect x="-5" y="-36" width="10" height="4" fill={theme.dark} />
            <rect x="-9" y="-33" width="18" height="7" fill={theme.dark} />
            <rect x="-4" y="-35" width="8" height="3" fill={theme.secondary} />
            <rect x="-8" y="-32" width="16" height="5" fill="#FEF3C7" />
            <rect x="-6" y="-31" width="5" height="1" fill="#FFFFFF" />
            <rect x="1" y="-31" width="3" height="3" fill={theme.primary} />
          </g>
        )}

        {costume.fesStyle === 'denizci_bere' && (
          <g>
            <rect x="-8" y="-33" width="16" height="7" fill={theme.dark} />
            <rect x="-6" y="-35" width="12" height="3" fill={theme.dark} />
            <rect x="-7" y="-32" width="14" height="5" fill="#0F172A" />
            <rect x="-5" y="-34" width="10" height="2" fill="#0F172A" />
            <rect x="-7" y="-29" width="14" height="2" fill="#DC2626" />
            <rect x="-1" y="-32" width="2" height="2" fill="#FDE047" />
          </g>
        )}

        {costume.fesStyle === 'altin_migfer' && (
          <g>
            <rect x="-6" y="-37" width="12" height="11" fill={theme.dark} />
            <rect x="-8" y="-30" width="16" height="4" fill={theme.dark} />
            <rect x="-1" y="-40" width="2" height="3" fill={theme.dark} />
            <rect x="-5" y="-36" width="10" height="9" fill="#CBD5E1" />
            <rect x="-7" y="-29" width="14" height="2" fill="#CBD5E1" />
            <rect x="-5" y="-30" width="10" height="2" fill="#FACC15" />
            <rect x="0" y="-39" width="1" height="3" fill="#FACC15" />
          </g>
        )}

        {costume.fesStyle === 'sultan_taci' && (
          <g>
            <rect x="-8" y="-34" width="16" height="8" fill={theme.dark} />
            <rect x="-8" y="-37" width="4" height="3" fill={theme.dark} />
            <rect x="-2" y="-38" width="4" height="4" fill={theme.dark} />
            <rect x="4" y="-37" width="4" height="3" fill={theme.dark} />
            <rect x="-7" y="-33" width="14" height="6" fill="#FACC15" />
            <rect x="-7" y="-36" width="2" height="3" fill="#FACC15" />
            <rect x="-1" y="-37" width="2" height="4" fill="#FACC15" />
            <rect x="5" y="-36" width="2" height="3" fill="#FACC15" />
            <rect x="-1" y="-31" width="2" height="2" fill="#EF4444" />
            <rect x="-5" y="-31" width="2" height="2" fill="#14D8C4" />
            <rect x="3" y="-31" width="2" height="2" fill="#14D8C4" />
          </g>
        )}

        {/* Overhead Accessory: Mühür Halesi */}
        {costume.accessoryId === 'hale' && (
          <g>
            <rect x="-7" y="-42" width="14" height="3" fill="#B45309" />
            <rect x="-6" y="-41" width="12" height="1" fill="#FDE047" />
            <rect x="-3" y="-41" width="4" height="1" fill="#FFFFFF" />
          </g>
        )}
      </g>
    </svg>
  );
};
