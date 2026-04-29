import { createRoot } from "react-dom/client";
import App from "./App";
import { AccessibilityProvider } from "./components/AccessibilityContext";
import AccessibilityPanel from "./components/AccessibilityPanel";
import TTSHandler from "./components/TTSHandler";
import ReadingGuide from "./components/ReadingGuide";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AccessibilityProvider>
    <App />
    <AccessibilityPanel />
    <TTSHandler />
    <ReadingGuide />
  </AccessibilityProvider>
);
