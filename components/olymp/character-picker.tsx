"use client";
import { useState } from "react";
import { Avatar } from "./art";
import {
  type Appearance,
  shapeNames,
  accessoryNames,
  detailNames,
  characterColors,
} from "@/lib/appearance";
export function CharacterPicker({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (v: Appearance) => void;
}) {
  const [tab, setTab] = useState<"shape" | "accessory" | "detail">("accessory");
  const names =
    tab === "shape"
      ? shapeNames
      : tab === "detail"
        ? detailNames
        : accessoryNames;
  const randomize = () =>
    onChange({
      shape: Math.floor(Math.random() * shapeNames.length),
      accessory: Math.floor(Math.random() * accessoryNames.length),
      detail: Math.floor(Math.random() * detailNames.length),
      color: Math.floor(Math.random() * characterColors.length),
      accent: Math.floor(Math.random() * characterColors.length),
    });
  return (
    <div className="character-builder wardrobe">
      <div className="character-preview">
        <div className="character-aura" />
        <Avatar look={value} />
        <div>
          <span className="eyebrow">DEIN ORIGINAL</span>
          <strong>
            {shapeNames[value.shape]} · {accessoryNames[value.accessory]}
          </strong>
          <small>
            {detailNames[value.detail ?? 0]} · Dein Look begleitet dich in jedem
            Spiel.
          </small>
          <button type="button" className="wardrobe-random" onClick={randomize}>
            ↻ Überrasch mich
          </button>
        </div>
      </div>
      <div className="wardrobe-colors">
        {(["color", "accent"] as const).map((key) => (
          <fieldset key={key}>
            <legend>
              {key === "color" ? "Körperfarbe" : "Accessoire-Akzent"}
            </legend>
            <div className="color-swatches">
              {characterColors.map((color, i) => (
                <button
                  type="button"
                  key={color}
                  style={{ background: color }}
                  className={(value[key] ?? 3) === i ? "selected" : ""}
                  aria-label={`${key === "color" ? "Körperfarbe" : "Akzentfarbe"} ${i + 1}`}
                  aria-pressed={(value[key] ?? 3) === i}
                  onClick={() => onChange({ ...value, [key]: i })}
                >
                  {(value[key] ?? 3) === i ? "✓" : ""}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div
        className="wardrobe-tabs"
        role="tablist"
        aria-label="Charakter gestalten"
      >
        {(
          [
            ["shape", "Formen", shapeNames.length],
            ["accessory", "Accessoires", accessoryNames.length],
            ["detail", "Extras", detailNames.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            type="button"
            role="tab"
            id={`wardrobe-${key}`}
            aria-controls="wardrobe-options"
            aria-selected={tab === key}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </div>
      <p className="wardrobe-hint">
        {tab === "detail"
          ? "Extras lassen sich mit jedem Accessoire kombinieren."
          : tab === "accessory"
            ? "Hüte, Brillen und mehr. Unter Extras kommt die zweite Schicht dazu."
            : "Jede Form trägt deinen persönlichen Look."}
      </p>
      <div
        className="accessory-options wardrobe-options"
        id="wardrobe-options"
        role="tabpanel"
        aria-labelledby={`wardrobe-${tab}`}
      >
        {names.map((name, i) => (
          <button
            type="button"
            key={`${tab}-${name}`}
            className={(value[tab] ?? 0) === i ? "selected" : ""}
            aria-label={name}
            aria-pressed={(value[tab] ?? 0) === i}
            onClick={() => onChange({ ...value, [tab]: i })}
          >
            <Avatar look={{ ...value, [tab]: i }} />
            <small>{name}</small>
            {(value[tab] ?? 0) === i && (
              <span className="wardrobe-check">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
