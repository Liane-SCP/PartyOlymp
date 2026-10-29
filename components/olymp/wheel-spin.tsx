"use client";
import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/audio";
import { wheelAngle, wheelSettled, type WheelDraw } from "@/lib/game/wheel";

const colors = ["#bcff5c", "#9b8aff", "#ff7b9d", "#56d9ff", "#ffb85c", "#76e8c5"];
export function WheelSpin({ draw, now, title, subtitle, reduced = false }: {
  draw: WheelDraw; now: number; title: string; subtitle: string; reduced?: boolean;
}) {
  const [systemReduced, setSystemReduced] = useState(false);
  const disc = useRef<HTMLDivElement>(null), clock = useRef({server:now,local:0});
  useEffect(()=>{clock.current={server:now,local:performance.now()};},[now]);
  const previous = useRef(-1), announced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(query.matches);
    change(); query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const angle = wheelAngle(draw, now), settled = wheelSettled(draw, now);
  const calm = reduced || systemReduced;
  useEffect(()=>{
    if(calm)return;
    let frame=0;
    const animate=(time:number)=>{
      const serverNow=clock.current.server+time-clock.current.local;
      if(disc.current)disc.current.style.transform=`rotate(${wheelAngle(draw,serverNow)}deg)`;
      if(!wheelSettled(draw,serverNow))frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(frame);
  },[draw.id,calm]);
  const count = draw.entries.length, step = 360 / count;
  const current = ((Math.round(-angle / step) % count) + count) % count;
  useEffect(() => {
    const tick = Math.floor(angle / step);
    if (!calm && !settled && tick !== previous.current && angle > 0) sound.play("click");
    previous.current = tick;
    if (settled && !announced.current) { announced.current = true; sound.play("reveal"); }
  }, [angle, step, settled, calm]);
  const point = (a: number, radius = 190) => {
    const radians = a * Math.PI / 180;
    return `${220 + radius * Math.cos(radians)},${220 + radius * Math.sin(radians)}`;
  };
  const winner = draw.entries[draw.selected];
  return <section className={`wheel-show ${settled ? "is-settled" : ""} ${calm ? "is-calm" : ""}`} aria-label={title}>
    <header><span className="eyebrow">{settled ? "DAS SCHICKSAL HAT ENTSCHIEDEN" : "EIN RAD · EINE CREW · EIN MOMENT"}</span>
      <h2>{title}</h2><p>{subtitle}</p></header>
    <div className="wheel-stage">
      <div className="wheel-halo" /><div className="wheel-pointer" aria-hidden="true">▼</div>
      <div ref={disc} className="wheel-disc" style={calm ? {transform:`rotate(${settled ? wheelAngle(draw, draw.startedAt + 10000) : 0}deg)`} : undefined}>
        <svg viewBox="0 0 440 440" aria-hidden="true">
          <circle cx="220" cy="220" r="208" fill="#20263b" stroke="#ffe5a0" strokeWidth="8" />
          {draw.entries.map((entry, i) => {
            const middle = i * step - 90, start = middle - step / 2, end = middle + step / 2;
            return <g key={`${entry.id}-${i}`}>
              {count === 1 ? <circle cx="220" cy="220" r="190" fill={colors[0]} /> :
                <path d={`M220,220 L${point(start)} A190,190 0 ${step > 180 ? 1 : 0},1 ${point(end)} Z`} fill={colors[i % colors.length]} stroke="#20263b" strokeWidth="2" />}
              <text transform={`translate(220 220) rotate(${middle})`} x="180" y="4" textAnchor="end" fill="#162033" fontWeight="800" fontSize={count > 24 ? 8 : count > 16 ? 10 : 13}>
                {entry.name.length > 19 ? entry.name.slice(0, 17) + "…" : entry.name}
              </text>
            </g>;
          })}
          {Array.from({length:32},(_,i)=><circle key={i} cx={220+200*Math.cos(i*Math.PI/16)} cy={220+200*Math.sin(i*Math.PI/16)} r="3" fill="#fff2bd" />)}
        </svg>
      </div>
      <div className="wheel-hub" aria-hidden="true">✦</div>
    </div>
    <div className="wheel-result" aria-live={settled ? "polite" : "off"} role="status">
      <small>{settled ? "AUSGELOST" : count === 1 ? "LETZTER EINTRAG IM LOSTOPF" : calm ? "DIE AUSLOSUNG LÄUFT" : "DAS RAD DREHT SICH"}</small>
      <strong>{settled ? winner.name : calm ? `${count} Möglichkeiten` : draw.entries[current].name}</strong>
    </div>
    <p className="wheel-note">{settled ? "Gleich geht’s weiter …" : `${count} ${count === 1 ? "Los" : "Lose"} im Rad · für alle dieselbe Auslosung`}</p>
  </section>;
}
