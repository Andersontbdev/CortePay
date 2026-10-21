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
const TELAS = ['tela-login', 'tela-convite', 'tela-app', 'tela-admin'];
const tela = id => TELAS.forEach(t => $('#' + t).hidden = t !== id);

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
const CATS = {ALUGUEL: 'Aluguel', PRODUTOS: 'Produtos', ENERGIA: 'Energia', AGUA: 'Água', OUTROS: 'Outros'};
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
  const [b, s] = await Promise.all([sb.from('barbearia').select('id,nome,logo,vencimento,usa_agendamento,abre,fecha').maybeSingle().then(ok), rpc('minha_situacao')]);
  INFO = {...b, restrito: s[0].restrito, situacao: s[0].situacao};
  tudoDoPainel();
}

// ======================= BARBEARIA =======================
let INFO, PER = 'semana', SERV = [], ATR = [], DIA = hojeISO(), CONCLUIR = null, NOVALOGO = null;

function marca() {
  $('#bn').textContent = INFO.nome;
  document.title = 'Painel da ' + INFO.nome;
  $('#logo').hidden = !INFO.logo;
  if (INFO.logo) $('#logo').src = INFO.logo;
  $('#ini').hidden = !!INFO.logo;
  $('#ini').textContent = INFO.nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  $('#sub').textContent = 'Resumo ' + {hoje: 'de hoje', semana: 'da semana', mes: 'do mês'}[PER];
  $('#tab-ag').hidden = !INFO.usa_agendamento;
  document.body.classList.toggle('restr', INFO.restrito);
  const ban = $('#ban');
  ban.hidden = !(INFO.restrito || INFO.situacao === 'ATRASADA');
  ban.className = 'ban' + (INFO.restrito ? '' : ' warn');
  ban.innerHTML = INFO.restrito
    ? '<b>Mensalidade em atraso.</b> Você continua lançando atendimentos e gastos normalmente, mas os painéis de ganhos, gastos e lucro ficam bloqueados até o pagamento. Fale com o administrador para regularizar.'
    : '<b>Sua mensalidade está atrasada.</b> Regularize para não perder a visualização dos painéis.';
}

async function painel() {
  if (INFO.restrito) return;
  const [i0, i1] = intervalo(PER);
  const [at, ds] = await Promise.all([
    sb.from('atendimento').select('valor_final,forma_pagamento,data_hora').gte('data_hora', i0 + 'T00:00:00').lt('data_hora', maisDia(i1, 1) + 'T00:00:00').limit(5000).then(ok),
    sb.from('despesa').select('categoria,valor').gte('data_despesa', i0).lte('data_despesa', i1).limit(5000).then(ok)]);
  const entrou = soma(at.map(a => a.valor_final)), gastos = soma(ds.map(d => d.valor)), lucro = entrou - gastos;
  $('#luc').textContent = brl(lucro); $('#in').textContent = brl(entrou); $('#out').textContent = brl(gastos); $('#qt').textContent = at.length;
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
    + kp('Maior gasto', cats.length ? CATS[cats[0][0]] : '-') + kp('Gasto por atendimento', brl(at.length ? gastos / at.length : 0));
}

async function recentes() {
  if (INFO.restrito) return;
  const l = await sb.from('atendimento').select('valor_final,desconto,forma_pagamento,data_hora,cliente(nome),servico(nome)').order('data_hora', {ascending: false}).limit(20).then(ok);
  $('#ult').innerHTML = l.length ? l.map(a => `<div class="row2"><span class="av">${esc((a.cliente?.nome || '?')[0])}</span><div class="who"><b>${esc(a.cliente?.nome)}</b><small>${esc(a.servico?.nome)}${Number(a.desconto) > 0 ? ' (desconto de ' + brl(a.desconto) + ')' : ''}</small></div><span class="chip">${esc(FORMAS[a.forma_pagamento] || '')}</span><b>${brl(a.valor_final)}</b></div>`).join('') : vazio('Nenhum atendimento ainda.');
}

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
function tudoDoPainel() { marca(); [painel, recentes, ranking, atrasados, resultado].forEach(f => seguro(f)); }

