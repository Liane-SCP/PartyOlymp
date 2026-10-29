export function extraSizeArt(name: string) {
  const light = "#e9f1ff",
    dark = "#25334d",
    mint = "#bcff5c";
  if (name === "Saturn V")
    return (
      <g>
        <path
          d="M107 137V37l13-29 13 29v100l16 15h-18v-15h-22v15H91Z"
          fill={light}
        />
        <path d="M107 55h26v16h-26m0 33h26v13h-26" fill={dark} />
        <path d="M114 143l6 16 6-16" fill="#ffb85c" />
        <path d="M120 12v-9" stroke={light} strokeWidth="3" />
        <text x="119" y="97" fill={dark} fontSize="13" textAnchor="middle">
          USA
        </text>
      </g>
    );
  if (name === "Airbus A380" || name === "Space Shuttle")
    return (
      <g>
        <path
          d="M15 91q-11-10 13-15h110l46-50h16l-15 50h28l11-17h9l-4 32q-5 11-23 11H26Z"
          fill={light}
        />
        <path d="m89 88 39 55h30l-28-55" fill="#9b8aff" />
        <path d="M40 82h11m4 0h5" stroke={dark} strokeWidth="5" />
        {name === "Airbus A380" &&
          Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={69 + i * 10} cy="84" r="2" fill={dark} />
          ))}
        <path d="M25 100h185" stroke="#56d9ff" strokeWidth="3" />
      </g>
    );
  if (name === "Gateway Arch")
    return (
      <g>
        <path
          d="M43 151Q52 5 120 6q68-1 77 145h-16Q168 24 120 24T59 151Z"
          fill="#a8bbd3"
        />
        <path
          d="M48 148Q60 13 120 13"
          fill="none"
          stroke={light}
          strokeWidth="3"
        />
      </g>
    );
  if (name === "Washington Monument")
    return (
      <g>
        <path d="M96 150 103 26 120 7 137 26l7 124Z" fill="#e9d9b9" />
        <path d="m120 7 17 19 7 124h-24Z" fill="#c6b493" />
        <path d="M97 146h46" stroke={dark} strokeWidth="5" />
      </g>
    );
  if (name === "General Sherman")
    return (
      <g>
        <path d="m100 151 6-67h28l10 67Z" fill="#b4794c" />
        <path
          d="M120 5 75 39h19L56 71h21L37 110h166l-40-39h20l-37-32h19Z"
          fill="#5cb98e"
        />
        <path d="M119 97v53m12-53 5 53" stroke="#79502e" strokeWidth="5" />
      </g>
    );
  if (name === "James-Webb-Teleskop")
    return (
      <g>
        <path d="m15 117 77-39 129 28-77 46Z" fill="#b3bbdf" />
        <path
          d="m15 124 77-39 129 28-77 46"
          fill="none"
          stroke="#857ba9"
          strokeWidth="4"
        />
        <path d="M110 115V53" stroke={light} strokeWidth="5" />
        {[
          [100, 30],
          [123, 30],
          [89, 50],
          [112, 50],
          [135, 50],
          [100, 70],
          [123, 70],
        ].map(([x, y]) => (
          <path
            key={`${x}:${y}`}
            d={`m${x} ${y - 12} 11 6v12l-11 6-11-6v-12Z`}
            fill="#efc769"
            stroke="#7d6135"
            strokeWidth="2"
          />
        ))}
      </g>
    );
  if (name === "iPhone 16")
    return (
      <g>
        <rect
          x="82"
          y="6"
          width="76"
          height="148"
          rx="15"
          fill="#889edf"
          stroke={dark}
          strokeWidth="4"
        />
        <rect x="88" y="12" width="64" height="136" rx="10" fill="#c9d3ff" />
        <rect x="104" y="16" width="32" height="9" rx="5" fill={dark} />
        <path d="M93 133q32-105 52-86v94H93" fill="#9b8aff" />
        <path d="M109 141h23" stroke={light} strokeWidth="3" />
      </g>
    );
  if (name === "Nintendo Switch 2")
    return (
      <g>
        <rect x="12" y="33" width="216" height="95" rx="22" fill={dark} />
        <rect x="45" y="40" width="150" height="80" rx="5" fill="#70c3d3" />
        <path d="M48 113 85 65l28 32 24-26 54 42" fill="#457aa0" />
        <path d="M38 38v85" stroke="#56d9ff" strokeWidth="6" />
        <path d="M202 38v85" stroke="#ff7b9d" strokeWidth="6" />
        <circle cx="27" cy="62" r="8" fill={light} />
        <circle cx="214" cy="99" r="8" fill={light} />
        <path
          d="M20 100h15m-8-7v15m180-44h14m-7-7v14"
          stroke={light}
          strokeWidth="4"
        />
      </g>
    );
  if (name === "LEGO-Stein")
    return (
      <g>
        <path d="m29 61 62-28 118 20v69l-62 29-118-22Z" fill="#f4c04c" />
        <path d="m29 61 118 20v70l-118-22Z" fill="#ff7b6e" />
        <path d="m147 81 62-28v69l-62 29Z" fill="#bf6b48" />
        {[
          [65, 51],
          [99, 57],
          [134, 63],
          [100, 35],
          [134, 41],
          [169, 47],
        ].map(([x, y]) => (
          <g key={`${x}:${y}`}>
            <path d={`M${x - 10} ${y}v-10h20v10`} fill="#e8b74b" />
            <ellipse cx={x} cy={y - 10} rx="10" ry="5" fill="#ffe29a" />
          </g>
        ))}
      </g>
    );
  if (name === "SD-Karte" || name === "microSD-Karte")
    return (
      <g>
        <path d="M76 12h65l24 24v112H76Z" fill={dark} />
        <rect x="83" y="69" width="75" height="57" rx="5" fill="#9b8aff" />
        {[87, 100, 113, 126, 139].map((x) => (
          <rect key={x} x={x} y="23" width="8" height="29" fill="#edc26b" />
        ))}
        <text
          x="121"
          y="104"
          textAnchor="middle"
          fill={light}
          fontSize="16"
          fontWeight="900"
        >
          {name === "SD-Karte" ? "SD" : "microSD"}
        </text>
      </g>
    );
  if (name === "Golfball")
    return (
      <g>
        <circle cx="120" cy="80" r="64" fill={light} />
        {Array.from({ length: 36 }, (_, i) => {
          const a = i * 2.4,
            r = 8 * Math.sqrt(i);
          return (
            <circle
              key={i}
              cx={120 + Math.cos(a) * r}
              cy={80 + Math.sin(a) * r}
              r="4"
              fill="#b9cadc"
            />
          );
        })}
        <path d="M100 148h40" stroke={mint} strokeWidth="5" />
      </g>
    );
  return null;
}
