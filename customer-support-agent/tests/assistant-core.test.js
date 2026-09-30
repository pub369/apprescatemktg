import test from 'node:test';
import assert from 'node:assert/strict';
import { createReply, getRelevantMemory, normalizeProfile } from '../public/assistant-core.js';

test('normaliza un perfil con valores seguros', () => {
  const profile = normalizeProfile({ businessName: 'Café Norte', tone: 'amable', escalationEmail: 'hola@cafenorte.com' });
  assert.equal(profile.businessName, 'Café Norte');
  assert.equal(profile.tone, 'amable');
  assert.equal(profile.escalationEmail, 'hola@cafenorte.com');
});

test('recupera memoria relevante por términos compartidos', () => {
  const memories = [
    { text: 'Lucía prefiere recibir actualizaciones por WhatsApp.' },
    { text: 'La garantía del pedido 502 vence en diciembre.' }
  ];
  assert.deepEqual(getRelevantMemory('¿Puedes mandarme actualizaciones por WhatsApp?', memories), [memories[0]]);
});

test('genera una respuesta con personalidad, contexto y escalamiento', () => {
  const profile = normalizeProfile({
    businessName: 'Taller Rivera',
    tone: 'cercano',
    escalationEmail: 'equipo@tallerrivera.com',
    faq: [{ question: 'horario', answer: 'Abrimos de lunes a viernes, de 9:00 a 18:00.' }]
  });
  const reply = createReply('¿Cuál es su horario?', profile, []);
  assert.match(reply.text, /Taller Rivera/);
  assert.match(reply.text, /9:00 a 18:00/);
  assert.match(reply.text, /equipo@tallerrivera.com/);
});

test('señala cuando conviene buscar información externa', () => {
  const profile = normalizeProfile({ businessName: 'Prueba' });
  const reply = createReply('Busca tendencias de cafeterías sostenibles', profile, []);
  assert.equal(reply.shouldSearch, true);
});
