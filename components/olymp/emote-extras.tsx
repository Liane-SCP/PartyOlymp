export function EmoteExtras({ id }: { id: number }) {
  return (
    <g
      stroke="#172035"
      strokeWidth="2.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {id === 32 && (
        <g className="snicker-hand" fill="#ffd29b">
          <path d="M27 68q2-18 9-12l5 8q4-16 10-10l8 19-6 16-21-3Z" />
          <path d="m32 66 7 9m4-12 5 11" fill="none" />
        </g>
      )}
      {id === 33 && (
        <g className="mic-drop">
          <path d="m65 60 10 5-16 30-9-5Z" fill="#8796ae" />
          <circle cx="75" cy="59" r="10" fill="#29384d" />
          <path d="m67 55 13 8m-10-13 13 8" stroke="#dce7ff" />
        </g>
      )}
      {id === 34 && (
        <g className="suspicion">
          <path d="M25 31 45 38m14 0 18-10" strokeWidth="6" />
          <text
            x="80"
            y="24"
            fill="#ffd86b"
            stroke="none"
            fontSize="28"
            fontWeight="900"
          >
            ?
          </text>
        </g>
      )}
      {id === 35 && (
        <g className="pleading-hands" fill="#ffd29b">
          <path d="M30 94 41 64q6-9 9 1v30Zm40 0L59 64q-6-9-9 1v30Z" />
          <path d="M50 69v23" />
          <path d="m16 66 8 3m53 0 8-3" stroke="#ffe0a0" />
        </g>
      )}
      {id === 36 && (
        <g className="mind-burst">
          <path
            d="m50-8 8 14 17-7-3 17 18 5-16 10 5 17-21-4-8 17-9-17-21 4 6-18-16-9 18-5-3-17 17 7Z"
            fill="#ffd86b"
          />
          <path
            d="m49 4 6 13 15-3-8 12 9 11-17-3-6 12-4-15-15 1 10-10-5-11 12 6Z"
            fill="#ff7b9d"
          />
        </g>
      )}
      {id === 37 && (
        <g className="dance-notes" fill="#bca5ff">
          <path
            d="M9 61V38l16-5v22m-16-8 16-5"
            fill="none"
            stroke="#bca5ff"
            strokeWidth="4"
          />
          <ellipse cx="5" cy="62" rx="6" ry="4" />
          <ellipse cx="21" cy="56" rx="6" ry="4" />
          <path d="m86 20 8-9m-6 20 10-3" stroke="#ffd86b" />
        </g>
      )}
      {id === 38 && (
        <g className="tiny-violin">
          <path
            d="M58 58q-11-12-15-1-2 6 3 12-18 5-10 20 9 15 21 1 5-5 4-12 13-3 5-12Z"
            fill="#d58751"
          />
          <path d="m54 69 18-28 6 4-19 28" fill="#ffc888" />
          <path d="m30 57 49 31" stroke="#fff3d7" strokeWidth="4" />
        </g>
      )}
      {id === 39 && (
        <g className="coffee-sip">
          <path d="M31 67h34v22q-17 12-34 0Z" fill="#fff2dc" />
          <path
            d="M66 72q22-3 13 13H66"
            fill="none"
            stroke="#fff2dc"
            strokeWidth="6"
          />
          <path
            className="steam"
            d="M39 58q-8-7 0-13m14 13q-8-7 0-13"
            stroke="#fff2dc"
            fill="none"
          />
        </g>
      )}
      {id === 40 && (
        <g className="hide-hands" fill="#ffd29b">
          <path d="M19 62 22 36q2-6 6 1l1 9 1-15q5-6 7 1l1 13 3-12q5-3 6 3l-1 30Zm62 0-3-26q-2-6-6 1l-1 9-1-15q-5-6-7 1l-1 13-3-12q-5-3-6 3l1 30Z" />
        </g>
      )}
      {id === 41 && (
        <g className="lucky-spin" fill="#baff78">
          <path d="M73 64C42 44 74 30 77 52c5-28 32-4 10 8 28 6 4 29-8 10-9 27-31 4-6-6Z" />
          <path d="m77 64-6 28" stroke="#80d35a" strokeWidth="4" />
        </g>
      )}
      {id === 42 && (
        <g className="chess-stamp" fill="#eee5ff">
          <path d="M58 90h31l-5-9H64Zm9-13 3-23h7l5 23Z" />
          <path
            d="M67 44h15v9H67Zm7-12v13m-5-7h10"
            fill="none"
            stroke="#eee5ff"
            strokeWidth="5"
          />
        </g>
      )}
      {id === 43 && (
        <g className="waterfall" fill="#60dfff" stroke="none">
          <path d="M23 48h12l-3 49H18ZM66 48h12l6 49H70Z" />
          <ellipse cx="50" cy="96" rx="44" ry="5" opacity=".65" />
          <path d="m25 54-2 35m49-35 5 35" stroke="white" strokeWidth="3" />
        </g>
      )}
      {id === 44 && (
        <g className="flex-arms" fill="#ffd29b">
          <path d="M22 85Q-5 88 3 58q3-13 13-7l4 11-8 3 2 9 8-5Zm56 0q27 3 19-27-3-13-13-7l-4 11 8 3-2 9-8-5Z" />
        </g>
      )}
      {id === 45 && (
        <g className="ufo-beam">
          <path
            d="m37 18-20 75h66L63 18"
            fill="#baff78"
            opacity=".2"
            stroke="none"
          />
          <ellipse cx="50" cy="16" rx="32" ry="9" fill="#9d91e3" />
          <path d="M33 13q0-24 17-20 17-4 17 20Z" fill="#9eeaff" />
          {[30, 50, 70].map((x) => (
            <circle key={x} cx={x} cy="18" r="3" fill="#ffe08a" stroke="none" />
          ))}
        </g>
      )}
      {id === 46 && (
        <g className="royal-wave">
          <path d="M23 24 20 5 39 14 50 1 62 14 80 5 76 24Z" fill="#ffce65" />
          <path
            d="M74 88 69 62l-5-13q1-8 7-2l6 9-1-19q4-7 7 0l1 20 5-14q6-3 5 4l-5 23 1 18Z"
            fill="#ffd29b"
          />
        </g>
      )}
      {id === 47 && (
        <g className="ko-stars" fill="#ffd86b" stroke="none">
          {[18, 50, 82].map((x, i) => (
            <path
              key={x}
              style={{ animationDelay: `${i * 0.13}s` }}
              d={`m${x} 0 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z`}
            />
          ))}
        </g>
      )}
    </g>
  );
}
