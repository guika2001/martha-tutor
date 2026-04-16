(function (root) {
  function normalizeToolMode(rawValue) {
    const value = String(rawValue || "").toLowerCase();
    if (value.includes("cas") || value.includes("mms")) return "cas";
    if (value.includes("wtr") || value.includes("gtr")) return "wtr";
    if (value.includes("mit hilfsmitteln")) return "supported";
    if (value.includes("hilfsmittel") || value.includes("ohne")) return "none";
    if (value.includes("bestand")) return "legacy";
    return null;
  }

  function buildToolModeHint(toolMode) {
    if (!toolMode) {
      return {
        status: "uncertain",
        message: "Werkzeugmodus unklar. Diese Aufgabe nicht als gesicherte CAS/WTR-Vorlage behandeln.",
      };
    }

    const messages = {
      none: "Hilfsmittelfrei: Rechenschritte und Argumentation vollständig ausformulieren.",
      cas: "CAS/MMS: Werkzeug darf entlasten, aber mathematische Deutung bleibt Pflicht.",
      wtr: "Einfacher WTR: numerische Unterstützung erlaubt, Modell- und Strukturargumente bleiben manuell.",
      legacy: "Bestandsformat: Werkzeuglogik stammt aus älterem Format und sollte separat behandelt werden.",
      supported: "Mit Hilfsmitteln: genaue Werkzeugart ist nicht gesichert, daher Lösungsschritte bewusst transparent halten.",
    };

    return {
      status: "known",
      message: messages[toolMode] || messages.supported,
    };
  }

  const api = { normalizeToolMode, buildToolModeHint };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaToolMode = api;
})(typeof window !== "undefined" ? window : globalThis);
