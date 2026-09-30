import { createReply, normalizeProfile } from './assistant-core.js';

const STORAGE = { profile: 'soporte-amigo-profile', memories: 'soporte-amigo-memories', messages: 'soporte-amigo-messages' };
const defaults = {
  businessName: 'Tu negocio', agentName: 'Sofía', tone: 'amable', escalationEmail: '',
  welcome: 'Cuéntame qué necesitas y revisaré la mejor forma de ayudarte.',
  faq: [{ question: '¿Cuál es su horario?', answer: 'Aún no configuraste esta respuesta. Ve a Personalidad para añadirla.' }]
};
let profile = normalizeProfile(read(STORAGE.profile, defaults));
let memories = read(STORAGE.memories, []);
let messages = read(STORAGE.messages, []);
let deferredPrompt;

const $ = (selector) => document.querySelector(selector);
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function persist() { localStorage.setItem(STORAGE.profile, JSON.stringify(profile)); localStorage.setItem(STORAGE.memories, JSON.stringify(memories)); localStorage.setItem(STORAGE.messages, JSON.stringify(messages)); }
function escapeHtml(value = '') { const box = document.createElement('div'); box.textContent = value; return box.innerHTML; }
function toast(text) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = text; document.body.append(node); setTimeout(() => node.remove(), 2800); }

function renderMessages() {
  const container = $('#messages');
  if (!messages.length) messages = [{ role: 'agent', text: `${profile.agentName}: ${profile.welcome}` }];
  container.innerHTML = messages.map((item) => `<article class="message ${item.role}"><div class="avatar">${item.role === 'agent' ? '✦' : 'Tú'}</div><div class="bubble">${escapeHtml(item.text).replace(/\n/g, '<br>')}</div></article>`).join('');
  container.scrollTop = container.scrollHeight;
}
function renderFaqs() {
  const list = $('#faqList'); list.innerHTML = '';
  profile.faq.forEach((faq) => addFaqRow(faq));
}
function addFaqRow(faq = {}) {
  const row = $('#faqTemplate').content.firstElementChild.cloneNode(true);
  row.querySelector('[data-faq="question"]').value = faq.question || '';
  row.querySelector('[data-faq="answer"]').value = faq.answer || '';
  row.querySelector('.remove-faq').addEventListener('click', () => row.remove());
  $('#faqList').append(row);
}
function renderProfile() {
  const form = $('#profileForm');
  for (const [key, value] of Object.entries(profile)) if (form.elements[key] && key !== 'faq') form.elements[key].value = value;
  $('#businessTitle').textContent = profile.businessName;
  renderFaqs();
}
function renderMemory() {
  $('#memoryCount').textContent = memories.length;
  const list = $('#memoryList');
  if (!memories.length) { list.innerHTML = '<div class="empty-state">Aún no hay recuerdos. Selecciona <b>Guardar como memoria</b> después de escribir un dato importante del cliente.</div>'; return; }
  list.innerHTML = memories.slice().reverse().map((memory, index) => `<article class="memory-item"><div><span class="memory-date">${new Date(memory.createdAt).toLocaleDateString('es-MX')}</span><p>${escapeHtml(memory.text)}</p></div><button class="icon-button delete-memory" data-index="${memories.length - 1 - index}" aria-label="Borrar memoria">×</button></article>`).join('');
  list.querySelectorAll('.delete-memory').forEach((button) => button.addEventListener('click', () => { memories.splice(Number(button.dataset.index), 1); persist(); renderMemory(); }));
}
function showPanel(name) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.panel === name));
  document.querySelectorAll('.panel').forEach((panel) => panel.classList.remove('active'));
  $(`#${name}Panel`).classList.add('active');
}
function searchOnline(query) {
  const card = $('#searchCard'); card.hidden = false; $('#searchTitle').textContent = 'Consultando fuentes públicas…'; $('#searchResults').innerHTML = '';
  fetch(`https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`)
    .then((response) => { if (!response.ok) throw new Error('No disponible'); return response.json(); })
    .then((data) => {
      const results = data?.query?.search?.slice(0, 3) ?? [];
      $('#searchTitle').textContent = results.length ? 'Resultados de Wikipedia' : 'No encontré resultados externos';
      $('#searchResults').innerHTML = results.map((result) => `<a target="_blank" rel="noreferrer" href="https://es.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}"><strong>${escapeHtml(result.title)}</strong><span>${result.snippet.replace(/<[^>]+>/g, '')}</span></a>`).join('');
    }).catch(() => { $('#searchTitle').textContent = 'La búsqueda no está disponible ahora'; $('#searchResults').innerHTML = '<span>Comprueba tu conexión y vuelve a intentarlo.</span>'; });
}
function submitMessage(event) {
  event.preventDefault(); const input = $('#messageInput'); const text = input.value.trim(); if (!text) return;
  messages.push({ role: 'user', text }); const reply = createReply(text, profile, memories); messages.push({ role: 'agent', text: reply.text }); persist(); renderMessages(); input.value = '';
  if (reply.shouldSearch) searchOnline(text);
}
function saveProfile(event) {
  event?.preventDefault(); const form = $('#profileForm');
  profile = normalizeProfile({ ...Object.fromEntries(new FormData(form)), faq: [...$('#faqList').querySelectorAll('.faq-row')].map((row) => ({ question: row.querySelector('[data-faq="question"]').value.trim(), answer: row.querySelector('[data-faq="answer"]').value.trim() })).filter((item) => item.question && item.answer) });
  persist(); renderProfile(); renderMessages(); toast('Personalidad guardada.');
}
function exportBackup() {
  const blob = new Blob([JSON.stringify({ profile, memories, messages, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'respaldo-soporte-amigo.json' }); link.click(); URL.revokeObjectURL(link.href);
}

$('#composer').addEventListener('submit', submitMessage);
$('#rememberBtn').addEventListener('click', () => { const text = $('#messageInput').value.trim(); if (!text) return toast('Escribe primero el dato que quieres recordar.'); memories.push({ text, createdAt: new Date().toISOString() }); persist(); renderMemory(); toast('Dato guardado en la memoria local.'); });
$('#profileForm').addEventListener('submit', saveProfile); $('#saveProfileBtn').addEventListener('click', saveProfile); $('#addFaqBtn').addEventListener('click', () => addFaqRow());
$('#clearMemoryBtn').addEventListener('click', () => { if (confirm('¿Borrar todos los recuerdos guardados en este dispositivo?')) { memories = []; persist(); renderMemory(); } });
$('#exportBtn').addEventListener('click', exportBackup); $('#closeSearch').addEventListener('click', () => { $('#searchCard').hidden = true; });
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => showPanel(tab.dataset.panel)));
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferredPrompt = event; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = undefined; $('#installBtn').hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
renderProfile(); renderMemory(); renderMessages();
