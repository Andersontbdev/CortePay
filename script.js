// ======================= CONFIGURAÇÃO =======================
// Cole aqui os dados do seu projeto no Supabase (Project Settings > API).
// A chave pública (anon/publishable) pode ficar aqui: a segurança está nas regras do banco (supabase.sql).
const SUPABASE_URL = 'https://qiwjxoymaccslovinfgx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wI9HINvYa3vAKvKABdr3NQ_xSH_MZSI';
// ============================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (s, r = document) => r.querySelector(s);
// Todo texto vindo do banco passa por esc() antes de entrar na página (protege contra código malicioso).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
function guarda(k, v) {
  try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; }
}

// Tema visual escolhido pelo próprio barbeiro e salvo neste navegador.
function aplicarTema(tema) {
  const escuro = tema === 'dark';
  document.documentElement.dataset.theme = escuro ? 'dark' : 'light';
  const botao = document.querySelector('#tema-toggle');
  if (botao) {
    botao.innerHTML = `<svg class="i" aria-hidden="true"><use href="#i-${escuro ? 'sun' : 'moon'}"/></svg><span>${escuro ? 'Modo claro' : 'Modo escuro'}</span>`;
    botao.setAttribute('aria-pressed', String(escuro));
    botao.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
  }
}
aplicarTema(guarda('cortepay-tema') || 'light');
document.querySelector('#tema-toggle')?.addEventListener('click', () => {
  const proximo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  guarda('cortepay-tema', proximo);
  aplicarTema(proximo);
});
function traduz(m) {
  m = String(m || '');
  const t = [['Invalid login credentials', 'E-mail ou senha incorretos.'], ['Email not confirmed', 'Confirme o seu e-mail antes de entrar (veja a caixa de entrada).'],
    ['User already registered', 'Este e-mail já tem cadastro. Use "Entrar".'], ['Password should be at least', 'A senha precisa ter pelo menos 8 caracteres.'],
    ['permission denied', 'Sem permissão para essa ação.'], ['row-level security', 'Sem permissão para essa ação.'],
    ['rate limit', 'Muitas tentativas. Aguarde um pouco e tente de novo.'], ['Failed to fetch', 'Sem conexão com o servidor. Confira a internet.']];
  for (const [k, v] of t) if (m.includes(k)) return v;
  return m || 'Algo deu errado. Tente de novo.';
}
const ok = ({data, error}) => { if (error) throw new Error(traduz(error.message)); return data; };
const rpc = (nome, args) => sb.rpc(nome, args).then(ok);

function toast(msg, erro) {
  const t = $('#toast');
  t.textContent = msg; t.className = 'toast' + (erro ? ' erro' : ''); t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => t.hidden = true, 4000);
}
const seguro = fn => fn().catch(e => toast(e.message, true));
const TELAS = ['tela-login', 'tela-convite', 'tela-app', 'tela-admin', 'tela-publico'];
const tela = id => TELAS.forEach(t => $('#' + t).hidden = t !== id);

$('#copiar-link-agendamento').addEventListener('click', async () => {
  const url = $('#link-agendamento').value;
  try { await navigator.clipboard.writeText(url); toast('Link de agendamento copiado!'); }
  catch (e) { $('#link-agendamento').focus(); $('#link-agendamento').select(); try { document.execCommand('copy'); toast('Link copiado!'); } catch (_) { toast('Selecione e copie o link manualmente.', true); } }
});

// ---------- Datas e textos ----------
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hojeISO = () => iso(new Date());
function maisDia(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const hora = s => new Date(s).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
const dataBR = s => new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
const whats = tel => { const d = String(tel).replace(/\D/g, ''); return d.length <= 11 ? '55' + d : d; };
function intervalo(p) {
  const h = new Date(); h.setHours(12, 0, 0, 0);
  if (p === 'hoje') return [iso(h), iso(h)];
  if (p === 'semana') { const d = new Date(h); d.setDate(d.getDate() - (d.getDay() + 6) % 7); const f = new Date(d); f.setDate(f.getDate() + 6); return [iso(d), iso(f)]; }
  return [iso(new Date(h.getFullYear(), h.getMonth(), 1, 12)), iso(new Date(h.getFullYear(), h.getMonth() + 1, 0, 12))];
}
const FORMAS = {PIX: 'Pix', DINHEIRO: 'Dinheiro', DEBITO: 'Débito', CREDITO: 'Crédito'};
const FORMAS_TODAS = {...FORMAS, ASSINATURA: 'Clube', FIDELIDADE: 'Fidelidade'};
const CATS = {ALUGUEL: 'Aluguel', PRODUTOS: 'Produtos', ENERGIA: 'Energia', AGUA: 'Água', COMISSOES: 'Comissões e vales', OUTROS: 'Outros'};
const TIPOS_PROD = {VENDA: 'Para venda', USO: 'Uso interno', AMBOS: 'Venda e uso interno'};
const qtd = n => Number(n || 0).toLocaleString('pt-BR', {maximumFractionDigits: 3});
const dataHoraBR = s => new Date(s).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'});
const STATUS = {AGENDADO: 'Agendado', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', FALTOU: 'Faltou'};
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const opcoes = obj => Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');
const linha = (nome, valor, pct, cor = '') => `<div class="row"><span class="nm">${esc(nome)}</span><div class="tr"><i class="${cor}" style="width:${Math.min(100, Math.max(0, pct))}%"></i></div><span class="v">${esc(valor)}</span></div>`;
const kp = (a, b) => `<div class="kp"><span class="lab">${esc(a)}</span><span class="num">${esc(b)}</span></div>`;
const vazio = t => `<p class="lab">${esc(t)}</p>`;
const soma = a => a.reduce((s, x) => s + Number(x), 0);
document.addEventListener('click', e => { const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close(); });

// ======================= ENTRADA (login, cadastro, convite) =======================
document.querySelectorAll('[data-lt]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-lt]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#fLogin').hidden = b.dataset.lt !== 'entrar'; $('#fCad').hidden = b.dataset.lt !== 'cadastro';
}));
$('#fLogin').addEventListener('submit', async e => {
  e.preventDefault(); $('#lg-err').textContent = '';
  try { ok(await sb.auth.signInWithPassword({email: $('#lg-e').value.trim(), password: $('#lg-s').value})); await entrar(); }
  catch (x) { $('#lg-err').textContent = x.message; }
});
$('#esqueci').addEventListener('click', async () => {
  const em = $('#lg-e').value.trim();
  if (!em) { $('#lg-err').textContent = 'Digite o seu e-mail acima e toque de novo.'; return; }
  try { ok(await sb.auth.resetPasswordForEmail(em, {redirectTo: location.origin + location.pathname})); toast('Enviamos um e-mail para criar uma nova senha.'); }
  catch (x) { $('#lg-err').textContent = x.message; }
});
$('#fCad').addEventListener('submit', async e => {
  e.preventDefault(); $('#cd-err').textContent = '';
  try {
    const r = ok(await sb.auth.signUp({email: $('#cd-e').value.trim(), password: $('#cd-s').value}));
    guarda('convite', $('#cd-c').value.trim());
    if (r.session) { await entrar(); }
    else { toast('Enviamos um e-mail de confirmação. Confirme e depois entre.'); document.querySelector('[data-lt="entrar"]').click(); }
  } catch (x) { $('#cd-err').textContent = x.message; }
});
$('#fConv').addEventListener('submit', async e => {
  e.preventDefault(); $('#cv-err').textContent = '';
  try { await rpc('reivindicar_convite', {p_codigo: $('#cv-cod').value}); guarda('convite', null); await entrar(); }
  catch (x) { $('#cv-err').textContent = x.message; }
});
$('#fSenha').addEventListener('submit', async e => {
  e.preventDefault(); $('#ns-err').textContent = '';
  try { ok(await sb.auth.updateUser({password: $('#ns-s').value})); $('#dSenha').close(); toast('Senha alterada.'); }
  catch (x) { $('#ns-err').textContent = x.message; }
});
async function sair() { await sb.auth.signOut(); tela('tela-login'); }
$('#cv-sair').addEventListener('click', sair);
sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') $('#dSenha').showModal(); });

async function entrar() {
  const {data: {session}} = await sb.auth.getSession();
  if (!session) return tela('tela-login');
  const p = await sb.from('perfil').select('papel,barbearia_id').maybeSingle().then(ok);
  if (!p) { $('#cv-cod').value = guarda('convite') || ''; return tela('tela-convite'); }
  if (p.papel === 'ADMIN') { tela('tela-admin'); return seguro(admCarregar); }
  tela('tela-app');
  const [b, s] = await Promise.all([sb.from('barbearia').select('id,nome,logo,vencimento,usa_agendamento,abre,fecha,fidelidade_meta').maybeSingle().then(ok), rpc('minha_situacao')]);
  INFO = {...b, restrito: s[0].restrito, situacao: s[0].situacao};
  await carregarPlano();
  tudoDoPainel();
}

// ---------- Plano (Free/Pro) e recursos liberados ----------
const RECURSOS_INFO = {
  agenda: ['Agenda e agendamento online', 'Seus clientes marcam pelo link, e a agenda evita horário duplicado.'],
  barbeiros: ['Barbeiros e comissões', 'Cada atendimento com o barbeiro certo e a comissão calculada sozinha, com vales e fechamento.'],
  estoque: ['Estoque e venda de produtos', 'Controle de produtos de uso e de venda, com aviso de estoque baixo e venda junto com o atendimento.'],
  caixa: ['Caixa do dia', 'Abertura, sangrias e fechamento com a conferência do dinheiro na gaveta.'],
  clube: ['Clube de assinatura', 'Planos mensais para seus clientes: receita garantida todo mês.'],
  fidelidade: ['Programa de fidelidade', 'A cada tantos atendimentos, o próximo é por conta da casa.'],
  marketing: ['Lembretes e aniversariantes', 'Lembretes dos horários de amanhã, parabéns no aniversário e clientes para chamar de volta.'],
  relatorios: ['Relatórios', 'Faturamento, horários de pico, desempenho por barbeiro, faltas e produtos mais vendidos.'],
};
const RECURSO_DA_PAGINA = {agenda: 'agenda', caixa: 'caixa', clube: 'clube', barbeiros: 'barbeiros', estoque: 'estoque', relatorios: 'relatorios'};
let PLANO = {plano: 'PRO', recursos: Object.keys(RECURSOS_INFO), recursos_pro: Object.keys(RECURSOS_INFO), preco_pro: null, whatsapp_vendas: null};
const tem = r => PLANO.recursos.includes(r);
async function carregarPlano() {
  // Se a atualização 4 ainda não foi instalada, tudo continua liberado como antes
  try { PLANO = await rpc('meus_recursos'); } catch (e) { /* mantém o padrão */ }
  document.querySelectorAll('#tabs .tag-pro').forEach(t => t.remove());
  Object.entries(RECURSO_DA_PAGINA).forEach(([pag, rec]) => {
    if (!tem(rec)) $(`#tabs [data-t="${pag}"]`)?.insertAdjacentHTML('beforeend', '<span class="tag-pro">Pro</span>');
  });
  [['#atalho-horario', 'agenda'], ['[data-atalho="vender"]', 'estoque'], ['[data-atalho="caixa"]', 'caixa'], ['[data-atalho="clube"]', 'clube']]
    .forEach(([sel, rec]) => { if (!tem(rec)) $(sel).hidden = true; });
  ['#card-lembretes', '#card-aniver', '#card-chamar', '#card-resultado'].forEach(sel => { if (!tem('marketing')) $(sel).hidden = true; });
  $('#cf-fid').closest('label').hidden = !tem('fidelidade'); if (!tem('fidelidade')) $('#cf-fid-box').hidden = true;
  $('#cf-a').closest('label').hidden = !tem('agenda');
}
function mostrarUpgrade(pag) {
  const rec = RECURSO_DA_PAGINA[pag], [titulo, desc] = RECURSOS_INFO[rec];
  $('#pro-tit').textContent = titulo + ' é do plano Pro';
  $('#pro-desc').textContent = desc;
  $('#pro-lista').innerHTML = PLANO.recursos_pro.filter(r => !tem(r)).map(r =>
    `<li class="${r === rec ? 'atual' : ''}"><svg class="i" aria-hidden="true"><use href="#i-check"/></svg><span>${esc(RECURSOS_INFO[r]?.[0] || r)}</span></li>`).join('');
  $('#pro-preco').innerHTML = PLANO.preco_pro ? `Tudo isso por <b>${brl(PLANO.preco_pro)}</b> por mês` : '';
  const wa = PLANO.whatsapp_vendas;
  $('#pro-quero').hidden = !wa;
  if (wa) $('#pro-quero').href = `https://wa.me/${whats(wa)}?text=${encodeURIComponent(`Olá! Sou da ${INFO.nome} e quero mudar para o plano Pro do CortePay (vi o recurso: ${titulo}).`)}`;
  $('#pro-desc').textContent = desc + (wa ? '' : ' Fale com quem te vendeu o sistema para mudar para o Pro.');
}
$('#pro-voltar').addEventListener('click', () => aba('painel'));

// ======================= BARBEARIA =======================
let INFO, PER = 'semana', SERV = [], ATR = [], DIA = hojeISO(), CONCLUIR = null, NOVALOGO = null, AGENDA = [];
let BARB = [], PROD = [];
const BARB_ATIVOS = () => BARB.filter(b => b.ativo);

function marca() {
  $('#bn').textContent = INFO.nome;
  document.title = 'Painel da ' + INFO.nome;
  $('#logo').hidden = !INFO.logo;
  if (INFO.logo) $('#logo').src = INFO.logo;
  $('#ini').hidden = !!INFO.logo;
  $('#ini').textContent = INFO.nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const per = {hoje: 'de hoje', semana: 'da semana', mes: 'do mês'}[PER];
  $('#saldo-rot').textContent = 'Lucro ' + per;
  if (ABA === 'painel') $('#sub').textContent = 'Resumo ' + per;
  const agendaOk = tem('agenda') && INFO.usa_agendamento;
  $('#tab-ag').hidden = tem('agenda') && !INFO.usa_agendamento;   // sem o recurso, aparece com o selo Pro
  $('#atalho-horario').hidden = !agendaOk;
  // Barra inferior: só atalhos que a barbearia pode usar
  const slot = (el, opcoes) => {
    const [t, ic, nome] = opcoes.find(o => o[3]);
    el.dataset.t = t; el.innerHTML = `<svg class="i" aria-hidden="true"><use href="#i-${ic}"/></svg><span>${nome}</span>`;
  };
  slot($('#bn-ag'), [['agenda', 'cal', 'Agenda', agendaOk], ['clube', 'crown', 'Clube', tem('clube')], ['gastos', 'receipt', 'Gastos', true]]);
  slot($('#bn-cx'), [['caixa', 'cash', 'Caixa', tem('caixa')], ['servicos', 'scissors', 'Serviços', true]]);
  $('#card-link-agendamento').hidden = !agendaOk;
  if (INFO.usa_agendamento) { const url = location.origin + location.pathname + '?agendar=' + encodeURIComponent(INFO.id); $('#link-agendamento').value = url; $('#abrir-link-agendamento').href = url; }
  document.body.classList.toggle('restr', INFO.restrito);
  const ban = $('#ban');
  ban.hidden = !(INFO.restrito || INFO.situacao === 'ATRASADA');
  ban.className = 'ban' + (INFO.restrito ? '' : ' warn');
  ban.innerHTML = INFO.restrito && INFO.situacao === 'RESTRITO' && PLANO.plano === 'FREE'
    ? '<b>Acesso restrito.</b> Os painéis de ganhos, gastos e lucro estão bloqueados pelo administrador do sistema. Você continua lançando normalmente.'
    : INFO.restrito
    ? '<b>Mensalidade em atraso.</b> Você continua lançando atendimentos e gastos normalmente, mas os painéis de ganhos, gastos e lucro ficam bloqueados até o pagamento. Fale com o administrador para regularizar.'
    : '<b>Sua mensalidade está atrasada.</b> Regularize para não perder a visualização dos painéis.';
}

