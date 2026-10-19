// Tela da barbearia: painel, agenda, serviços e gastos. Todos os dados vêm do servidor (/api/...).
let INFO, PER = 'semana', SERV = [], ATR = [], DIA = hojeISO(), CONCLUIR = null, NOVALOGO = null;
const FORMAS = {PIX: 'Pix', DINHEIRO: 'Dinheiro', DEBITO: 'Débito', CREDITO: 'Crédito'};
const CATS = {ALUGUEL: 'Aluguel', PRODUTOS: 'Produtos', ENERGIA: 'Energia', AGUA: 'Água', OUTROS: 'Outros'};
const STATUS = {AGENDADO: 'Agendado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', FALTOU: 'Faltou'};

function hojeISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const hora = s => new Date(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
const dataBR = s => new Date(s).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
const opcoes = obj => Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');
const linha = (nome, valor, pct, cor = '') =>
  `<div class="row"><span class="nm">${esc(nome)}</span><div class="tr"><i class="${cor}" style="width:${Math.min(100, Math.max(0, pct))}%"></i></div><span class="v">${esc(valor)}</span></div>`;
const kp = (a, b) => `<div class="kp"><span class="lab">${esc(a)}</span><span class="num">${esc(b)}</span></div>`;
const vazio = t => `<p class="lab">${esc(t)}</p>`;

function toast(msg, erro) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (erro ? ' erro' : ''); t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 4000);
}
// Executa uma tarefa e mostra o erro na tela; o modo restrito é esperado e não vira alerta.
const seguro = fn => fn().catch(e => { if (!e.restrito) toast(e.message, true); });

// ---------- Marca e situação da mensalidade ----------
function marca() {
  $('#bn').textContent = INFO.nome;
  document.title = 'Painel da ' + INFO.nome;
  $('#logo').hidden = !INFO.logo;
  if (INFO.logo) $('#logo').src = INFO.logo;
  $('#ini').hidden = !!INFO.logo;
  $('#ini').textContent = INFO.nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  $('#sub').textContent = 'Resumo ' + {hoje: 'de hoje', semana: 'da semana', mes: 'do mês'}[PER];
  $('#tab-ag').hidden = !INFO.usaAgendamento;
  document.body.classList.toggle('restr', INFO.restrito);
  const ban = $('#ban');
  ban.hidden = !(INFO.restrito || INFO.situacao === 'ATRASADA');
  ban.className = 'ban' + (INFO.restrito ? '' : ' warn');
  ban.innerHTML = INFO.restrito
    ? '<b>Mensalidade em atraso.</b> Você continua lançando atendimentos e gastos normalmente, mas os painéis de ganhos, gastos e lucro ficam bloqueados até o pagamento. Fale com o administrador para regularizar.'
    : '<b>Sua mensalidade está atrasada.</b> Regularize para não perder a visualização dos painéis.';
}

// ---------- Painel ----------
async function painel() {
  if (INFO.restrito) return;
  const p = await api('GET', '/api/painel?periodo=' + PER);
  $('#luc').textContent = brl(p.lucro); $('#in').textContent = brl(p.entrou);
  $('#out').textContent = brl(p.gastos); $('#qt').textContent = p.atendimentos;
  const mx = Math.max(1, ...p.serie.map(x => Number(x.valor)));
  $('#bars').innerHTML = p.serie.map(x => `<div class="col" title="${esc(x.rotulo)}: ${brl(x.valor)}"><div class="b${Number(x.valor) === mx ? ' top' : ''}" style="height:${Math.round(Number(x.valor) / mx * 100)}%"></div></div>`).join('');
  $('#ticks').innerHTML = p.serie.map(x => `<span>${esc(x.rotulo)}</span>`).join('');
  const tot = Number(p.entrou) || 1;
  $('#pag').innerHTML = Object.entries(p.porPagamento).map(([k, v]) => {
    const pc = Math.round(Number(v) / tot * 100); return linha(FORMAS[k] || k, pc + '%', pc);
  }).join('');
  $('#gst').innerHTML = p.gastosPorCategoria.length
    ? p.gastosPorCategoria.map(c => linha(CATS[c.categoria] || c.categoria, brl(c.valor) + ' (' + c.percentual + '%)', c.percentual, 'red')).join('')
    : vazio('Nenhum gasto neste período.');
  const i = p.indicadores;
  $('#kpi').innerHTML = kp('Gastos sobre o que entrou', i.gastosSobreEntradaPct + '%') + kp('Margem de lucro', i.margemPct + '%')
    + kp('Maior gasto', CATS[i.maiorGasto] || '-') + kp('Gasto por atendimento', brl(i.gastoPorAtendimento));
}

