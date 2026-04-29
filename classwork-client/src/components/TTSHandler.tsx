import { useEffect, useRef, useState } from "react";
import { useAccessibility } from "./AccessibilityContext";

export default function TTSHandler() {
  const { settings } = useAccessibility();
  const [statusText, setStatusText] = useState("");
  const speakingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    if (!settings.ttsEnabled) {
      stopAll();
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        target.closest("[data-testid='button-accessibility-toggle']") ||
        target.closest("[role='dialog']") ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.closest("button[role='switch']") ||
        target.closest("input[type='range']")
      ) {
        return;
      }

      if (speakingRef.current) {
        stopAll();
        return;
      }

      let text = "";
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        text = selection.toString().trim();
      } else {
        text = extractReadableText(target);
      }

      if (!text.trim()) return;

      speakText(text.trim());
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [settings.ttsEnabled]);

  function stopAll() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    setStatusText("");
  }

  function speakText(text: string) {
    const preview = text.substring(0, 80) + (text.length > 80 ? "..." : "");
    setStatusText("Speaking: " + preview);
    speakingRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.substring(0, 2000) }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("TTS request failed");
        return res.blob();
      })
      .then((blob) => {
        if (!speakingRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          speakingRef.current = false;
          setStatusText("");
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          fallbackToLocal(text, preview);
        };

        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          fallbackToLocal(text, preview);
        });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        fallbackToLocal(text, preview);
      });
  }

  function fallbackToLocal(text: string, preview: string) {
    const synth = window.speechSynthesis;
    if (!synth) {
      speakingRef.current = false;
      setStatusText("");
      return;
    }

    setStatusText("Speaking: " + preview);
    speakingRef.current = true;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    u.rate = 0.85;
    u.pitch = 1.05;

    const voices = synth.getVoices();
    const gbLocal = voices.filter(v => v.lang === "en-GB" && v.localService);
    const enLocal = voices.filter(v => v.lang.startsWith("en") && v.localService);
    const pool = gbLocal.length ? gbLocal : enLocal;
    const voice = pool[0] || voices.find(v => v.lang.startsWith("en")) || null;
    if (voice) u.voice = voice;

    u.onend = () => {
      speakingRef.current = false;
      setStatusText("");
    };
    u.onerror = (ev) => {
      speakingRef.current = false;
      setStatusText("");
    };

    synth.speak(u);
  }

  if (!settings.ttsEnabled || !statusText) return null;

  return (
    <div
      data-testid="tts-status"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "#1a1a2e",
        color: "#e0e0e0",
        padding: "8px 16px",
        fontSize: "14px",
        textAlign: "center",
        borderBottom: "2px solid #e94560",
      }}
    >
      {statusText}
    </div>
  );
}

function extractReadableText(el: HTMLElement): string {
  const blockTags = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TD", "TH", "SPAN", "LABEL", "A"];

  if (blockTags.includes(el.tagName)) {
    return el.textContent || "";
  }

  const parent = el.closest(
    "p, h1, h2, h3, h4, h5, h6, li, td, th, label, [class*='card'], [class*='question']"
  );
  if (parent) {
    return parent.textContent || "";
  }

  return el.textContent?.substring(0, 500) || "";
}