async function painel() {
  if (INFO.restrito) return;
  const [i0, i1] = intervalo(PER);
  const [ats, ds, vds] = await Promise.all([
    sb.from('atendimento').select('valor_final,forma_pagamento,data_hora').gte('data_hora', i0 + 'T00:00:00').lt('data_hora', maisDia(i1, 1) + 'T00:00:00').limit(5000).then(ok),
    sb.from('despesa').select('categoria,valor').gte('data_despesa', i0).lte('data_despesa', i1).limit(5000).then(ok),
    sb.from('venda_item').select('valor_total,forma_pagamento,data_hora').gte('data_hora', i0 + 'T00:00:00').lt('data_hora', maisDia(i1, 1) + 'T00:00:00').limit(5000).then(ok)]);
  const cps = await sb.from('clube_pagamento').select('valor,forma_pagamento,pago_em').gte('pago_em', i0 + 'T00:00:00').lt('pago_em', maisDia(i1, 1) + 'T00:00:00').limit(5000).then(ok);
  // Entradas = atendimentos + produtos vendidos (com ou sem atendimento)
  const at = ats.filter(a => FORMAS[a.forma_pagamento])
    .concat(vds.map(v => ({valor_final: v.valor_total, forma_pagamento: v.forma_pagamento, data_hora: v.data_hora})))
    .concat(cps.map(c => ({valor_final: c.valor, forma_pagamento: c.forma_pagamento, data_hora: c.pago_em})));
  const entrou = soma(at.map(a => a.valor_final)), gastos = soma(ds.map(d => d.valor)), lucro = entrou - gastos;
  $('#luc').textContent = brl(lucro); $('#in').textContent = brl(entrou); $('#out').textContent = brl(gastos); $('#qt').textContent = ats.length;
  $('#pv').textContent = brl(soma(vds.map(v => v.valor_total)));
  $('#cv').textContent = brl(soma(cps.map(c => c.valor)));
  const serie = new Map();
  if (PER === 'hoje') { [...new Set(at.map(a => +a.data_hora.slice(11, 13)))].sort((x, y) => x - y).forEach(h => serie.set(h + 'h', 0)); }
  else if (PER === 'semana') DIAS.forEach(d => serie.set(d, 0));
  else for (let i = 1; i <= 5; i++) serie.set('Sem ' + i, 0);
  at.forEach(a => {
    const k = PER === 'hoje' ? (+a.data_hora.slice(11, 13)) + 'h' : PER === 'semana' ? DIAS[(new Date(a.data_hora).getDay() + 6) % 7] : 'Sem ' + (Math.floor((+a.data_hora.slice(8, 10) - 1) / 7) + 1);
    serie.set(k, serie.get(k) + Number(a.valor_final));
  });
  const pts = [...serie.entries()], mx = Math.max(1, ...pts.map(p => p[1]));
  $('#bars').innerHTML = pts.map(([r, v]) => `<div class="col" title="${esc(r)}: ${brl(v)}"><div class="b${v === mx ? ' top' : ''}" style="height:${Math.round(v / mx * 100)}%"></div></div>`).join('');
  $('#ticks').innerHTML = pts.map(([r]) => `<span>${esc(r)}</span>`).join('');
  const tot = entrou || 1;
  $('#pag').innerHTML = Object.keys(FORMAS).map(f => { const v = soma(at.filter(a => a.forma_pagamento === f).map(a => a.valor_final)), pc = Math.round(v / tot * 100); return linha(FORMAS[f], pc + '%', pc); }).join('');
  const cat = {}; ds.forEach(d => cat[d.categoria] = (cat[d.categoria] || 0) + Number(d.valor));
  const cats = Object.entries(cat).sort((a, b) => b[1] - a[1]);
  $('#gst').innerHTML = cats.length ? cats.map(([c, v]) => { const pc = Math.round(v / (gastos || 1) * 100); return linha(CATS[c] || c, brl(v) + ' (' + pc + '%)', pc, 'red'); }).join('') : vazio('Nenhum gasto neste período.');
  $('#kpi').innerHTML = kp('Gastos sobre o que entrou', (entrou ? Math.round(gastos / entrou * 100) : 0) + '%') + kp('Margem de lucro', (entrou ? Math.round(lucro / entrou * 100) : 0) + '%')
    + kp('Maior gasto', cats.length ? CATS[cats[0][0]] : '-') + kp('Gasto por atendimento', brl(ats.length ? gastos / ats.length : 0));
}

async function recentes() {
  if (INFO.restrito) return;
  const l = await sb.from('atendimento').select('id,valor_final,desconto,forma_pagamento,data_hora,cliente(nome),servico(nome),barbeiro(nome)').order('data_hora', {ascending: false}).limit(8).then(ok);
  $('#ult').innerHTML = l.length ? l.map(a => `<div class="row2"><span class="av">${esc((a.cliente?.nome || '?')[0])}</span><div class="who"><b>${esc(a.cliente?.nome)}</b><small>${esc(a.servico?.nome)}${a.barbeiro?.nome ? ' · ' + esc(a.barbeiro.nome) : ''}${Number(a.desconto) > 0 ? ' (desconto de ' + brl(a.desconto) + ')' : ''}</small></div><span class="chip">${esc(FORMAS_TODAS[a.forma_pagamento] || '')}</span><b>${brl(a.valor_final)}</b><button class="btn sec sm btn-excluir-lancamento" type="button" data-tipo="ENTRADA" data-id="${a.id}" aria-label="Excluir entrada de ${esc(a.cliente?.nome || 'cliente')}">Excluir</button></div>`).join('') : vazio('Nenhum atendimento ainda.');
}

// Excluir entradas (atendimentos) e saídas (gastos) com confirmação.
// A exclusão é feita por uma função SQL que valida a barbearia vinculada ao usuário.
async function excluirLancamento(tipo, id) {
  const ehEntrada = tipo === 'ENTRADA', ehVenda = tipo === 'VENDA', ehClube = tipo === 'CLUBE';
  const pergunta = ehEntrada
    ? 'Deseja realmente excluir esta entrada? Se ela veio de um agendamento, o horário relacionado também será cancelado. Produtos vendidos junto voltam para o estoque.'
    : ehVenda ? 'Deseja realmente excluir esta venda? O produto volta para o estoque.'
    : ehClube ? 'Deseja realmente excluir este recebimento do clube? O vencimento da assinatura volta para a data anterior.'
    : 'Deseja realmente excluir esta saída/gasto?';
  if (!confirm(pergunta)) return;
  await rpc('excluir_lancamento', {p_tipo: tipo, p_id: Number(id)});
  toast(ehEntrada ? 'Entrada excluída.' : ehVenda ? 'Venda excluída.' : ehClube ? 'Recebimento excluído.' : 'Saída excluída.');
  if (ehClube) { await clube(); seguro(painel); }
  else if (ehEntrada || ehVenda) {
    tudoDoPainel();
    seguro(agenda);
    if (ehVenda) seguro(estoque);
  } else {
    await gastos();
    seguro(painel);
  }
}
document.addEventListener('click', e => {
  const b = e.target.closest('.btn-excluir-lancamento');
  if (!b) return;
  b.disabled = true;
  seguro(async () => {
    try { await excluirLancamento(b.dataset.tipo, b.dataset.id); }
    finally { b.disabled = false; }
  });
});

async function ranking() {
  const [i0, i1] = intervalo(PER);
  const l = await rpc('ranking', {p_de: i0, p_ate: i1});
  const mx = Math.max(1, ...l.map(x => x.visitas));
  $('#rank').innerHTML = l.length ? l.map(c => `<div class="row"><span class="av">${esc(c.nome[0] || '?')}</span><span class="nm" style="flex:1">${esc(c.nome)}</span><div class="tr" style="max-width:120px"><i style="width:${Math.round(c.visitas / mx * 100)}%"></i></div><span class="v" style="min-width:70px">${c.visitas} ${c.visitas === 1 ? 'visita' : 'visitas'}</span></div>`).join('') : vazio('Ainda não há atendimentos neste período.');
}

// Ritmo de cada cliente: com 3 visitas ou mais, calcula o intervalo médio; passou de 1,5x esse intervalo = cliente para chamar.
async function dadosFreq() {
  const [vis, cli, con] = await Promise.all([rpc('visitas'), sb.from('cliente').select('id,nome,telefone').limit(5000).then(ok),
    sb.from('contato').select('cliente_id,enviado_em,promocao').limit(5000).then(ok)]);
  const porC = {};
  vis.forEach(v => (porC[v.cliente_id] = porC[v.cliente_id] || []).push(v.dia));
  Object.values(porC).forEach(a => a.sort());
  return {porC, cli, con};
}
async function atrasados() {
  const hoje = hojeISO(), {porC, cli, con} = await dadosFreq(), ult = {};
  con.forEach(c => { const d = c.enviado_em.slice(0, 10); if (!ult[c.cliente_id] || d > ult[c.cliente_id]) ult[c.cliente_id] = d; });
  const L = [];
  cli.forEach(c => {
    const d = porC[c.id]; if (!d || d.length < 3) return;
    const media = diasEntre(d[0], d[d.length - 1]) / (d.length - 1), sem = diasEntre(d[d.length - 1], hoje);
    if (sem <= 1.5 * media) return;
    if (ult[c.id] && diasEntre(ult[c.id], hoje) <= 14) return; // já foi chamado há pouco tempo
    L.push({clienteId: c.id, nome: c.nome, whatsapp: whats(c.telefone), intervaloMedioDias: Math.round(media), diasSemVir: sem, r: sem / media});
  });
  ATR = L.sort((a, b) => b.r - a.r); chamarRender();
}
function chamarRender() {
  const tpl = $('#tpl').value, promo = $('#promo').value.trim() || 'uma condição especial';
  $('#chm').innerHTML = ATR.length ? ATR.map(c => {
    const msg = tpl.split('{nome}').join(c.nome.split(' ')[0]).split('{barbearia}').join(INFO.nome).split('{promocao}').join(promo);
    return `<div class="row2"><span class="av">${esc(c.nome[0] || '?')}</span><div class="who"><b>${esc(c.nome)}</b><small>Costuma vir a cada ${c.intervaloMedioDias} dias e está há ${c.diasSemVir} sem vir</small></div><a class="wa" data-id="${c.clienteId}" target="_blank" rel="noopener" href="https://wa.me/${esc(c.whatsapp)}?text=${encodeURIComponent(msg)}">Chamar no WhatsApp</a></div>`;
  }).join('') : vazio('Nenhum cliente fora do ritmo agora.');
}
// Comparação justa: no passado, quantas vezes um cliente ficou atrasado SEM ser chamado e voltou em até 14 dias.
function baseSemChamar(porC, con, hoje) {
  let ep = 0, vol = 0; const env = {};
  con.forEach(c => (env[c.cliente_id] = env[c.cliente_id] || []).push(c.enviado_em.slice(0, 10)));
  Object.entries(porC).forEach(([id, d]) => {
    for (let i = 2; i < d.length; i++) {
      const media = diasEntre(d[0], d[i]) / i, marco = maisDia(d[i], Math.floor(1.5 * media) + 1), fim = maisDia(marco, 14);
      if (fim > hoje) continue;
      const prox = d[i + 1];
      if (prox && prox < marco) continue;
      if ((env[id] || []).some(x => x >= marco && x <= fim)) continue;
      ep++; if (prox && prox <= fim) vol++;
    }
  });
  return {ep, vol};
}
const VEREDITO = {
  POUCOS_DADOS: () => 'Ainda há poucas mensagens para concluir algo. Continue enviando.',
  SEM_COMPARACAO: r => `${r.taxa}% dos clientes chamados voltaram. Ainda não há histórico suficiente para comparar com quem não foi chamado.`,
  UTIL: r => `Está sendo útil: ${r.taxa}% dos clientes chamados voltaram, contra ${r.base}% dos atrasados que ninguém chamou.`,
  SINAL_POSITIVO: r => `Há sinal positivo: ${r.taxa}% voltaram, contra ${r.base}% de quem não foi chamado. Vale testar outras promoções.`,
  NAO_COMPENSA: r => `Por enquanto não está compensando: ${r.taxa}% voltaram, contra ${r.base}% de quem não foi chamado. Experimente outra promoção.`
};
async function resultado() {
  if (INFO.restrito) return;
  const hoje = hojeISO(), agora = new Date(), {porC, cli, con} = await dadosFreq();
  const at = await sb.from('atendimento').select('cliente_id,data_hora,valor_final').order('data_hora').limit(5000).then(ok);
  const porCli = {}; at.forEach(a => (porCli[a.cliente_id] = porCli[a.cliente_id] || []).push(a));
  const nomes = {}; cli.forEach(c => nomes[c.id] = c.nome);
  let concl = 0, vol = 0, dias = 0, rec = 0; const promos = {};
  const itens = con.map(c => {
    const env = new Date(c.enviado_em), lim = new Date(env.getTime() + 14 * 864e5);
    const v = (porCli[c.cliente_id] || []).find(a => { const t = new Date(a.data_hora); return t > env && t <= lim; });
    const p = promos[c.promocao] = promos[c.promocao] || [0, 0];
    if (v) { const d = diasEntre(c.enviado_em.slice(0, 10), v.data_hora.slice(0, 10)); concl++; vol++; dias += d; rec += Number(v.valor_final); p[0]++; p[1]++; return {c, s: 'VOLTOU', d}; }
    if (lim < agora) { concl++; p[0]++; return {c, s: 'NAO_VOLTOU', d: null}; }
    return {c, s: 'AGUARDANDO', d: null};
  });
  const taxa = concl ? Math.round(vol * 100 / concl) : 0, bs = baseSemChamar(porC, con, hoje), base = bs.ep >= 5 ? Math.round(bs.vol * 100 / bs.ep) : null;
  const ver = concl < 5 ? 'POUCOS_DADOS' : base === null ? 'SEM_COMPARACAO' : taxa >= base * 2 ? 'UTIL' : taxa > base ? 'SINAL_POSITIVO' : 'NAO_COMPENSA';
  const m = (l, v) => `<div><p class="lab">${esc(l)}</p><p class="num">${esc(v)}</p></div>`;
  $('#rs').innerHTML = m('Mensagens enviadas', con.length) + m('Voltaram', vol + ' de ' + concl + ' (' + taxa + '%)') + m('Tempo até voltar', (vol ? Math.round(dias / vol) : 0) + ' dias') + m('Receita recuperada', brl(rec));
  $('#vd').textContent = VEREDITO[ver]({taxa, base});
  const pl = Object.entries(promos).filter(([, v]) => v[0] > 0).sort((a, b) => b[1][1] / b[1][0] - a[1][1] / a[1][0]);
  $('#pm').innerHTML = pl.length ? pl.map(([k, v]) => { const pc = Math.round(v[1] * 100 / v[0]); return linha(k, v[1] + ' de ' + v[0] + ' (' + pc + '%)', pc); }).join('') : vazio('Ainda sem resultados.');
  const sit = {VOLTOU: 'Voltou', NAO_VOLTOU: 'Não voltou', AGUARDANDO: 'Aguardando'};
  const ult = itens.sort((a, b) => b.c.enviado_em.localeCompare(a.c.enviado_em)).slice(0, 5);
  $('#ms').innerHTML = ult.length ? ult.map(u => `<div class="row2"><span class="av">${esc((nomes[u.c.cliente_id] || '?')[0])}</span><div class="who"><b>${esc(nomes[u.c.cliente_id])}</b><small>${esc(u.c.promocao)}</small></div><span class="chip">${sit[u.s]}${u.d != null ? ' em ' + u.d + ' dias' : ''}</span></div>`).join('') : vazio('Nenhuma mensagem enviada.');
}
function tudoDoPainel() { marca(); [painel, recentes, ranking, carregarBase].concat(tem('marketing') ? [atrasados, resultado, lembretes, aniversariantes] : []).forEach(f => seguro(f)); }

