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
  const values = useRef({ surface, glow, speed });
  useEffect(() => {
    values.current = { surface, glow, speed };
  }, [surface, glow, speed]);
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
    const uniforms = {
      uTime: { value: 0 },
      uSurface: { value: surface / 100 },
      uGlow: { value: glow },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}",
      fragmentShader: `precision mediump float;varying vec2 vUv;uniform float uTime,uSurface,uGlow;uniform vec2 uPointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){vec2 uv=vUv;float grain=hash(floor(uv*950.));float blend=clamp(uSurface,0.,1.);float activity=sin(blend*3.14159265);vec2 delta=uv-uPointer;float ripple=sin(length(delta)*34.-uTime*1.4)*exp(-length(delta)*5.);uv+=vec2(ripple,-ripple)*.025*activity;float sweep=pow(max(0.,sin(uv.x*3.4+uv.y*2.2+uPointer.x*.8+uTime*.07)),12.);float edge=pow(abs(uv.x-.5)*2.,3.);vec3 glass=vec3(.12,.10,.17)+sweep*vec3(.58,.52,.65)+edge*vec3(.1,.16,.20);glass+=uGlow*vec3(.28,.035,.24)*pow(1.-uv.x,4.);glass+=uGlow*vec3(.015,.22,.29)*pow(uv.x,6.);vec3 skin=vec3(.55,.37,.32)+(1.-length(uv-vec2(.38,.7)))*vec3(.3,.24,.18)+(grain-.5)*.05;vec3 col=mix(glass,skin,smoothstep(0.,1.,blend));col+=activity*vec3(.06,.02,.07)*ripple;gl_FragColor=vec4(col+(grain-.5)*.014,1.);}`,
    });
    scene.add(new THREE.Mesh(geometry, material));
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    el.appendChild(renderer.domElement);
    const resize = new ResizeObserver(() =>
      renderer.setSize(el.clientWidth, el.clientHeight),
    );
    resize.observe(el);
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
    const pointerArea = el.parentElement || el;
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
      uniforms.uTime.value += dt * values.current.speed;
      uniforms.uSurface.value =
        (materialValue?.get() ?? values.current.surface) / 100;
      uniforms.uGlow.value = values.current.glow;
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
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
