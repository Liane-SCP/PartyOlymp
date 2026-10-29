"use client";
import { useEffect, useRef, useState } from "react";
export function Panorama({ image }: { image: string }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    camera = useRef({ yaw: 0, pitch: 0, fov: 75 }),
    draw = useRef(() => {});
  const [state, setState] = useState("loading");
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = canvas.current!,
      gl = el.getContext("webgl", { alpha: false, antialias: true });
    if (!gl) {
      setState("fallback");
      return;
    }
    let disposed = false;
    const shader = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      return s;
    };
    const vs = shader(
      gl.VERTEX_SHADER,
      "attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.0,1.0);}",
    );
    const fs = shader(
      gl.FRAGMENT_SHADER,
      `precision mediump float; varying vec2 uv; uniform sampler2D photo; uniform vec4 camera; void main(){vec3 d=normalize(vec3((uv.x*2.0-1.0)*camera.w*tan(camera.z*.5),(uv.y*2.0-1.0)*tan(camera.z*.5),1.0));float cp=cos(camera.y),sp=sin(camera.y);d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);float cy=cos(camera.x),sy=sin(camera.x);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);vec2 t=vec2(fract(atan(d.x,d.z)/6.2831853+.5),.5-asin(clamp(d.y,-1.0,1.0))/3.14159265);gl_FragColor=texture2D(photo,t);}`,
    );
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setState("fallback");
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const location = gl.getUniformLocation(program, "camera");
    let loaded = false;
    draw.current = () => {
      if (!loaded || disposed || !el.isConnected) return;
      const rect = el.getBoundingClientRect(),
        ratio = Math.min(2, window.devicePixelRatio || 1);
      if (rect.width <= 0 || rect.height <= 0) return;
      const width = Math.max(1, Math.round(rect.width * ratio)),
        height = Math.max(1, Math.round(rect.height * ratio));
      if (el.width !== width) el.width = width;
      if (el.height !== height) el.height = height;
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform4f(
        location,
        camera.current.yaw,
        camera.current.pitch,
        (camera.current.fov * Math.PI) / 180,
        el.width / el.height,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      el.dataset.panoramaView=JSON.stringify({yaw:camera.current.yaw,pitch:camera.current.pitch,fov:camera.current.fov,aspect:el.width/el.height});
    };
    const photo = new Image();
    photo.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, photo);
      loaded = true;
      setState("ready");
      draw.current();
    };
    photo.onerror = () => setState("error");
    photo.src = image;
    const observer = new ResizeObserver(() => draw.current());
    observer.observe(el);
    return () => {
      disposed = true;
      photo.onload = null;
      photo.onerror = null;
      observer.disconnect();
      draw.current = () => {};
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [image]);
  const zoom = (delta: number) => {
    camera.current.fov = Math.max(
      30,
      Math.min(100, camera.current.fov + delta),
    );
    draw.current();
  };
  return (
    <div className="geo-panorama">
      {state === "loading" && (
        <p className="pano-loading">Dein nächster Ort wird geladen …</p>
      )}
      {state === "error" && (
        <p className="pano-loading">
          Das Panorama konnte nicht geladen werden. Bitte lade die Seite neu.
        </p>
      )}
      {state === "fallback" ? (
        <div className="pano-fallback">
          <img src={image} alt="360-Grad-Ansicht des gesuchten Ortes" />
          <span>Panorama zum horizontalen Scrollen</span>
        </div>
      ) : (
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="360-Grad-Panorama. Zum Umsehen ziehen oder Pfeiltasten nutzen. Plus und Minus zoomen."
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            camera.current.yaw -= (e.clientX - drag.current.x) * 0.004;
            camera.current.pitch = Math.max(
              -1.35,
              Math.min(
                1.35,
                camera.current.pitch + (e.clientY - drag.current.y) * 0.004,
              ),
            );
            drag.current = { x: e.clientX, y: e.clientY };
            draw.current();
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onWheel={(e) => zoom(Math.sign(e.deltaY) * 4)}
          onKeyDown={(e) => {
            if (
              ![
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "+",
                "-",
              ].includes(e.key)
            )
              return;
            e.preventDefault();
            if (e.key === "+" || e.key === "-") zoom(e.key === "+" ? -5 : 5);
            else {
              camera.current.yaw +=
                e.key === "ArrowLeft"
                  ? -0.12
                  : e.key === "ArrowRight"
                    ? 0.12
                    : 0;
              camera.current.pitch = Math.max(
                -1.35,
                Math.min(
                  1.35,
                  camera.current.pitch +
                    (e.key === "ArrowUp"
                      ? 0.12
                      : e.key === "ArrowDown"
                        ? -0.12
                        : 0),
                ),
              );
              draw.current();
            }
          }}
        />
      )}
      <div className="pano-toolbar">
        <span>360° · Ziehen zum Umsehen</span>
        <button aria-label="Panorama vergrößern" onClick={() => zoom(-10)}>
          +
        </button>
        <button aria-label="Panorama verkleinern" onClick={() => zoom(10)}>
          −
        </button>
      </div>
    </div>
  );
}