// ---------- Agenda ----------
async function agenda() {
  if (!INFO.usa_agendamento) return;
  $('#dia').value = DIA;
  const filtro = $('#ag-filtro');
  filtro.hidden = !BARB_ATIVOS().length;
  if (!filtro.hidden) {
    const atual = filtro.value;
    filtro.innerHTML = '<option value="">Todos os barbeiros</option>' + BARB_ATIVOS().map(b => `<option value="${b.id}">${esc(b.nome)}</option>`).join('');
    filtro.value = BARB_ATIVOS().some(b => String(b.id) === atual) ? atual : '';
  }
  let q = sb.from('agendamento').select('id,inicio,fim,status,barbeiro_id,cliente_id,servico_id,cliente(nome,telefone),servico(nome,preco),barbeiro(nome)').gte('inicio', DIA + 'T00:00:00').lt('inicio', maisDia(DIA, 1) + 'T00:00:00').order('inicio');
  if (!filtro.hidden && filtro.value) q = q.eq('barbeiro_id', Number(filtro.value));
  const l = AGENDA = await q.then(ok);
  $('#ag').innerHTML = l.length ? l.map(a => {
    const nome = a.cliente?.nome || '', com = a.barbeiro?.nome ? ` com ${a.barbeiro.nome}` : '';
    const msg = `Olá, ${nome.split(' ')[0]}! Confirmando seu horário (${a.servico?.nome}${com}) no dia ${dataBR(a.inicio)} às ${hora(a.inicio)} na ${INFO.nome}. Pode confirmar?`;
    return `<div class="row2"><div style="min-width:92px"><b>${hora(a.inicio)}</b><br><small class="lab">até ${hora(a.fim)}</small></div>
      <div class="who"><b>${esc(nome)}</b><small>${esc(a.servico?.nome)}${a.barbeiro?.nome ? ' · ' + esc(a.barbeiro.nome) : ''}</small></div>
      <span class="chip${a.status === 'CONCLUIDO' ? ' ok' : a.status === 'AGENDADO' ? '' : ' red'}">${STATUS[a.status]}</span>
      ${a.status === 'AGENDADO' ? `<div class="acts"><a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(a.cliente?.telefone))}?text=${encodeURIComponent(msg)}">Confirmar no WhatsApp</a>
      <button class="btn sm" data-a="concluir" data-id="${a.id}">Concluir</button>
      <button class="btn sec sm" data-a="FALTOU" data-id="${a.id}">Faltou</button>
      <button class="btn sec sm" data-a="CANCELADO" data-id="${a.id}">Cancelar</button></div>` : ''}</div>`;
  }).join('') : vazio('Nenhum horário marcado neste dia.');
}
async function livres() {
  const sv = SERV.find(x => String(x.id) === $('#ag-s').value), d = $('#ag-dt').value;
  if (!sv || !d) return;
  // Com barbeiros, cada um tem a própria agenda; sem barbeiros, a agenda é única
  const brb = BARB_ATIVOS().length ? Number($('#ag-b').value) || null : null;
  if (BARB_ATIVOS().length && !brb) { $('#ag-h').innerHTML = '<option value="">Escolha o barbeiro</option>'; return; }
  const m = (await sb.from('agendamento').select('inicio,fim,barbeiro_id').eq('status', 'AGENDADO').gte('inicio', d + 'T00:00:00').lt('inicio', maisDia(d, 1) + 'T00:00:00').then(ok))
    .filter(x => (x.barbeiro_id ?? null) === brb);
  const min = h => +h.slice(0, 2) * 60 + +h.slice(3, 5), ocup = m.map(x => [min(x.inicio.slice(11, 16)), min(x.fim.slice(11, 16))]);
  const ag = new Date(), ja = d === iso(ag) ? ag.getHours() * 60 + ag.getMinutes() : -1, out = [];
  for (let t = min(INFO.abre); t + sv.duracao_min <= min(INFO.fecha); t += 30) {
    if (t <= ja || ocup.some(([a, b]) => t < b && a < t + sv.duracao_min)) continue;
    out.push(String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'));
  }
  $('#ag-h').innerHTML = out.length ? out.map(h => `<option value="${h}">${h}</option>`).join('') : '<option value="">Sem horários livres</option>';
}

// ---------- Serviços e gastos ----------
async function carregarServicos() { SERV = await sb.from('servico').select('id,nome,preco,duracao_min').eq('ativo', true).order('nome').then(ok); }
async function servicos() {
  await carregarServicos();
  $('#sv').innerHTML = SERV.length ? SERV.map(s => `<div class="row2" data-id="${s.id}">
    <input class="f" style="flex:2;margin:0;min-width:140px" value="${esc(s.nome)}" aria-label="Nome">
    <input class="f" style="width:110px;margin:0" type="number" min="0.01" step="0.01" value="${Number(s.preco)}" aria-label="Preço">
    <input class="f" style="width:90px;margin:0" type="number" min="5" step="5" value="${s.duracao_min}" aria-label="Duração em minutos">
    <button class="btn sm" data-a="salvar">Salvar</button><button class="btn sec sm" data-a="remover">Remover</button></div>`).join('') : vazio('Nenhum serviço cadastrado. Adicione o primeiro acima.');
}
async function gastos() {
  if (INFO.restrito) { $('#gs').innerHTML = vazio('Você pode lançar gastos normalmente. A lista fica disponível após o pagamento da mensalidade.'); return; }
  const l = await sb.from('despesa').select('id,descricao,categoria,valor,data_despesa').order('data_despesa', {ascending: false}).order('id', {ascending: false}).limit(20).then(ok);
  $('#gs').innerHTML = l.length ? l.map(d => `<div class="row2"><div class="who"><b>${esc(d.descricao)}</b><small>${esc(CATS[d.categoria] || d.categoria)}, ${dataBR(d.data_despesa)}</small></div><b>${brl(d.valor)}</b><button class="btn sec sm btn-excluir-lancamento" type="button" data-tipo="SAIDA" data-id="${d.id}" aria-label="Excluir gasto ${esc(d.descricao)}">Excluir</button></div>`).join('') : vazio('Nenhum gasto lançado ainda.');
}

// ---------- Navegação e eventos ----------
const PAGINAS = {
  painel: ['Início', ''], relatorios: ['Relatórios', 'Como a barbearia está indo'], agenda: ['Agenda', 'Horários do dia'],
  caixa: ['Caixa', 'Abertura, sangrias e fechamento'], clube: ['Clube', 'Assinantes e planos'], servicos: ['Serviços', 'Preços e duração'],
  barbeiros: ['Barbeiros', 'Equipe e comissões'], estoque: ['Estoque', 'Produtos de uso e de venda'], gastos: ['Gastos', 'Saídas da barbearia'],
};
let ABA = 'painel';
function aba(nome) {
  if (!PAGINAS[nome]) return;
  ABA = nome;
  document.querySelectorAll('#tabs [data-t], #bottom-nav [data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === nome)));
  $('#bn-mais').setAttribute('aria-pressed', String(!document.querySelector(`#bottom-nav [data-t="${nome}"]`)));
  const travada = RECURSO_DA_PAGINA[nome] && !tem(RECURSO_DA_PAGINA[nome]);
  Object.keys(PAGINAS).forEach(n => $('#v-' + n).hidden = travada || n !== nome);
  $('#v-pro').hidden = !travada;
  if (travada) mostrarUpgrade(nome);
  $('#page-title').textContent = PAGINAS[nome][0];
  $('#sub').textContent = nome === 'painel' ? 'Resumo ' + {hoje: 'de hoje', semana: 'da semana', mes: 'do mês'}[PER] : PAGINAS[nome][1];
  $('#per').hidden = nome !== 'painel';
  fecharMenu();
  window.scrollTo({top: 0});
  const carregar = {agenda, servicos, gastos, barbeiros, estoque, caixa, clube, relatorios}[nome];
  if (carregar && !travada) seguro(carregar);
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) aba(b.dataset.t); });
$('#bottom-nav').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) aba(b.dataset.t); });

// Menu deslizante (celular)
function abrirMenu() { $('#tela-app').classList.add('menu-aberto'); $('#scrim').hidden = false; $('#menu-fechar').focus(); }
function fecharMenu() { $('#tela-app').classList.remove('menu-aberto'); $('#scrim').hidden = true; }
['#menu-abrir', '#bn-mais'].forEach(s => $(s).addEventListener('click', abrirMenu));
['#menu-fechar', '#scrim'].forEach(s => $(s).addEventListener('click', fecharMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#tela-app').classList.contains('menu-aberto')) fecharMenu(); });

// Esconder valores (olho), lembrado neste aparelho
function aplicarOlho(ocultar) {
  document.body.classList.toggle('ocultar', ocultar);
  $('#olho').setAttribute('aria-pressed', String(ocultar));
  $('#olho').setAttribute('aria-label', ocultar ? 'Mostrar valores' : 'Esconder valores');
  $('#olho').innerHTML = `<svg class="i" aria-hidden="true"><use href="#i-${ocultar ? 'eye-off' : 'eye'}"/></svg>`;
}
aplicarOlho(guarda('cortepay-ocultar') === '1');
$('#olho').addEventListener('click', () => { const o = !document.body.classList.contains('ocultar'); guarda('cortepay-ocultar', o ? '1' : '0'); aplicarOlho(o); });

// Atalhos do início
$('.atalhos').addEventListener('click', e => {
  const b = e.target.closest('[data-atalho]'); if (!b) return;
  const a = b.dataset.atalho;
  if (a === 'atendimento') $('#novo').click();
  else if (a === 'horario') { aba('agenda'); $('#novo-ag').click(); }
  else if (a === 'vender') $('#nova-venda').click();
  else if (a === 'gasto') { aba('gastos'); setTimeout(() => $('#gs-d').focus(), 50); }
  else aba(a);
});

// Dica ao passar o mouse ou tocar em barras e células dos gráficos
document.addEventListener('pointerover', e => {
  const el = e.target.closest('[data-tip]'), tip = $('#tip');
  if (!el) { tip.hidden = true; return; }
  tip.textContent = el.dataset.tip; tip.hidden = false;
  const r = el.getBoundingClientRect(), w = tip.offsetWidth;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  tip.style.top = Math.max(8, r.top - tip.offsetHeight - 8) + 'px';
});
document.addEventListener('scroll', () => { $('#tip').hidden = true; }, {passive: true});
$('#per').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  PER = b.dataset.p; document.querySelectorAll('#per button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  marca(); [painel, ranking].forEach(f => seguro(f));
});
$('#sair').addEventListener('click', sair);
$('#tpl').addEventListener('input', chamarRender); $('#promo').addEventListener('input', chamarRender);
$('#chm').addEventListener('click', e => {
  const a = e.target.closest('a.wa'); if (!a) return;
  seguro(async () => {
    await sb.from('contato').insert({cliente_id: Number(a.dataset.id), promocao: $('#promo').value.trim() || 'sem promoção'}).then(ok);
    setTimeout(() => { seguro(atrasados); seguro(resultado); }, 600);
  });
});

// Clientes já cadastrados: usados para preencher nome e telefone no novo atendimento.
let CLIENTES_AT = [];
async function carregarClientesAtendimento() {
  CLIENTES_AT = await sb.from('cliente').select('id,nome,telefone').order('nome').limit(1000).then(ok);
  const sel = $('#at-cliente-existente');
  const atual = sel.value;
  sel.innerHTML = '<option value="">Novo cliente — preencher os dados abaixo</option>' +
    CLIENTES_AT.map(c => `<option value="${c.id}">${esc(c.nome)} — ${esc(c.telefone)}</option>`).join('');
  if (CLIENTES_AT.some(c => String(c.id) === atual)) sel.value = atual;
}
$('#at-cliente-existente').addEventListener('change', () => {
  const c = CLIENTES_AT.find(x => String(x.id) === $('#at-cliente-existente').value);
  if (!c) return;
  $('#at-n').value = c.nome;
  $('#at-t').value = c.telefone;
  $('#at-cliente-ajuda').textContent = 'Dados preenchidos a partir do cadastro do cliente. Você pode editá-los se necessário.';
});
['at-n', 'at-t'].forEach(id => $('#' + id).addEventListener('input', () => {
  // Se os dados forem alterados manualmente, limpa a seleção para evitar confusão.
  const sel = $('#at-cliente-existente');
  if (sel.value) sel.value = '';
  $('#at-cliente-ajuda').textContent = 'Selecione um cliente salvo para preencher nome e telefone automaticamente.';
}));

// Novo atendimento
function totalServico(preco, idDesc) {
  const p = Number(preco) || 0, d = Math.min(Math.max(Number($(idDesc).value) || 0, 0), p);
  return p - d;
}
function totalAt() {
  const s = SERV.find(x => String(x.id) === $('#at-s').value);
  $('#at-tot').textContent = brl((s && !BENEF.at ? totalServico(s.preco, '#at-d') : 0) + totalItens('at'));
}
function benefAt() {
  const cli = Number($('#at-cliente-existente').value) || null;
  atualizarBenef('at', {p_cliente: cli, p_telefone: cli ? null : $('#at-t').value, p_servico: Number($('#at-s').value) || null});
}
['at-cliente-existente', 'at-s', 'at-t'].forEach(i => $('#' + i).addEventListener('change', benefAt));
$('#novo').addEventListener('click', () => seguro(async () => {
  await Promise.all([carregarServicos(), carregarClientesAtendimento(), carregarBase()]);
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#at-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${brl(s.preco)})</option>`).join('');
  $('#at-f').innerHTML = opcoes(FORMAS); $('#at-err').textContent = '';
  $('#at-cliente-existente').value = ''; $('#at-n').value = ''; $('#at-t').value = ''; $('#at-d').value = 0;
  $('#at-cliente-ajuda').textContent = 'Selecione um cliente salvo para preencher nome e telefone automaticamente.';
  preencherBarbeiros('#at-b'); iniciarItens('at', totalAt);
  BENEF.at = null; $('#at-benef').hidden = true; $('#at-nasc').value = ''; $('#at-nasc-box').open = false;
  totalAt(); $('#dAt').showModal();
}));
['at-s', 'at-d'].forEach(i => $('#' + i).addEventListener('input', totalAt));
$('#fAt').addEventListener('submit', async e => {
  e.preventDefault(); $('#at-err').textContent = '';
  const b = e.submitter || $('#fAt button:not([type])'); b.disabled = true;
  try {
    await rpc('registrar_atendimento_v3', {p_nome: $('#at-n').value, p_telefone: $('#at-t').value, p_servico: Number($('#at-s').value),
      p_desconto: BENEF.at ? 0 : Number($('#at-d').value) || 0, p_forma: $('#at-f').value, p_barbeiro: barbeiroEscolhido('#at-b'),
      p_produtos: itensParaEnviar('at'), p_beneficio: BENEF.at, p_nascimento: $('#at-nasc').value || null});
    $('#dAt').close(); $('#fAt').reset(); $('#at-cliente-ajuda').textContent = 'Selecione um cliente salvo para preencher nome e telefone automaticamente.'; toast('Atendimento salvo.'); tudoDoPainel();
  } catch (x) { $('#at-err').textContent = x.message; }
  finally { b.disabled = false; }
});

// Agenda
$('#dia').addEventListener('change', e => { DIA = e.target.value || hojeISO(); seguro(agenda); });
$('#dia-ant').addEventListener('click', () => { DIA = maisDia(DIA, -1); seguro(agenda); });
$('#dia-prox').addEventListener('click', () => { DIA = maisDia(DIA, 1); seguro(agenda); });
$('#ag-filtro').addEventListener('change', () => seguro(agenda));
$('#novo-ag').addEventListener('click', () => seguro(async () => {
  await Promise.all([carregarServicos(), carregarBase()]);
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#ag-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${s.duracao_min} min)</option>`).join('');
  preencherBarbeiros('#ag-b', $('#ag-filtro').value);
  $('#ag-dt').value = DIA; $('#ag-err').textContent = ''; await livres(); $('#dAg').showModal();
}));
['ag-s', 'ag-dt', 'ag-b'].forEach(i => $('#' + i).addEventListener('change', () => seguro(livres)));
$('#fAg').addEventListener('submit', async e => {
  e.preventDefault(); $('#ag-err').textContent = '';
  if (!$('#ag-h').value) { $('#ag-err').textContent = 'Escolha um horário livre.'; return; }
  try {
    await rpc('agenda_marcar_v2', {p_nome: $('#ag-n').value, p_telefone: $('#ag-t').value, p_servico: Number($('#ag-s').value),
      p_inicio: $('#ag-dt').value + 'T' + $('#ag-h').value + ':00', p_barbeiro: barbeiroEscolhido('#ag-b')});
    DIA = $('#ag-dt').value; $('#dAg').close(); $('#fAg').reset(); toast('Horário marcado.'); seguro(agenda);
  } catch (x) { $('#ag-err').textContent = x.message; }
});
let CONCLUIR_SERV = null;
function totalCon() { $('#co-tot').textContent = brl((BENEF.co ? 0 : totalServico(CONCLUIR_SERV?.preco, '#co-d')) + totalItens('co')); }
$('#co-d').addEventListener('input', totalCon);
$('#ag').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  if (b.dataset.a === 'concluir') {
    const a = AGENDA.find(x => String(x.id) === b.dataset.id);
    CONCLUIR = b.dataset.id; CONCLUIR_SERV = a?.servico || null;
    $('#co-info').textContent = a ? `${a.cliente?.nome || ''} · ${a.servico?.nome || ''} · ${hora(a.inicio)}` : '';
    $('#co-f').innerHTML = opcoes(FORMAS); $('#co-d').value = 0; $('#co-err').textContent = '';
    preencherBarbeiros('#co-b', a?.barbeiro_id); iniciarItens('co', totalCon);
    BENEF.co = null; $('#co-benef').hidden = true; totalCon();
    if (a) atualizarBenef('co', {p_cliente: a.cliente_id, p_servico: a.servico_id});
    $('#dCon').showModal(); return;
  }
  seguro(async () => { await sb.from('agendamento').update({status: b.dataset.a}).eq('id', Number(b.dataset.id)).then(ok); await agenda(); });
});
$('#fCon').addEventListener('submit', async e => {
  e.preventDefault(); $('#co-err').textContent = '';
  try {
    await rpc('agenda_concluir_v3', {p_id: Number(CONCLUIR), p_desconto: BENEF.co ? 0 : Number($('#co-d').value) || 0, p_forma: $('#co-f').value, p_beneficio: BENEF.co,
      p_barbeiro: barbeiroEscolhido('#co-b'), p_produtos: itensParaEnviar('co')});
    $('#dCon').close(); toast('Atendimento concluído.'); seguro(agenda); tudoDoPainel();
  } catch (x) { $('#co-err').textContent = x.message; }
});

// Serviços
$('#fSv').addEventListener('submit', e => {
  e.preventDefault();
  seguro(async () => {
    await sb.from('servico').insert({nome: $('#sv-n').value.trim(), preco: Number($('#sv-p').value), duracao_min: Number($('#sv-d').value) || 30}).then(ok);
    $('#fSv').reset(); $('#sv-d').value = 30; toast('Serviço adicionado.'); await servicos();
  });
});
$('#sv').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const lin = b.closest('[data-id]'), id = Number(lin.dataset.id), c = lin.querySelectorAll('input');
  seguro(async () => {
    if (b.dataset.a === 'remover') {
      if (!confirm('Remover este serviço? O histórico de atendimentos continua guardado.')) return;
      await sb.from('servico').update({ativo: false}).eq('id', id).then(ok);
    } else { await sb.from('servico').update({nome: c[0].value.trim(), preco: Number(c[1].value), duracao_min: Number(c[2].value) || 30}).eq('id', id).then(ok); toast('Serviço salvo.'); }
    await servicos();
  });
});

