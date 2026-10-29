import type { ReactNode } from "react";
import { extraSizeArt } from "./extra-size-art";
import { librarySizeArt } from "./library-size-art";
export const sizeKindLabel = (kind?: string) =>
  ({
    bridge: "Brücke",
    ship: "Schiff",
    aircraft: "Luftfahrzeug",
    tower: "Turm",
    statue: "Kunstwerk",
    building: "Gebäude",
  })[kind ?? ""] ?? "";

/** Original vector drawings. The viewBox follows the object's real orientation. */
export function SizeSilhouette({
  name,
  measure = "",
  kind,
}: {
  name: string;
  measure?: string;
  kind?: string;
}) {
  let box = "0 0 240 160";
  let art: ReactNode;
  const ink = "#25334d",
    mint = "#bcff5c",
    purple = "#9b8aff";
  const extra = extraSizeArt(name);
  const categoryArt = librarySizeArt(kind);
  if (categoryArt) {
    art = categoryArt;
  } else if (extra) {
    art = extra;
  } else if (name === "Golden Gate Bridge") {
    box = "0 0 360 160";
    art = (
      <>
        <path
          d="M7 144q25-10 48 0t48 0t48 0t48 0t48 0t48 0t48 0"
          fill="none"
          stroke="#6cc8e5"
          strokeWidth="5"
          opacity=".75"
        />
        <path
          d="M79 144V14h21v130M260 144V14h21v130"
          fill="#ef754b"
          stroke="#b84231"
          strokeWidth="3"
        />
        <path
          d="M83 40h13m-13 27h13m-13 27h13m168-54h13m-13 27h13m-13 27h13"
          stroke="#a4352b"
          strokeWidth="8"
        />
        <path
          d="M8 101Q52 94 90 22Q180 142 270 22Q310 91 352 101"
          fill="none"
          stroke="#f99668"
          strokeWidth="5"
        />
        {[
          30, 50, 70, 110, 130, 150, 170, 190, 210, 230, 250, 290, 310, 330,
        ].map((x) => {
          const y =
            x < 90
              ? 101 - 79 * ((x - 8) / 82) ** 2
              : x > 270
                ? 101 - 79 * ((352 - x) / 82) ** 2
                : 22 + 60 * (1 - ((x - 180) / 90) ** 2);
          return (
            <path
              key={x}
              d={`M${x} ${y}V112`}
              stroke="#e56542"
              strokeWidth="2"
            />
          );
        })}
        <rect x="6" y="106" width="348" height="10" rx="2" fill="#ef754b" />
        <path d="M8 110h344" stroke="#ffe1ac" strokeWidth="2" />
      </>
    );
  } else if (name === "Giraffe") {
    box = "0 0 140 250";
    art = (
      <>
        <path
          d="M34 133q30-18 57-4l7 28-8 69H79l2-64H56l-4 64H40l-1-64-11-18-5 25-5-3 10-30Z"
          fill="#e9b95d"
        />
        <path d="M79 144 88 58 103 26l22 5 3 15-24 11-1 95Z" fill="#e9b95d" />
        <path
          d="m101 30-6-12 7-4 6 15m8 1 3-15 6 1-3 16"
          stroke="#936134"
          strokeWidth="5"
        />
        <path
          d="m94 53-6-3-6 81"
          fill="none"
          stroke="#795334"
          strokeWidth="6"
        />
        <path
          d="m47 135 11 4-4 12-12-3m26-7 10 3-2 11-12-2m19-64 9 2-2 11-9-3m5-30 10 2-2 11-10-2m-14 42 9 4-2 12-10-5"
          fill="#976238"
        />
        <circle cx="115" cy="36" r="3" fill={ink} />
        <path d="M40 226h14m23 0h15" stroke={ink} strokeWidth="6" />
      </>
    );
  } else if (name === "Afrikanischer Elefant") {
    box = "0 0 250 185";
    art = (
      <>
        <path
          d="M30 132Q12 52 95 37Q157 23 194 68q44-8 43 38l-4 47q-1 30-28 13l4-9q12 9 13-9l-1-35-19 9-8 47h-27l-5-50H86l-9 50H50l-9-45Z"
          fill="#9badd0"
        />
        <path
          d="M159 53q-62-16-61 46q2 42 46 24q22-21 15-70Z"
          fill="#7b8fab"
          stroke="#667e9e"
          strokeWidth="3"
        />
        <path d="M198 107q0 23-20 23l3-24" fill="#fff4dd" />
        <circle cx="202" cy="88" r="4" fill={ink} />
        <path
          d="M31 105 15 135m36 31h27m88 0h27"
          stroke="#637a98"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </>
    );
  } else if (name === "Blauwal") {
    box = "0 0 340 115";
    art = (
      <>
        <path
          d="M16 52Q44 6 167 32q67 14 109 15l36-25-2 31 22 26-58-13q-118 54-234 18Q11 72 16 52Z"
          fill="#70b9d4"
        />
        <path d="M22 69q95 39 210-2-90 21-160-1Z" fill="#b7e5e9" />
        <path d="m154 65 39 40-9-39m20-24-13-22-16 15" fill="#4f92b3" />
        <circle cx="43" cy="52" r="4" fill={ink} />
        <path
          d="M25 65q25 13 47 6"
          fill="none"
          stroke="#3c7f9c"
          strokeWidth="3"
        />
      </>
    );
  } else if (
    [
      "Fußball",
      "Basketball",
      "Tischtennisball",
      "Tennisball",
      "Billardkugel",
    ].includes(name)
  ) {
    box = "0 0 160 160";
    const fill =
      name === "Basketball"
        ? "#ef9650"
        : name === "Tennisball"
          ? "#c2e85d"
          : name === "Billardkugel"
            ? "#27334c"
            : "#fff6e1";
    art = (
      <>
        <circle
          cx="80"
          cy="80"
          r="73"
          fill={fill}
          stroke={name === "Billardkugel" ? "#8391ad" : "#c4c8cb"}
          strokeWidth="3"
        />
        {name === "Fußball" && (
          <>
            <path
              d="m80 46 28 20-11 32H63L52 66Z M13 53l23 1 7-24-17-3m107 0-16 4 7 23 23-1m-10 61-20 4-5 25 20-10m-74 10-5-25-20-4-5 19"
              fill={ink}
            />
            <path
              d="M80 46V8m28 58 34-13M97 98l22 22m-56-22-24 23M52 66 17 54"
              stroke={ink}
              strokeWidth="3"
            />
          </>
        )}
        {name === "Basketball" && (
          <g fill="none" stroke="#774729" strokeWidth="4">
            <path d="M7 80h146M80 7v146M29 26q86 53 0 108m101-108q-86 53 0 108" />
          </g>
        )}
        {name === "Tennisball" && (
          <path
            d="M28 29q81 13 57 51t48 52M29 132q80-13 56-51t48-52"
            fill="none"
            stroke="#fffde6"
            strokeWidth="6"
          />
        )}
        {name === "Billardkugel" && (
          <>
            <circle cx="80" cy="72" r="28" fill="#fff8e8" />
            <text
              x="80"
              y="82"
              textAnchor="middle"
              fontSize="33"
              fontWeight="800"
              fill={ink}
            >
              8
            </text>
          </>
        )}
        <ellipse
          cx="49"
          cy="35"
          rx="16"
          ry="8"
          fill="#fff"
          opacity=".3"
          transform="rotate(-35 49 35)"
        />
      </>
    );
  } else if (/^A[0-5]-Blatt$/.test(name)) {
    box = "0 0 160 225";
    art = (
      <>
        <path
          d="M12 8h105l31 31v178H12Z"
          fill="#fff8e7"
          stroke="#aab7cf"
          strokeWidth="3"
        />
        <path
          d="M117 8v31h31"
          fill="#d7e0ed"
          stroke="#aab7cf"
          strokeWidth="3"
        />
        <path
          d="M34 73h91m-91 20h80m-80 20h91m-91 20h64"
          stroke="#cfdaea"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <text
          x="80"
          y="185"
          textAnchor="middle"
          fill="#7383a1"
          fontSize="31"
          fontWeight="800"
        >
          {name.slice(0, 2)}
        </text>
      </>
    );
  } else if (name.includes("Münze")) {
    box = "0 0 160 160";
    const euro = name.includes("Euro"),
      two = name.startsWith("2-");
    art = (
      <>
        <circle
          cx="80"
          cy="80"
          r="73"
          fill={euro && !two ? "#e7ca76" : euro ? "#cbd2d9" : "#deba60"}
          stroke="#9e884f"
          strokeWidth="3"
        />
        <circle
          cx="80"
          cy="80"
          r={euro ? 49 : 63}
          fill={euro ? (two ? "#e7ca76" : "#cbd2d9") : "none"}
          stroke="#ac965e"
          strokeWidth="2"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            cx={80 + Math.sin((i * Math.PI) / 6) * 62}
            cy={80 + Math.cos((i * Math.PI) / 6) * 62}
            r="2.5"
            fill="#88764a"
          />
        ))}
        <text
          x="80"
          y="91"
          textAnchor="middle"
          fontSize="52"
          fontWeight="800"
          fill="#846d38"
        >
          {name.split("-")[0]}
        </text>
        <text
          x="80"
          y="114"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#846d38"
        >
          {euro ? "EURO" : "CENT"}
        </text>
      </>
    );
  } else if (name === "Kreditkarte") {
    box = "0 0 250 160";
    art = (
      <>
        <rect x="7" y="8" width="236" height="144" rx="15" fill={purple} />
        <path d="M8 106q88-91 233-68v114H22q-14 0-14-15Z" fill="#7969d8" />
        <rect x="29" y="46" width="41" height="32" rx="7" fill="#eed291" />
        <path
          d="M43 46v32m13-32v32M29 62h41"
          stroke="#bb9c61"
          strokeWidth="2"
        />
        <path
          d="M31 108h44m13 0h40m13 0h40M31 127h57"
          stroke="#efeaff"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="200" cy="122" r="12" fill="#ffb795" opacity=".9" />
        <circle cx="217" cy="122" r="12" fill={mint} opacity=".85" />
      </>
    );
  } else if (name === "Eiffelturm") {
    box = "0 0 130 250";
    art = (
      <>
        <path
          d="M64 9h3l4 52 7 66 15 54 30 57H93q-28-68-56 0H8l30-57 15-54 7-66Z"
          fill="#b9a19a"
          stroke="#8b726e"
          strokeWidth="3"
        />
        <path
          d="M42 173h47M49 137h32M56 95h18M65 62v109M41 177l48 50m-2-50-49 50M54 130l25 41m-2-41-23 41M59 93l16 35m-5-35-14 35"
          stroke="#725e61"
          strokeWidth="3"
        />
        <path
          d="M36 182h61M50 130h29M54 66h23"
          stroke="#d3beb1"
          strokeWidth="7"
        />
      </>
    );
  } else if (name === "Freiheitsstatue") {
    box = "0 0 150 250";
    art = (
      <>
        <path
          d="m57 241 14-120-11-17-8-53 12-3 17 51 14-8 19 35-5 42 12 73Z"
          fill="#76baa9"
        />
        <path
          d="m71 129 15 98m17-100-13 100m-24-66 36 18"
          stroke="#4f9384"
          strokeWidth="4"
        />
        <path d="m56 54-5-26 15-3 7 26Z" fill="#76baa9" />
        <path d="M50 26h23l-4-10H54Z" fill="#9bd1b0" />
        <path d="M56 17q-10-19 9-14-7 6 2 12Z" fill="#f3bd6b" />
        <ellipse cx="86" cy="80" rx="15" ry="18" fill="#9bd1b0" />
        <path
          d="m71 70-12-10 16 4-1-19 11 18 8-19 1 20 17-8-11 15"
          fill="#76baa9"
        />
        <path
          d="m108 122 22-9 8 43-21 5Z"
          fill="#659c92"
          stroke="#3d776f"
          strokeWidth="3"
        />
      </>
    );
  } else if (name === "Fußballtor") {
    box = "0 0 300 125";
    art = (
      <>
        <path
          d="M28 116V10h242v106M28 10 8 43v73h282V43l-20-33"
          fill="#cbdeed"
          fillOpacity=".16"
          stroke="#edf4ee"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <g stroke="#9caec5" strokeWidth="1.5" opacity=".8">
          {Array.from({ length: 17 }, (_, i) => (
            <path key={i} d={`M${29 + i * 15} 14v99`} />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} d={`M30 ${20 + i * 18}h239`} />
          ))}
        </g>
        <path
          d="M28 116V10h242v106"
          fill="none"
          stroke="#fff9e5"
          strokeWidth="7"
        />
      </>
    );
  } else if (name === "Tennisnetz" || name === "Tischtennisnetz") {
    box = "0 0 300 100";
    art = (
      <>
        <path d="M12 94V7m276 87V7" stroke={purple} strokeWidth="9" />
        <path
          d="M15 20q135 20 270 0v61H15Z"
          fill="#d5e5ed"
          fillOpacity=".12"
          stroke="#bccadd"
          strokeWidth="2"
        />
        <g stroke="#bccadd" strokeWidth="1.5" opacity=".75">
          {Array.from({ length: 22 }, (_, i) => (
            <path key={i} d={`M${19 + i * 12} 29v50`} />
          ))}
          {[40, 53, 66, 79].map((y) => (
            <path key={y} d={`M17 ${y}h267`} />
          ))}
        </g>
        <path
          d="M15 20q135 20 270 0"
          fill="none"
          stroke="#fff5df"
          strokeWidth="8"
        />
      </>
    );
  } else if (name === "Basketballkorb") {
    box = "0 0 150 240";
    art = (
      <>
        <path d="M103 225V38h-7" stroke="#8a9cba" strokeWidth="9" fill="none" />
        <rect
          x="21"
          y="10"
          width="108"
          height="74"
          rx="5"
          fill="#eaf3f5"
          fillOpacity=".9"
          stroke={purple}
          strokeWidth="5"
        />
        <rect
          x="49"
          y="38"
          width="45"
          height="34"
          fill="none"
          stroke="#ef9061"
          strokeWidth="4"
        />
        <path
          d="m45 78 15 48h26l16-48m-51 6 35 42m10-42-35 42M51 99h44m-38 15h32"
          stroke="#e3eaf0"
          strokeWidth="2.5"
          fill="none"
        />
        <ellipse
          cx="73"
          cy="78"
          rx="32"
          ry="7"
          fill="none"
          stroke="#ed8056"
          strokeWidth="6"
        />
        <path
          d="M82 231h46"
          stroke="#788aab"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </>
    );
  } else if (name === "Tischtennisplatte") {
    box = "0 0 290 160";
    art = (
      <>
        <path
          d="M33 89v58m217-58v58M74 91v46m138-46v46"
          stroke="#8b9bb3"
          strokeWidth="8"
        />
        <path
          d="m8 86 55-70h170l49 70Z"
          fill="#527d9e"
          stroke="#d8e8eb"
          strokeWidth="4"
        />
        <path d="m145 17 1 69M8 86h274" stroke="#edf4ee" strokeWidth="3" />
        <path
          d="m40 52 19-23h174l20 23Z"
          fill="#25334d"
          fillOpacity=".55"
          stroke="#d6e1e3"
          strokeWidth="2"
        />
        <path
          d="M40 51V28m213 23V28M40 29h213"
          stroke="#f7f2e5"
          strokeWidth="4"
        />
      </>
    );
  } else if (name === "Olympisches Schwimmbecken") {
    box = "0 0 300 155";
    art = (
      <>
        <rect x="4" y="4" width="292" height="147" rx="9" fill="#bcd6de" />
        <rect x="14" y="16" width="272" height="123" rx="3" fill="#5cbfdb" />
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            <path
              d={`M17 ${29 + i * 19}h265`}
              stroke="#fff0db"
              strokeWidth="3"
              strokeDasharray="5 5"
            />
            <path
              d={`M32 ${37 + i * 19}h235m-235-4v8m235-8v8`}
              stroke="#3386a6"
              strokeWidth="2"
            />
          </g>
        ))}
        <path
          d="M277 106h15m-15 12h15M281 99v33m8-33v33"
          stroke="#e8f2ef"
          strokeWidth="3"
        />
      </>
    );
  } else if (name === "Marathon") {
    box = "0 0 300 150";
    art = (
      <>
        <path
          d="M22 119h84q50 0 48-38t58-38h57"
          fill="none"
          stroke="#8999b6"
          strokeWidth="23"
          strokeLinecap="round"
        />
        <path
          d="M22 119h84q50 0 48-38t58-38h57"
          fill="none"
          stroke="#f9edcc"
          strokeWidth="2"
          strokeDasharray="8 8"
        />
        <path
          d="M23 117V53h40v28H23"
          fill={mint}
          stroke={mint}
          strokeWidth="5"
        />
        <path
          d="M270 42V8h-41v28h41"
          fill="#f8eee0"
          stroke="#f8eee0"
          strokeWidth="4"
        />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) =>
            (row + col) % 2 === 0 ? (
              <rect
                key={`${row}-${col}`}
                x={230 + col * 10}
                y={9 + row * 9}
                width="10"
                height="9"
                fill={ink}
              />
            ) : null,
          ),
        )}
      </>
    );
  } else if (["CD", "DVD", "Vinyl-Single", "Vinyl-LP"].includes(name)) {
    box = "0 0 160 160";
    const vinyl = name.startsWith("Vinyl");
    art = (
      <>
        <circle
          cx="80"
          cy="80"
          r="73"
          fill={vinyl ? "#26334b" : "#c5d6ea"}
          stroke="#8799b5"
          strokeWidth="2"
        />
        {[62, 53, 44].map((r) => (
          <circle
            key={r}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={vinyl ? "#4b5973" : "#eef3ec"}
            strokeWidth="1.5"
          />
        ))}
        {!vinyl && (
          <>
            <path d="m80 80-43-59q-15 8-24 24Z" fill="#d8b1f4" opacity=".7" />
            <path d="m80 80 43 59q15-8 24-24Z" fill="#b9f3e0" opacity=".8" />
          </>
        )}
        <circle cx="80" cy="80" r="24" fill={vinyl ? purple : "#e7edeb"} />
        <circle cx="80" cy="80" r="7" fill="#1a2538" />
        <path
          d="M28 49q17-25 43-29"
          fill="none"
          stroke="#fff"
          opacity=".25"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  } else if (name === "Container") {
    box = "0 0 300 150";
    art = (
      <>
        <path
          d="M7 38 62 12h229v99l-54 28H7Z"
          fill="#ec855c"
          stroke="#ad563e"
          strokeWidth="3"
        />
        <path
          d="M7 38h230v101M237 38l54-26"
          fill="none"
          stroke="#ffc09b"
          strokeWidth="3"
        />
        {Array.from({ length: 13 }, (_, i) => (
          <path
            key={i}
            d={`M${17 + i * 17} 46v84`}
            stroke="#ba6349"
            strokeWidth="4"
          />
        ))}
        <path
          d="m246 46 36-18v77l-36 18Zm17-10v78m-8-42v17m17-25v16"
          fill="none"
          stroke="#914a39"
          strokeWidth="3"
        />
        <path d="M15 132h214" stroke="#ffbc91" strokeWidth="2" />
      </>
    );
  } else if (name === "Schachbrett") {
    box = "0 0 180 180";
    art = (
      <>
        <rect x="4" y="4" width="172" height="172" rx="6" fill="#b89e7b" />
        {Array.from({ length: 64 }, (_, i) => (
          <rect
            key={i}
            x={10 + (i % 8) * 20}
            y={10 + Math.floor(i / 8) * 20}
            width="20"
            height="20"
            fill={((i % 8) + Math.floor(i / 8)) % 2 ? "#42526b" : "#fff0d0"}
          />
        ))}
      </>
    );
  } else if (name.endsWith("Schein")) {
    box = "0 0 270 140";
    const dollar = name.startsWith("US"),
      value = dollar ? "1" : name.split("-")[0],
      colour =
        dollar || value === "100"
          ? "#94b99d"
          : value === "50"
            ? "#dbb58a"
            : "#94b2d7";
    art = (
      <>
        <rect x="5" y="5" width="260" height="130" rx="4" fill={colour} />
        <rect
          x="14"
          y="14"
          width="242"
          height="112"
          rx="2"
          fill="none"
          stroke="#faf3dc"
          strokeWidth="2"
        />
        <path
          d="M33 99V49l28-18 28 18v50M41 97V60h40v37M106 109h122"
          fill="none"
          stroke="#fff6dc"
          strokeWidth="5"
          opacity=".65"
        />
        <ellipse
          cx="146"
          cy="65"
          rx="34"
          ry="43"
          fill="#f6edcd"
          opacity=".35"
        />
        <text
          x="204"
          y="85"
          fontSize="47"
          textAnchor="middle"
          fill="#32544f"
          fontWeight="800"
        >
          {value}
        </text>
        <text x="233" y="118" textAnchor="end" fontSize="12" fill="#32544f">
          {dollar ? "DOLLAR" : "EURO"}
        </text>
        <path d="M31 113h53M229 26h14" stroke="#fff6dc" strokeWidth="3" />
      </>
    );
  } else {
    art = (
      <>
        <rect x="25" y="25" width="190" height="110" rx="20" fill={purple} />
        <path
          d="M50 100h140m-140-25h100"
          stroke="#efeaff"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </>
    );
  }
  return (
    <svg
      className="size-silhouette"
      viewBox={box}
      role="img"
      aria-label={`${name}${measure ? `: ${measure}` : ""}`}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "visible",
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>
        {name}
        {kind ? " · Symbolbild der Kategorie" : ""}
      </title>
      {art}
    </svg>
  );
}

export function formatLength(cm: number) {
  if (cm >= 100000)
    return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(cm / 100000)} km`;
  if (cm >= 100)
    return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(cm / 100)} m`;
  if (cm < 1)
    return `${new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 3 }).format(cm * 10)} mm`;
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(cm)} cm`;
}
