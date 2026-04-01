import { useEffect, useState, useRef, useCallback } from "react";
import { useAccessibility } from "./AccessibilityContext";

const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TD", "TH", "LABEL", "DIV", "BLOCKQUOTE", "FIGCAPTION"]);
const IGNORE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]);

function getReadableText(el: HTMLElement): string {
  if (el.closest("[data-a11y-panel]")) return "";
  const selected = window.getSelection()?.toString().trim();
  if (selected) return selected;

  let node: HTMLElement | null = el;
  while (node && !BLOCK_TAGS.has(node.tagName)) {
    node = node.parentElement;
  }
  return (node || el).textContent?.trim() || "";
}

function speakLocal(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    const voices = speechSynthesis.getVoices().filter(v => v.localService);
    const gb = voices.find(v => v.lang.startsWith("en-GB"));
    const en = voices.find(v => v.lang.startsWith("en"));
    if (gb) utter.voice = gb;
    else if (en) utter.voice = en;
    utter.onend = () => resolve();
    utter.onerror = () => reject();
    speechSynthesis.speak(utter);
  });
}

export default function TTSHandler() {
  const { settings } = useAccessibility();
  const [speaking, setSpeaking] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const usingLocalRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (usingLocalRef.current) {
      speechSynthesis.cancel();
      usingLocalRef.current = false;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    setSpeaking("");
  }, []);

  const speak = useCallback(async (text: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;

    const trimmed = text.slice(0, 2000);
    setSpeaking(trimmed.slice(0, 80) + (trimmed.length > 80 ? "..." : ""));

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error("TTS API failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(""); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(""); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      try {
        usingLocalRef.current = true;
        await speakLocal(trimmed);
        usingLocalRef.current = false;
      } catch {
        usingLocalRef.current = false;
      }
      setSpeaking("");
    }
  }, []);

  useEffect(() => {
    if (!settings.ttsEnabled) {
      stopSpeaking();
      return;
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest("[data-a11y-panel]")) return;
      if (IGNORE_TAGS.has(target.tagName)) return;
      if (target.closest("button") || target.closest("a") || target.closest("input")) return;

      if (speaking) {
        stopSpeaking();
        return;
      }

      const text = getReadableText(target);
      if (text) speak(text);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [settings.ttsEnabled, speaking, speak, stopSpeaking]);

  if (!speaking) return null;

  return (
    <div
      data-testid="tts-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "8px 16px",
        fontSize: "14px",
        textAlign: "center",
      }}
    >
      🔊 Speaking: {speaking}
    </div>
  );
}