async function recentes() {
  if (INFO.restrito) return;
  const l = await api('GET', '/api/atendimentos/recentes');
  $('#ult').innerHTML = l.length ? l.map(a => `<div class="row2"><span class="av">${esc((a.cliente || '?')[0])}</span><div class="who"><b>${esc(a.cliente)}</b><small>${esc(a.servico)}${Number(a.desconto) > 0 ? ' (desconto de ' + brl(a.desconto) + ')' : ''}</small></div><span class="chip">${esc(FORMAS[a.formaPagamento] || '')}</span><b>${brl(a.valorFinal)}</b></div>`).join('') : vazio('Nenhum atendimento ainda.');
}

async function ranking() {
  const l = await api('GET', '/api/clientes/ranking?periodo=' + PER);
  const mx = Math.max(1, ...l.map(x => x.visitas));
  $('#rank').innerHTML = l.length ? l.map(c => `<div class="row"><span class="av">${esc(c.nome[0] || '?')}</span><span class="nm" style="flex:1">${esc(c.nome)}</span><div class="tr" style="max-width:120px"><i style="width:${Math.round(c.visitas / mx * 100)}%"></i></div><span class="v" style="min-width:70px">${c.visitas} ${c.visitas === 1 ? 'visita' : 'visitas'}</span></div>`).join('') : vazio('Ainda não há atendimentos neste período.');
}

async function atrasados() { ATR = await api('GET', '/api/clientes/atrasados'); chamarRender(); }
function chamarRender() {
  const tpl = $('#tpl').value, promo = $('#promo').value.trim() || 'uma condição especial';
  $('#chm').innerHTML = ATR.length ? ATR.map(c => {
    const msg = tpl.split('{nome}').join(c.nome.split(' ')[0]).split('{barbearia}').join(INFO.nome).split('{promocao}').join(promo);
    return `<div class="row2"><span class="av">${esc(c.nome[0] || '?')}</span><div class="who"><b>${esc(c.nome)}</b><small>Costuma vir a cada ${c.intervaloMedioDias} dias e está há ${c.diasSemVir} sem vir</small></div><a class="wa" data-id="${c.clienteId}" target="_blank" rel="noopener" href="https://wa.me/${esc(c.whatsapp)}?text=${encodeURIComponent(msg)}">Chamar no WhatsApp</a></div>`;
  }).join('') : vazio('Nenhum cliente fora do ritmo agora.');
}

const VEREDITO = {
  POUCOS_DADOS: r => 'Ainda há poucas mensagens para concluir algo. Continue enviando.',
  SEM_COMPARACAO: r => `${r.taxaRetornoPct}% dos clientes chamados voltaram. Ainda não há histórico suficiente para comparar com quem não foi chamado.`,
  UTIL: r => `Está sendo útil: ${r.taxaRetornoPct}% dos clientes chamados voltaram, contra ${r.taxaBasePct}% dos atrasados que ninguém chamou.`,
  SINAL_POSITIVO: r => `Há sinal positivo: ${r.taxaRetornoPct}% voltaram, contra ${r.taxaBasePct}% de quem não foi chamado. Vale testar outras promoções.`,
  NAO_COMPENSA: r => `Por enquanto não está compensando: ${r.taxaRetornoPct}% voltaram, contra ${r.taxaBasePct}% de quem não foi chamado. Experimente outra promoção.`
};
async function resultado() {
  if (INFO.restrito) return;
  const r = await api('GET', '/api/contatos/resultado');
  const m = (l, v) => `<div><p class="lab">${esc(l)}</p><p class="num">${esc(v)}</p></div>`;
  $('#rs').innerHTML = m('Mensagens enviadas', r.enviados) + m('Voltaram', r.voltaram + ' de ' + r.concluidos + ' (' + r.taxaRetornoPct + '%)')
    + m('Tempo até voltar', r.tempoMedioDias + ' dias') + m('Receita recuperada', brl(r.receitaRecuperada));
  $('#vd').textContent = VEREDITO[r.veredito](r);
  $('#pm').innerHTML = r.promocoes.length ? r.promocoes.map(p => linha(p.promocao, p.voltaram + ' de ' + p.concluidos + ' (' + p.taxaPct + '%)', p.taxaPct)).join('') : vazio('Ainda sem resultados.');
  const sit = {VOLTOU: 'Voltou', NAO_VOLTOU: 'Não voltou', AGUARDANDO: 'Aguardando'};
  $('#ms').innerHTML = r.ultimos.length ? r.ultimos.map(u => `<div class="row2"><span class="av">${esc((u.cliente || '?')[0])}</span><div class="who"><b>${esc(u.cliente)}</b><small>${esc(u.promocao)}</small></div><span class="chip">${esc(sit[u.situacao] || '')}${u.diasParaVoltar != null ? ' em ' + u.diasParaVoltar + ' dias' : ''}</span></div>`).join('') : vazio('Nenhuma mensagem enviada.');
}

