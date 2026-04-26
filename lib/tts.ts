"use client"

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window
}

export function speakText(text: string, lang: string) {
  if (!canSpeak() || !text.trim()) {
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