// Gastos
$('#gs-c').innerHTML = opcoes(CATS); $('#gs-dt').value = hojeISO();
$('#fGs').addEventListener('submit', e => {
  e.preventDefault();
  seguro(async () => {
    await sb.from('despesa').insert({descricao: $('#gs-d').value.trim(), categoria: $('#gs-c').value, valor: Number($('#gs-v').value), data_despesa: $('#gs-dt').value || hojeISO()}).then(ok);
    $('#fGs').reset(); $('#gs-dt').value = hojeISO(); toast('Gasto salvo.'); await gastos(); seguro(painel);
  });
});

// Configurar barbearia
function reduzir(arquivo) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => {
      const q = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 160;
      c.getContext('2d').drawImage(im, (im.width - q) / 2, (im.height - q) / 2, q, q, 0, 0, 160, 160);
      res(c.toDataURL('image/jpeg', 0.85)); }; im.onerror = rej; im.src = r.result; };
    r.onerror = rej; r.readAsDataURL(arquivo);
  });
}
$('#cfg').addEventListener('click', () => {
  $('#cf-n').value = INFO.nome; $('#cf-a').checked = INFO.usa_agendamento;
  $('#cf-ab').value = INFO.abre.slice(0, 5); $('#cf-fe').value = INFO.fecha.slice(0, 5);
  $('#cf-fid').checked = INFO.fidelidade_meta != null; $('#cf-fid-n').value = INFO.fidelidade_meta || 10; $('#cf-fid-box').hidden = !$('#cf-fid').checked;
  $('#cf-l').value = ''; NOVALOGO = null; $('#cf-err').textContent = ''; $('#dCfg').showModal();
});
$('#cf-l').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try { NOVALOGO = await reduzir(f); } catch (x) { $('#cf-err').textContent = 'Não foi possível ler essa imagem.'; }
});
$('#fCfg').addEventListener('submit', async e => {
  e.preventDefault();
  const ab = $('#cf-ab').value || INFO.abre.slice(0, 5), fe = $('#cf-fe').value || INFO.fecha.slice(0, 5);
  if (ab >= fe) { $('#cf-err').textContent = 'O horário de abertura deve ser antes do fechamento.'; return; }
  try {
    const meta = Number($('#cf-fid-n').value);
    if ($('#cf-fid').checked && !(meta >= 2 && meta <= 100)) { $('#cf-err').textContent = 'Fidelidade: informe um número entre 2 e 100.'; return; }
    const dados = {nome: $('#cf-n').value.trim(), usa_agendamento: $('#cf-a').checked, abre: ab, fecha: fe, fidelidade_meta: $('#cf-fid').checked ? meta : null};
    if (NOVALOGO) dados.logo = NOVALOGO;
    await sb.from('barbearia').update(dados).eq('id', INFO.id).then(ok);
    const b = await sb.from('barbearia').select('id,nome,logo,vencimento,usa_agendamento,abre,fecha,fidelidade_meta').maybeSingle().then(ok);
    INFO = {...INFO, ...b}; $('#dCfg').close(); marca(); toast('Configuração salva.');
  } catch (x) { $('#cf-err').textContent = x.message; }
});

// ======================= BARBEIROS, PRODUTOS, COMANDA E CAIXA =======================
async function carregarBase() {
  [BARB, PROD] = await Promise.all([
    sb.from('barbeiro').select('id,nome,telefone,comissao_servico,comissao_produto,ativo').order('nome').then(ok),
    sb.from('produto').select('id,nome,tipo,unidade,custo,preco_venda,estoque,estoque_minimo,ativo').order('nome').then(ok)]);
  if (!tem('barbeiros')) BARB = [];
  if (!tem('estoque')) PROD = [];
  const baixo = PROD.filter(p => p.ativo && Number(p.estoque) <= Number(p.estoque_minimo));
  $('#card-estoque-baixo').hidden = !baixo.length;
  $('#estoque-baixo').innerHTML = baixo.map(p => `<div class="row2"><div class="who"><b>${esc(p.nome)}</b><small>${esc(TIPOS_PROD[p.tipo])}</small></div><span class="chip red">${qtd(p.estoque)} ${esc(p.unidade)} (mínimo ${qtd(p.estoque_minimo)})</span><button class="btn sec sm" type="button" data-ir-estoque>Ver estoque</button></div>`).join('');
}
$('#estoque-baixo').addEventListener('click', e => { if (e.target.closest('[data-ir-estoque]')) aba('estoque'); });

// Select de barbeiro nos formulários (some quando não há barbeiros cadastrados)
function preencherBarbeiros(sel, escolhido) {
  const el = $(sel), lista = BARB_ATIVOS(), opcional = sel === '#vd-b';
  el.closest('.so-barbeiros').hidden = !lista.length;
  el.innerHTML = (opcional ? '<option value="">Sem comissão</option>' : lista.length > 1 ? '<option value="">Escolha o barbeiro</option>' : '')
    + lista.map(b => `<option value="${b.id}">${esc(b.nome)}</option>`).join('');
  if (escolhido && lista.some(b => String(b.id) === String(escolhido))) el.value = String(escolhido);
}
const barbeiroEscolhido = sel => BARB_ATIVOS().length ? Number($(sel).value) || null : null;

// ---------- Produtos vendidos junto (comanda) ----------
const ITENS = {at: [], co: [], vd: []}, AO_MUDAR = {};
const vendaveis = () => PROD.filter(p => p.ativo && p.tipo !== 'USO');
function iniciarItens(k, aoMudar) {
  ITENS[k] = []; AO_MUDAR[k] = aoMudar;
  const box = document.querySelector(`[data-itens="${k}"]`), lista = vendaveis();
  box.hidden = !lista.length && k !== 'vd';
  box.innerHTML = `<label class="lab">${k === 'vd' ? 'Produtos' : 'Produtos vendidos junto (opcional)'}</label>
    <div class="itens-add"><select class="f it-prod" aria-label="Produto">${lista.length ? lista.map(p => `<option value="${p.id}"${Number(p.estoque) <= 0 ? ' disabled' : ''}>${esc(p.nome)} · ${brl(p.preco_venda)} (${qtd(p.estoque)} em estoque)</option>`).join('') : '<option value="">Nenhum produto para venda</option>'}</select>
    <input class="f it-qtd" type="number" min="1" step="1" value="1" aria-label="Quantidade"><button type="button" class="btn sec sm it-add">Adicionar</button></div>
    <div class="it-lista"></div>`;
  const primeiro = lista.find(p => Number(p.estoque) > 0); if (primeiro) box.querySelector('.it-prod').value = primeiro.id;
  desenharItens(k);
}
function desenharItens(k) {
  const box = document.querySelector(`[data-itens="${k}"]`);
  box.querySelector('.it-lista').innerHTML = ITENS[k].map((i, n) => {
    const p = PROD.find(x => x.id === i.id);
    return `<div class="row2"><div class="who"><b>${esc(p?.nome)}</b><small>${qtd(i.q)} x ${brl(p?.preco_venda)}</small></div><b>${brl(Number(p?.preco_venda) * i.q)}</b><button type="button" class="btn-x" data-rm="${n}" aria-label="Remover">✕</button></div>`;
  }).join('');
  AO_MUDAR[k]?.();
}
const totalItens = k => soma(ITENS[k].map(i => Number(PROD.find(p => p.id === i.id)?.preco_venda || 0) * i.q));
const itensParaEnviar = k => ITENS[k].map(i => ({produto_id: i.id, quantidade: i.q}));
document.addEventListener('click', e => {
  const box = e.target.closest('[data-itens]'); if (!box) return;
  const k = box.dataset.itens;
  if (e.target.closest('.it-add')) {
    const id = Number(box.querySelector('.it-prod').value), q = Number(box.querySelector('.it-qtd').value);
    const p = PROD.find(x => x.id === id);
    if (!p) return;
    if (!(q > 0)) { toast('Informe a quantidade.', true); return; }
    const ja = ITENS[k].find(i => i.id === id), total = (ja ? ja.q : 0) + q;
    if (total > Number(p.estoque)) { toast(`Só há ${qtd(p.estoque)} ${p.unidade} de ${p.nome} em estoque.`, true); return; }
    if (ja) ja.q = total; else ITENS[k].push({id, q});
    box.querySelector('.it-qtd').value = 1; desenharItens(k);
  }
  const rm = e.target.closest('[data-rm]');
  if (rm) { ITENS[k].splice(Number(rm.dataset.rm), 1); desenharItens(k); }
});

// ---------- Barbeiros ----------
async function barbeiros() {
  await carregarBase();
  $('#bb').innerHTML = BARB.length ? BARB.map(b => `<div class="row2 edit-linha" data-id="${b.id}">
    <input class="f nome" value="${esc(b.nome)}" aria-label="Nome" maxlength="80">
    <input class="f tel" value="${esc(b.telefone || '')}" type="tel" aria-label="WhatsApp" placeholder="WhatsApp" maxlength="20">
    <label class="lab">Serviços %<input class="f pct" type="number" min="0" max="100" step="0.5" value="${Number(b.comissao_servico)}"></label>
    <label class="lab">Produtos %<input class="f pct" type="number" min="0" max="100" step="0.5" value="${Number(b.comissao_produto)}"></label>
    ${b.ativo ? '' : '<span class="chip">Inativo</span>'}
    <div class="acts"><button class="btn sm" data-a="salvar">Salvar</button><button class="btn sec sm" data-a="com">% por serviço</button>
    <button class="btn sec sm" data-a="ativo">${b.ativo ? 'Desativar' : 'Reativar'}</button></div></div>`).join('')
    : vazio('Nenhum barbeiro cadastrado. Enquanto não houver barbeiros, a agenda continua única, como antes.');
  await comissoes();
}
$('#fBb').addEventListener('submit', e => {
  e.preventDefault();
  seguro(async () => {
    await sb.from('barbeiro').insert({nome: $('#bb-n').value.trim(), telefone: $('#bb-t').value.trim() || null,
      comissao_servico: Number($('#bb-cs').value) || 0, comissao_produto: Number($('#bb-cp').value) || 0}).then(ok);
    $('#bb-n').value = ''; $('#bb-t').value = ''; toast('Barbeiro cadastrado.'); await barbeiros();
  });
});
let BB_COM = null;
$('#bb').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const lin = b.closest('[data-id]'), id = Number(lin.dataset.id), bb = BARB.find(x => x.id === id), c = lin.querySelectorAll('input');
  seguro(async () => {
    if (b.dataset.a === 'salvar') {
      await sb.from('barbeiro').update({nome: c[0].value.trim(), telefone: c[1].value.trim() || null,
        comissao_servico: Number(c[2].value) || 0, comissao_produto: Number(c[3].value) || 0}).eq('id', id).then(ok);
      toast('Barbeiro salvo.');
    } else if (b.dataset.a === 'ativo') {
      if (bb.ativo && !confirm(`Desativar ${bb.nome}? Ele deixa de aparecer na agenda e no link de agendamento. O histórico e as comissões continuam guardados.`)) return;
      await sb.from('barbeiro').update({ativo: !bb.ativo}).eq('id', id).then(ok);
    } else if (b.dataset.a === 'com') {
      await carregarServicos();
      const atuais = await sb.from('barbeiro_comissao_servico').select('servico_id,percentual').eq('barbeiro_id', id).then(ok);
      BB_COM = {id, atuais: Object.fromEntries(atuais.map(a => [a.servico_id, Number(a.percentual)]))};
      $('#bbc-tit').textContent = 'Comissão por serviço · ' + bb.nome; $('#bbc-err').textContent = '';
      $('#bbc-lista').innerHTML = SERV.length ? SERV.map(s => `<div class="row2"><div class="who"><b>${esc(s.nome)}</b><small>${brl(s.preco)}</small></div>
        <input class="f pct" style="margin:0" type="number" min="0" max="100" step="0.5" data-sv="${s.id}" value="${BB_COM.atuais[s.id] ?? ''}" placeholder="${Number(bb.comissao_servico)}%" aria-label="% em ${esc(s.nome)}"></div>`).join('')
        : vazio('Cadastre os serviços primeiro.');
      $('#dBbCom').showModal(); return;
    }
    await barbeiros();
  });
});
$('#fBbCom').addEventListener('submit', async e => {
  e.preventDefault(); $('#bbc-err').textContent = '';
  try {
    for (const inp of document.querySelectorAll('#bbc-lista [data-sv]')) {
      const sv = Number(inp.dataset.sv), v = inp.value === '' ? null : Number(inp.value);
      if ((BB_COM.atuais[sv] ?? null) === v) continue;
      await rpc('barbeiro_comissao_definir', {p_barbeiro: BB_COM.id, p_servico: sv, p_percentual: v});
    }
    $('#dBbCom').close(); toast('Comissões salvas.');
  } catch (x) { $('#bbc-err').textContent = x.message; }
});

