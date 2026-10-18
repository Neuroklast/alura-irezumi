"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
/** Native touch scrolling stays enabled. Modals and the admin retain native scrolling. */
export function SmoothScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | undefined;
    function setup() {
      instance?.destroy();
      instance = undefined;
      if (preference.matches) return;
      instance = new Lenis({
        autoRaf: true,
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -30 },
        prevent: (node) => node.closest("dialog") !== null,
      });
    }
    setup();
    preference.addEventListener("change", setup);
    const suspendForDialog = () => {
      if (document.querySelector("dialog[open]")) instance?.stop();
      else instance?.start();
    };
    const observer = new MutationObserver(suspendForDialog);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", setup);
      instance?.destroy();
    };
  }, [pathname]);
  return null;
}
