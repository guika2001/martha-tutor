(function (root) {
  const PDF_JS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  let pdfJsPromise = null;
  const pdfCache = new Map();

  function normalizeToken(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9äöüß.\- ]/gi, "")
      .trim();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = Array.from((root.document || {}).scripts || []).find((script) => script.src === src);
      if (existing) {
        if (existing.dataset.ready === "true") return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = root.document.createElement("script");
      script.src = src;
      script.onload = () => {
        script.dataset.ready = "true";
        resolve();
      };
      script.onerror = reject;
      root.document.head.appendChild(script);
    });
  }

  async function ensurePdfJs() {
    if (root.pdfjsLib) return root.pdfjsLib;
    if (!pdfJsPromise) {
      pdfJsPromise = loadScript(PDF_JS_SRC).then(() => {
        const lib = root.pdfjsLib || root["pdfjs-dist/build/pdf"];
        if (!lib) throw new Error("pdf.js konnte nicht geladen werden.");
        lib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        return lib;
      });
    }
    return pdfJsPromise;
  }

  async function openPdf(href) {
    if (pdfCache.has(href)) return pdfCache.get(href);
    const lib = await ensurePdfJs();
    const pdf = await lib.getDocument(href).promise;
    pdfCache.set(href, pdf);
    return pdf;
  }

  async function findBestPage(task, source) {
    const pdf = await openPdf(source.href);
    const searchTokens = [
      task && task.figureLabel,
      task && task.task_id,
      task && task.topic,
      task && task.examPart,
    ].map(normalizeToken).filter(Boolean);
    let best = { score: 0, pageNumber: 1, matches: [] };
    const pagesToScan = Math.min(pdf.numPages, 8);
    for (let pageNumber = 1; pageNumber <= pagesToScan; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = normalizeToken(textContent.items.map((item) => item.str).join(" "));
      const matches = searchTokens.filter((token) => token && text.includes(token));
      if (matches.length > best.score) {
        best = { score: matches.length, pageNumber, matches };
      }
    }
    return {
      ok: best.score > 0,
      pageNumber: best.pageNumber,
      matches: best.matches,
      score: best.score,
      totalTokens: searchTokens.length,
    };
  }

  async function renderPageToCanvas(sourceHref, pageNumber, canvas) {
    const pdf = await openPdf(sourceHref);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.1 });
    const ratio = root.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;
  }

  async function renderFigurePreview(container, { task, sources }) {
    if (!container || !sources || !sources.length) return;
    container.innerHTML = "";
    const doc = container.ownerDocument;
    const primary = sources[0];

    const status = doc.createElement("div");
    status.className = "pdf-preview-status";
    status.textContent = "Prüfe PDF-Quelle …";
    container.appendChild(status);

    const canvas = doc.createElement("canvas");
    canvas.className = "pdf-preview-canvas";
    container.appendChild(canvas);

    try {
      const validation = await findBestPage(task, primary);
      const targetPage = validation.pageNumber || 1;
      await renderPageToCanvas(primary.href, targetPage, canvas);
      container.dataset.status = validation.ok
        ? `PDF-Quelle validiert · Seite ${targetPage}`
        : `PDF geladen · Seite ${targetPage} als Vorschau`;
      status.textContent = validation.ok
        ? `${primary.label} validiert auf Seite ${targetPage}.`
        : `${primary.label} geladen. Seitenvorschau ohne eindeutigen Abbildungs-Treffer.`;
      const footer = doc.createElement("a");
      footer.className = "pdf-open-link";
      footer.href = primary.href + "#page=" + targetPage;
      footer.target = "_blank";
      footer.rel = "noopener noreferrer";
      footer.textContent = "PDF auf passender Seite öffnen";
      container.appendChild(footer);
    } catch (error) {
      container.dataset.status = "PDF-Vorschau fehlgeschlagen";
      status.textContent = "PDF-Vorschau konnte nicht geladen werden.";
      const err = doc.createElement("div");
      err.className = "abw";
      err.textContent = error.message || "Unbekannter PDF-Fehler";
      container.appendChild(err);
    }
  }

  const api = {
    findBestPage,
    renderFigurePreview,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaPdfFigure = api;
})(typeof window !== "undefined" ? window : globalThis);
