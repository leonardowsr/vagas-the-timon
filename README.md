# 🚀 Vagas THE & Timon

> Agregador inteligente e automação de vagas de emprego e estágio exclusivo para **Teresina (PI)** e **Timon (MA)**, sincronizado em tempo real com o [Themos Vagas](https://themosvagas.com.br/).

---

## 🎯 Por que este projeto é muito mais fácil e direto?

O Themos Vagas tradicional possui muitos anúncios, formatação longa em parágrafos e e-mails escondidos no meio do texto. Este portal resolve isso:

1. **Foco 100% Regional**: Filtra e exibe **apenas vagas de Teresina e Timon** (descarta outras cidades fora da região metropolitana).
2. **Extração Automática de Dados**:
   - 💼 **Cargo & Função**
   - 📍 **Cidade e Estado** (distinção visual clara entre Teresina - PI e Timon - MA)
   - 👥 **Quantidade de vagas**
   - 💰 **Salário em destaque** (com filtro rápido "Apenas com salário informado")
   - ⏰ **Carga horária e escala**
   - 🎯 **Requisitos em formato de tópicos (bullets)**
   - 🎁 **Benefícios estruturados**
3. **Candidatura em 1 Clique**:
   - 📧 **E-mail**: Botão "Enviar Currículo" já abre seu app de e-mail com o destinatário e o **assunto oficial preenchido** (ex: *"Currículo - Consultor(a) de Vendas - Crédito"*), além de botão para copiar o e-mail em 1 clique.
   - 💬 **WhatsApp**: Botão direto `wa.me` com mensagem de apresentação profissional já digitada.
   - 🔗 **Formulário / Plataforma**: Link direto para a página de inscrição da empresa.
4. **Sem Poluição Visual**:
   - Interface limpa, modo escuro moderno, rápida e responsiva para celular e computador.
   - Busca em tempo real por palavras-chave e filtros instantâneos por Tipo (CLT, Estágio, Home Office, Jovem Aprendiz) e Área.

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 16 (App Router + Turbopack)**
- **TypeScript**
- **Tailwind CSS**
- **Lucide Icons**
- **WordPress REST API Connector** com cache inteligente em memória

---

## 💻 Como Rodar Localmente

```bash
cd /Users/macbookpro/projetos/vagas-the-timon

# Instalar dependências (já instaladas)
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev
```

Acesse no seu navegador: `http://localhost:3000`

---

## ☁️ Como Publicar na Vercel ou Cloudflare Pages

### Opção 1: Vercel (Recomendado - 2 minutos)

1. Envie para o GitHub:
   ```bash
   gh repo create vagas-the-timon --public --source=. --push
   ```
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**.
3. Selecione o repositório `vagas-the-timon` e clique em **Deploy**.
4. Pronto! O site estará online com HTTPS gratuito e atualizações automáticas.

### Opção 2: Cloudflare Pages

1. Conecte o repositório Git no painel da **Cloudflare Pages**.
2. Framework preset: **Next.js**.
3. Build command: `npx @cloudflare/next-on-pages` (ou Next.js adapter).
4. Clique em **Save and Deploy**.
