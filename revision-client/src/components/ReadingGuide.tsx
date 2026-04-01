import { useEffect, useState } from "react";
import { useAccessibility } from "./AccessibilityContext";

export default function ReadingGuide() {
  const { settings } = useAccessibility();
  const [y, setY] = useState(-100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings.readingGuide) return;

    const onMove = (e: MouseEvent) => {
      setY(e.clientY - 20);
      setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [settings.readingGuide]);

  if (!settings.readingGuide || !visible) return null;

  return (
    <div
      data-testid="reading-guide-bar"
      style={{
        position: "fixed",
        top: y,
        left: 0,
        width: "100%",
        height: 40,
        background: "linear-gradient(to bottom, rgba(255,220,50,0.15), rgba(255,220,50,0.2))",
        borderTop: "1px solid rgba(255,220,50,0.3)",
        borderBottom: "1px solid rgba(255,220,50,0.3)",
        pointerEvents: "none",
        zIndex: 9990,
        transition: "top 0.05s linear",
      }}
    />
  );
}
