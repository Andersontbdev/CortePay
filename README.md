# Sistema da barbearia

Sistema para vender a várias barbearias. Cada barbearia vê somente a sua área; o administrador só libera acesso e
controla a cobrança, sem ver clientes, atendimentos ou gastos.

## As três peças (cada uma faz uma coisa)
| Peça | Para que serve | O que vai nela |
|---|---|---|
| **GitHub** | Guarda o código | Todos os arquivos desta pasta |
| **Supabase** | Guarda os dados (banco de dados) | Nada de código: o sistema cria as tabelas sozinho |
| **Hospedagem do servidor** | Roda o programa em Java e entrega as telas | O código vem do GitHub, e os dados ficam no Supabase |

O Supabase não roda programas em Java. Ele é só o banco de dados, e o servidor precisa de uma hospedagem que aceite
Docker (o arquivo `Dockerfile` já está pronto).

## Passo a passo
1. **Supabase:** crie um projeto e guarde a senha do banco. Clique em **Connect**, escolha **Session pooler**, aba **JDBC**.
   Anote o endereço (host) e o usuário (algo como `postgres.xxxx`). Não use o "Transaction pooler" (porta 6543).
2. **GitHub:** crie um repositório **privado** e envie todos os arquivos desta pasta, mantendo as pastas como estão.
   A cada envio, a aba **Actions** compila o código e mostra se há algum erro.
3. **Hospedagem:** crie um serviço Web a partir do repositório do GitHub usando o `Dockerfile` e preencha as variáveis do
   arquivo `.env.example` (os valores reais ficam só na hospedagem, nunca no GitHub).
4. **Primeiro acesso:** abra o endereço do sistema e entre com `ADMIN_EMAIL` e `ADMIN_PASSWORD`. Em "Nova barbearia",
   crie o acesso do primeiro cliente.

Na primeira execução o sistema cria as tabelas no Supabase sozinho (pasta `src/main/resources/db/migration`).
**Não** crie as tabelas à mão no Supabase.

## Segurança
- Repositório privado e senhas só nas variáveis da hospedagem. O `.env` está no `.gitignore`.
- Um ajuste só do Supabase (`V3__seguranca_supabase.sql`) fecha o acesso direto às tabelas pela internet: os dados só
  passam pelo servidor. Se um dia você criar tabelas novas, repita esse ajuste nelas.
- O isolamento entre barbearias é feito no servidor: a barbearia vem sempre do login.

## Estrutura
- `src/main/java/com/barbearia`: servidor (modelo, repositórios, segurança, cobrança, controladores).
- `src/main/resources/static`: telas (login, painel da barbearia, administração) e o estilo.
- `src/main/resources/db/migration`: criação das tabelas.

## Limites conhecidos (para os próximos passos)
- O código foi escrito mas ainda não foi executado de ponta a ponta. A conferência automática do GitHub Actions vai
  apontar erros de compilação, e os demais serão corrigidos na primeira execução.
- Uma agenda por barbearia (sem cadastro de vários barbeiros).
- Quem está logado perde a sessão quando o servidor reinicia (ele precisa entrar de novo).
- Rodar com uma única cópia do servidor (a proteção contra horário duplicado na agenda depende disso).