// ---------- Comissões ----------
let COMISSOES = [], BB_LANC = null;
(function () { const [a, b] = intervalo('mes'); $('#cm-de').value = a; $('#cm-ate').value = b; })();
['cm-de', 'cm-ate'].forEach(i => $('#' + i).addEventListener('change', () => seguro(comissoes)));
async function comissoes() {
  if (INFO.restrito) { $('#cm').innerHTML = vazio('Disponível após o pagamento da mensalidade.'); return; }
  if (!BARB.length) { $('#cm').innerHTML = vazio('Cadastre os barbeiros acima para acompanhar as comissões.'); return; }
  const de = $('#cm-de').value, ate = $('#cm-ate').value;
  if (!de || !ate || de > ate) { $('#cm').innerHTML = vazio('Escolha um período válido.'); return; }
  COMISSOES = await rpc('comissoes_resumo', {p_de: de, p_ate: ate});
  $('#cm').innerHTML = COMISSOES.map(c => {
    const periodo = Number(c.comissao_servicos) + Number(c.comissao_produtos), saldo = Number(c.saldo);
    return `<div class="row2" data-id="${c.barbeiro_id}"><span class="av">${esc((c.nome || '?')[0])}</span>
      <div class="who"><b>${esc(c.nome)}${c.ativo ? '' : ' (inativo)'}</b>
        <small>${c.atendimentos} ${Number(c.atendimentos) === 1 ? 'atendimento' : 'atendimentos'} · serviços ${brl(c.servicos_valor)} · produtos ${brl(c.produtos_valor)}</small>
        <div class="num-linha">
          <div><p class="lab">Comissão no período</p><p class="num">${brl(periodo)}</p></div>
          <div><p class="lab">Vales no período</p><p class="num">${brl(c.vales)}</p></div>
          <div><p class="lab">Pago no período</p><p class="num">${brl(c.pagos)}</p></div>
        </div></div>
      <span class="chip ${saldo > 0 ? 'warn' : saldo < 0 ? 'red' : 'ok'} saldo-ch">${saldo < 0 ? 'Adiantado ' + brl(-saldo) : 'A receber ' + brl(saldo)}</span>
      <div class="acts"><button class="btn sec sm" data-a="VALE">Vale</button><button class="btn sm" data-a="PAGAMENTO">Pagar</button>
      ${BARB.find(b => b.id === c.barbeiro_id)?.telefone ? '<button class="btn sec sm" data-a="extrato">Enviar extrato</button>' : ''}</div></div>`;
  }).join('');
}
$('#cm').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const id = Number(b.closest('[data-id]').dataset.id), c = COMISSOES.find(x => x.barbeiro_id === id), bb = BARB.find(x => x.id === id);
  if (b.dataset.a === 'extrato') {
    const de = $('#cm-de').value, ate = $('#cm-ate').value;
    const msg = `Olá, ${bb.nome.split(' ')[0]}! Extrato de comissões da ${INFO.nome} de ${dataBR(de)} a ${dataBR(ate)}:\n`
      + `• Atendimentos: ${c.atendimentos} (comissão ${brl(c.comissao_servicos)})\n• Produtos: comissão ${brl(c.comissao_produtos)}\n`
      + `• Vales: ${brl(c.vales)}\n• Pago: ${brl(c.pagos)}\nSaldo a receber: ${brl(Math.max(0, c.saldo))}`;
    window.open(`https://wa.me/${whats(bb.telefone)}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    return;
  }
  BB_LANC = {id, tipo: b.dataset.a};
  $('#bbl-tit').textContent = (b.dataset.a === 'VALE' ? 'Vale para ' : 'Pagar comissão de ') + bb.nome;
  $('#bbl-info').textContent = 'Saldo a receber hoje: ' + brl(c.saldo);
  $('#bbl-v').value = b.dataset.a === 'PAGAMENTO' && Number(c.saldo) > 0 ? Number(c.saldo).toFixed(2) : '';
  $('#bbl-d').value = ''; $('#bbl-err').textContent = ''; $('#dBbLanc').showModal();
});
$('#fBbLanc').addEventListener('submit', async e => {
  e.preventDefault(); $('#bbl-err').textContent = '';
  try {
    await rpc('barbeiro_lancar', {p_barbeiro: BB_LANC.id, p_tipo: BB_LANC.tipo, p_valor: Number($('#bbl-v').value), p_descricao: $('#bbl-d').value});
    $('#dBbLanc').close(); toast(BB_LANC.tipo === 'VALE' ? 'Vale registrado.' : 'Pagamento registrado.');
    await comissoes(); seguro(painel);
  } catch (x) { $('#bbl-err').textContent = x.message; }
});

// ---------- Estoque ----------
$('#pr-tp').innerHTML = opcoes(TIPOS_PROD); $('#pd-tp').innerHTML = opcoes(TIPOS_PROD);
async function estoque() {
  await carregarBase();
  $('#pr').innerHTML = PROD.length ? PROD.map(p => {
    const baixo = p.ativo && Number(p.estoque) <= Number(p.estoque_minimo);
    return `<div class="row2" data-id="${p.id}"><div class="who"><b>${esc(p.nome)}${p.ativo ? '' : ' (inativo)'}</b>
      <small>${esc(TIPOS_PROD[p.tipo])} · custo ${brl(p.custo)}${p.tipo !== 'USO' ? ' · venda ' + brl(p.preco_venda) : ''}</small></div>
      <span class="chip ${baixo ? 'red' : 'ok'}">${qtd(p.estoque)} ${esc(p.unidade)}</span>
      <div class="acts"><button class="btn sm" data-a="ENTRADA">Entrada</button><button class="btn sec sm" data-a="mov">Saída/ajuste</button>
      <button class="btn sec sm" data-a="hist">Histórico</button><button class="btn sec sm" data-a="editar">Editar</button></div></div>`;
  }).join('') : vazio('Nenhum produto cadastrado ainda.');
  if (INFO.restrito) { $('#vd-lista').innerHTML = vazio('Disponível após o pagamento da mensalidade.'); return; }
  const vs = await sb.from('venda_item').select('id,produto_nome,quantidade,valor_total,forma_pagamento,data_hora,atendimento_id,cliente(nome),barbeiro(nome)').order('data_hora', {ascending: false}).limit(20).then(ok);
  $('#vd-lista').innerHTML = vs.length ? vs.map(v => `<div class="row2"><div class="who"><b>${esc(v.produto_nome)} × ${qtd(v.quantidade)}</b>
    <small>${dataHoraBR(v.data_hora)}${v.cliente?.nome ? ' · ' + esc(v.cliente.nome) : ''}${v.barbeiro?.nome ? ' · ' + esc(v.barbeiro.nome) : ''}${v.atendimento_id ? ' · junto com atendimento' : ''}</small></div>
    <span class="chip">${esc(FORMAS[v.forma_pagamento] || '')}</span><b>${brl(v.valor_total)}</b>
    ${v.atendimento_id ? '' : `<button class="btn sec sm btn-excluir-lancamento" type="button" data-tipo="VENDA" data-id="${v.id}">Excluir</button>`}</div>`).join('')
    : vazio('Nenhuma venda de produto ainda.');
}
$('#fPr').addEventListener('submit', e => {
  e.preventDefault();
  seguro(async () => {
    await sb.from('produto').insert({nome: $('#pr-n').value.trim(), tipo: $('#pr-tp').value, custo: Number($('#pr-c').value) || 0,
      preco_venda: Number($('#pr-p').value) || 0, estoque_minimo: Number($('#pr-m').value) || 0}).then(ok);
    $('#pr-n').value = ''; $('#pr-c').value = 0; $('#pr-p').value = 0;
    toast('Produto cadastrado. Agora lance a quantidade em "Entrada".'); await estoque();
  });
});
let MOV = null, EDIT_PROD = null;
function ajustarMov() {
  const t = $('#mv-t').value;
  $('#mv-entrada').hidden = t !== 'ENTRADA';
  $('#mv-q-lab').textContent = t === 'AJUSTE' ? 'Quantidade contada agora (o estoque passa a ser este número)' : t === 'CONSUMO' ? 'Quantidade usada' : 'Quantidade que entrou';
  $('#mv-q').min = t === 'AJUSTE' ? 0 : 1;
}
$('#mv-t').addEventListener('change', ajustarMov);
$('#pr').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const p = PROD.find(x => x.id === Number(b.closest('[data-id]').dataset.id)); if (!p) return;
  if (b.dataset.a === 'editar') {
    EDIT_PROD = p.id; $('#pd-n').value = p.nome; $('#pd-tp').value = p.tipo; $('#pd-c').value = Number(p.custo);
    $('#pd-p').value = Number(p.preco_venda); $('#pd-m').value = Number(p.estoque_minimo); $('#pd-a').checked = p.ativo;
    $('#pd-err').textContent = ''; $('#dProd').showModal(); return;
  }
  if (b.dataset.a === 'hist') return seguro(async () => {
    const l = await sb.from('estoque_mov').select('tipo,quantidade,saldo,custo_unit,observacao,criado_em').eq('produto_id', p.id).order('criado_em', {ascending: false}).limit(30).then(ok);
    const nomes = {ENTRADA: 'Entrada', VENDA: 'Venda', CONSUMO: 'Uso interno', AJUSTE: 'Ajuste', ESTORNO: 'Venda desfeita'};
    $('#hs-tit').textContent = 'Histórico · ' + p.nome;
    $('#hs-lista').innerHTML = l.length ? l.map(m => `<div class="row2"><div class="who"><b>${nomes[m.tipo]}</b><small>${dataHoraBR(m.criado_em)}${m.observacao ? ' · ' + esc(m.observacao) : ''}</small></div>
      <span class="chip ${Number(m.quantidade) > 0 ? 'ok' : 'red'}">${Number(m.quantidade) > 0 ? '+' : ''}${qtd(m.quantidade)}</span><span class="lab">saldo ${qtd(m.saldo)}</span></div>`).join('') : vazio('Sem movimentações.');
    $('#dHist').showModal();
  });
  MOV = p.id; $('#mv-tit').textContent = p.nome; $('#mv-info').textContent = `Em estoque: ${qtd(p.estoque)} ${p.unidade}`;
  $('#mv-t').value = b.dataset.a === 'ENTRADA' ? 'ENTRADA' : 'CONSUMO';
  $('#mv-q').value = ''; $('#mv-c').value = Number(p.custo) || ''; $('#mv-g').checked = true; $('#mv-o').value = ''; $('#mv-err').textContent = '';
  ajustarMov(); $('#dMov').showModal();
});
$('#fMov').addEventListener('submit', async e => {
  e.preventDefault(); $('#mv-err').textContent = '';
  const t = $('#mv-t').value;
  try {
    await rpc('estoque_movimentar', {p_produto: MOV, p_tipo: t, p_quantidade: Number($('#mv-q').value),
      p_custo_unit: t === 'ENTRADA' && $('#mv-c').value !== '' ? Number($('#mv-c').value) : null,
      p_observacao: $('#mv-o').value, p_lancar_gasto: t === 'ENTRADA' && $('#mv-g').checked});
    $('#dMov').close(); toast('Estoque atualizado.'); await estoque(); seguro(painel);
  } catch (x) { $('#mv-err').textContent = x.message; }
});
$('#fProd').addEventListener('submit', async e => {
  e.preventDefault(); $('#pd-err').textContent = '';
  try {
    await sb.from('produto').update({nome: $('#pd-n').value.trim(), tipo: $('#pd-tp').value, custo: Number($('#pd-c').value) || 0,
      preco_venda: Number($('#pd-p').value) || 0, estoque_minimo: Number($('#pd-m').value) || 0, ativo: $('#pd-a').checked}).eq('id', EDIT_PROD).then(ok);
    $('#dProd').close(); toast('Produto salvo.'); await estoque();
  } catch (x) { $('#pd-err').textContent = x.message; }
});

// ---------- Venda de produto sem atendimento ----------
function totalVd() { $('#vd-tot').textContent = brl(totalItens('vd')); }
$('#nova-venda').addEventListener('click', () => seguro(async () => {
  await carregarBase();
  if (!vendaveis().length) { toast('Cadastre um produto "Para venda" e lance a entrada no estoque primeiro.', true); return; }
  preencherBarbeiros('#vd-b'); $('#vd-f').innerHTML = opcoes(FORMAS);
  $('#vd-n').value = ''; $('#vd-t').value = ''; $('#vd-err').textContent = '';
  iniciarItens('vd', totalVd); totalVd(); $('#dVenda').showModal();
}));
$('#fVenda').addEventListener('submit', async e => {
  e.preventDefault(); $('#vd-err').textContent = '';
  if (!ITENS.vd.length) { $('#vd-err').textContent = 'Adicione pelo menos um produto.'; return; }
  try {
    await rpc('vender_produtos', {p_produtos: itensParaEnviar('vd'), p_forma: $('#vd-f').value, p_barbeiro: Number($('#vd-b').value) || null,
      p_nome: $('#vd-n').value.trim() || null, p_telefone: $('#vd-t').value.trim() || null});
    $('#dVenda').close(); toast('Venda registrada.'); await estoque(); seguro(painel);
  } catch (x) { $('#vd-err').textContent = x.message; }
});

// ---------- Caixa do dia ----------
let CAIXA = null;
async function caixa() {
  if (INFO.restrito) { $('#cx').innerHTML = vazio('Disponível após o pagamento da mensalidade.'); $('#cx-hist').innerHTML = ''; return; }
  const [c, hist] = await Promise.all([rpc('caixa_atual'),
    sb.from('caixa').select('id,aberto_em,fechado_em,valor_abertura,total_pix,total_dinheiro,total_debito,total_credito,valor_contado,diferenca,observacao').not('fechado_em', 'is', null).order('aberto_em', {ascending: false}).limit(10).then(ok)]);
  CAIXA = c;
  if (!c.aberto) {
    $('#cx').innerHTML = `<p class="sub" style="margin-bottom:12px">O caixa está fechado. Abra no começo do dia informando quanto há em dinheiro na gaveta (troco).</p>
      <form id="fCxAbrir" class="cols cols-campos"><div><label class="lab" for="cx-ab">Dinheiro na abertura (R$)</label><input id="cx-ab" class="f" type="number" min="0" step="0.01" value="0" required></div>
      <div class="cols-botao"><button class="btn">Abrir caixa</button></div></form>`;
  } else {
    const tot = Number(c.pix) + Number(c.dinheiro) + Number(c.debito) + Number(c.credito);
    $('#cx').innerHTML = `<p class="lab">Aberto em ${dataHoraBR(c.aberto_em)} · entrou desde a abertura</p>
      <p class="num cx-total">${brl(tot)}</p>
      ${kp('Pix', brl(c.pix))}${kp('Dinheiro', brl(c.dinheiro))}${kp('Débito', brl(c.debito))}${kp('Crédito', brl(c.credito))}
      ${kp('Dinheiro na abertura', brl(c.valor_abertura))}${kp('Suprimentos (+)', brl(c.suprimentos))}${kp('Sangrias (−)', brl(c.sangrias))}
      <div class="kp"><span class="lab"><b>Deve haver em dinheiro na gaveta</b></span><span class="num">${brl(c.esperado_dinheiro)}</span></div>
      ${c.movimentos.length ? '<div style="margin-top:6px">' + c.movimentos.map(m => `<div class="row2"><div class="who"><b>${m.tipo === 'SANGRIA' ? 'Sangria' : 'Suprimento'}</b><small>${dataHoraBR(m.criado_em)}${m.descricao ? ' · ' + esc(m.descricao) : ''}</small></div><b>${m.tipo === 'SANGRIA' ? '−' : '+'} ${brl(m.valor)}</b></div>`).join('') + '</div>' : ''}
      <div class="cx-acoes"><button class="btn sec sm" type="button" data-cx="SANGRIA">Sangria (retirada)</button><button class="btn sec sm" type="button" data-cx="SUPRIMENTO">Suprimento (reforço de troco)</button></div>
      <form id="fCxFechar" class="cols cols-campos">
        <div><label class="lab" for="cx-ct">Dinheiro contado na gaveta (R$)</label><input id="cx-ct" class="f" type="number" min="0" step="0.01" required></div>
        <div><label class="lab" for="cx-ob">Observação (opcional)</label><input id="cx-ob" class="f" maxlength="300"></div>
        <div class="cols-botao"><button class="btn">Fechar caixa</button></div></form>`;
  }
  $('#cx-hist').innerHTML = hist.length ? hist.map(h => {
    const tot = Number(h.total_pix) + Number(h.total_dinheiro) + Number(h.total_debito) + Number(h.total_credito), d = Number(h.diferenca);
    return `<div class="row2"><div class="who"><b>${dataHoraBR(h.aberto_em)} até ${dataHoraBR(h.fechado_em)}</b>
      <small>Pix ${brl(h.total_pix)} · Dinheiro ${brl(h.total_dinheiro)} · Débito ${brl(h.total_debito)} · Crédito ${brl(h.total_credito)}${h.observacao ? ' · ' + esc(h.observacao) : ''}</small></div>
      <b>${brl(tot)}</b><span class="chip ${d === 0 ? 'ok' : d > 0 ? 'blue' : 'red'}">${d === 0 ? 'Bateu' : d > 0 ? 'Sobrou ' + brl(d) : 'Faltou ' + brl(-d)}</span></div>`;
  }).join('') : vazio('Nenhum caixa fechado ainda.');
}
$('#cx').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'fCxAbrir') return seguro(async () => { await rpc('caixa_abrir', {p_valor: Number($('#cx-ab').value) || 0}); toast('Caixa aberto.'); await caixa(); });
  if (e.target.id === 'fCxFechar') return seguro(async () => {
    const contado = Number($('#cx-ct').value), dif = contado - Number(CAIXA.esperado_dinheiro);
    const aviso = dif === 0 ? 'O dinheiro bateu.' : dif > 0 ? `Sobrou ${brl(dif)} em dinheiro.` : `Faltou ${brl(-dif)} em dinheiro.`;
    if (!confirm(`${aviso}\n\nFechar o caixa agora?`)) return;
    await rpc('caixa_fechar', {p_contado: contado, p_observacao: $('#cx-ob').value});
    toast('Caixa fechado. ' + aviso); await caixa();
  });
});
let CX_MOV = null;
$('#cx').addEventListener('click', e => {
  const b = e.target.closest('[data-cx]'); if (!b) return;
  CX_MOV = b.dataset.cx;
  $('#cxm-tit').textContent = CX_MOV === 'SANGRIA' ? 'Sangria' : 'Suprimento';
  $('#cxm-info').textContent = CX_MOV === 'SANGRIA' ? 'Dinheiro retirado da gaveta (ex.: depósito, pagamento em dinheiro).' : 'Dinheiro colocado na gaveta (ex.: reforço de troco).';
  $('#cxm-v').value = ''; $('#cxm-d').value = ''; $('#cxm-err').textContent = ''; $('#dCxMov').showModal();
});
$('#fCxMov').addEventListener('submit', async e => {
  e.preventDefault(); $('#cxm-err').textContent = '';
  try {
    await rpc('caixa_movimentar', {p_tipo: CX_MOV, p_valor: Number($('#cxm-v').value), p_descricao: $('#cxm-d').value});
    $('#dCxMov').close(); toast('Registrado.'); await caixa();
  } catch (x) { $('#cxm-err').textContent = x.message; }
});

// ======================= CLUBE, FIDELIDADE, ANIVERSÁRIOS E LEMBRETES =======================
// ---------- Benefícios do cliente no atendimento (clube e fidelidade) ----------
const BENEF = {at: null, co: null}, BENEF_REQ = {at: 0, co: 0};
async function atualizarBenef(k, args) {
  const box = $('#' + k + '-benef'), recalcular = k === 'at' ? totalAt : totalCon;
  BENEF[k] = null;
  const tel = String(args.p_telefone || '').replace(/\D/g, '');
  if (!args.p_servico || (!args.p_cliente && tel.length < 10)) { box.hidden = true; recalcular(); return; }
  const req = ++BENEF_REQ[k];
  let b;
  try { b = await rpc('beneficios_cliente', args); } catch (e) { box.hidden = true; return; }
  if (req !== BENEF_REQ[k]) return;
  if (k === 'at' && b.nascimento && !$('#at-nasc').value) $('#at-nasc').value = b.nascimento;
  const ops = [], infos = [], c = b.clube, f = b.fidelidade;
  if (c) {
    const uso = c.usos_mes ? `${c.usados} de ${c.usos_mes} usos no mês` : `${c.usados} usos no mês (ilimitado)`;
    if (c.cobre) ops.push(['CLUBE', `Usar o clube · ${c.plano}`, uso + ` · pago até ${dataBR(c.pago_ate)}`]);
    else infos.push(!c.em_dia ? `Clube ${c.plano}: mensalidade vencida em ${dataBR(c.pago_ate)}. Receba na aba Clube para liberar.`
      : !c.cobre_servico ? `Clube ${c.plano}: este serviço não está incluído no plano.`
      : `Clube ${c.plano}: já usou os ${c.usos_mes} atendimentos deste mês.`);
  }
  if (f) {
    if (f.disponivel) ops.push(['FIDELIDADE', 'Usar o prêmio da fidelidade (serviço grátis)', `${f.contagem} de ${f.meta} atendimentos completos`]);
    else { const falta = f.meta - f.contagem; infos.push(`Fidelidade: ${f.contagem} de ${f.meta}. ${falta === 1 ? 'Falta 1 atendimento' : 'Faltam ' + falta + ' atendimentos'} para o prêmio.`); }
  }
  if (!ops.length && !infos.length) { box.hidden = true; recalcular(); return; }
  box.innerHTML = (ops.length ? `<label class="op"><input type="radio" name="${k}-bn" value="" checked><span>Cobrar normalmente</span></label>`
    + ops.map(([v, t, s]) => `<label class="op"><input type="radio" name="${k}-bn" value="${v}"><span><b>${esc(t)}</b><small>${esc(s)}</small></span></label>`).join('') : '')
    + infos.map(i => `<p class="info">${esc(i)}</p>`).join('');
  box.hidden = false;
  box.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', () => { BENEF[k] = r.value || null; recalcular(); }));
  recalcular();
}

// ---------- Lembretes dos horários de amanhã ----------
async function lembretes() {
  const card = $('#card-lembretes');
  if (!INFO.usa_agendamento || !tem('agenda') || !tem('marketing')) { card.hidden = true; return; }
  const am = maisDia(hojeISO(), 1);
  const l = await sb.from('agendamento').select('id,inicio,lembrete_em,cliente(nome,telefone),servico(nome),barbeiro(nome)')
    .eq('status', 'AGENDADO').gte('inicio', am + 'T00:00:00').lt('inicio', maisDia(am, 1) + 'T00:00:00').order('inicio').then(ok);
  card.hidden = false;
  $('#lembretes').innerHTML = l.length ? l.map(a => {
    const nome = a.cliente?.nome || '', com = a.barbeiro?.nome ? ` com ${a.barbeiro.nome}` : '';
    const msg = `Olá, ${nome.split(' ')[0]}! Passando para lembrar do seu horário amanhã (${dataBR(a.inicio)}) às ${hora(a.inicio)} na ${INFO.nome}: ${a.servico?.nome || ''}${com}. Podemos confirmar?`;
    return `<div class="row2"><div style="min-width:52px"><b>${hora(a.inicio)}</b></div><div class="who"><b>${esc(nome)}</b><small>${esc(a.servico?.nome)}${a.barbeiro?.nome ? ' · ' + esc(a.barbeiro.nome) : ''}</small></div>
      ${a.lembrete_em ? '<span class="chip ok">Lembrado</span>' : ''}
      <a class="wa" data-lembrete="${a.id}" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(a.cliente?.telefone))}?text=${encodeURIComponent(msg)}">${a.lembrete_em ? 'Lembrar de novo' : 'Lembrar no WhatsApp'}</a></div>`;
  }).join('') : vazio('Nenhum horário marcado para amanhã.');
}
$('#lembretes').addEventListener('click', e => {
  const a = e.target.closest('a[data-lembrete]'); if (!a) return;
  seguro(async () => { await rpc('agenda_lembrete', {p_id: Number(a.dataset.lembrete)}); setTimeout(() => seguro(lembretes), 800); });
});

