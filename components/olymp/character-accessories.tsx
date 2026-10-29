/** Layered, original vector wardrobe. Kept readable at scoreboard size. */
export function CharacterAccessories({
  item,
  detail = 0,
  accent = "#9b8aff",
  behind = false,
}: {
  item: number;
  detail?: number;
  accent?: string;
  behind?: boolean;
}) {
  if (behind)
    return (
      <g stroke="#172035" strokeWidth="2.5" strokeLinejoin="round">
        {detail === 9 && (
          <path
            d="M24 56Q-9 21 3 65L0 79l23-4m53-19q33-35 21 9l3 14-23-4"
            fill="#eaf6ff"
          />
        )}
        {detail === 10 && (
          <path d="M25 62 7 97q43-12 86 0L75 62Z" fill={accent} />
        )}
      </g>
    );
  return (
    <g
      stroke="#172035"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {item === 8 && (
        <g fill={accent}>
          <path d="M15 29 45 0 60 6l8 21 18 5q-35 13-71-3Z" />
          <path
            d="m46 11 2 5 6 1-5 3 1 6-5-4-5 2 2-6-4-4Z"
            fill="#ffe08a"
            stroke="none"
          />
        </g>
      )}
      {item === 9 && (
        <g>
          <path d="M8 29Q4 6 25 14 50-10 75 14q21-8 17 15Z" fill="#273349" />
          <circle cx="50" cy="17" r="7" fill="white" />
          <path d="m39 28 22-5m-22 0 22 5" stroke="white" />
          <path d="M18 39 81 54" />
          <path d="M57 39h21v14q-11 10-21 0Z" fill="#172035" />
        </g>
      )}
      {item === 10 && (
        <g>
          <path
            d="M22 24Q4 24 9 5l16 13m53 6Q96 24 91 5L75 18"
            fill="#fff2cd"
          />
          <path d="M21 30Q22 5 50 5t29 25Z" fill="#a7b5c9" />
          <path d="M47 7v22" stroke={accent} strokeWidth="7" />
        </g>
      )}
      {item === 11 && (
        <g fill="#25324a">
          <path d="M30 26 26 1h47l-4 25Z" />
          <path d="M16 27q34-9 68 0v7H16Z" />
          <path d="M29 17h42v9H29Z" fill={accent} />
        </g>
      )}
      {item === 12 && (
        <g fill={accent}>
          <path d="M22 24Q20 4 50 4t28 20Z" />
          <rect x="19" y="21" width="62" height="13" rx="5" />
          <circle cx="50" cy="4" r="6" fill="#fff2cd" />
          <path d="M32 12v8m12-10v10m12-10v10m12-8v8" opacity=".35" />
        </g>
      )}
      {item === 13 && (
        <g>
          <path d="M8 30Q17-3 50 2q33-5 42 28Z" fill={accent} />
          <ellipse cx="50" cy="31" rx="42" ry="6" fill="#fff2cd" />
          {[24, 47, 72].map((x, i) => (
            <ellipse
              key={x}
              cx={x}
              cy={i === 1 ? 10 : 21}
              rx="7"
              ry="5"
              fill="white"
              stroke="none"
            />
          ))}
        </g>
      )}
      {item === 14 && (
        <g fill="#91d66c">
          <path d="M18 32Q17 7 50 9t32 23Z" />
          <circle cx="30" cy="12" r="11" />
          <circle cx="70" cy="12" r="11" />
          <circle cx="30" cy="12" r="4" fill="white" />
          <circle cx="70" cy="12" r="4" fill="white" />
          <path d="M28 29q22 9 44 0" fill="none" />
        </g>
      )}
      {item === 15 && (
        <g>
          <path d="m27 28 23-29 23 29Z" fill={accent} />
          <path d="m40 13 22 2m-30 8 36 1" stroke="#ffe08a" strokeWidth="5" />
          <circle cx="50" cy="2" r="6" fill="#ffcf70" />
        </g>
      )}
      {item === 16 && (
        <ellipse
          cx="50"
          cy="9"
          rx="31"
          ry="7"
          fill="none"
          stroke="#ffe08a"
          strokeWidth="6"
        />
      )}
      {item === 17 && (
        <g fill="#ff6480">
          <path d="M20 27Q6 15 17 1l18 23Zm60 0Q94 15 83 1L65 24Z" />
        </g>
      )}
      {item === 18 && (
        <g>
          <path d="M39 25 50-1l12 26Z" fill="#ffdfa0" />
          <path d="m45 12 11 4m-15 4 18 4" stroke={accent} />
          <path
            d="M30 29q4-13 13-7m18 0q9-6 13 7"
            stroke="#ff7baf"
            strokeWidth="6"
          />
        </g>
      )}
      {item === 19 && (
        <g>
          {[20, 35, 50, 65, 80].map((x, i) => (
            <g
              key={x}
              transform={`translate(${x} ${22 - Math.sin(i * 0.8) * 10})`}
            >
              <path
                d="M-8 0q-4-11 4-7Q0-17 4-7q12-3 6 7 6 10-4 7-7 9-9-1-10 2-5-6Z"
                fill={accent}
              />
              <circle r="3" fill="#ffe08a" stroke="none" />
            </g>
          ))}
        </g>
      )}
      {item === 20 && (
        <g fill={accent}>
          <path d="M13 26h74v13H13Z" />
          <path d="m83 31 16 8-4 9-14-13m2-4 16-12-2 13-14 5" />
          <rect x="39" y="27" width="22" height="10" rx="2" fill="#c6d3e6" />
          <path d="m45 32 5-3 5 3-5 3Z" fill="#172035" stroke="none" />
        </g>
      )}
      {item === 21 && (
        <g>
          <rect
            x="19"
            y="33"
            width="63"
            height="24"
            rx="10"
            fill="#86e5f1"
            fillOpacity=".7"
            stroke={accent}
            strokeWidth="5"
          />
          <path
            d="M82 53h10V16h-7"
            fill="none"
            stroke={accent}
            strokeWidth="6"
          />
          <path d="m28 38 11 11m16-11 11 11" stroke="white" />
        </g>
      )}
      {item === 22 && (
        <g fill="none" stroke="#ffe08a">
          <circle cx="66" cy="44" r="14" strokeWidth="4" />
          <path d="M79 47q12 28 1 40" />
          <path d="m60 35 9 10" stroke="white" />
        </g>
      )}
      {item === 23 && (
        <g>
          <path d="M17 31h66v24H17Z" fill="#172035" />
          <path d="M23 38h54v8H23Z" fill={accent} />
          <path d="m27 37 9 11m4-11 9 11" stroke="white" opacity=".6" />
        </g>
      )}
      {detail === 1 && (
        <g fill={accent}>
          <path d="M21 78q29 12 58 0l-6 14H28Z" />
          <path d="m65 86 16 13-21-2Z" />
        </g>
      )}
      {detail === 2 && (
        <g fill={accent}>
          <path d="m48 85-18-9v21l18-9m4-3 18-9v21l-18-9" />
          <circle cx="50" cy="87" r="5" />
        </g>
      )}
      {detail === 3 && (
        <g fill="none" stroke="#ffd66a" strokeWidth="4">
          <path d="M24 75q26 29 52 0" />
          <circle cx="50" cy="90" r="7" />
        </g>
      )}
      {detail === 4 && (
        <path d="m75 64 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill={accent} />
      )}
      {detail === 5 && (
        <path
          d="m23 54 11-2-6 10h7L20 78l4-13h-6Z"
          fill={accent}
          stroke="none"
        />
      )}
      {detail === 6 && (
        <g transform="rotate(-25 74 63)">
          <rect x="61" y="57" width="27" height="12" rx="4" fill="#ffd1a2" />
          <path d="M72 60v6m5-6v6" stroke="#bc906e" />
        </g>
      )}
      {detail === 7 && (
        <g fill="#87483c" stroke="none">
          {[22, 29, 71, 78].map((x, i) => (
            <circle key={x} cx={x} cy={57 + (i % 2) * 4} r="2" />
          ))}
        </g>
      )}
      {detail === 8 && (
        <g fill="none" stroke="#ffdc74" strokeWidth="4">
          <ellipse cx="14" cy="64" rx="7" ry="10" />
          <ellipse cx="86" cy="64" rx="7" ry="10" />
        </g>
      )}
      {detail === 12 && (
        <g fill="none" stroke={accent} strokeWidth="3">
          <circle cx="35" cy="44" r="13" />
          <circle cx="66" cy="44" r="13" />
          <path d="M48 42h5M11 38l11 3m57 0 10-3" />
        </g>
      )}
      {detail === 13 && (
        <g>
          <path d="m17 29 67 32" fill="none" />
          <path d="M24 36h23v15q-12 11-23 0Z" fill="#172035" />
        </g>
      )}
      {detail === 14 && (
        <g>
          <path d="M25 58q25 9 50 0L70 77q-20 14-40 0Z" fill={accent} />
          <path d="m34 65 30 2m-27 5 24 1" fill="none" opacity=".3" />
        </g>
      )}
      {detail === 15 && (
        <g fill={accent}>
          <path d="M35 38c-14-17-26 3 0 20 26-17 14-37 0-20Zm31 0c-14-17-26 3 0 20 26-17 14-37 0-20Z" />
          <path d="M47 41h7" />
        </g>
      )}
      {detail === 11 && (
        <path
          d="M25 63q8 10 25 12 17-2 25-12L64 91 50 99 36 91Z"
          fill={accent}
        />
      )}
    </g>
  );
}
