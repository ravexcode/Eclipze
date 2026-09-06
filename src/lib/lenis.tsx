"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, type LenisRef } from "lenis/react";

export default function Lenis({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<LenisRef>(null);

  const options = useMemo(() => ({
    lerp: 0.1,
    duration: 1.2,
    smoothWheel: true,
    smoothTouch: false,
    stopInertiaOnNavigate: true,
  }), []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        lenisRef.current?.lenis?.resize();
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={options}
    >
      {children}
    </ReactLenis>
  );
}