// ---------- Aniversariantes (hoje até 7 dias) ----------
let ANIV = [];
async function aniversariantes() {
  const l = await sb.from('cliente').select('id,nome,telefone,nascimento').not('nascimento', 'is', null).limit(5000).then(ok);
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
  ANIV = l.map(c => {
    const [, m, d] = c.nascimento.split('-').map(Number);
    let prox = new Date(hoje.getFullYear(), m - 1, d, 12);
    if (prox < hoje) prox = new Date(hoje.getFullYear() + 1, m - 1, d, 12);
    return {...c, dias: Math.round((prox - hoje) / 864e5), dia: String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0')};
  }).filter(c => c.dias <= 7).sort((a, b) => a.dias - b.dias);
  renderAniv();
}
function renderAniv() {
  const tpl = $('#tpl-aniv').value;
  $('#aniver').innerHTML = ANIV.length ? ANIV.map(c => {
    const msg = tpl.split('{nome}').join(c.nome.split(' ')[0]).split('{barbearia}').join(INFO.nome);
    const quando = c.dias === 0 ? 'Hoje! 🎂' : c.dias === 1 ? 'Amanhã' : `Em ${c.dias} dias (${c.dia})`;
    return `<div class="row2"><span class="av">${esc((c.nome || '?')[0])}</span><div class="who"><b>${esc(c.nome)}</b><small>${c.dia}</small></div>
      <span class="chip ${c.dias === 0 ? 'red' : 'blue'}">${quando}</span>
      <a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(c.telefone))}?text=${encodeURIComponent(msg)}">Parabenizar</a></div>`;
  }).join('') : vazio('Nenhum aniversariante nos próximos 7 dias. Peça a data de nascimento no atendimento ou no link de agendamento.');
}
$('#tpl-aniv').addEventListener('input', renderAniv);

// ---------- Clube de assinatura ----------
let PLANOS = [], ASSIN = [], EDIT_PLANO = null, REC = null;
const nomesServ = ids => ids.map(i => SERV.find(s => s.id === i)?.nome).filter(Boolean).join(', ') || 'nenhum serviço ativo';
function situacaoAss(a) {
  if (a.status !== 'ATIVA') return {cls: '', txt: 'Cancelada', cobrar: false};
  const d = diasEntre(hojeISO(), a.pago_ate);
  if (d < 0) return {cls: 'red', txt: `Vencida há ${-d} ${d === -1 ? 'dia' : 'dias'}`, cobrar: true};
  if (d <= 3) return {cls: 'warn', txt: d === 0 ? 'Vence hoje' : `Vence em ${d} ${d === 1 ? 'dia' : 'dias'}`, cobrar: true};
  return {cls: 'ok', txt: `Em dia até ${dataBR(a.pago_ate)}`, cobrar: false};
}
async function clube() {
  const [pl, ps, as] = await Promise.all([
    sb.from('clube_plano').select('id,nome,valor,usos_mes,ativo').order('nome').then(ok),
    sb.from('clube_plano_servico').select('plano_id,servico_id').then(ok),
    rpc('clube_assinantes'), carregarServicos()]);
  PLANOS = pl.map(p => ({...p, servicos: ps.filter(x => x.plano_id === p.id).map(x => x.servico_id)}));
  ASSIN = as;
  $('#planos').innerHTML = PLANOS.length ? PLANOS.map(p => `<div class="row2" data-id="${p.id}"><div class="who"><b>${esc(p.nome)}${p.ativo ? '' : ' (inativo)'}</b>
    <small>${brl(p.valor)} por mês · ${p.usos_mes ? p.usos_mes + ' usos por mês' : 'uso ilimitado'} · ${esc(nomesServ(p.servicos))}</small></div>
    <span class="chip">${(n => n + (n === 1 ? ' assinante' : ' assinantes'))(ASSIN.filter(a => a.plano_id === p.id && a.status === 'ATIVA').length)}</span>
    <button class="btn sec sm" type="button" data-a="editar">Editar</button></div>`).join('') : vazio('Nenhum plano ainda. Crie o primeiro em "Novo plano".');
  const ativas = ASSIN.filter(a => a.status === 'ATIVA'), vencidas = ativas.filter(a => a.pago_ate < hojeISO());
  $('#clube-resumo').innerHTML = `<div><p class="lab">Assinantes ativos</p><p class="num">${ativas.length}</p></div>
    <div><p class="lab">Receita mensal do clube</p><p class="num">${brl(soma(ativas.map(a => a.valor)))}</p></div>
    <div><p class="lab">Vencidas</p><p class="num">${vencidas.length}</p></div>`;
  const lista = ativas.concat(ASSIN.filter(a => a.status !== 'ATIVA').slice(0, 10));
  $('#assinantes').innerHTML = lista.length ? lista.map(a => {
    const s = situacaoAss(a), uso = a.usos_mes ? `${a.usados} de ${a.usos_mes} usos no mês` : `${a.usados} usos no mês`;
    const msg = `Olá, ${a.nome.split(' ')[0]}! Sua mensalidade do clube ${a.plano} (${brl(a.valor)}) ${a.pago_ate < hojeISO() ? 'venceu' : 'vence'} em ${dataBR(a.pago_ate)}. Vamos renovar para continuar aproveitando?`;
    return `<div class="row2" data-id="${a.id}"><span class="av">${esc((a.nome || '?')[0])}</span><div class="who"><b>${esc(a.nome)}</b><small>${esc(a.plano)} · ${brl(a.valor)} · ${uso}</small></div>
      <span class="chip ${s.cls}">${esc(s.txt)}</span>
      ${a.status === 'ATIVA' ? `<div class="acts"><button class="btn sm" type="button" data-a="receber">Receber</button>
        ${s.cobrar ? `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(a.telefone))}?text=${encodeURIComponent(msg)}">Cobrar</a>` : ''}
        <button class="btn sec sm" type="button" data-a="cancelar">Cancelar</button></div>` : ''}</div>`;
  }).join('') : vazio('Nenhum assinante ainda. Crie um plano e use "Novo assinante".');
  if (INFO.restrito) { $('#clube-pags').innerHTML = vazio('Disponível após o pagamento da mensalidade.'); return; }
  const pags = await sb.from('clube_pagamento').select('id,assinatura_id,valor,forma_pagamento,pago_em,pago_ate_novo').order('pago_em', {ascending: false}).limit(20).then(ok);
  $('#clube-pags').innerHTML = pags.length ? pags.map(p => {
    const a = ASSIN.find(x => x.id === p.assinatura_id);
    return `<div class="row2"><div class="who"><b>${esc(a?.nome || 'Assinante')}</b><small>${dataHoraBR(p.pago_em)} · ${esc(a?.plano || '')} · liberou até ${dataBR(p.pago_ate_novo)}</small></div>
      <span class="chip">${esc(FORMAS[p.forma_pagamento] || '')}</span><b>${brl(p.valor)}</b>
      <button class="btn sec sm btn-excluir-lancamento" type="button" data-tipo="CLUBE" data-id="${p.id}">Excluir</button></div>`;
  }).join('') : vazio('Nenhuma mensalidade recebida ainda.');
}
function abrirPlano(p) {
  EDIT_PLANO = p?.id || null;
  $('#pl-tit').textContent = p ? 'Editar plano' : 'Novo plano';
  $('#pl-n').value = p?.nome || ''; $('#pl-v').value = p ? Number(p.valor) : ''; $('#pl-u').value = p?.usos_mes || '';
  $('#pl-a').checked = p ? p.ativo : true; $('#pl-err').textContent = '';
  $('#pl-servs').innerHTML = SERV.length ? SERV.map(s => `<label><input type="checkbox" value="${s.id}"${p?.servicos.includes(s.id) ? ' checked' : ''}> ${esc(s.nome)} (${brl(s.preco)})</label>`).join('')
    : '<p class="lab">Cadastre os serviços primeiro, na aba Serviços.</p>';
  $('#dPlano').showModal();
}
$('#novo-plano').addEventListener('click', () => seguro(async () => { await carregarServicos(); abrirPlano(null); }));
$('#planos').addEventListener('click', e => {
  const b = e.target.closest('button[data-a="editar"]'); if (!b) return;
  abrirPlano(PLANOS.find(p => p.id === Number(b.closest('[data-id]').dataset.id)));
});
$('#fPlano').addEventListener('submit', async e => {
  e.preventDefault(); $('#pl-err').textContent = '';
  try {
    await rpc('clube_plano_salvar', {p_id: EDIT_PLANO, p_nome: $('#pl-n').value, p_valor: Number($('#pl-v').value),
      p_usos_mes: $('#pl-u').value === '' ? null : Number($('#pl-u').value),
      p_servicos: [...document.querySelectorAll('#pl-servs input:checked')].map(i => Number(i.value)), p_ativo: $('#pl-a').checked});
    $('#dPlano').close(); toast('Plano salvo.'); await clube();
  } catch (x) { $('#pl-err').textContent = x.message; }
});
$('#novo-assinante').addEventListener('click', () => seguro(async () => {
  if (!PLANOS.length) await clube();
  const ativos = PLANOS.filter(p => p.ativo);
  if (!ativos.length) { toast('Crie um plano primeiro, logo abaixo em "Novo plano".', true); return; }
  await carregarClientesAtendimento();
  $('#as-cli').innerHTML = '<option value="">Novo cliente — preencher abaixo</option>' + CLIENTES_AT.map(c => `<option value="${c.id}">${esc(c.nome)} — ${esc(c.telefone)}</option>`).join('');
  $('#as-p').innerHTML = ativos.map(p => `<option value="${p.id}">${esc(p.nome)} · ${brl(p.valor)}/mês</option>`).join('');
  $('#as-f').innerHTML = opcoes(FORMAS); $('#as-n').value = ''; $('#as-t').value = ''; $('#as-novo').hidden = false; $('#as-err').textContent = '';
  $('#dAss').showModal();
}));
$('#as-cli').addEventListener('change', () => { $('#as-novo').hidden = !!$('#as-cli').value; });
$('#fAss').addEventListener('submit', async e => {
  e.preventDefault(); $('#as-err').textContent = '';
  try {
    await rpc('clube_assinar', {p_plano: Number($('#as-p').value), p_forma: $('#as-f').value, p_cliente: Number($('#as-cli').value) || null,
      p_nome: $('#as-n').value.trim() || null, p_telefone: $('#as-t').value.trim() || null});
    $('#dAss').close(); toast('Assinatura criada e primeiro mês recebido.'); await clube(); seguro(painel);
  } catch (x) { $('#as-err').textContent = x.message; }
});
$('#assinantes').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const a = ASSIN.find(x => x.id === Number(b.closest('[data-id]').dataset.id)); if (!a) return;
  if (b.dataset.a === 'receber') {
    REC = a; $('#rec-info').textContent = `${a.nome} · ${a.plano} · ${brl(a.valor)} · vencimento ${dataBR(a.pago_ate)}`;
    $('#rec-f').innerHTML = opcoes(FORMAS); $('#rec-err').textContent = ''; $('#dRec').showModal(); return;
  }
  if (b.dataset.a === 'cancelar') {
    if (!confirm(`Cancelar a assinatura de ${a.nome}? O histórico continua guardado.`)) return;
    seguro(async () => { await rpc('clube_cancelar', {p_assinatura: a.id}); toast('Assinatura cancelada.'); await clube(); });
  }
});
$('#fRec').addEventListener('submit', async e => {
  e.preventDefault(); $('#rec-err').textContent = '';
  try {
    const ate = await rpc('clube_receber', {p_assinatura: REC.id, p_forma: $('#rec-f').value});
    $('#dRec').close(); toast(`Mensalidade recebida. Clube liberado até ${dataBR(ate)}.`); await clube(); seguro(painel);
  } catch (x) { $('#rec-err').textContent = x.message; }
});
$('#cf-fid').addEventListener('change', () => { $('#cf-fid-box').hidden = !$('#cf-fid').checked; });

// ======================= RELATÓRIOS =======================
const DIAS_SEMANA = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
function relIntervalo(r) {
  const h = new Date(); h.setHours(12, 0, 0, 0); const hoje = iso(h);
  if (r === '7') return [maisDia(hoje, -6), hoje];
  if (r === '30') return [maisDia(hoje, -29), hoje];
  if (r === 'passado') return [iso(new Date(h.getFullYear(), h.getMonth() - 1, 1, 12)), iso(new Date(h.getFullYear(), h.getMonth(), 0, 12))];
  return [iso(new Date(h.getFullYear(), h.getMonth(), 1, 12)), hoje];
}
function relRapido(r) {
  document.querySelectorAll('#rel-rapido button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.r === r)));
  if (r) { const [a, b] = relIntervalo(r); $('#rel-de').value = a; $('#rel-ate').value = b; }
}
relRapido('mes');
$('#rel-rapido').addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (!b) return; relRapido(b.dataset.r); seguro(relatorios); });
['rel-de', 'rel-ate'].forEach(i => $('#' + i).addEventListener('change', () => { relRapido(null); seguro(relatorios); }));

