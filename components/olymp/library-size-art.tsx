/** Original category illustrations, deliberately symbolic rather than exact plans. */
export function librarySizeArt(kind?: string) {
  const dark = "#25334d",
    light = "#d9e9fb",
    mint = "#bcff5c",
    purple = "#9b8aff";
  if (kind === "bridge")
    return (
      <>
        <path
          d="M4 139q15-8 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0"
          fill="none"
          stroke="#63cce5"
          strokeWidth="5"
        />
        <path
          d="M57 131V29h12v102M171 131V29h12v102"
          fill={purple}
          stroke={dark}
          strokeWidth="3"
        />
        <path
          d="M5 95Q38 94 63 35Q120 132 177 35Q205 94 235 95"
          fill="none"
          stroke={dark}
          strokeWidth="4"
        />
        <path
          d="M18 92v22m24-43v43m44-50v50m22-31v31m24-31v31m22-50v50m44-43v43m24-22v22"
          stroke={purple}
          strokeWidth="3"
        />
        <rect x="3" y="109" width="234" height="11" rx="3" fill={dark} />
        <path d="M5 113h230" stroke={mint} strokeWidth="2" />
      </>
    );
  if (kind === "ship")
    return (
      <>
        <path d="M12 101h217l-27 34H47z" fill={dark} />
        <path d="M31 105h179l-8 10H38z" fill={purple} />
        <path
          d="M46 99V77h102V56h39v43"
          fill={light}
          stroke={dark}
          strokeWidth="3"
        />
        <path
          d="M154 55V43h20v12M169 44V22m0 0 29 9-29 5"
          fill={mint}
          stroke={dark}
          strokeWidth="3"
        />
        {[60, 81, 102, 123, 157, 176].map((x) => (
          <rect key={x} x={x} y="84" width="10" height="7" rx="2" fill={dark} />
        ))}
        <path
          d="M5 141q15-7 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0"
          fill="none"
          stroke="#63cce5"
          strokeWidth="5"
        />
      </>
    );
  if (kind === "aircraft")
    return (
      <>
        <path
          d="m23 102 33-4 41-7-24-57 21 2 49 50 57-1q30 0 33 15-8 12-33 12H43L12 75l16-2 22 23"
          fill={light}
          stroke={dark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="m104 108-35 31 22 2 60-31"
          fill={purple}
          stroke={dark}
          strokeWidth="3"
        />
        <path d="m198 89 9 11h-19l-6-10" fill={dark} />
        {[68, 85, 102, 119, 136, 153, 170].map((x) => (
          <circle key={x} cx={x} cy="100" r="3" fill={dark} />
        ))}
        <path
          d="M10 124h39M5 137h28"
          stroke={mint}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  if (kind === "tower")
    return (
      <>
        <path
          d="M120 5v26M111 59h18l16 92H95z"
          fill={light}
          stroke={dark}
          strokeWidth="4"
        />
        <path
          d="M87 36h66l-8 23H95z"
          fill={purple}
          stroke={dark}
          strokeWidth="4"
        />
        <ellipse
          cx="120"
          cy="36"
          rx="33"
          ry="8"
          fill={mint}
          stroke={dark}
          strokeWidth="3"
        />
        <path
          d="M107 86h26M103 112h34M84 151h72"
          stroke={dark}
          strokeWidth="4"
        />
      </>
    );
  if (kind === "statue")
    return (
      <>
        <path d="M82 142h76v12H82zM91 129h58v13H91z" fill={dark} />
        <path
          d="m113 45-18 21-13-26-8 4 12 41 15-6-4 49h49l-11-61 21-28-7-6-26 20"
          fill={purple}
          stroke={dark}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle
          cx="119"
          cy="31"
          r="14"
          fill={light}
          stroke={dark}
          strokeWidth="3"
        />
        <path
          d="m108 69-2 46m16-51 8 51M153 33l8-14"
          stroke={dark}
          strokeWidth="3"
        />
        <path d="m153 19 8-16 8 16-8 7z" fill={mint} />
      </>
    );
  if (kind === "building")
    return (
      <>
        <path
          d="M78 152V37h29V16h39v136z"
          fill={purple}
          stroke={dark}
          strokeWidth="3"
        />
        <path
          d="M146 57h24v95h-24"
          fill={light}
          stroke={dark}
          strokeWidth="3"
        />
        {[48, 69, 90, 111].flatMap((y) =>
          [88, 108, 128].map((x) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="9"
              height="12"
              rx="1"
              fill={light}
            />
          )),
        )}
        <path d="M115 151v-19h15v19" fill={mint} />
        <path d="M65 153h119M127 16V3" stroke={dark} strokeWidth="3" />
      </>
    );
  return null;
}
