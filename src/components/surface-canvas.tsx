"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { MotionValue } from "motion/react";
export default function SurfaceCanvas({
  surface,
  glow,
  speed,
  material: materialValue,
}: {
  surface: number;
  glow: number;
  speed: number;
  material?: MotionValue<number>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const values = useRef({ surface, glow, speed, materialValue });
  useEffect(() => {
    values.current = { surface, glow, speed, materialValue };
  }, [surface, glow, speed, materialValue]);
  useEffect(() => {
    const el = host.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const scene = new THREE.Scene(),
      camera = new THREE.Camera();
    let disposed = false;
    const placeholder = new THREE.DataTexture(
      new Uint8Array([28, 18, 42, 255]),
      1,
      1,
    );
    placeholder.needsUpdate = true;
    const uniforms = {
      uEnvironment: { value: placeholder as THREE.Texture },
      uEnvironmentReady: { value: 0 },
      uTime: { value: 0 },
      uSurface: { value: surface / 100 },
      uGlow: { value: glow },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    };
    const environment = new THREE.TextureLoader().load(
      "/art/laura-atelier.webp",
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        uniforms.uEnvironment.value = texture;
        uniforms.uEnvironmentReady.value = 1;
      },
      undefined,
      () => {
        /* The procedural reflection remains available if the image fails. */
      },
    );
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}",
      fragmentShader: `precision mediump float;varying vec2 vUv;uniform float uTime,uSurface,uGlow;uniform vec2 uPointer;uniform sampler2D uEnvironment;uniform float uEnvironmentReady;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=vUv;float grain=hash(floor(uv*950.));float blend=clamp(uSurface,0.,1.);float activity=sin(blend*3.14159265);vec2 delta=uv-uPointer;float ripple=sin(length(delta)*34.-uTime*1.4)*exp(-length(delta)*5.);uv+=vec2(ripple,-ripple)*.025*activity;float sweep=pow(max(0.,sin(uv.x*3.4+uv.y*2.2+uPointer.x*.8+uTime*.07)),12.);float edge=pow(abs(uv.x-.5)*2.,3.);vec3 glass=vec3(.12,.10,.17)+sweep*vec3(.58,.52,.65)+edge*vec3(.1,.16,.20);glass+=uGlow*vec3(.28,.035,.24)*pow(1.-uv.x,4.);glass+=uGlow*vec3(.015,.22,.29)*pow(uv.x,6.);vec2 envUv=vec2(clamp(1.-uv.x*.8+uPointer.x*.05,.05,.95),clamp(.82+uv.y*.16,.82,.99));vec3 reflected=(texture2D(uEnvironment,envUv).rgb+texture2D(uEnvironment,envUv+vec2(.025,-.015)).rgb)*.5;glass=mix(glass,reflected*.65+vec3(.055,.04,.08)+sweep*vec3(.3,.34,.36),uEnvironmentReady*.8);vec3 col=glass;col+=activity*vec3(.06,.02,.07)*ripple;gl_FragColor=vec4(col+(grain-.5)*.014,1.);}`,
    });
    scene.add(new THREE.Mesh(geometry, material));
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    const resize = new ResizeObserver(() =>
      renderer.setSize(el.clientWidth, el.clientHeight),
    );
    resize.observe(el);
    const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionPreference.matches;
    const preferenceChange = () => {
      reduced = motionPreference.matches;
    };
    motionPreference.addEventListener("change", preferenceChange);
    let visible = true,
      frame = 0,
      last = 0;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const move = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      uniforms.uPointer.value.set(
        (e.clientX - b.left) / b.width,
        (e.clientY - b.top) / b.height,
      );
    };
    const pointerArea =
      el.closest<HTMLElement>(".scene") || el.parentElement || el;
    pointerArea.addEventListener("pointermove", move);
    let lost = false;
    const loss = (e: Event) => {
      e.preventDefault();
      lost = true;
      el.dataset.lost = "true";
    };
    const restore = () => {
      lost = false;
      delete el.dataset.lost;
    };
    renderer.domElement.addEventListener("webglcontextlost", loss);
    renderer.domElement.addEventListener("webglcontextrestored", restore);
    function animate(t: number) {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      if (!visible || document.hidden || lost) return;
      if (!reduced) uniforms.uTime.value += dt * values.current.speed;
      uniforms.uSurface.value =
        (values.current.materialValue?.get() ?? values.current.surface) / 100;
      uniforms.uGlow.value = values.current.glow;
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      environment.dispose();
      placeholder.dispose();
      cancelAnimationFrame(frame);
      motionPreference.removeEventListener("change", preferenceChange);
      resize.disconnect();
      observer.disconnect();
      pointerArea.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", loss);
      renderer.domElement.removeEventListener("webglcontextrestored", restore);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Material controls are read through a ref without recreating the WebGL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={host} className="surface-canvas" aria-hidden="true" />;
}