function tudoDoPainel() {
  marca();
  [painel, recentes, ranking, atrasados, resultado].forEach(f => seguro(f));
}

// ---------- Agenda ----------
async function agenda() {
  if (!INFO.usaAgendamento) return;
  $('#dia').value = DIA;
  const l = await api('GET', '/api/agenda?data=' + DIA);
  $('#ag').innerHTML = l.length ? l.map(a => {
    const marcado = a.status === 'AGENDADO';
    const msg = `Olá, ${a.cliente.split(' ')[0]}! Confirmando seu horário (${a.servico}) no dia ${dataBR(a.inicio)} às ${hora(a.inicio)} na ${INFO.nome}. Pode confirmar?`;
    return `<div class="row2"><div style="min-width:92px"><b>${hora(a.inicio)}</b><br><small class="lab">até ${hora(a.fim)}</small></div>
      <div class="who"><b>${esc(a.cliente)}</b><small>${esc(a.servico)}</small></div>
      <span class="chip${a.status === 'CONCLUIDO' ? ' ok' : a.status === 'AGENDADO' ? '' : ' red'}">${STATUS[a.status]}</span>
      ${marcado ? `<div class="acts"><a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(a.whatsapp)}?text=${encodeURIComponent(msg)}">Confirmar no WhatsApp</a>
      <button class="btn sm" data-a="concluir" data-id="${a.id}">Concluir</button>
      <button class="btn sec sm" data-a="faltou" data-id="${a.id}">Faltou</button>
      <button class="btn sec sm" data-a="cancelar" data-id="${a.id}">Cancelar</button></div>` : ''}</div>`;
  }).join('') : vazio('Nenhum horário marcado neste dia.');
}
function mudaDia(n) {
  const d = new Date(DIA + 'T12:00:00'); d.setDate(d.getDate() + n);
  DIA = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  seguro(agenda);
}
async function livres() {
  const s = $('#ag-s').value, d = $('#ag-dt').value;
  if (!s || !d) return;
  const l = await api('GET', `/api/agenda/livres?data=${d}&servicoId=${s}`);
  $('#ag-h').innerHTML = l.length ? l.map(h => `<option value="${esc(h.slice(0, 5))}">${esc(h.slice(0, 5))}</option>`).join('') : '<option value="">Sem horários livres</option>';
}

// ---------- Serviços e gastos ----------
async function carregarServicos() { SERV = await api('GET', '/api/servicos'); }
async function servicos() {
  await carregarServicos();
  $('#sv').innerHTML = SERV.length ? SERV.map(s => `<div class="row2" data-id="${s.id}">
    <input class="f" style="flex:2;margin:0;min-width:140px" value="${esc(s.nome)}" aria-label="Nome">
    <input class="f" style="width:110px;margin:0" type="number" min="0.01" step="0.01" value="${Number(s.preco)}" aria-label="Preço">
    <input class="f" style="width:90px;margin:0" type="number" min="5" step="5" value="${s.duracaoMin}" aria-label="Duração em minutos">
    <button class="btn sm" data-a="salvar">Salvar</button><button class="btn sec sm" data-a="remover">Remover</button></div>`).join('') : vazio('Nenhum serviço cadastrado. Adicione o primeiro acima.');
}
async function gastos() {
  if (INFO.restrito) { $('#gs').innerHTML = vazio('Você pode lançar gastos normalmente. A lista fica disponível após o pagamento da mensalidade.'); return; }
  const l = await api('GET', '/api/despesas/recentes');
  $('#gs').innerHTML = l.length ? l.map(d => `<div class="row2"><div class="who"><b>${esc(d.descricao)}</b><small>${esc(CATS[d.categoria] || d.categoria)}, ${dataBR(d.data + 'T12:00:00')}</small></div><b>${brl(d.valor)}</b></div>`).join('') : vazio('Nenhum gasto lançado ainda.');
}