// ---------- Agenda ----------
async function agenda() {
  if (!INFO.usa_agendamento) return;
  $('#dia').value = DIA;
  const l = await sb.from('agendamento').select('id,inicio,fim,status,cliente(nome,telefone),servico(nome)').gte('inicio', DIA + 'T00:00:00').lt('inicio', maisDia(DIA, 1) + 'T00:00:00').order('inicio').then(ok);
  $('#ag').innerHTML = l.length ? l.map(a => {
    const nome = a.cliente?.nome || '', msg = `Olá, ${nome.split(' ')[0]}! Confirmando seu horário (${a.servico?.nome}) no dia ${dataBR(a.inicio)} às ${hora(a.inicio)} na ${INFO.nome}. Pode confirmar?`;
    return `<div class="row2"><div style="min-width:92px"><b>${hora(a.inicio)}</b><br><small class="lab">até ${hora(a.fim)}</small></div>
      <div class="who"><b>${esc(nome)}</b><small>${esc(a.servico?.nome)}</small></div>
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
  const m = await sb.from('agendamento').select('inicio,fim').eq('status', 'AGENDADO').gte('inicio', d + 'T00:00:00').lt('inicio', maisDia(d, 1) + 'T00:00:00').then(ok);
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
  const l = await sb.from('despesa').select('descricao,categoria,valor,data_despesa').order('data_despesa', {ascending: false}).order('id', {ascending: false}).limit(20).then(ok);
  $('#gs').innerHTML = l.length ? l.map(d => `<div class="row2"><div class="who"><b>${esc(d.descricao)}</b><small>${esc(CATS[d.categoria] || d.categoria)}, ${dataBR(d.data_despesa)}</small></div><b>${brl(d.valor)}</b></div>`).join('') : vazio('Nenhum gasto lançado ainda.');
}

// ---------- Navegação e eventos ----------
function aba(nome) {
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === nome)));
  ['painel', 'agenda', 'servicos', 'gastos'].forEach(n => $('#v-' + n).hidden = n !== nome);
  if (nome === 'agenda') seguro(agenda); if (nome === 'servicos') seguro(servicos); if (nome === 'gastos') seguro(gastos);
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) aba(b.dataset.t); });
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

// Novo atendimento
function totalAt() {
  const s = SERV.find(x => String(x.id) === $('#at-s').value), d = Math.min(Math.max(Number($('#at-d').value) || 0, 0), s ? Number(s.preco) : 0);
  $('#at-tot').textContent = brl(s ? Number(s.preco) - d : 0);
}
$('#novo').addEventListener('click', () => seguro(async () => {
  await carregarServicos();
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#at-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${brl(s.preco)})</option>`).join('');
  $('#at-f').innerHTML = opcoes(FORMAS); $('#at-err').textContent = ''; totalAt(); $('#dAt').showModal();
}));
['at-s', 'at-d'].forEach(i => $('#' + i).addEventListener('input', totalAt));
$('#fAt').addEventListener('submit', async e => {
  e.preventDefault(); $('#at-err').textContent = '';
  try {
    await rpc('registrar_atendimento', {p_nome: $('#at-n').value, p_telefone: $('#at-t').value, p_servico: Number($('#at-s').value), p_desconto: Number($('#at-d').value) || 0, p_forma: $('#at-f').value});
    $('#dAt').close(); $('#fAt').reset(); toast('Atendimento salvo.'); tudoDoPainel();
  } catch (x) { $('#at-err').textContent = x.message; }
});

