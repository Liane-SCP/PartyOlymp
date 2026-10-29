import {
  ShaderMaterial,
  WebGLRenderTarget,
  HalfFloatType,
  Vector2,
  type WebGLRenderer,
} from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const vertex = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
/** Five bounded low-resolution passes and one composite, instead of a full mip pyramid. */
export class BossBloom extends Pass {
  strength = 0.85;
  private targets = Array.from(
    { length: 3 },
    () =>
      new WebGLRenderTarget(1, 1, {
        type: HalfFloatType,
        depthBuffer: false,
        stencilBuffer: false,
      }),
  );
  private extract = new ShaderMaterial({
    uniforms: {
      source: { value: null },
      texel: { value: new Vector2() },
      threshold: { value: 1.15 },
    },
    vertexShader: vertex,
    depthTest: false,
    depthWrite: false,
    fragmentShader: `varying vec2 vUv;uniform sampler2D source;uniform vec2 texel;uniform float threshold;
    void main(){vec3 c=(texture2D(source,vUv+texel*vec2(-1.,-1.)).rgb+texture2D(source,vUv+texel*vec2(1.,-1.)).rgb+texture2D(source,vUv+texel*vec2(-1.,1.)).rgb+texture2D(source,vUv+texel*vec2(1.,1.)).rgb)*.25;
    float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(threshold-.35,threshold+.35,l),1.);}`,
  });
  private blur = new ShaderMaterial({
    uniforms: { source: { value: null }, direction: { value: new Vector2() } },
    vertexShader: vertex,
    depthTest: false,
    depthWrite: false,
    fragmentShader: `varying vec2 vUv;uniform sampler2D source;uniform vec2 direction;
    void main(){vec3 c=texture2D(source,vUv).rgb*.227027;
    c+=(texture2D(source,vUv+direction*1.384615).rgb+texture2D(source,vUv-direction*1.384615).rgb)*.316216;
    c+=(texture2D(source,vUv+direction*3.230769).rgb+texture2D(source,vUv-direction*3.230769).rgb)*.070270;
    gl_FragColor=vec4(c,1.);}`,
  });
  private composite = new ShaderMaterial({
    uniforms: {
      source: { value: null },
      glow: { value: null },
      strength: { value: 1 },
    },
    vertexShader: vertex,
    depthTest: false,
    depthWrite: false,
    fragmentShader: `varying vec2 vUv;uniform sampler2D source;uniform sampler2D glow;uniform float strength;
    void main(){gl_FragColor=vec4(texture2D(source,vUv).rgb+texture2D(glow,vUv).rgb*strength*1.55,1.);}`,
  });
  private quad = new FullScreenQuad(this.extract);
  setSize(width: number, height: number) {
    // Glow contains only low-frequency light: cap its longest edge independently of display DPI.
    const scale = Math.min(0.25, 480 / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale)),
      h = Math.max(1, Math.round(height * scale));
    for (const target of this.targets) target.setSize(w, h);
    this.extract.uniforms.texel.value.set(1 / width, 1 / height);
  }
  render(
    renderer: WebGLRenderer,
    write: WebGLRenderTarget,
    read: WebGLRenderTarget,
  ) {
    const [a, b, c] = this.targets;
    this.extract.uniforms.source.value = read.texture;
    this.quad.material = this.extract;
    renderer.setRenderTarget(a);
    this.quad.render(renderer);
    this.quad.material = this.blur;
    this.blur.uniforms.source.value = a.texture;
    this.blur.uniforms.direction.value.set(1 / a.width, 0);
    renderer.setRenderTarget(b);
    this.quad.render(renderer);
    this.blur.uniforms.source.value = b.texture;
    this.blur.uniforms.direction.value.set(0, 1 / a.height);
    renderer.setRenderTarget(c);
    this.quad.render(renderer);
    this.blur.uniforms.source.value = c.texture;
    this.blur.uniforms.direction.value.set(1 / a.width, 0);
    renderer.setRenderTarget(a);
    this.quad.render(renderer);
    this.blur.uniforms.source.value = a.texture;
    this.blur.uniforms.direction.value.set(0, 1 / a.height);
    renderer.setRenderTarget(b);
    this.quad.render(renderer);
    this.composite.uniforms.source.value = read.texture;
    this.composite.uniforms.glow.value = b.texture;
    this.composite.uniforms.strength.value = this.strength;
    this.quad.material = this.composite;
    renderer.setRenderTarget(this.renderToScreen ? null : write);
    this.quad.render(renderer);
  }
  dispose() {
    for (const target of this.targets) target.dispose();
    this.extract.dispose();
    this.blur.dispose();
    this.composite.dispose();
    this.quad.dispose();
  }
}
