const API_URL = "http://localhost:3001";

export async function getIngredientes() {
  const response = await fetch(`${API_URL}/ingredientes`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los ingredientes");
  }

  return response.json();
}

export async function getRecetas() {
  const response = await fetch(`${API_URL}/recetas`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar las recetas");
  }

  return response.json();
}

export async function getRecetaById(id) {
  const response = await fetch(`${API_URL}/recetas/${id}`);

  if (!response.ok) {
    throw new Error("No se pudo cargar la receta");
  }

  return response.json();
}

export async function getPuntajes() {
  const response = await fetch(`${API_URL}/puntajes`);

  if (!response.ok) {
    throw new Error("No se pudieron cargar los puntajes");
  }

  return response.json();
}

export async function guardarPuntaje(puntaje) {
  const response = await fetch(`${API_URL}/puntajes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(puntaje)
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar el puntaje");
  }

  return response.json();
}