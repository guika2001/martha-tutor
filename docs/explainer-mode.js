(function (root) {
  const COPY = {
    de: {
      title: "Erklärmodus",
      subtitle: "Allgemeine Mathefragen ohne konkrete Aufgabe",
      prompt: "Allgemeiner Mathematik-Dialog ohne konkrete Prüfungsaufgabe. Erkläre klar, altersgerecht und schrittweise. Stelle bei Bedarf Rückfragen.",
      greeting: "Hallo! 👋 In diesem Modus kannst du mir allgemeine Mathefragen stellen, auch ohne konkrete Aufgabe. Frag mich nach Begriffen, Methoden oder Beispielen.",
    },
    hu: {
      title: "Magyarázó",
      subtitle: "Általános matekkérdések konkrét feladat nélkül",
      prompt: "Általános matematikai beszélgetés konkrét vizsgafeladat nélkül. Magyarázz világosan, életkorhoz illően, lépésről lépésre. Szükség esetén kérdezz vissza.",
      greeting: "Szia! 👋 Ebben a módban konkrét feladat nélkül is kérdezhetsz matekról. Kérdezhetsz fogalmakról, módszerekről vagy példákról.",
    },
    en: {
      title: "Explainer",
      subtitle: "General math questions without a specific task",
      prompt: "General mathematics dialog without a specific exam task. Explain clearly, age-appropriately, and step by step. Ask follow-up questions if needed.",
      greeting: "Hi! 👋 In this mode you can ask general math questions even without a specific task. Ask about concepts, methods, or examples.",
    },
    es: {
      title: "Explicador",
      subtitle: "Preguntas generales de matemáticas sin una tarea concreta",
      prompt: "Diálogo general de matemáticas sin una tarea concreta de examen. Explica con claridad, de forma adecuada para la edad y paso a paso. Haz preguntas de seguimiento si hace falta.",
      greeting: "¡Hola! 👋 En este modo puedes hacer preguntas generales de matemáticas incluso sin una tarea concreta. Pregunta sobre conceptos, métodos o ejemplos.",
    },
  };

  function getCopy(langCode = "de") {
    return COPY[langCode] || COPY.de;
  }

  function buildExplainerTask(langCode = "de") {
    const copy = getCopy(langCode);
    return {
      task_id: copy.title,
      topic: copy.title,
      subtopic: copy.subtitle,
      source: { level: "", year: "" },
      points: null,
      question: copy.prompt,
      expected_answer: "",
      examPart: "",
      taskType: "",
      toolType: "",
      toolMode: null,
      operators: [],
      primaryOperator: null,
      isExplainerMode: true,
      explainerGreeting: copy.greeting,
    };
  }

  const api = { buildExplainerTask, getExplainerCopy: getCopy };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.MarthaExplainerMode = api;
})(typeof window !== "undefined" ? window : globalThis);
