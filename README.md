# Sistema da barbearia

Sistema para vender a várias barbearias. Cada barbearia vê somente a sua área; o administrador só libera acesso e
controla a cobrança, sem ver clientes, atendimentos ou gastos.

Feito só com **HTML, CSS e JavaScript**. Não tem mais Java, Docker nem servidor próprio.

## As três peças (cada uma faz uma coisa)
| Peça | Para que serve | O que vai nela |
|---|---|---|
| **GitHub** | Guarda o código | Todos os arquivos desta pasta |
| **Vercel** | Publica o site (telas) e roda a pequena função do administrador | Puxa o código do GitHub sozinha a cada envio |
| **Supabase** | Login, banco de dados e regras de segurança | O arquivo `supabase/schema.sql`, rodado uma vez |

## Passo a passo

### 1. Supabase
1. Crie um projeto em supabase.com.
2. Vá em **SQL Editor > New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Vá em **Authentication > Sign In / Providers** e **desligue "Allow new users to sign up"**.
   Assim ninguém cria conta sozinho: só você, pelo painel de administração.
4. Crie o seu login de administrador: **Authentication > Users > Add user > Create new user**
   (seu e-mail, senha forte, marque **Auto Confirm User**). Depois, no SQL Editor, rode (trocando o e-mail):
   ```sql
   insert into public.perfis (user_id, papel)
   select id, 'admin' from auth.users where email = 'seu-email@exemplo.com';
   ```
5. Em **Project Settings > API** (ou botão **Connect**), anote:
   - a **URL do projeto** (`https://xxxx.supabase.co`);
   - a chave **pública** (`anon` ou `publishable`) → vai no arquivo `js/config.js`;
   - a chave **secreta** (`service_role` ou `secret`) → vai **só** na Vercel (passo 3).

### 2. GitHub
1. Abra `js/config.js` e cole a URL e a chave **pública** do Supabase.
2. Crie um repositório (pode ser **privado**) e envie todos os arquivos desta pasta, mantendo as pastas.
   Se for reaproveitar o repositório antigo, **apague** dele: `pom.xml`, `Dockerfile`, `.dockerignore`, a pasta `src/`
   e a pasta `.github/workflows/` (a conferência antiga compilava Java e passaria a falhar).

### 3. Vercel
1. Em vercel.com, **Add New > Project** e escolha o repositório do GitHub.
2. Framework: **Other**. Não precisa de comando de build.
3. Em **Environment Variables**, crie as duas variáveis do arquivo `.env.example`:
   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (a chave **secreta**).
4. Clique em **Deploy**. A cada envio ao GitHub, a Vercel publica de novo sozinha.
5. Volte ao Supabase em **Authentication > URL Configuration** e coloque o endereço da Vercel em **Site URL**.

### 4. Primeiro acesso
Abra o endereço da Vercel, entre com o login de administrador e clique em **Nova barbearia** para criar o
acesso do primeiro cliente. Envie a ele o e-mail e a senha inicial.

## Como funciona a cobrança (manual)
- Cada barbearia tem **mensalidade**, **pago até** (vencimento) e **tolerância** em dias.
- Ao receber, clique em **Pagamento**: o sistema guarda o histórico e empurra o vencimento (sugere +1 mês).
- A barbearia vê um aviso 5 dias antes de vencer. Passada a tolerância, o acesso é **bloqueado automaticamente**
  (os dados ficam guardados). **Desativar** bloqueia na hora; **Reativar** libera.
- Esqueceu a senha? O administrador usa **Senha** para definir uma nova.

## O que a barbearia tem
- **Agenda** por dia: marcar, concluir (valor e forma de pagamento), faltou, cancelar, editar.
  Atendimento de quem chegou sem horário: "Novo horário" e marque "Já foi atendido".
- **Clientes**: cadastro, busca, link para WhatsApp e histórico de cada cliente. Ao marcar horário com um nome novo,
  o cliente é cadastrado sozinho.
- **Serviços**: preço e duração, que preenchem a agenda.
- **Gastos** por mês, com categorias.
- **Resumo** do mês: faturamento, atendimentos, ticket médio, gastos, resultado, faltas e quebras por serviço,
  forma de pagamento e categoria de gasto.

## Segurança
- A chave **pública** fica no site (é feita para isso). Quem protege os dados são as regras **RLS** do
  `schema.sql`: cada barbearia só lê e grava as próprias linhas, o administrador não enxerga clientes, agenda nem
  gastos, e quem não está logado não acessa nada.
- A chave **secreta** fica só na Vercel e é usada apenas por `api/admin.js`, que confere se quem pede é o
  administrador antes de criar logins, trocar senhas ou excluir.
- O próprio banco impede dois horários sobrepostos na agenda (cancelados e faltas liberam o horário).
- Se um dia criar tabelas novas, ative o RLS nelas e crie regras iguais às de `clientes`.
- O `vercel.json` liga proteções do navegador. Se usar um domínio próprio no Supabase, inclua-o na linha
  `connect-src` desse arquivo.

## Estrutura
- `index.html`, `painel.html`, `admin.html`: as telas (login, barbearia, administração).
- `css/estilo.css`: o visual.
- `js/`: a lógica das telas (`config.js` é o único que você edita).
- `api/admin.js`: função da Vercel para o administrador.
- `supabase/schema.sql`: tabelas, regras de acesso e funções do banco.

## Limites conhecidos
- Uma agenda por barbearia (sem cadastro de vários barbeiros).
- Um login por barbearia.
- Cobrança manual (sem boleto ou Pix automático).
