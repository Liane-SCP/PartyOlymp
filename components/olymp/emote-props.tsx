import { EmoteExtras } from "./emote-extras";
/** Original mascot props; shared palette and thick outlines keep tiny reactions readable. */
export function EmoteProps({ id }: { id: number }) {
  const heart = "M0 4C-9-5-16 6-10 12L0 21 10 12C16 6 9-5 0 4Z";
  return (
    <g
      className={`emote-props props-${id}`}
      stroke="#172035"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      {id >= 32 && <EmoteExtras id={id} />}
      {[12, 24].includes(id) && (
        <g fill="#ff548b" className="heart-flight">
          {(id === 24 ? [34, 66] : [78]).map((x) => (
            <path
              key={x}
              d={heart}
              transform={`translate(${x} ${id === 24 ? 34 : 53}) scale(.8)`}
            />
          ))}
        </g>
      )}
      {[13, 30].includes(id) && (
        <g className="coin-rain" fill="#ffd86b">
          {[17, 50, 83].map((x, i) => (
            <g key={x} style={{ animationDelay: `${i * 0.18}s` }}>
              <circle cx={x} cy={18 + i * 8} r="10" />
              <path
                d={`M${x - 3} ${14 + i * 8}h6m-6 5h6m-3-8v13`}
                fill="none"
              />
            </g>
          ))}
        </g>
      )}
      {id === 14 && (
        <g className="prop-bob">
          <path d="m25 69 5 29h37l7-29Z" fill="#fff2d4" />
          <path
            d="m35 70 4 27m17-27-1 27m9-26-3 26"
            stroke="#ff548b"
            strokeWidth="6"
          />
          {[31, 42, 53, 64].map((x, i) => (
            <circle key={x} cx={x} cy={67 - (i % 2) * 6} r="8" fill="#ffe0a0" />
          ))}
        </g>
      )}
      {id === 15 && (
        <g className="frost" stroke="#b5f5ff" strokeWidth="4">
          <path d="M17 12v25M5 24h24m-21-9 18 18m0-18L8 33M82 60v30M67 75h30m-25-10 20 20m0-20L72 85" />
        </g>
      )}
      {id === 16 && (
        <g className="prop-bob">
          <circle cx="72" cy="76" r="19" fill="#eef4ff" />
          <path
            className="clock-hand"
            d="M72 62v14l9 5"
            fill="none"
            strokeWidth="4"
          />
        </g>
      )}
      {id === 17 && (
        <g className="idea-glow">
          <path
            d="M75 8a12 12 0 1 1 0 24v7H64v-7a12 12 0 0 1 11-24"
            fill="#ffe577"
          />
          <path
            d="M63 43h14M52 9l-5-5m37-1 4-5M91 22h7"
            stroke="#ffe577"
            strokeWidth="4"
          />
        </g>
      )}
      {id === 18 && (
        <g stroke="white" strokeWidth="4">
          <path d="m28 36 15 15m0-15L28 51m30-15 15 15m0-15L58 51" />
          <path d="M45 63q12 22 18 0" fill="#ff7b9d" />
        </g>
      )}
      {id === 19 && (
        <path
          className="flame-wave"
          d="M12 92Q-3 70 14 48l5 15Q25 32 32 33q-2 27 13 37 5-18 18-30 0 19 15 29l6-19q26 31 6 42Z"
          fill="#ff923d"
          stroke="#ffd56b"
          opacity=".85"
        />
      )}
      {[20, 21, 30].includes(id) && (
        <g className={id === 21 ? "hand-no" : "hand-yes"} fill="#ffcf9b">
          <path d="M61 93V69l9-17q7-5 9 3l-3 14h15q7 0 5 9l-4 15Z" />
          <path d="M53 71h9v22h-9Z" fill="#8c7dff" />
        </g>
      )}
      {id === 22 && (
        <path
          className="shush"
          d="M46 91V52q5-8 10 0v20l7-2q9 1 9 10v11Z"
          fill="#ffcf9b"
        />
      )}
      {id === 23 && (
        <g className="prop-bob" fill="#ffd86b">
          <path d="M77 5h12l-3 24h-6Z" />
          <circle cx="83" cy="38" r="5" />
        </g>
      )}
      {id === 25 && (
        <g className="rocket-lift">
          <path d="M69 84 64 99l11-6 8 6-2-17" fill="#ffaf45" />
          <path d="M62 80q-2-26 13-39 16 13 13 39Z" fill="#e9f1ff" />
          <circle cx="75" cy="63" r="6" fill="#56d9ff" />
          <path d="m63 72-10 15 11-2m23-13 10 15-11-2" fill="#ff7b9d" />
        </g>
      )}
      {id === 26 && (
        <g className="salt-shake">
          <path d="m63 54 22 5-8 32-22-5Z" fill="white" />
          <path d="m64 53 2-9 22 5-2 9Z" fill="#a6b3ca" />
          <path d="m61 95-2 3m9-1-1 3m9-3-1 3" stroke="white" strokeWidth="4" />
        </g>
      )}
      {id === 27 && (
        <g className="tears" fill="#56d9ff">
          <path d="M23 48Q4 67 22 69q17-2 1-21M77 48Q60 67 77 69q19-2 0-21" />
        </g>
      )}
      {id === 28 && (
        <g fill="#e4dcff" stroke="none" className="sleep-letters">
          <text x="70" y="33" fontSize="25" fontWeight="900">
            Z
          </text>
          <text x="86" y="15" fontSize="16" fontWeight="900">
            z
          </text>
        </g>
      )}
      {id === 29 && (
        <path
          className="comeback-arrow"
          d="M16 91V64H7l19-22 19 22H35v27Z"
          fill="#bcff5c"
        />
      )}
      {id === 31 && (
        <g className="confetti-spray" strokeWidth="5">
          {[10, 25, 43, 61, 78, 91].map((x, i) => (
            <path
              key={x}
              d={`m${x} ${8 + (i % 3) * 12} 3 7`}
              stroke={["#ff7b9d", "#ffd86b", "#56d9ff"][i % 3]}
            />
          ))}
        </g>
      )}
      {[0, 4, 9, 10, 11, 13, 20, 29, 31].includes(id) && (
        <g className="comic-sparks" stroke="#ffe69d" strokeWidth="3">
          <path d="m8 44-6-4m88 4 7-5M17 12l-4-7m73 7 4-7" />
        </g>
      )}
    </g>
  );
}