// Agenda
$('#dia').addEventListener('change', e => { DIA = e.target.value || hojeISO(); seguro(agenda); });
$('#dia-ant').addEventListener('click', () => { DIA = maisDia(DIA, -1); seguro(agenda); });
$('#dia-prox').addEventListener('click', () => { DIA = maisDia(DIA, 1); seguro(agenda); });
$('#novo-ag').addEventListener('click', () => seguro(async () => {
  await carregarServicos();
  if (!SERV.length) { toast('Cadastre ao menos um serviço antes, na aba Serviços.', true); aba('servicos'); return; }
  $('#ag-s').innerHTML = SERV.map(s => `<option value="${s.id}">${esc(s.nome)} (${s.duracao_min} min)</option>`).join('');
  $('#ag-dt').value = DIA; $('#ag-err').textContent = ''; await livres(); $('#dAg').showModal();
}));
['ag-s', 'ag-dt'].forEach(i => $('#' + i).addEventListener('change', () => seguro(livres)));
$('#fAg').addEventListener('submit', async e => {
  e.preventDefault(); $('#ag-err').textContent = '';
  if (!$('#ag-h').value) { $('#ag-err').textContent = 'Escolha um horário livre.'; return; }
  try {
    await rpc('agenda_marcar', {p_nome: $('#ag-n').value, p_telefone: $('#ag-t').value, p_servico: Number($('#ag-s').value), p_inicio: $('#ag-dt').value + 'T' + $('#ag-h').value + ':00'});
    DIA = $('#ag-dt').value; $('#dAg').close(); $('#fAg').reset(); toast('Horário marcado.'); seguro(agenda);
  } catch (x) { $('#ag-err').textContent = x.message; }
});
$('#ag').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  if (b.dataset.a === 'concluir') { CONCLUIR = b.dataset.id; $('#co-f').innerHTML = opcoes(FORMAS); $('#co-d').value = 0; $('#co-err').textContent = ''; $('#dCon').showModal(); return; }
  seguro(async () => { await sb.from('agendamento').update({status: b.dataset.a}).eq('id', Number(b.dataset.id)).then(ok); await agenda(); });
});
$('#fCon').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await rpc('agenda_concluir', {p_id: Number(CONCLUIR), p_desconto: Number($('#co-d').value) || 0, p_forma: $('#co-f').value});
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
    const dados = {nome: $('#cf-n').value.trim(), usa_agendamento: $('#cf-a').checked, abre: ab, fecha: fe};
    if (NOVALOGO) dados.logo = NOVALOGO;
    await sb.from('barbearia').update(dados).eq('id', INFO.id).then(ok);
    const b = await sb.from('barbearia').select('id,nome,logo,vencimento,usa_agendamento,abre,fecha').maybeSingle().then(ok);
    INFO = {...INFO, ...b}; $('#dCfg').close(); marca(); toast('Configuração salva.');
  } catch (x) { $('#cf-err').textContent = x.message; }
});