// ---------- Navegação e eventos ----------
function aba(nome) {
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === nome)));
  ['painel', 'agenda', 'servicos', 'gastos'].forEach(n => $('#v-' + n).hidden = n !== nome);
  if (nome === 'agenda') seguro(agenda);
  if (nome === 'servicos') seguro(servicos);
  if (nome === 'gastos') seguro(gastos);
}
document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close(); });
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) aba(b.dataset.t); });
$('#per').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  PER = b.dataset.p;
  document.querySelectorAll('#per button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  marca(); [painel, ranking].forEach(f => seguro(f));
});
$('#sair').addEventListener('click', async () => { try { await api('POST', '/api/logout'); } finally { location.href = '/login.html'; } });
$('#tpl').addEventListener('input', chamarRender);
$('#promo').addEventListener('input', chamarRender);
$('#chm').addEventListener('click', e => {
  const a = e.target.closest('a.wa'); if (!a) return;
  seguro(async () => {
    await api('POST', '/api/contatos', {clienteId: Number(a.dataset.id), promocao: $('#promo').value.trim() || 'sem promoção'});
    setTimeout(() => { seguro(atrasados); seguro(resultado); }, 600);
  });
});

// Novo atendimento
function totalAt() {
  const s = SERV.find(x => String(x.id) === $('#at-s').value);
  const d = Math.min(Math.max(Number($('#at-d').value) || 0, 0), s ? Number(s.preco) : 0);
  $('#at-tot').textContent = brl(s ? Number(s.preco) - d : 0);
}
$('#novo').addEventListener('click', () => seguro(async () => {
  await carregarServicos();
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#at-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${brl(s.preco)})</option>`).join('');
  $('#at-f').innerHTML = opcoes(FORMAS); $('#at-err').textContent = '';
  totalAt(); $('#dAt').showModal();
}));
['at-s', 'at-d'].forEach(i => $('#' + i).addEventListener('input', totalAt));
$('#fAt').addEventListener('submit', async e => {
  e.preventDefault(); $('#at-err').textContent = '';
  try {
    await api('POST', '/api/atendimentos', {nome: $('#at-n').value, telefone: $('#at-t').value, servicoId: Number($('#at-s').value),
      desconto: Number($('#at-d').value) || 0, formaPagamento: $('#at-f').value});
    $('#dAt').close(); $('#fAt').reset(); toast('Atendimento salvo.'); tudoDoPainel();
  } catch (x) { $('#at-err').textContent = x.message; }
});

