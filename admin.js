// Tela do administrador: só acesso e cobrança. Nada aqui mostra clientes, atendimentos ou gastos das barbearias.
const TOLERANCIA = 7; // precisa ser igual a app.cobranca.dias-tolerancia no servidor
let LISTA = [], MENSAGEM_ACESSO = '';

function toast(msg, erro) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (erro ? ' erro' : ''); t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 4000);
}
const seguro = fn => fn().catch(e => toast(e.message, true));
const dataBR = iso => { const [a, m, d] = iso.split('-'); return d + '/' + m; };
const whats = tel => { const d = String(tel).replace(/\D/g, ''); return d.length <= 11 ? '55' + d : d; };
const dinheiro = () => Number($('#val').value) || 0;

// Guarda a chave Pix e o valor só neste navegador.
try { $('#pix').value = localStorage.getItem('pix') || ''; $('#val').value = localStorage.getItem('mensalidade') || '24.90'; } catch (e) { /* sem armazenamento */ }
function guardar() {
  try { localStorage.setItem('pix', $('#pix').value.trim()); localStorage.setItem('mensalidade', $('#val').value); } catch (e) { /* ignora */ }
}

function rotulo(b) {
  switch (b.situacao) {
    case 'TESTE': return ['blue', 'Em teste: ' + Math.max(0, -b.diasAtraso) + ' dias restantes'];
    case 'EM_DIA': return ['ok', 'Em dia'];
    case 'VENCE_EM_BREVE': return ['warn', b.diasAtraso === 0 ? 'Vence hoje' : 'Vence em breve'];
    case 'ATRASADA': return ['red', 'Atrasada ' + b.diasAtraso + (b.diasAtraso === 1 ? ' dia' : ' dias')];
    default: return ['red', b.restricaoManual ? 'Modo restrito (manual)' : 'Modo restrito'];
  }
}
function mensagemCobranca(b) {
  const atraso = b.diasAtraso > 0;
  return `Olá, ${b.nome}! Sua mensalidade do sistema (${brl(dinheiro())}) ${atraso ? 'venceu' : 'vence'} em ${dataBR(b.vencimento)}. Para pagar via Pix, use a chave: ${$('#pix').value.trim()}. Depois de pagar, responda aqui com o comprovante.${atraso ? ' Lembrete: após ' + TOLERANCIA + ' dias de atraso, os painéis de ganhos e gastos ficam bloqueados. Os lançamentos continuam normais.' : ''} Obrigado!`;
}