// ======================= ADMINISTRAÇÃO (só acesso e cobrança) =======================
let LISTA = [], MENSAGEM = '';
const dinheiro = () => Number($('#val').value) || 0;
$('#pix').value = guarda('pix') || ''; $('#val').value = guarda('mensalidade') || '24.90';
const rotulo = b => {
  switch (b.situacao) {
    case 'TESTE': return ['blue', 'Em teste: ' + Math.max(0, -b.dias_atraso) + ' dias restantes'];
    case 'EM_DIA': return ['ok', 'Em dia'];
    case 'VENCE_EM_BREVE': return ['warn', b.dias_atraso === 0 ? 'Vence hoje' : 'Vence em breve'];
    case 'ATRASADA': return ['red', 'Atrasada ' + b.dias_atraso + (b.dias_atraso === 1 ? ' dia' : ' dias')];
    default: return ['red', b.restricao_manual ? 'Modo restrito (manual)' : 'Modo restrito'];
  }
};
const msgCobranca = b => { const at = b.dias_atraso > 0; return `Olá, ${b.nome}! Sua mensalidade do sistema (${brl(dinheiro())}) ${at ? 'venceu' : 'vence'} em ${dataBR(b.vencimento)}. Para pagar via Pix, use a chave: ${$('#pix').value.trim()}. Depois de pagar, responda aqui com o comprovante.${at ? ' Lembrete: após 7 dias de atraso, os painéis de ganhos e gastos ficam bloqueados. Os lançamentos continuam normais.' : ''} Obrigado!`; };
const msgConvite = b => `Olá! Seu acesso ao sistema da ${b.nome} está liberado. Abra ${location.origin + location.pathname}?convite=${b.convite}, toque em "Criar conta" e use o e-mail e a senha que você escolher. O código de convite já vem preenchido (${b.convite}). Você tem 15 dias de teste grátis.`;
function admDesenhar() {
  const c = {EM_DIA: 0, TESTE: 0, VENCE_EM_BREVE: 0, ATRASADA: 0, RESTRITO: 0}; let pend = 0;
  $('#lista').innerHTML = LISTA.length ? LISTA.map(b => {
    c[b.situacao]++;
    const [cor, texto] = rotulo(b), teste = b.situacao === 'TESTE', cobrar = ['VENCE_EM_BREVE', 'ATRASADA', 'RESTRITO'].includes(b.situacao);
    if (b.ativada && !teste && b.dias_atraso >= 0 && !b.nao_pago && !b.restricao_manual) pend++;
    return `<div class="row2" data-id="${b.id}">
      <span class="av">${esc((b.nome.trim()[0] || '?'))}</span>
      <div class="who"><b>${esc(b.nome)}</b><small>${teste ? 'teste até ' : 'vencimento '}${dataBR(b.vencimento)}${b.nao_pago ? '. Marcado como não pago.' : ''}${b.ativada ? '' : '. Aguardando o dono criar a conta.'}</small></div>
      <span class="chip ${cor}">${esc(texto)}</span>
      <div class="acts">
        ${b.ativada ? '' : `<a class="wa" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(b.telefone))}?text=${encodeURIComponent(msgConvite(b))}">Enviar convite</a><button class="btn sec sm" data-a="copiar">Copiar convite</button>`}
        ${teste ? '' : `<span class="lab">Pagou?</span><button class="btn sec sm" data-a="sim">Sim</button><button class="btn sec sm${b.nao_pago ? ' sel' : ''}" data-a="nao">Não</button>`}
        ${cobrar ? `<a class="wa" data-w="1" target="_blank" rel="noopener" href="https://wa.me/${esc(whats(b.telefone))}?text=${encodeURIComponent(msgCobranca(b))}">Cobrar no WhatsApp</a>` : ''}
        <button class="btn sec sm" data-a="${b.restricao_manual ? 'liberar' : 'restringir'}">${b.restricao_manual ? 'Liberar visualização' : 'Restringir visualização'}</button>
      </div></div>`;
  }).join('') : vazio('Nenhuma barbearia cadastrada. Use "Nova barbearia".');
  $('#m-o').textContent = c.EM_DIA + c.TESTE; $('#m-p').textContent = c.VENCE_EM_BREVE; $('#m-a').textContent = c.ATRASADA; $('#m-s').textContent = c.RESTRITO;
  $('#pend').innerHTML = pend ? `<div class="pend">${pend} ${pend === 1 ? 'barbearia aguarda' : 'barbearias aguardam'} a sua confirmação de pagamento. Sem resposta em 7 dias após o vencimento, entram em modo restrito.</div>` : '';
}
async function admCarregar() { LISTA = await rpc('admin_listar'); admDesenhar(); }
$('#pix').addEventListener('input', () => { guarda('pix', $('#pix').value.trim()); $('#err').textContent = ''; admDesenhar(); });
$('#val').addEventListener('input', () => { guarda('mensalidade', $('#val').value); admDesenhar(); });
$('#lista').addEventListener('click', e => {
  const w = e.target.closest('a[data-w]');
  if (w) { if (!$('#pix').value.trim()) { e.preventDefault(); $('#err').textContent = 'Digite sua chave Pix acima antes de cobrar.'; $('#pix').focus(); } return; }
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const id = Number(b.closest('[data-id]').dataset.id), a = b.dataset.a;
  seguro(async () => {
    if (a === 'copiar') { const x = LISTA.find(y => y.id === id); try { await navigator.clipboard.writeText(msgConvite(x)); toast('Convite copiado.'); } catch (er) { toast('Não foi possível copiar.', true); } return; }
    if (a === 'sim' || a === 'nao') await rpc('admin_pagamento', {p_id: id, p_pago: a === 'sim'});
    else await rpc('admin_restricao', {p_id: id, p_restrito: a === 'restringir'});
    await admCarregar();
  });
});
$('#nova').addEventListener('click', () => { $('#n-err').textContent = ''; $('#dNova').showModal(); });
$('#fNova').addEventListener('submit', async e => {
  e.preventDefault(); $('#n-err').textContent = '';
  try {
    const cod = await rpc('admin_criar_barbearia', {p_nome: $('#n-n').value, p_telefone: $('#n-t').value});
    const nome = $('#n-n').value.trim(), tel = $('#n-t').value;
    $('#dNova').close(); $('#fNova').reset(); await admCarregar();
    MENSAGEM = msgConvite({nome, convite: cod});
    $('#cred').innerHTML = `<b>${esc(nome)}</b><br>Código de convite: <b>${esc(cod)}</b><br>O dono abre o endereço do sistema, toca em "Criar conta" e usa esse código.`;
    $('#cred-wa').href = `https://wa.me/${whats(tel)}?text=${encodeURIComponent(MENSAGEM)}`; $('#dCred').showModal();
  } catch (x) { $('#n-err').textContent = x.message; }
});
$('#cred-copiar').addEventListener('click', async () => { try { await navigator.clipboard.writeText(MENSAGEM); toast('Mensagem copiada.'); } catch (er) { toast('Não foi possível copiar.', true); } });
$('#a-sair').addEventListener('click', sair);

// ======================= INÍCIO ========================
(function inicio() {
  const conv = new URLSearchParams(location.search).get('convite');
  if (conv) { guarda('convite', conv); $('#cd-c').value = conv; document.querySelector('[data-lt="cadastro"]').click(); }
  entrar().catch(e => { tela('tela-login'); toast(e.message, true); });
})();
