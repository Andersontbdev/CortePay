// Funções de apoio usadas por todas as telas.
const $ = (s, r = document) => r.querySelector(s);

// Protege contra código malicioso: todo texto vindo do servidor passa por aqui antes de entrar na página.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

function csrf() {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

// Fala com o servidor. Devolve os dados ou lança um erro com mensagem em português.
async function api(method, url, body, formulario) {
  const opt = {method, headers: {'X-XSRF-TOKEN': csrf()}, credentials: 'same-origin'};
  if (formulario) {
    opt.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opt.body = new URLSearchParams(body);
  } else if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const r = await fetch(url, opt);
  if (r.status === 401 && !url.startsWith('/api/login')) {
    location.href = '/login.html';
    throw new Error('Sessão expirada.');
  }
  const texto = await r.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch (e) { /* resposta sem JSON */ }
  if (!r.ok) {
    const erro = new Error((dados && dados.erro) || 'Algo deu errado. Tente de novo.');
    erro.status = r.status;
    erro.restrito = r.status === 403 && dados && dados.erro === 'RESTRITO';
    throw erro;
  }
  return dados;
}