function desenhar() {
  const c = {EM_DIA: 0, TESTE: 0, VENCE_EM_BREVE: 0, ATRASADA: 0, RESTRITO: 0};
  let pendentes = 0;
  $('#lista').innerHTML = LISTA.length ? LISTA.map(b => {
    c[b.situacao]++;
    const [cor, texto] = rotulo(b);
    const emTeste = b.situacao === 'TESTE';
    if (!emTeste && b.diasAtraso >= 0 && !b.marcadoNaoPago && !b.restricaoManual) pendentes++;
    const cobrar = ['VENCE_EM_BREVE', 'ATRASADA', 'RESTRITO'].includes(b.situacao);
    const msg = cobrar ? encodeURIComponent(mensagemCobranca(b)) : '';
    return `<div class="row2" data-id="${b.id}">
      <span class="av">${esc(b.nome.trim()[0] || '?')}</span>
      <div class="who"><b>${esc(b.nome)}</b><small>${emTeste ? 'teste até ' : 'vencimento '}${dataBR(b.vencimento)}${b.marcadoNaoPago ? '. Marcado como não pago.' : ''}</small></div>
      <span class="chip ${cor}">${esc(texto)}</span>
      <div class="acts">
        ${emTeste ? '' : `<span class="lab">Pagou?</span><button class="btn sec sm" data-a="sim">Sim</button><button class="btn sec sm${b.marcadoNaoPago ? ' sel' : ''}" data-a="nao">Não</button>`}
        ${cobrar ? `<a class="wa" data-w="1" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(b.telefone))}?text=${msg}">Cobrar no WhatsApp</a>` : ''}
        <button class="btn sec sm" data-a="${b.restricaoManual ? 'liberar' : 'restringir'}">${b.restricaoManual ? 'Liberar visualização' : 'Restringir visualização'}</button>
        <button class="btn sec sm" data-a="senha">Nova senha</button>
      </div></div>`;
  }).join('') : '<p class="lab">Nenhuma barbearia cadastrada. Use "Nova barbearia".</p>';
  $('#m-o').textContent = c.EM_DIA + c.TESTE; $('#m-p').textContent = c.VENCE_EM_BREVE;
  $('#m-a').textContent = c.ATRASADA; $('#m-s').textContent = c.RESTRITO;
  $('#pend').innerHTML = pendentes ? `<div class="pend">${pendentes} ${pendentes === 1 ? 'barbearia aguarda' : 'barbearias aguardam'} a sua confirmação de pagamento. Sem resposta em ${TOLERANCIA} dias após o vencimento, entram em modo restrito.</div>` : '';
}
async function carregar() { LISTA = await api('GET', '/api/admin/barbearias'); desenhar(); }

$('#pix').addEventListener('input', () => { guardar(); $('#err').textContent = ''; desenhar(); });
$('#val').addEventListener('input', () => { guardar(); desenhar(); });

$('#lista').addEventListener('click', e => {
  const w = e.target.closest('a[data-w]');
  if (w) { if (!$('#pix').value.trim()) { e.preventDefault(); $('#err').textContent = 'Digite sua chave Pix acima antes de cobrar.'; $('#pix').focus(); } return; }
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const id = b.closest('[data-id]').dataset.id, a = b.dataset.a, base = '/api/admin/barbearias/' + id;
  seguro(async () => {
    if (a === 'sim') await api('POST', base + '/pagamento', {pago: true});
    else if (a === 'nao') await api('POST', base + '/pagamento', {pago: false});
    else if (a === 'restringir' || a === 'liberar') await api('POST', base + '/restricao', {restrito: a === 'restringir'});
    else if (a === 'senha') {
      if (!confirm('Gerar uma nova senha para este dono? A senha atual deixa de funcionar.')) return;
      mostrarAcesso(await api('POST', base + '/nova-senha'), false); return;
    }
    await carregar();
  });
});

function mostrarAcesso(r, novo) {
  const b = r.barbearia;
  const link = location.origin + '/login.html';
  MENSAGEM_ACESSO = `Olá! Seu acesso ao sistema da ${b.nome} está liberado. Entre em ${link} com o e-mail ${r.emailAcesso} e a senha temporária ${r.senhaTemporaria}.${novo ? ' Você tem ' + Math.max(0, -b.diasAtraso) + ' dias de teste grátis.' : ''}`;
  $('#cred').innerHTML = `<b>${esc(b.nome)}</b><br>Link: ${esc(link)}<br>E-mail: ${esc(r.emailAcesso)}<br>Senha temporária: <b>${esc(r.senhaTemporaria)}</b>`;
  $('#cred-wa').href = `https://wa.me/${whats(b.telefone)}?text=${encodeURIComponent(MENSAGEM_ACESSO)}`;
  $('#dCred').showModal();
}
$('#cred-copiar').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(MENSAGEM_ACESSO); toast('Mensagem copiada.'); } catch (e) { toast('Não foi possível copiar. Selecione o texto e copie.', true); }
});

document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close(); });
$('#nova').addEventListener('click', () => { $('#n-err').textContent = ''; $('#dNova').showModal(); });
$('#fNova').addEventListener('submit', async e => {
  e.preventDefault(); $('#n-err').textContent = '';
  try {
    const r = await api('POST', '/api/admin/barbearias', {nome: $('#n-n').value, telefone: $('#n-t').value, email: $('#n-e').value});
    $('#dNova').close(); $('#fNova').reset(); await carregar(); mostrarAcesso(r, true);
  } catch (x) { $('#n-err').textContent = x.message; }
});
$('#sair').addEventListener('click', async () => { try { await api('POST', '/api/logout'); } finally { location.href = '/login.html'; } });

seguro(carregar);
