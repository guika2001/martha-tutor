(function (root) {
  function buildQuickActionPrompt(action, langCode = "de") {
    const code = langCode || "de";
    const packs = {
      hu: {
        tip: "Adj csak egy kis tippet a következő lépéshez, a teljes megoldást még ne mondd el.",
        step: "Mutasd meg csak az első lépést, és állj meg utána.",
        solpath: "Mutasd meg röviden a megoldás menetét, de még ne vezesd le teljesen.",
        solution: "Adj teljes megoldást, ellenőrzötten, lépésről lépésre.",
      },
      en: {
        tip: "Give only a small hint for the next step, not the full solution yet.",
        step: "Show only the first step and stop after that.",
        solpath: "Show the solution path briefly, but do not fully solve it yet.",
        solution: "Give the full validated solution step by step.",
      },
      es: {
        tip: "Da solo una pequeña pista para el siguiente paso, todavía no la solución completa.",
        step: "Muestra solo el primer paso y detente después.",
        solpath: "Muestra brevemente el camino de solución, pero aún no lo resuelvas por completo.",
        solution: "Da la solución completa validada paso a paso.",
      },
      de: {
        tip: "Gib nur einen kleinen Tipp für den nächsten Schritt, aber noch nicht die ganze Lösung.",
        step: "Zeige nur den ersten Schritt und stoppe danach.",
        solpath: "Zeige kurz den Lösungsweg, aber rechne noch nicht vollständig vor.",
        solution: "Gib die vollständige, validierte Lösung Schritt für Schritt.",
      },
    };
    const pack = packs[code] || packs.de;
    return pack[action] || pack.tip;
  }

  const api = { buildQuickActionPrompt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaQuickActions = api;
})(typeof window !== "undefined" ? window : globalThis);