const tabelaDados = (cab, linhas) => `<details class="tabela-dados"><summary>Ver em tabela</summary><table><thead><tr>${cab.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
  <tbody>${linhas.map(l => `<tr>${l.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
const barraLinha = (nome, detalhe, valor, largura) => `<div class="row2"><div class="who"><b>${esc(nome)}</b><small>${esc(detalhe)}</small>
  <div class="tr" style="margin-top:8px"><i style="width:${Math.max(2, Math.min(100, largura))}%"></i></div></div><b class="num">${esc(valor)}</b></div>`;

async function relatorios() {
  const corpo = ['#rel-diario', '#rel-barb', '#rel-pico', '#rel-serv', '#rel-prod', '#rel-faltas', '#rel-formas'];
  if (INFO.restrito) { $('#rel-kpis').innerHTML = vazio('Disponível após o pagamento da mensalidade.'); corpo.forEach(c => $(c).innerHTML = ''); return; }
  const de = $('#rel-de').value, ate = $('#rel-ate').value;
  if (!de || !ate || de > ate) { $('#rel-kpis').innerHTML = vazio('Escolha um período válido.'); return; }
  const r = await rpc('relatorio', {p_de: de, p_ate: ate}), s = r.resumo;
  const fat = Number(s.servicos) + Number(s.produtos) + Number(s.clube), lucro = fat - Number(s.gastos);
  const tile = (rot, val, det) => `<div class="kpi"><p class="lab">${esc(rot)}</p><p class="num">${esc(val)}</p><small>${esc(det)}</small></div>`;
  $('#rel-kpis').innerHTML =
    tile('Faturamento', brl(fat), `Serviços ${brl(s.servicos)} · produtos ${brl(s.produtos)} · clube ${brl(s.clube)}`)
    + tile('Lucro', brl(lucro), `Gastos de ${brl(s.gastos)}`)
    + tile('Atendimentos', s.atendimentos, s.cobertos ? `${s.cobertos} pelo clube ou fidelidade` : 'Todos pagos na hora')
    + tile('Ticket médio', brl(s.pagos ? (Number(s.servicos) + Number(s.produtos)) / s.pagos : 0), 'Por atendimento pago, com produtos')
    + tile('Clientes atendidos', s.clientes, `${s.novos} ${s.novos === 1 ? 'cliente novo' : 'clientes novos'}`)
    + tile('Faltas', pct(s.faltas, s.agendados) + '%', `${s.faltas} de ${s.agendados} horários`)
    + tile('Comissões', brl(s.comissoes), 'Serviços e produtos');

  // Entradas por dia (barras, um tom; a barra sob o cursor fica vermelha)
  const d = r.diario, mx = Math.max(0, ...d.map(x => Number(x.valor)));
  $('#rel-diario').innerHTML = !mx ? vazio('Nenhuma entrada no período.') :
    `<div class="bars" role="img" aria-label="Entradas por dia">${d.map(x => `<div class="col" tabindex="0" data-tip="${dataBR(x.dia)}: ${brl(x.valor)}"><div class="b" style="height:${Math.round(Number(x.valor) / mx * 100)}%"></div></div>`).join('')}</div>
    <div class="eixo"><span>${dataBR(d[0].dia)}</span>${d.length > 2 ? `<span>${dataBR(d[Math.floor(d.length / 2)].dia)}</span>` : ''}<span>${dataBR(d[d.length - 1].dia)}</span></div>
    ${tabelaDados(['Dia', 'Entradas'], d.map(x => [dataBR(x.dia), brl(x.valor)]))}`;

  // Por barbeiro
  const bs = r.barbeiros, mb = Math.max(1, ...bs.map(b => Number(b.servicos) + Number(b.produtos)));
  $('#rel-barb').innerHTML = bs.length ? bs.map(b => barraLinha(b.nome,
    `${b.atendimentos} ${b.atendimentos === 1 ? 'atendimento' : 'atendimentos'} · produtos ${brl(b.produtos)} · comissão ${brl(b.comissao)}`,
    brl(Number(b.servicos) + Number(b.produtos)), (Number(b.servicos) + Number(b.produtos)) / mb * 100)).join('') : vazio('Nenhum atendimento no período.');

  // Horários de pico (mapa de calor, um tom em 5 degraus)
  const pico = r.pico;
  if (!pico.length) $('#rel-pico').innerHTML = vazio('Nenhum atendimento no período.');
  else {
    const hs = pico.map(p => p.hora), h0 = Math.min(...hs, +String(INFO.abre).slice(0, 2)), h1 = Math.max(...hs, +String(INFO.fecha).slice(0, 2) - 1);
    const mxp = Math.max(...pico.map(p => p.qtd)), horas = []; for (let h = h0; h <= h1; h++) horas.push(h);
    const q = (dia, h) => pico.find(p => p.dia === dia && p.hora === h)?.qtd || 0;
    let html = `<div class="hm" style="grid-template-columns:36px repeat(${horas.length}, minmax(18px, 1fr))"><span></span>${horas.map(h => `<span class="h">${h % 2 === 0 ? h + 'h' : ''}</span>`).join('')}`;
    for (let dia = 1; dia <= 7; dia++) {
      html += `<span class="rot">${DIAS_SEMANA[dia]}</span>` + horas.map(h => { const n = q(dia, h);
        return `<span class="c" data-n="${n ? Math.max(1, Math.ceil(n / mxp * 5)) : 0}" data-tip="${DIAS_SEMANA[dia]}, ${h}h: ${n} ${n === 1 ? 'atendimento' : 'atendimentos'}"></span>`; }).join('');
    }
    const top = [...pico].sort((a, b) => b.qtd - a.qtd).slice(0, 3);
    $('#rel-pico').innerHTML = html + `</div><div class="legenda">Menos <i style="background:var(--s1)"></i><i style="background:var(--s2)"></i><i style="background:var(--s3)"></i><i style="background:var(--s4)"></i><i style="background:var(--s5)"></i> Mais</div>
      <p class="sub" style="margin-top:10px">Mais movimentados: ${top.map(t => `${DIAS_SEMANA[t.dia]} ${t.hora}h (${t.qtd})`).join(', ')}.</p>`;
  }

  // Serviços e produtos
  const sv = r.servicos, ms = Math.max(1, ...sv.map(x => x.qtd));
  $('#rel-serv').innerHTML = sv.length ? sv.map(x => barraLinha(x.nome, `${x.qtd} ${x.qtd === 1 ? 'vez' : 'vezes'}`, brl(x.total), x.qtd / ms * 100)).join('') : vazio('Nenhum serviço no período.');
  const pr = r.produtos, mp = Math.max(1, ...pr.map(x => Number(x.total)));
  $('#rel-prod').innerHTML = pr.length ? pr.map(x => barraLinha(x.nome, `${qtd(x.qtd)} vendidos · lucro estimado ${brl(x.lucro)}`, brl(x.total), Number(x.total) / mp * 100)).join('') : vazio('Nenhum produto vendido no período.');

  // Faltas
  if (!INFO.usa_agendamento) $('#rel-faltas').innerHTML = vazio('A agenda está desligada nas configurações.');
  else if (!s.agendados) $('#rel-faltas').innerHTML = vazio('Nenhum horário concluído ou com falta no período.');
  else $('#rel-faltas').innerHTML = `<p class="num big">${pct(s.faltas, s.agendados)}%</p><p class="sub" style="margin-bottom:12px">dos clientes agendados faltaram (${s.faltas} de ${s.agendados}). Lembrar no dia anterior ajuda a reduzir.</p>`
    + r.faltas_dia.filter(f => f.total).map(f => linha(DIAS_SEMANA[f.dia], `${f.faltas} de ${f.total} (${pct(f.faltas, f.total)}%)`, pct(f.faltas, f.total), 'red')).join('');

  // Formas de pagamento
  const tf = soma(r.formas.map(f => f.valor));
  $('#rel-formas').innerHTML = r.formas.length ? r.formas.map(f => linha(FORMAS[f.forma] || f.forma, `${brl(f.valor)} (${pct(f.valor, tf)}%)`, pct(f.valor, tf))).join('') : vazio('Nenhuma entrada no período.');
}

// ======================= APP INSTALÁVEL =======================
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
let PEDIDO_INSTALAR = null;
const NO_IPHONE = /iphone|ipad|ipod/i.test(navigator.userAgent);
const JA_INSTALADO = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
if (NO_IPHONE && !JA_INSTALADO) $('#instalar').hidden = false;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PEDIDO_INSTALAR = e; $('#instalar').hidden = false; });
window.addEventListener('appinstalled', () => { $('#instalar').hidden = true; toast('App instalado. Ele já está na tela inicial.'); });
$('#instalar').addEventListener('click', async () => {
  if (PEDIDO_INSTALAR) {
    PEDIDO_INSTALAR.prompt();
    const r = await PEDIDO_INSTALAR.userChoice;
    if (r.outcome === 'accepted') $('#instalar').hidden = true;
    PEDIDO_INSTALAR = null;
  } else {
    toast('No iPhone: toque em Compartilhar (quadrado com seta) e depois em "Adicionar à Tela de Início".');
  }
});

// ======================= ADMINISTRAÇÃO (só acesso e cobrança) =======================
let LISTA = [], MENSAGEM = '', HIST_PAGAMENTOS = [], EVOLUCAO = [], AQUISICOES_PAGAS = new Set();
const TAXA_AQUISICAO = 99.90;
let PRECO_PRO = 24.90, PLANOS_CFG = null;
const dinheiro = () => PRECO_PRO;
// Preço da barbearia: especial (desconto ou cortesia = 0) ou o padrão do Pro
const precoDe = b => b && b.mensalidade_especial != null ? Number(b.mensalidade_especial) : PRECO_PRO;
$('#pix').value = guarda('pix') || ''; $('#val').value = PRECO_PRO.toFixed(2); $('#val').readOnly = true;
const rotulo = b => {
  switch (b.situacao) {
    case 'FREE': return ['', 'Plano Free'];
    case 'CORTESIA': return ['ok', 'Cortesia (sem mensalidade)'];
    case 'TESTE': return ['blue', 'Pro em teste: ' + Math.max(0, -b.dias_atraso) + ' dias restantes'];
    case 'EM_DIA': return ['ok', 'Em dia'];
    case 'VENCE_EM_BREVE': return ['warn', b.dias_atraso === 0 ? 'Vence hoje' : 'Vence em breve'];
    case 'ATRASADA': return ['red', 'Atrasada ' + b.dias_atraso + (b.dias_atraso === 1 ? ' dia' : ' dias')];
    default: return ['red', b.restricao_manual ? 'Modo restrito (manual)' : 'Modo restrito'];
  }
};
const msgCobranca = b => { const at = b.dias_atraso > 0; return `Olá, ${b.nome}! Sua mensalidade do sistema (${brl(precoDe(b))}) ${at ? 'venceu' : 'vence'} em ${dataBR(b.vencimento)}. Para pagar via Pix, use a chave: ${$('#pix').value.trim()}. Depois de pagar, responda aqui com o comprovante.${at ? ' Lembrete: após 7 dias de atraso, os painéis de ganhos e gastos ficam bloqueados. Os lançamentos continuam normais.' : ''} Obrigado!`; };
const msgConvite = b => `Olá! Seu acesso ao sistema da ${b.nome} está liberado. Abra ${location.origin + location.pathname}?convite=${b.convite}, toque em "Criar conta" e use o e-mail e a senha que você escolher. O código de convite já vem preenchido (${b.convite}).${b.plano === 'PRO' ? (b.dias_teste ? ` Você tem ${b.dias_teste} dias de teste grátis do plano Pro.` : ' Seu plano é o Pro.') : ' Seu plano é o Free (gratuito).'}`;
function admDesenhar() {
  const c = {FREE: 0, CORTESIA: 0, EM_DIA: 0, TESTE: 0, VENCE_EM_BREVE: 0, ATRASADA: 0, RESTRITO: 0}; let pend = 0;
  $('#lista').innerHTML = LISTA.length ? LISTA.map(b => {
    c[b.situacao]++;
    const pro = b.plano !== 'FREE', cortesia = pro && Number(b.mensalidade_especial) === 0 && b.mensalidade_especial != null;
    const desconto = pro && !cortesia && b.mensalidade_especial != null;
    const [cor, texto] = rotulo(b), teste = b.situacao === 'TESTE', cobrar = pro && !cortesia && ['VENCE_EM_BREVE', 'ATRASADA', 'RESTRITO'].includes(b.situacao);
    if (pro && !cortesia && b.ativada && !teste && b.dias_atraso >= 0 && !b.nao_pago && !b.restricao_manual) pend++;
    return `<div class="row2" data-id="${b.id}">
      <span class="av">${esc((b.nome.trim()[0] || '?'))}</span>
      <div class="who"><b>${esc(b.nome)}</b><small>${!pro ? 'Sem mensalidade' : cortesia ? 'Pro gratuito (cortesia)' : (teste ? 'teste até ' : 'vencimento ') + dataBR(b.vencimento) + ` · ${brl(precoDe(b))}/mês${desconto ? ' (preço especial)' : ''}`}${b.nao_pago ? '. Marcado como não pago.' : ''}${b.ativada ? '' : '. Aguardando o dono criar a conta.'}</small></div>
      <span class="chip ${pro ? 'pro' : 'free'}">${pro ? 'Pro' : 'Free'}</span>${pro ? `<span class="chip ${cor}">${esc(texto)}</span>` : ''}
      <div class="acts">
        ${b.ativada ? '' : `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(b.telefone))}?text=${encodeURIComponent(msgConvite(b))}">Enviar convite</a><button class="btn sec sm" data-a="copiar">Copiar convite</button>`}
        ${AQUISICOES_PAGAS.has(Number(b.id)) ? '<span class="chip ok">Implantação paga</span>' : `<button class="btn sec sm" data-a="aquisicao" title="Confirmar recebimento único de R$ 99,90">Confirmar implantação (R$ 99,90)</button>`}
        ${teste || !pro || cortesia ? '' : `<span class="lab">Mensalidade paga?</span><button class="btn sec sm" data-a="sim">Sim</button><button class="btn sec sm${b.nao_pago ? ' sel' : ''}" data-a="nao">Não</button>`}
        <button class="btn sec sm" data-a="plano">${pro ? 'Mudar para Free' : 'Mudar para Pro'}</button>
        ${pro && PLANOS_CFG ? '<button class="btn sec sm" data-a="preco">Preço</button>' : ''}
        ${cobrar ? `<a class="wa" data-w="1" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(b.telefone))}?text=${encodeURIComponent(msgCobranca(b))}">Cobrar no WhatsApp</a>` : ''}
        <button class="btn sec sm" data-a="${b.restricao_manual ? 'liberar' : 'restringir'}">${b.restricao_manual ? 'Liberar visualização' : 'Restringir visualização'}</button>
      </div></div>`;
  }).join('') : vazio('Nenhuma barbearia cadastrada. Use "Nova barbearia".');
  $('#m-f').textContent = c.FREE; $('#m-o').textContent = c.EM_DIA + c.TESTE + c.CORTESIA; $('#m-p').textContent = c.VENCE_EM_BREVE; $('#m-a').textContent = c.ATRASADA; $('#m-s').textContent = c.RESTRITO;
  $('#pend').innerHTML = pend ? `<div class="pend">${pend} ${pend === 1 ? 'barbearia aguarda' : 'barbearias aguardam'} a sua confirmação de pagamento. Sem resposta em 7 dias após o vencimento, entram em modo restrito.</div>` : '';
}
function mesKey(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
function mesesUltimosSeis() { const hoje = new Date(); return Array.from({length:6}, (_,i) => { const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5-i), 1, 12); return {key:mesKey(d), label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','')}; }); }
function desenharBarrasAdmin(containerId, ticksId, values, formatMoney=false) {
  const el = $('#' + containerId), tx = $('#' + ticksId), max = Math.max(1, ...values.map(x => Number(x.value)||0));
  el.innerHTML = values.map(x => { const v=Number(x.value)||0, h=v ? Math.max(5,Math.round(v/max*100)) : 0; return `<div class="col" title="${esc(x.label)}: ${esc(formatMoney?brl(v):v)}"><div class="b${v===max?' top':''}" style="height:${h}%"></div></div>`; }).join('');
  tx.innerHTML = values.map(x => `<span>${esc(x.label)}</span>`).join('');
}
function admDashboard() {
  const pagantes = LISTA.filter(b => b.plano !== 'FREE' && ['EM_DIA','VENCE_EM_BREVE'].includes(b.situacao) && !b.em_teste && !b.restricao_manual);
  const ativas = pagantes.length, mrr = soma(pagantes.map(precoDe)), cortesias = LISTA.filter(b => b.situacao === 'CORTESIA').length;
  $('#ad-mrr-txt').textContent = `${ativas} ${ativas === 1 ? 'barbearia pagante' : 'barbearias pagantes'} no Pro${cortesias ? ` · ${cortesias} em cortesia` : ''}`;
  $('#ad-mens-txt').textContent = `Plano Pro de ${brl(PRECO_PRO)}`;
  $('#ad-modelo').textContent = `Implantação única de ${brl(TAXA_AQUISICAO)} + plano Pro de ${brl(PRECO_PRO)} por mês (Free é gratuito)`;
  const inad = LISTA.filter(b => ['ATRASADA','RESTRITO'].includes(b.situacao) || b.restricao_manual);
  const hoje = new Date(), mk = mesKey(hoje), meses = mesesUltimosSeis();
  const pagMes = HIST_PAGAMENTOS.filter(p => String(p.pago_em || '').slice(0,7) === mk);
  $('#ad-mrr').textContent = brl(mrr);
  $('#ad-recebido').textContent = brl(pagMes.reduce((s,p)=>s+Number(p.valor||0),0));
  $('#ad-pagamentos-qtd').textContent = `${pagMes.length} ${pagMes.length===1?'pagamento confirmado':'pagamentos confirmados'}`;
  $('#ad-aquisicao-recebida').textContent = brl(pagMes.filter(p=>p.tipo==='aquisicao').reduce((s,p)=>s+Number(p.valor||0),0));
  $('#ad-mensalidades-recebidas').textContent = brl(pagMes.filter(p=>p.tipo!=='aquisicao').reduce((s,p)=>s+Number(p.valor||0),0));
  $('#ad-total').textContent = LISTA.length;
  $('#ad-novas').textContent = `${EVOLUCAO.filter(x=>String(x.mes).slice(0,7)===mk).reduce((s,x)=>s+Number(x.total||0),0)} novas neste mês`;
  $('#ad-inadimplentes').textContent = inad.length;
  const novosMap = new Map(EVOLUCAO.map(x=>[String(x.mes).slice(0,7),Number(x.total||0)]));
  desenharBarrasAdmin('ad-crescimento','ad-crescimento-ticks',meses.map(m=>({label:m.label,value:novosMap.get(m.key)||0})));
  const receitaMap = new Map(); HIST_PAGAMENTOS.forEach(p=>{const k=String(p.pago_em||'').slice(0,7);receitaMap.set(k,(receitaMap.get(k)||0)+Number(p.valor||0));});
  desenharBarrasAdmin('ad-receitas','ad-receitas-ticks',meses.map(m=>({label:m.label,value:receitaMap.get(m.key)||0})),true);
  $('#ad-lista-inadimplentes').innerHTML = inad.length ? inad.slice(0,6).map(b=>`<div class="row2"><span class="av">${esc((b.nome||'?')[0])}</span><div class="who"><b>${esc(b.nome)}</b><small>${b.dias_atraso>0?`Atraso de ${b.dias_atraso} dia(s)`:'Acesso restrito'}</small></div><span class="chip red">${esc(b.situacao==='RESTRITO'?'Restrito':'Atrasada')}</span></div>`).join('') : vazio('Nenhuma barbearia inadimplente no momento.');
  $('#ad-ultimos-pagamentos').innerHTML = HIST_PAGAMENTOS.length ? HIST_PAGAMENTOS.slice(0,6).map(p=>`<div class="row2"><span class="av">✓</span><div class="who"><b>${esc(p.nome||'Barbearia')}</b><small>${p.pago_em?new Date(p.pago_em).toLocaleDateString('pt-BR'):'Data não disponível'}</small></div><b>${brl(p.valor)}</b></div>`).join('') : vazio('Nenhum pagamento registrado ainda. As próximas confirmações aparecerão aqui.');
}
async function admCarregar() {
  const [lista, pagamentos, evolucao, aquisicoes, planos] = await Promise.all([
    rpc('admin_listar_v2').catch(() => rpc('admin_listar')),
    rpc('admin_pagamentos_listar_v2').catch(()=>rpc('admin_pagamentos_listar').catch(()=>[])),
    rpc('admin_evolucao_cadastros').catch(()=>[]),
    rpc('admin_aquisicoes_listar').catch(()=>[]),
    rpc('admin_planos').catch(() => null)
  ]);
  PLANOS_CFG = planos;
  if (planos) { PRECO_PRO = Number(planos.preco_pro); $('#val').value = PRECO_PRO.toFixed(2); desenharPlanos(); }
  $('#card-planos').hidden = !planos;
  LISTA = lista || []; HIST_PAGAMENTOS = pagamentos || []; EVOLUCAO = evolucao || [];
  AQUISICOES_PAGAS = new Set((aquisicoes || []).map(x=>Number(x.barbearia_id))); 
  admDesenhar(); admDashboard();
}
$('#adm-atualizar').addEventListener('click', () => seguro(admCarregar));
$('#pix').addEventListener('input', () => { guarda('pix', $('#pix').value.trim()); $('#err').textContent = ''; admDesenhar(); });
$('#val').addEventListener('input', () => { $('#val').value = PRECO_PRO.toFixed(2); });
$('#lista').addEventListener('click', e => {
  const w = e.target.closest('a[data-w]');
  if (w) { if (!$('#pix').value.trim()) { e.preventDefault(); $('#err').textContent = 'Digite sua chave Pix acima antes de cobrar.'; $('#pix').focus(); } return; }
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const id = Number(b.closest('[data-id]').dataset.id), a = b.dataset.a;
  seguro(async () => {
    if (a === 'copiar') { const x = LISTA.find(y => y.id === id); try { await navigator.clipboard.writeText(msgConvite(x)); toast('Convite copiado.'); } catch (er) { toast('Não foi possível copiar.', true); } return; }
    if (a === 'aquisicao') { if (!confirm('Confirma que recebeu a taxa única de implantação de R$ 99,90 desta barbearia?')) return; await rpc('admin_confirmar_aquisicao', {p_id: id, p_valor: TAXA_AQUISICAO}); }
    else if (a === 'sim') await rpc('admin_confirmar_pagamento', {p_id: id, p_valor: precoDe(LISTA.find(y => y.id === id))});
    else if (a === 'preco') { abrirPreco(LISTA.find(y => y.id === id)); return; }
    else if (a === 'nao') await rpc('admin_pagamento', {p_id: id, p_pago: false});
    else if (a === 'plano') { abrirPlanoB(LISTA.find(y => y.id === id)); return; }
    else await rpc('admin_restricao', {p_id: id, p_restrito: a === 'restringir'});
    await admCarregar();
  });
});
$('#nova').addEventListener('click', () => { $('#n-err').textContent = ''; $('#n-p').value = 'FREE'; $('#n-dias-box').hidden = true; $('#dNova').showModal(); });
$('#n-p').addEventListener('change', () => { $('#n-dias-box').hidden = $('#n-p').value !== 'PRO'; });
$('#fNova').addEventListener('submit', async e => {
  e.preventDefault(); $('#n-err').textContent = '';
  try {
    const plano = $('#n-p').value, dias = Number($('#n-d').value) || 0;
    const cod = PLANOS_CFG ? await rpc('admin_criar_barbearia_v2', {p_nome: $('#n-n').value, p_telefone: $('#n-t').value, p_plano: plano, p_dias_teste: dias})
                           : await rpc('admin_criar_barbearia', {p_nome: $('#n-n').value, p_telefone: $('#n-t').value});
    const nome = $('#n-n').value.trim(), tel = $('#n-t').value;
    $('#dNova').close(); $('#fNova').reset(); await admCarregar();
    MENSAGEM = msgConvite({nome, convite: cod, plano: PLANOS_CFG ? plano : 'PRO', dias_teste: PLANOS_CFG ? dias : 15});
    $('#cred').innerHTML = `<b>${esc(nome)}</b><br>Código de convite: <b>${esc(cod)}</b><br>O dono abre o endereço do sistema, toca em "Criar conta" e usa esse código.`;
    $('#cred-wa').href = `https://wa.me/${whats(tel)}?text=${encodeURIComponent(MENSAGEM)}`; $('#dCred').showModal();
  } catch (x) { $('#n-err').textContent = x.message; }
});
$('#cred-copiar').addEventListener('click', async () => { try { await navigator.clipboard.writeText(MENSAGEM); toast('Mensagem copiada.'); } catch (er) { toast('Não foi possível copiar.', true); } });
$('#a-sair').addEventListener('click', sair);

