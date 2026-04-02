import { useEffect, useState } from "react";
import { useAccessibility } from "./AccessibilityContext";

export default function ReadingGuide() {
  const { settings } = useAccessibility();
  const [mouseY, setMouseY] = useState(-100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings.readingGuide) {
      setVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
      setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [settings.readingGuide]);

  if (!settings.readingGuide || !visible) return null;

  const guideHeight = 40;

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none z-[9990]"
      style={{
        top: mouseY - guideHeight / 2,
        height: guideHeight,
        background: "linear-gradient(to bottom, transparent 0%, rgba(255, 220, 50, 0.15) 20%, rgba(255, 220, 50, 0.2) 50%, rgba(255, 220, 50, 0.15) 80%, transparent 100%)",
        borderTop: "1px solid rgba(255, 200, 0, 0.3)",
        borderBottom: "1px solid rgba(255, 200, 0, 0.3)",
        transition: "top 0.05s linear",
      }}
      aria-hidden="true"
    />
  );
}
