"use client";
import { memo, useEffect, useRef, useState, type CSSProperties } from "react";

const pips = [
  [],
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
];
// Opposite faces add to seven. Orient the authoritative value on top (-Y).
export const rotations = [
  [90, 0],
  [90, 0],
  [90, -90],
  [0, 0],
  [180, 0],
  [90, 90],
  [90, 180],
];

export const BossDie = memo(function BossDie({
  value,
  held,
  roll,
  rolling,
  index,
}: {
  value: number;
  held: boolean;
  roll: number;
  rolling: boolean;
  index: number;
}) {
  const previousRoll = useRef(roll);
  const [landing, setLanding] = useState(false);
  useEffect(() => {
    if (previousRoll.current === roll) return;
    previousRoll.current = roll;
    if (held) return;
    setLanding(true);
    const timer = setTimeout(() => setLanding(false), 460);
    return () => clearTimeout(timer);
  }, [roll]);
  const [x, y] = rotations[value] ?? rotations[0];
  return (
    <span
      className={`boss-die ${held ? "is-held" : ""} ${rolling ? "is-rolling" : landing ? "is-landing" : ""}`}
      style={
        {
          "--die-x": `${x}deg`,
          "--die-y": `${y}deg`,
          "--die-offset": `${index * -63}ms`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <span className="boss-die-shadow" />
      <span className="boss-die-lift">
        <span className="boss-die-solid">
          {[1, 2, 3, 4, 5, 6].map((face) => (
            <span key={face} className={`boss-die-side side-${face} ${face === value ? "is-result" : ""}`}>
              {Array.from({ length: 9 }, (_, i) => (
                <i
                  key={i}
                  className={
                    (value || rolling) && pips[face].includes(i) ? "pip" : ""
                  }
                />
              ))}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
});