// ---------- Planos e recursos ----------
function desenharPlanos() {
  const nomes = {agenda: 'Agenda e agendamento online', barbeiros: 'Barbeiros e comissões', estoque: 'Estoque e venda de produtos', caixa: 'Caixa do dia',
    clube: 'Clube de assinatura', fidelidade: 'Programa de fidelidade', marketing: 'Lembretes, aniversariantes e clientes para chamar', relatorios: 'Relatórios'};
  const chave = (rec, pl, on) => `<label class="chave"><input type="checkbox" data-rec="${rec}" data-pl="${pl}"${on ? ' checked' : ''} aria-label="${esc(nomes[rec] || rec)} no plano ${pl === 'free' ? 'Free' : 'Pro'}"><span></span></label>`;
  $('#matriz').innerHTML = `<table class="matriz"><thead><tr><th>Recurso</th><th>Free</th><th>Pro</th></tr></thead><tbody>${PLANOS_CFG.recursos.map(r =>
    `<tr><td><b>${esc(nomes[r.recurso] || r.recurso)}</b></td><td>${chave(r.recurso, 'free', r.free)}</td><td>${chave(r.recurso, 'pro', r.pro)}</td></tr>`).join('')}
    <tr><td><b>Atendimentos, serviços, gastos e painel</b><small>Sempre liberados</small></td><td>Sempre</td><td>Sempre</td></tr></tbody></table>`;
  $('#preco-pro').value = Number(PLANOS_CFG.preco_pro).toFixed(2);
  $('#wa-vendas').value = PLANOS_CFG.whatsapp_vendas || '';
}
$('#planos-salvar').addEventListener('click', async () => {
  $('#planos-err').textContent = '';
  const recursos = PLANOS_CFG.recursos.map(r => ({recurso: r.recurso,
    free: $(`#matriz [data-rec="${r.recurso}"][data-pl="free"]`).checked, pro: $(`#matriz [data-rec="${r.recurso}"][data-pl="pro"]`).checked}));
  if (recursos.some(r => r.free && !r.pro)) { $('#planos-err').textContent = 'Todo recurso liberado no Free precisa estar no Pro também.'; return; }
  try {
    await rpc('admin_planos_salvar', {p_preco_pro: Number($('#preco-pro').value), p_recursos: recursos, p_whatsapp: $('#wa-vendas').value});
    toast('Planos salvos. As barbearias veem a mudança na próxima vez que abrirem o sistema.'); await admCarregar();
  } catch (x) { $('#planos-err').textContent = x.message; }
});
// ---------- Preço especial ou cortesia de uma barbearia ----------
let PRECO_B = null;
function abrirPreco(b) {
  PRECO_B = b;
  const atual = b.mensalidade_especial == null ? 'PADRAO' : Number(b.mensalidade_especial) === 0 ? 'CORTESIA' : 'DESCONTO';
  $('#pc-info').textContent = `${b.nome} · preço padrão do Pro: ${brl(PRECO_PRO)} por mês`;
  document.querySelectorAll('#fPreco input[name="pc-tipo"]').forEach(r => { r.checked = r.value === atual; });
  $('#pc-v').value = atual === 'DESCONTO' ? Number(b.mensalidade_especial).toFixed(2) : '';
  $('#pc-v-box').hidden = atual !== 'DESCONTO'; $('#pc-err').textContent = '';
  $('#dPreco').showModal();
}
$('#fPreco').addEventListener('change', () => { $('#pc-v-box').hidden = $('#fPreco input[name="pc-tipo"]:checked')?.value !== 'DESCONTO'; });
$('#fPreco').addEventListener('submit', async e => {
  e.preventDefault(); $('#pc-err').textContent = '';
  const tipo = $('#fPreco input[name="pc-tipo"]:checked')?.value;
  const v = tipo === 'PADRAO' ? null : tipo === 'CORTESIA' ? 0 : Number($('#pc-v').value);
  if (tipo === 'DESCONTO' && !(v > 0)) { $('#pc-err').textContent = 'Informe o valor com desconto (maior que zero). Para grátis, escolha "Cortesia".'; return; }
  try {
    await rpc('admin_definir_mensalidade', {p_id: PRECO_B.id, p_valor: v});
    $('#dPreco').close();
    toast(tipo === 'CORTESIA' ? `${PRECO_B.nome} agora tem o Pro de cortesia.` : tipo === 'DESCONTO' ? `Preço especial de ${brl(v)} salvo.` : 'Voltou ao preço padrão.');
    await admCarregar();
  } catch (x) { $('#pc-err').textContent = x.message; }
});

let PLANO_B = null;
function abrirPlanoB(b) {
  PLANO_B = b; const praPro = b.plano === 'FREE';
  $('#pb-tit').textContent = praPro ? 'Mudar para o Pro' : 'Mudar para o Free';
  $('#pb-info').textContent = praPro
    ? `${b.nome} passa a ter os recursos do Pro e a pagar ${brl(PRECO_PRO)} por mês.`
    : `${b.nome} perde os recursos do Pro e deixa de ter mensalidade. Os dados ficam guardados e voltam se ela voltar ao Pro.`;
  $('#pb-dias-box').hidden = !praPro; $('#pb-d').value = 0; $('#pb-err').textContent = '';
  $('#dPlanoB').showModal();
}
$('#fPlanoB').addEventListener('submit', async e => {
  e.preventDefault(); $('#pb-err').textContent = '';
  try {
    const praPro = PLANO_B.plano === 'FREE';
    await rpc('admin_definir_plano', {p_id: PLANO_B.id, p_plano: praPro ? 'PRO' : 'FREE', p_dias_teste: Number($('#pb-d').value) || 0});
    $('#dPlanoB').close(); toast(praPro ? `${PLANO_B.nome} agora é Pro.` : `${PLANO_B.nome} agora é Free.`); await admCarregar();
  } catch (x) { $('#pb-err').textContent = x.message; }
});

// ======================= AGENDAMENTO PÚBLICO =======================
let PUBLICO = null, PUBLIC_SERV = [];
const pubHoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function pubErro(msg) { $('#pub-erro').textContent = msg || ''; }
async function pubCarregarHorarios() {
  pubErro('');
  const servico = Number($('#pub-servico').value), dia = $('#pub-data').value;
  $('#pub-hora').innerHTML = '<option value="">Buscando horários...</option>';
  $('#pub-resumo').hidden = true;
  if (!servico || !dia || !PUBLICO) { $('#pub-hora').innerHTML = '<option value="">Selecione um serviço e uma data</option>'; return; }
  try {
    const rows = await rpc('public_horarios_disponiveis_v2', {p_barbearia_id: Number(PUBLICO.id), p_servico: servico, p_dia: dia, p_barbeiro: Number($('#pub-barbeiro').value) || null});
    $('#pub-hora').innerHTML = rows.length ? '<option value="">Escolha um horário</option>' + rows.map(r => { const v = String(r.inicio).replace(' ', 'T').slice(0,16); return `<option value="${esc(v)}">${esc(v.slice(11,16))}</option>`; }).join('') : '<option value="">Sem horários disponíveis nesta data</option>';
  } catch (e) { $('#pub-hora').innerHTML = '<option value="">Não foi possível carregar os horários</option>'; pubErro(e.message); }
}
async function iniciarAgendamentoPublico(id) {
  tela('tela-publico');
  $('#pub-data').min = pubHoje(); $('#pub-data').value = pubHoje();
  try {
    PUBLICO = await rpc('public_agendamento_info', {p_barbearia_id: Number(id)});
    if (!PUBLICO || !PUBLICO.usa_agendamento) throw new Error('Este link não está disponível. A barbearia pode estar com o agendamento desativado.');
    $('#pub-nome').textContent = PUBLICO.nome;
    document.title = 'Agendar horário | ' + PUBLICO.nome;
    $('#pub-horario').textContent = `Atendimento das ${String(PUBLICO.abre).slice(0,5)} às ${String(PUBLICO.fecha).slice(0,5)}`;
    $('#pub-logo').hidden = !PUBLICO.logo; if (PUBLICO.logo) $('#pub-logo').src = PUBLICO.logo;
    PUBLIC_SERV = PUBLICO.servicos || [];
    const barbs = PUBLICO.barbeiros || [];
    $('#pub-barbeiro-box').hidden = !barbs.length;
    $('#pub-barbeiro').innerHTML = '<option value="">Qualquer barbeiro disponível</option>' + barbs.map(x => `<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join('');
    $('#pub-servico').innerHTML = '<option value="">Selecione um serviço</option>' + PUBLIC_SERV.map(x => `<option value="${esc(x.id)}">${esc(x.nome)} — ${brl(x.preco)} (${esc(x.duracao_min)} min)</option>`).join('');
    if (!PUBLIC_SERV.length) throw new Error('Esta barbearia ainda não cadastrou serviços ativos.');
    await pubCarregarHorarios();
  } catch (e) {
    $('#pub-nome').textContent = 'Agendamento indisponível'; pubErro(e.message);
    $('#form-publico-agendamento').hidden = true;
  }
}
$('#pub-servico').addEventListener('change', pubCarregarHorarios);
$('#pub-data').addEventListener('change', pubCarregarHorarios);
$('#pub-barbeiro').addEventListener('change', pubCarregarHorarios);
$('#pub-hora').addEventListener('change', () => {
  const s = PUBLIC_SERV.find(x => String(x.id) === $('#pub-servico').value), h = $('#pub-hora').value;
  const bb = (PUBLICO?.barbeiros || []).find(x => String(x.id) === $('#pub-barbeiro').value);
  const el = $('#pub-resumo');
  if (s && h) { el.hidden = false; el.textContent = `${s.nome} • ${brl(s.preco)} • ${$('#pub-data').value.split('-').reverse().join('/')} às ${h.slice(11,16)}${bb ? ' • com ' + bb.nome : ''}`; } else el.hidden = true;
});
$('#form-publico-agendamento').addEventListener('submit', async e => {
  e.preventDefault(); pubErro('');
  const botao = $('#pub-confirmar'); botao.disabled = true; botao.textContent = 'Confirmando...';
  try {
    const inicio = $('#pub-hora').value;
    if (!inicio) throw new Error('Escolha um horário disponível.');
    await rpc('public_agenda_marcar_v3', {p_barbearia_id: Number(PUBLICO.id), p_nome: $('#pub-cliente').value.trim(), p_telefone: $('#pub-telefone').value, p_servico: Number($('#pub-servico').value), p_inicio: inicio + ':00', p_barbeiro: Number($('#pub-barbeiro').value) || null, p_nascimento: $('#pub-nasc').value || null});
    const resumo = $('#pub-resumo').textContent;
    $('#form-publico-agendamento').hidden = true;
    $('#pub-sucesso-txt').textContent = (resumo ? resumo + '. ' : '') + 'Se precisar alterar o horário, entre em contato diretamente com a barbearia.';
    $('#pub-sucesso').hidden = false;
  } catch (e2) { pubErro(e2.message); await pubCarregarHorarios(); }
  finally { botao.disabled = false; botao.textContent = 'Confirmar agendamento'; }
});

// ======================= INÍCIO =======================
(function inicio() {
  const params = new URLSearchParams(location.search);
  const agendar = params.get('agendar');
  if (agendar && /^\d+$/.test(agendar)) { iniciarAgendamentoPublico(agendar); return; }
  const conv = params.get('convite');
  if (conv) { guarda('convite', conv); $('#cd-c').value = conv; document.querySelector('[data-lt="cadastro"]').click(); }
  entrar().catch(e => { tela('tela-login'); toast(e.message, true); });
})();
