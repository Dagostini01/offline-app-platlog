export const API_BASE =
  "https://apidocker-bhc9f4hxb3hggrfz.brazilsouth-01.azurewebsites.net";

/* --------------------------------- util ---------------------------------- */

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 10000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function read(res: Response) {
  const text = await safeText(res);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assertOk(res: Response) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
}

function withJson(init: RequestInit = {}) {
  return {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  };
}

function qs(params: Record<string, any>) {
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return p ? `?${p}` : "";
}

/* ---------- Tipos ---------- */
export type CreateNotaPayload = {
  numeroRota: number;
  numeroNota: number;
  avaria?: "sim" | "nao";
  tipologia?: string;
  conferidoPor?: string;
  avarias?: Array<{
    tipoErro: string;
    codProduto?: string;
    descProduto?: string;
    quantidade?: string;
    unidadeMedida?: string;
  }>;
};

export type CreatePaletePayload = {
  numeroRota: number;
  numeroPallet: string;
  tipologia: string;
  remontado: "sim" | "nao";
  conferido: "sim" | "nao";
};

/* ---------- Notas ---------- */
export async function createNota(payload: CreateNotaPayload) {
  const res = await fetchWithTimeout(
    `${API_BASE}/notas`,
    withJson({ method: "POST", body: JSON.stringify(payload) }),
    12000
  );

  const responseText = await safeText(res);
  if (!res.ok)
    throw new Error(responseText || `Erro ${res.status}: ${res.statusText}`);

  try {
    return JSON.parse(responseText);
  } catch {
    return { success: true };
  }
}

export async function listNotas(diaISO: string, rota?: number) {
  const res = await fetchWithTimeout(
    `${API_BASE}/notas${qs({ dia: diaISO, rota })}`,
    {},
    12000
  );
  assertOk(res);
  return read(res);
}

/* ---------- Paletes ---------- */
export async function createPalete(payload: CreatePaletePayload) {
  const res = await fetchWithTimeout(
    `${API_BASE}/paletes`,
    withJson({ method: "POST", body: JSON.stringify(payload) }),
    12000
  );

  const responseText = await safeText(res);
  if (!res.ok)
    throw new Error(responseText || `Erro ${res.status}: ${res.statusText}`);

  return read(res);
}

export async function listPaletes(diaISO: string, rota?: number) {
  const res = await fetchWithTimeout(
    `${API_BASE}/paletes${qs({ dia: diaISO, rota })}`,
    {},
    12000
  );
  assertOk(res);
  return read(res);
}

/* ---------------------------- helpers de data ----------------------------- */
export function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function toBR(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

/* ---------------------------- autenticação ----------------------------- */
export type User = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: "admin" | "comum";
};

export async function listUsers(): Promise<User[]> {
  const r = await fetch(`${API_BASE}/users`);
  if (!r.ok) throw new Error("Falha ao carregar usuários");
  return r.json();
}

export async function getUserByEmail(email: string) {
  const url = `${API_BASE}/users/by-email/${encodeURIComponent(email)}`;
  const res = await fetchWithTimeout(url, {}, 8000); // timeout de 8s

  const text = await safeText(res);

  if (res.status === 404) return null;
  if (!res.ok) {
    // repassa o motivo real, se houver
    throw new Error(text || `Erro ao buscar usuário (HTTP ${res.status})`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida do servidor");
  }
}
