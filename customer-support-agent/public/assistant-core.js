const STOP_WORDS = new Set(['a', 'al', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'los', 'me', 'mi', 'para', 'por', 'que', 'su', 'un', 'una', 'y', 'ya', 'con', 'como', 'cuál', 'cual', 'puedes', 'puede', 'puedo', 'hola']);

const cleanText = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñáéíóúü\s]/gi, ' ');
const tokens = (value) => [...new Set(cleanText(value).split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word)))];

export function normalizeProfile(input = {}) {
  return {
    businessName: String(input.businessName || 'Tu negocio').trim().slice(0, 80),
    agentName: String(input.agentName || 'Sofía').trim().slice(0, 40),
    tone: ['amable', 'cercano', 'formal', 'directo'].includes(input.tone) ? input.tone : 'amable',
    escalationEmail: String(input.escalationEmail || '').trim().slice(0, 120),
    welcome: String(input.welcome || '').trim().slice(0, 280),
    faq: Array.isArray(input.faq) ? input.faq.filter((item) => item?.question && item?.answer).slice(0, 50) : []
  };
}

export function getRelevantMemory(message, memories = []) {
  const queryTerms = tokens(message);
  if (!queryTerms.length) return [];
  return memories
    .map((memory) => ({ memory, score: tokens(memory.text).filter((term) => queryTerms.includes(term)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ memory }) => memory);
}

function findFaq(message, faq) {
  const messageTerms = tokens(message);
  return faq
    .map((item) => ({ item, score: tokens(item.question).filter((term) => messageTerms.includes(term)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function toneLead(profile) {
  return {
    amable: `Gracias por escribir a ${profile.businessName}.`,
    cercano: `¡Hola! Soy ${profile.agentName} de ${profile.businessName}; con gusto te apoyo.`,
    formal: `Gracias por contactar a ${profile.businessName}.`,
    directo: `${profile.businessName}:`
  }[profile.tone];
}

export function createReply(message, rawProfile, memories = []) {
  const profile = normalizeProfile(rawProfile);
  const relevant = getRelevantMemory(message, memories);
  const faq = findFaq(message, profile.faq);
  const asksForSearch = /\b(busca|buscar|investiga|tendencia|actualidad|noticias|informacion externa)\b/i.test(message);
  const context = relevant.length ? ` Tengo presente: ${relevant.map((item) => item.text).join(' · ')}.` : '';
  const handoff = profile.escalationEmail ? ` Si necesitas que una persona lo revise, escríbenos a ${profile.escalationEmail}.` : '';

  if (faq) return { text: `${toneLead(profile)} ${faq.answer}${context}${handoff}`, shouldSearch: asksForSearch, relevant };
  return {
    text: `${toneLead(profile)} ${profile.welcome || 'Cuéntame qué necesitas y revisaré la mejor forma de ayudarte.'}${context}${handoff}`,
    shouldSearch: asksForSearch,
    relevant
  };
}
