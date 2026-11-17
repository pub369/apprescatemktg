const visitCountElements = document.querySelectorAll("[data-visit-count]");

async function loadVisitCount() {
  try {
    const response = await fetch("/.netlify/functions/visit-counter", {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`El contador respondió con HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!Number.isSafeInteger(result.count) || result.count < 1) {
      throw new Error("El contador devolvió un valor inválido");
    }

    visitCountElements.forEach((element) => {
      element.textContent = result.count.toLocaleString("es");
    });
  } catch (error) {
    visitCountElements.forEach((element) => {
      element.textContent = "—";
      element.title = "Contador no disponible";
    });
    console.error("No se pudo cargar el contador de visitas.", error);
  }
}

if (visitCountElements.length > 0) {
  loadVisitCount();
}
