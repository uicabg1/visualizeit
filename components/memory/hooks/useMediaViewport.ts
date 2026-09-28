import { useEffect, useRef, useState } from "react";

export function useMediaViewport() {
  const [isPhone, setIsPhone] = useState(false);
  const [containerWidth, setContainerWidth] = useState(960);
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsPhone(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsPhone(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setContainerWidth(Math.round(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { canvasAreaRef, containerWidth, isPhone };
}
