"use client";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  blockColors,
  blockShape,
  ghostY,
  moveBlock,
  predictFall,
  type BlockInput,
  type BlockPlayer,
} from "@/lib/game/blocks-physics";
import { sound } from "@/lib/audio";
const Field = memo(function Field({
  p,
  ghost = false,
}: {
  p: BlockPlayer;
  ghost?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 800);
    const cell = (x: number, y: number, value: number, shadow = false) => {
      if (y < 2 || y >= 22 || x < 0 || x >= 10) return;
      const left = x * 40,
        top = (y - 2) * 40;
      ctx.fillStyle = value ? blockColors[value] : "#0b1220";
      ctx.fillRect(left + 1, top + 1, 38, 38);
      if (shadow) {
        ctx.fillStyle = "#ffffff14";
        ctx.fillRect(left + 2, top + 2, 36, 36);
        ctx.strokeStyle = "#b9c8df99";
        ctx.lineWidth = 2;
        ctx.strokeRect(left + 3, top + 3, 34, 34);
      } else if (value) {
        ctx.fillStyle = "#ffffff35";
        ctx.fillRect(left + 2, top + 2, 36, 4);
        ctx.fillStyle = "#0004";
        ctx.fillRect(left + 2, top + 34, 36, 4);
      }
    };
    p.board.forEach((row, y) => row.forEach((v, x) => cell(x, y, v)));
    if (p.alive) {
      const shape = blockShape(p.kind, p.rotation);
      if (ghost) {
        const landing = ghostY(p);
        shape.forEach((row, dy) =>
          row.forEach((v, dx) => {
            if (v) cell(p.x + dx, landing + dy, 0, true);
          }),
        );
      }
      shape.forEach((row, dy) =>
        row.forEach((v, dx) => {
          if (v) cell(p.x + dx, p.y + dy, v);
        }),
      );
    }
  }, [p, ghost]);
  return (
    <div className={`block-field canvas-field ${!p.alive ? "eliminated" : ""}`}>
      <canvas
        ref={ref}
        width={400}
        height={800}
        aria-label={
          ghost
            ? "Dein Spielfeld: 10 Spalten, 20 Reihen"
            : "Gegnerisches Spielfeld"
        }
      />
      {!p.alive && <strong>Platz {p.place ?? "–"}</strong>}
    </div>
  );
});
function Piece({ kind }: { kind: any }) {
  return (
    <div className="block-preview">
      {kind ? (
        blockShape(kind).map((row, y) => (
          <div key={y}>
            {row.map((cell, x) => (
              <i key={x} style={{ background: blockColors[cell] }} />
            ))}
          </div>
        ))
      ) : (
        <span>Leer</span>
      )}
    </div>
  );
}
export function BlockDuel({
  room,
  me,
  now,
  act,
}: {
  room: any;
  me: string;
  now: number;
  act: (a: any) => void;
}) {
  const g = room.game;
  const [local, setLocal] = useState<BlockPlayer>(() =>
    structuredClone(g.mine),
  );
  const predicted = useRef(local),
    pending = useRef<
      { seq: number; key: BlockInput; pieceId: number; at: number }[]
    >([]),
    inFlight = useRef({ seq: 0, at: 0 }),
    seq = useRef(g.mine.seq),
    send = useRef(act),
    time = useRef(now);
  send.current = act;
  time.current = now;
  useEffect(() => {
    pending.current = pending.current.filter(
      (command) => command.seq > g.mine.seq,
    );
    seq.current = Math.max(seq.current, g.mine.seq);
    const p = structuredClone(g.mine);
    for (const command of pending.current) {
      if (command.pieceId !== (p.pieceId ?? 1)) continue;
      predictFall(p, command.at, g.startedAt);
      moveBlock(p, command.key, command.at);
    }
    predictFall(p, time.current, g.startedAt);
    predicted.current = p;
    setLocal(p);
  }, [g.mine]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        pending.current.length &&
        (g.mine.seq >= inFlight.current.seq ||
          Date.now() - inFlight.current.at > 800)
      ) {
        const inputs = pending.current.slice(0, 24);
        inFlight.current = { seq: inputs.at(-1)!.seq, at: Date.now() };
        send.current({ type: "inputs", inputs, round: g.round });
      }
    }, 80);
    return () => clearInterval(interval);
  }, [g.mine.seq, g.round]);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const p = predicted.current;
      if (p.alive) {
        const copy = { ...p };
        predictFall(copy, time.current, g.startedAt);
        if (copy.y !== p.y) {
          predicted.current = copy;
          setLocal(copy);
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [g.startedAt]);
  const input = useRef((key: BlockInput) => {});
  input.current = (key) => {
    if (!predicted.current.alive || pending.current.length >= 48) return;
    const command = {
      seq: ++seq.current,
      key,
      pieceId: predicted.current.pieceId ?? 1,
      at: time.current,
    };
    pending.current.push(command);
    const p = structuredClone(predicted.current);
    moveBlock(p, key, time.current);
    predicted.current = p;
    setLocal(p);
    sound.play(
      key === "drop" ? "blockDrop" : key === "hold" ? "card" : "typeKey",
    );
  };
  useEffect(() => {
    const keys: Record<string, BlockInput> = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowDown: "down",
      ArrowUp: "cw",
      x: "cw",
      z: "ccw",
      " ": "drop",
      c: "hold",
      Shift: "hold",
      a: "left",
      d: "right",
      s: "down",
      w: "cw",
      q: "ccw",
      e: "cw",
    };
    let held: BlockInput | null = null,
      pressedAt = 0,
      repeatedAt = 0;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches("input,textarea,select")) return;
      const key = keys[e.key] ?? keys[e.key.toLowerCase()];
      if (!key) return;
      e.preventDefault();
      if (e.repeat) return;
      input.current(key);
      if (["left", "right", "down"].includes(key)) {
        held = key;
        pressedAt = performance.now();
        repeatedAt = pressedAt;
      }
    };
    const up = (e: KeyboardEvent) => {
      if ((keys[e.key] ?? keys[e.key.toLowerCase()]) === held) held = null;
    };
    const blur = () => {
      held = null;
    };
    const repeat = setInterval(() => {
      const t = performance.now();
      if (held && t - pressedAt > 150 && t - repeatedAt > 45) {
        input.current(held);
        repeatedAt = t;
      }
    }, 16);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      clearInterval(repeat);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const lastClear = useRef(0);
  useEffect(() => {
    if (g.mine.lastClearAt > lastClear.current) {
      if (g.mine.lastClear)
        sound.play(g.mine.lastClear === 4 ? "win" : "blockClear");
      lastClear.current = g.mine.lastClearAt;
    }
  }, [g.mine.lastClearAt]);
  const name = (id: string) =>
    room.players.find((p: any) => p.id === id)?.name ?? "Spieler";
  return (
    <section className="block-arena">
      <div className="block-main">
        <aside className="block-hold">
          <span>HALTEN · C</span>
          <Piece kind={local.hold} />
          <b>{local.lines}</b>
          <small>Reihen</small>
          <b>{local.sent}</b>
          <small>Gesendet</small>
        </aside>
        <div className="block-own">
          <Field p={local} ghost />
          {local.lastClear > 0 && now - local.lastClearAt < 1300 && (
            <div className="block-clear" key={local.lastClearAt}>
              {local.lastClear === 4 ? "VIERER!" : `${local.lastClear} REIHEN`}
              {local.combo > 0 && <small>COMBO ×{local.combo + 1}</small>}
            </div>
          )}
          <div
            className={`block-incoming ${g.mine.incoming.length ? "danger" : ""}`}
          >
            {g.mine.incoming.length
              ? `↑ ${g.mine.incoming.length} Strafreihen warten`
              : "Keine Strafreihen in Sicht"}
          </div>
        </div>
        <aside className="block-next">
          <span>DANACH</span>
          {local.queue.slice(0, 5).map((kind, i) => (
            <Piece kind={kind} key={i} />
          ))}
        </aside>
      </div>
      <div className="block-rivals">
        <div className="new-mode-heading">
          <span className="eyebrow">DEINE GEGNER · LIVE</span>
          <h2>
            {local.alive ? "Baue ab. Greif an." : "Du schaust der Crew zu."}
          </h2>
          <p>
            Gegner anklicken = Angriffsziel. Ohne Auswahl wechselt das Ziel
            automatisch.
          </p>
        </div>
        <div className="block-rival-grid">
          {room.participantIds
            .filter((id: string) => id !== me)
            .map((id: string) => (
              <button
                key={id}
                disabled={!local.alive || !g.fields[id].alive}
                className={g.mine.target === id ? "targeted" : ""}
                onClick={() => act({ type: "target", target: id })}
              >
                <strong>
                  {name(id)} {g.mine.target === id ? "◎" : ""}
                </strong>
                <Field p={g.fields[id]} />
                <small>
                  {g.fields[id].alive
                    ? `${g.fields[id].lines} Reihen · ↑${g.fields[id].incoming}`
                    : `Platz ${g.fields[id].place}`}
                </small>
              </button>
            ))}
        </div>
        <div className="block-feed" aria-live="polite">
          {g.attacks
            .slice(-3)
            .reverse()
            .map((a: any, i: number) => (
              <p key={`${a.at}:${a.from}:${i}`}>
                <b>{name(a.from)}</b> schickt <strong>+{a.rows}</strong> an{" "}
                {name(a.to)}
              </p>
            ))}
        </div>
      </div>
      <div className="block-controls">
        {(
          [
            ["left", "←"],
            ["ccw", "↶"],
            ["cw", "↷"],
            ["right", "→"],
            ["down", "↓"],
            ["drop", "Fallen ⤓"],
            ["hold", "Halten C"],
          ] as [BlockInput, string][]
        ).map(([key, label]) => (
          <button
            disabled={!local.alive}
            aria-label={label}
            key={key}
            onClick={() => input.current(key)}
          >
            {label}
          </button>
        ))}
        <small>
          A/D oder ← → Bewegen · W/↑ Drehen · Q/Z Zurück · S/↓ Senken ·
          Leertaste Fallen · C Halten
        </small>
      </div>
    </section>
  );
}