// Agenda
$('#dia').addEventListener('change', e => { DIA = e.target.value || hojeISO(); seguro(agenda); });
$('#dia-ant').addEventListener('click', () => mudaDia(-1));
$('#dia-prox').addEventListener('click', () => mudaDia(1));
$('#novo-ag').addEventListener('click', () => seguro(async () => {
  await carregarServicos();
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#ag-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${s.duracaoMin} min)</option>`).join('');
  $('#ag-dt').value = DIA; $('#ag-err').textContent = '';
  await livres(); $('#dAg').showModal();
}));
['ag-s', 'ag-dt'].forEach(i => $('#' + i).addEventListener('change', () => seguro(livres)));
$('#fAg').addEventListener('submit', async e => {
  e.preventDefault(); $('#ag-err').textContent = '';
  if (!$('#ag-h').value) { $('#ag-err').textContent = 'Escolha um horário livre.'; return; }
  try {
    await api('POST', '/api/agenda', {nome: $('#ag-n').value, telefone: $('#ag-t').value, servicoId: Number($('#ag-s').value),
      inicio: $('#ag-dt').value + 'T' + $('#ag-h').value + ':00'});
    DIA = $('#ag-dt').value; $('#dAg').close(); $('#fAg').reset(); toast('Horário marcado.'); seguro(agenda);
  } catch (x) { $('#ag-err').textContent = x.message; }
});
$('#ag').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  if (b.dataset.a === 'concluir') {
    CONCLUIR = b.dataset.id; $('#co-f').innerHTML = opcoes(FORMAS); $('#co-d').value = 0; $('#co-err').textContent = ''; $('#dCon').showModal(); return;
  }
  seguro(async () => { await api('POST', `/api/agenda/${b.dataset.id}/${b.dataset.a}`); await agenda(); });
});
$('#fCon').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await api('POST', `/api/agenda/${CONCLUIR}/concluir`, {desconto: Number($('#co-d').value) || 0, formaPagamento: $('#co-f').value});
    $('#dCon').close(); toast('Atendimento concluído.'); seguro(agenda); tudoDoPainel();
  } catch (x) { $('#co-err').textContent = x.message; }
});

// Serviços
$('#fSv').addEventListener('submit', async e => {
  e.preventDefault();
  seguro(async () => {
    await api('POST', '/api/servicos', {nome: $('#sv-n').value, preco: Number($('#sv-p').value), duracaoMin: Number($('#sv-d').value) || 30});
    $('#fSv').reset(); $('#sv-d').value = 30; toast('Serviço adicionado.'); await servicos();
  });
});
$('#sv').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const linha = b.closest('[data-id]'), id = linha.dataset.id, c = linha.querySelectorAll('input');
  seguro(async () => {
    if (b.dataset.a === 'remover') { if (!confirm('Remover este serviço? O histórico de atendimentos continua guardado.')) return; await api('DELETE', '/api/servicos/' + id); }
    else { await api('PUT', '/api/servicos/' + id, {nome: c[0].value, preco: Number(c[1].value), duracaoMin: Number(c[2].value) || 30}); toast('Serviço salvo.'); }
    await servicos();
  });
});

// Gastos
$('#gs-c').innerHTML = opcoes(CATS); $('#gs-dt').value = hojeISO();
$('#fGs').addEventListener('submit', async e => {
  e.preventDefault();
  seguro(async () => {
    await api('POST', '/api/despesas', {descricao: $('#gs-d').value, categoria: $('#gs-c').value, valor: Number($('#gs-v').value), data: $('#gs-dt').value || null});
    $('#fGs').reset(); $('#gs-dt').value = hojeISO(); toast('Gasto salvo.'); await gastos(); seguro(painel);
  });
});

// Configurar barbearia
function reduzir(arquivo) {
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const q = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 160;
      c.getContext('2d').drawImage(im, (im.width - q) / 2, (im.height - q) / 2, q, q, 0, 0, 160, 160);
      ok(c.toDataURL('image/jpeg', 0.85)); }; im.onerror = falha; im.src = r.result; };
    r.onerror = falha; r.readAsDataURL(arquivo);
  });
}
$('#cfg').addEventListener('click', () => {
  $('#cf-n').value = INFO.nome; $('#cf-a').checked = INFO.usaAgendamento;
  $('#cf-ab').value = (INFO.abre || '09:00').slice(0, 5); $('#cf-fe').value = (INFO.fecha || '19:00').slice(0, 5);
  $('#cf-l').value = ''; NOVALOGO = null; $('#cf-err').textContent = ''; $('#dCfg').showModal();
});
$('#cf-l').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { NOVALOGO = await reduzir(f); } catch (x) { $('#cf-err').textContent = 'Não foi possível ler essa imagem.'; }
});
$('#fCfg').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    INFO = await api('PUT', '/api/barbearia', {nome: $('#cf-n').value, logo: NOVALOGO, usaAgendamento: $('#cf-a').checked,
      abre: $('#cf-ab').value || null, fecha: $('#cf-fe').value || null});
    $('#dCfg').close(); marca(); toast('Configuração salva.');
  } catch (x) { $('#cf-err').textContent = x.message; }
});

// ---------- Início ----------
(async () => {
  try { INFO = await api('GET', '/api/barbearia'); } catch (e) { return; }
  tudoDoPainel();
})();
