(function (root) {
  function sanitizeExtractedTaskText(text = "") {
    let cleaned = String(text || "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\u2061/g, "")
      .replace(/\bkötözősaláta\b/gi, "cos")
      .replace(/\b(sin|cos|tan|log|ln|exp)\s*[\u2061\s]*\(\s*/gi, (_, fn) => `${fn}(`)
      .replace(/\bf\s*\(\s*x\s*\)/gi, "f(x)")
      .replace(/\bg\s*\(\s*x\s*\)/gi, "g(x)")
      .replace(/\s+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ");

    cleaned = cleaned.replace(/\b(f\(x\)\s*=\s*[^=\n]{1,120})\s+f\(x\)\s*=\s*/gi, "$1\n");
    cleaned = cleaned.replace(/([0-9=])([a-z]\))(?=\s*[A-ZÁÉÍÓÖŐÚÜŰ])/g, "$1\n\n$2");
    cleaned = cleaned.replace(/\b(cos|sin|tan|log|ln|exp)\(\s*([^)]+?)\s*\)\s*\+\s*([0-9])/gi, (_, fn, arg, rhs) => `${fn}(${arg.trim()}) + ${rhs}`);
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
    return cleaned;
  }

  const api = { sanitizeExtractedTaskText };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaUploadCleanup = api;
})(typeof window !== "undefined" ? window : globalThis);
