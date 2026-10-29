"use client";
import { EmoteProps } from "./emote-props";
import { CharacterAccessories } from "./character-accessories";
import { emoteExpressions, emoteMotions } from "@/lib/emotes";
import { memo, type CSSProperties } from "react";
import { characterColors, type Appearance } from "@/lib/appearance";
export function Mark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M5 30 17 7h7l12 23h-9l-6-13-7 13Z" fill="currentColor" />
      <path d="M12 32h18" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
export function GameIcon({
  id,
  large = false,
}: {
  id: string;
  large?: boolean;
}) {
  const paths: Record<string, React.ReactNode> = {
    colossus: (
      <>
        <path d="m45 66-13 16-9 45h27l5-30 6 41h38l6-41 5 30h27l-9-45-13-16M50 63V25l15-12h30l15 12v38ZM48 36h64M62 50h9m18 0h9M80 72l15 17-15 18-15-18Z" />
      </>
    ),
    kraken: (
      <>
        <path d="M46 93V59a34 34 0 0 1 68 0v34M47 83C8 57 8 131 36 135q18 0 12-23m11-14c-27 65 24 63 20 18m33-33c39-26 39 48 11 52q-18 0-12-23m-10-14c27 65-24 63-20 18" />
        <path d="m58 68 12 4m32-4-12 4M71 92l9 10 9-10" />
      </>
    ),
    dragon: (
      <>
        <path d="m77 49-8-30 24 17 21-17-2 32 23 19-16 16-24-8-7 25 12 25-31 14-22-13 15-21V84L39 99l-5-28-21 4 11-42 27 17 13 21M95 52h2m10 48 28 5-19 15-6 15" />
        <ellipse cx="49" cy="140" rx="32" ry="9" />
      </>
    ),
    auction: (
      <>
        <path d="m52 33 42 42-22 22-42-42Zm22 55 53 53M22 130h59m-51-13h43v13" />
        <path d="m99 25 11-11m5 37h19M79 14V3" />
      </>
    ),
    code: (
      <>
        <rect x="23" y="22" width="114" height="116" rx="16" />
        <circle cx="48" cy="54" r="10" />
        <circle cx="78" cy="54" r="10" />
        <circle cx="108" cy="54" r="10" />
        <circle cx="48" cy="96" r="10" />
        <circle cx="78" cy="96" r="10" />
        <circle cx="105" cy="91" r="3" />
        <circle cx="118" cy="91" r="3" />
        <circle cx="105" cy="103" r="3" />
        <circle cx="118" cy="103" r="3" />
      </>
    ),
    timing: (
      <>
        <circle cx="80" cy="89" r="51" />
        <path d="M66 17h28M80 17v21m38 10 12-12M80 57v33l22 15M38 89h8m68 0h8m-42 34v8" />
      </>
    ),
    bomb: (
      <>
        <circle cx="74" cy="96" r="43" />
        <path d="m88 55 4-14 22 6-4 14m-7-17q-4-29 20-26M121 8v-6m14 21h12m-17-9 9-9M48 91q0-17 15-21" />
      </>
    ),
    chain: (
      <>
        <path d="M63 58 48 73a23 23 0 0 0 33 33l15-15M97 102l15-15a23 23 0 0 0-33-33L64 69M61 100l39-39" />
        <circle cx="29" cy="30" r="10" />
        <circle cx="130" cy="131" r="10" />
      </>
    ),
    categories: (
      <>
        <rect x="30" y="18" width="100" height="124" rx="12" />
        <path d="m46 49 6 6 12-15m12 9h37M46 77l6 6 12-15m12 9h37m-67 28 6 6 12-15m12 9h37" />
      </>
    ),
    geo: (
      <>
        <circle cx="80" cy="80" r="57" />
        <ellipse cx="80" cy="80" rx="24" ry="57" />
        <path d="M23 80h114M32 49h96M32 111h96" />
      </>
    ),
    blocks: (
      <>
        <path d="M22 98h34v34H22Zm34 0h34v34H56Zm34 0h34v34H90ZM56 64h34v34H56ZM56 20h34v34H56Zm34 0h34v34H90Z" />
      </>
    ),
    typer: (
      <>
        <rect x="20" y="48" width="120" height="75" rx="12" />
        <path d="M35 65h12m10 0h12m10 0h12m10 0h12m10 0h3M35 85h15m10 0h15m10 0h15m10 0h16M49 106h62M58 28h44" />
      </>
    ),
    herd: (
      <>
        <circle cx="80" cy="65" r="24" />
        <circle cx="32" cy="82" r="15" />
        <circle cx="128" cy="82" r="15" />
        <path d="M43 137v-14a37 37 0 0 1 74 0v14M13 132v-15a19 19 0 0 1 28-17m106 32v-15a19 19 0 0 0-28-17" />
      </>
    ),
    spectrum: (
      <>
        <path d="M22 119a58 58 0 0 1 116 0ZM80 118l30-48M38 97l10 5m8-36 5 10m19-24v13m25 1-5 10m22 21-10 5" />
        <circle cx="80" cy="118" r="8" />
      </>
    ),
    dice: (
      <>
        <rect x="28" y="28" width="104" height="104" rx="23" />
        <circle cx="55" cy="55" r="5" />
        <circle cx="105" cy="55" r="5" />
        <circle cx="80" cy="80" r="5" />
        <circle cx="55" cy="105" r="5" />
        <circle cx="105" cy="105" r="5" />
      </>
    ),
    wiki: (
      <>
        <path d="M25 35h45l10 10 10-10h45v95H90l-10 10-10-10H25Z M80 45v95" />
        <path d="m40 65 7 35 12-23 11 23 6-35m20 0v35m0-45v1" />
      </>
    ),
    picture: (
      <>
        <rect x="25" y="30" width="110" height="100" rx="15" />
        <path d="m30 120 35-45 24 26 20-18 23 39" />
        <circle cx="105" cy="55" r="10" />
      </>
    ),
    budget: (
      <>
        <path d="M30 60h100l-15 65H45Z M55 60l25-35 25 35 M60 85v20m20-20v20m20-20v20" />
      </>
    ),
    blackjack: (
      <>
        <rect x="35" y="25" width="90" height="115" rx="14" />
        <path d="M80 55q-30-20-25 5l25 35 25-35q5-25-25-5Z M54 117h52" />
      </>
    ),
    cards: (
      <>
        <rect
          x="45"
          y="25"
          width="80"
          height="110"
          rx="14"
          transform="rotate(15 80 80)"
        />
        <rect
          x="25"
          y="30"
          width="80"
          height="110"
          rx="14"
          transform="rotate(-15 80 80)"
        />
        <path d="m55 70 35 25m-5-30-25 35" />
      </>
    ),
    fleet: (
      <>
        <path d="M25 105h110l-22 30H47Z M80 25v80m5-75 40 60H85Zm-12 20-35 45h35" />
      </>
    ),
    color: (
      <>
        <circle cx="60" cy="65" r="35" />
        <circle cx="100" cy="65" r="35" />
        <circle cx="80" cy="105" r="35" />
      </>
    ),
    size: (
      <>
        <path d="M30 115h100M35 85v45m90-75v75M40 85h35V50H40Zm50 25h30V25H90Z" />
        <path d="m55 135-8 8m48-8 8 8" />
      </>
    ),
  };
  return (
    <svg
      className={large ? "game-art large" : "game-art"}
      viewBox="0 0 160 160"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[id] ?? paths.dice}
    </svg>
  );
}
export { emoteNames } from "@/lib/emotes";
export const Avatar = memo(function Avatar({
  avatar = 0,
  color = "#bcff5c",
  emote = -1,
  look,
}: {
  avatar?: number;
  color?: string;
  emote?: number;
  look?: Appearance;
}) {
  if (look) color = characterColors[look.color] ?? color;
  const shape = look?.shape ?? avatar % 3;
  const expression = emote < 0 ? -1 : (emoteExpressions[emote] ?? 0);
  const accent = characterColors[look?.accent ?? 3];
  return (
    <svg
      viewBox="0 0 100 100"
      className={`avatar-art ${emote >= 0 ? `emote-face e${emote} react-${emoteMotions[emote] ?? "cheer"}` : ""}`}
      style={{ "--face": color } as CSSProperties}
      aria-hidden="true"
    >
      <CharacterAccessories
        item={-1}
        detail={look?.detail}
        accent={accent}
        behind
      />
      <g className="mascot-body">
        <path
          d={
            shape === 0
              ? "M18 25 30 8 45 20 64 8 82 25 87 65Q80 91 50 90 20 91 13 65Z"
              : shape === 1
                ? "M15 30Q50-4 85 30L91 65Q78 93 50 90 20 92 9 65Z"
                : shape === 2
                  ? "M23 12H77L90 38 85 75 68 90H32L15 75 10 38Z"
                  : shape === 3
                    ? "M50 7a42 42 0 1 1 0 84a42 42 0 1 1 0-84Z"
                    : shape === 4
                      ? "M50 5 64 27 90 30 79 53 85 79 60 84 50 96 37 83 12 78 20 54 8 31 36 27Z"
                      : shape === 5
                        ? "M31 8h38q19 0 19 22v39q0 23-38 23T12 69V30q0-22 19-22Z"
                        : shape === 6
                          ? "M13 48Q13 9 50 9t37 39v44L73 82 61 94 49 83 36 94 24 82 13 92Z"
                          : shape === 7
                            ? "M23 33Q9-3 25 1q13 0 15 28h20Q62 1 75 1q16-4 2 32 14 12 12 31Q85 91 50 91T11 64Q9 44 23 33Z"
                            : shape === 8
                              ? "M17 34Q6 8 31 13 49-9 66 12q29-5 20 23 24 19 2 34 0 26-26 19-17 16-33 0Q4 96 12 72Q-11 51 17 34Z"
                              : "M21 16h58q12 0 12 12v49q0 13-13 13H22Q9 90 9 77V28q0-12 12-12Z"
          }
          fill={color}
        />
        <path
          d="M20 68Q50 95 80 68"
          stroke="#151c2c"
          strokeWidth="5"
          opacity=".12"
          fill="none"
        />
        <g
          className="face-eyes"
          stroke="#151c2c"
          strokeWidth="6"
          strokeLinecap="round"
        >
          {[0, 4, 9, 10].includes(expression) ? (
            <>
              <path d="m30 44 7-5 7 5m15 0 7-5 7 5" fill="none" />
            </>
          ) : expression === 5 ? (
            <>
              <circle cx="36" cy="43" r="3" />
              <path d="m60 44 6-5 7 5" fill="none" />
            </>
          ) : expression === 2 ? (
            <>
              <path d="m29 36 15 6m15 0 15-6" />
              <circle cx="37" cy="47" r="3" />
              <circle cx="66" cy="47" r="3" />
            </>
          ) : (
            <>
              <ellipse cx="36" cy="44" rx="3" ry={expression === 3 ? 7 : 4} />
              <ellipse cx="66" cy="44" rx="3" ry={expression === 3 ? 7 : 4} />
            </>
          )}
        </g>
        {expression === 1 || expression === 8 ? (
          <path
            d="M35 70Q50 48 66 70"
            stroke="#151c2c"
            strokeWidth="5"
            fill="none"
          />
        ) : expression === 3 || expression === 7 ? (
          <ellipse cx="50" cy="64" rx="8" ry="12" fill="#151c2c" />
        ) : (
          <path d="M33 59Q50 82 69 59Z" fill="#151c2c" />
        )}
        {emote >= 0 && (
          <g className="face-detail">
            <ellipse
              cx="25"
              cy="58"
              rx="7"
              ry="4"
              fill="#ff6b89"
              opacity=".45"
            />
            <ellipse
              cx="77"
              cy="58"
              rx="7"
              ry="4"
              fill="#ff6b89"
              opacity=".45"
            />
            {[0, 4, 9, 10].includes(expression) && (
              <>
                <path d="M36 60h29l-5 7H42Z" fill="white" />
                <path d="M43 72q8-9 16 0" fill="#ff7b9d" />
              </>
            )}
          </g>
        )}
        {emote === 1 && (
          <g fill="#56d9ff" className="tears">
            <path d="M30 50Q14 72 29 73Q45 72 30 50Z M73 50Q57 72 72 73Q88 72 73 50Z" />
          </g>
        )}
        {emote === 2 && (
          <path
            className="steam"
            d="M15 25q-15-10 0-20m70 20q15-10 0-20"
            stroke="white"
            fill="none"
            strokeWidth="5"
          />
        )}
        {emote === 6 && (
          <path
            className="palm"
            d="M42 88 35 42Q35 35 42 39l8 18V25q6-7 9 0v30l5-28q7-5 8 3l-4 32 8-17q9-3 7 6l-9 28Z"
            fill="#ffb85c"
            stroke="#151c2c"
            strokeWidth="2"
          />
        )}
        {emote === 7 && (
          <path d="M81 27q-14 20 0 21 14-1 0-21" fill="#56d9ff" />
        )}
        {emote === 8 && (
          <path
            className="heart"
            d="m13 75 8-10 8 10-7 10 7 8-8 5-15-14Z"
            fill="#ff7b9d"
          />
        )}
        {emote === 9 && (
          <g className="clap" fill="#ffb85c">
            <ellipse
              cx="24"
              cy="78"
              rx="10"
              ry="16"
              transform="rotate(-35 24 78)"
            />
            <ellipse
              cx="77"
              cy="78"
              rx="10"
              ry="16"
              transform="rotate(35 77 78)"
            />
          </g>
        )}
        {emote === 10 && (
          <text
            x="50"
            y="91"
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fill="white"
            stroke="#151c2c"
            strokeWidth="1"
          >
            GG
          </text>
        )}
        {emote === 11 && (
          <path
            className="crown"
            d="M27 24 23 3 40 13 50 0 60 13 77 3 73 24Z"
            fill="#ffb85c"
          />
        )}
        {look?.accessory === 1 && (
          <g fill="#172035" stroke="#172035" strokeWidth="4">
            <path d="M20 37h25v16H24Zm36 0h25l-4 16H56Z" />
            <path d="M45 41h11" />
            <path d="m25 39 8 9m29-9 8 9" stroke="#56d9ff" strokeWidth="2" />
          </g>
        )}
        {look?.accessory === 2 && emote !== 11 && (
          <path
            d="M25 24 21 4 39 14 50 1 61 14 79 4 75 24Z"
            fill="#ffb85c"
            stroke="#172035"
            strokeWidth="2"
          />
        )}
        {look?.accessory === 3 && (
          <g fill="none" stroke="#172035" strokeWidth="7">
            <path d="M15 48V36a35 35 0 0 1 70 0v12" />
            <rect x="9" y="36" width="12" height="26" rx="5" fill={accent} />
            <rect x="79" y="36" width="12" height="26" rx="5" fill={accent} />
          </g>
        )}
        {look?.accessory === 4 && (
          <g fill={accent} stroke="#172035" strokeWidth="2">
            <path d="M24 28q0-28 28-25 25 0 25 25Z" />
            <path d="M22 27h65q7 8-9 9H22Z" />
            <path d="M50 5v21" fill="none" />
          </g>
        )}
        {look?.accessory === 5 && (
          <g fill={accent} stroke="#172035" strokeWidth="2">
            <path d="m49 19-23-13v26Zm3 0L76 6v26Z" />
            <circle cx="50" cy="20" r="6" />
          </g>
        )}
        {look?.accessory === 6 && (
          <path
            d="M50 57q-9-11-17 0-7 6-14 3 4 16 22 8l9-6 9 6q18 8 22-8-7 3-14-3-8-11-17 0Z"
            fill="#172035"
          />
        )}
        {look?.accessory === 7 && (
          <g fill="none">
            <ellipse
              cx="50"
              cy="45"
              rx="46"
              ry="43"
              stroke="#e9f1ff"
              strokeWidth="4"
            />
            <path d="M19 69q31 20 62 0v13q-31 16-62 0Z" fill="#e9f1ff" />
            <path
              d="M19 35q4-17 17-22"
              stroke="white"
              strokeWidth="5"
              opacity=".55"
              strokeLinecap="round"
            />
          </g>
        )}
        <CharacterAccessories
          item={look?.accessory ?? 0}
          detail={look?.detail}
          accent={accent}
        />
      </g>
      {emote >= 0 && <EmoteProps id={emote} />}
    </svg>
  );
});
