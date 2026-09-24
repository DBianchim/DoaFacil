# Prompt para colar no Claude Code

Cole o texto abaixo na primeira mensagem, dentro da pasta do projeto:

---

Leia o CLAUDE.md e os protótipos em design/. Quero construir o Doa Fácil com Next.js (App Router, TypeScript, Tailwind) para a Vercel e Supabase como banco.

Antes de escrever código, me apresente um plano curto em etapas. Depois implemente nesta ordem, parando ao fim de cada etapa para eu testar:

1. Setup do projeto, Tailwind com os design tokens, fonte Plus Jakarta Sans e componentes base (Button, Badge, Input, Card, Modal, Toast, Skeleton).
2. Migração SQL do Supabase (tabelas, RLS sem policies, pg_cron) e o cliente service-role só no servidor.
3. Middleware + tela /entrar com o código do condomínio.
4. Home e /explorar com busca, filtros e paginação, lendo do banco.
5. /item/[id] com o modal de contato e a rota /api/contato/[id] (link de WhatsApp com mensagem pronta).
6. /publicar com upload de fotos, etapa de contato, consentimento e criação da chave de doador; tela /publicado.
7. /minhas com as ações de reservar, doar, renovar e remover.
8. /admin simples para o síndico, cartaz com QR Code e revisão de responsividade e acessibilidade.

Siga as decisões de produto e as regras de segurança do CLAUDE.md sem alterá-las; se achar que alguma precisa mudar, pergunte antes.
