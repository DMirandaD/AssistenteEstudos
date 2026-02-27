# DevTrain - Plataforma de Treino Inteligente para Programadores

Esta é uma plataforma base completa para treino de programação, focada em feedback didático e evolução adaptativa.

## 🚀 Tecnologias

- **Frontend**: React 19, Tailwind CSS 4, Motion (Framer Motion), Lucide React.
- **Backend**: Node.js com Express (Estruturado em Clean Architecture: Domain, Application, Infrastructure, API).
- **Banco de Dados**: SQLite (via `better-sqlite3`) para persistência real e simplicidade de setup.
- **Linguagem**: TypeScript em todo o projeto.

## 🧠 Arquitetura Híbrida Inteligente

O sistema agora utiliza uma abordagem híbrida para geração de perguntas:
1.  **Geração em Tempo Real (Groq)**: Se houver uma `GROQ_API_KEY` configurada e o limite diário (100 requisições) não tiver sido atingido, o sistema gera perguntas inéditas via IA.
2.  **Fallback Automático**: Caso o limite de IA seja atingido ou ocorra um erro na API, o sistema utiliza automaticamente a biblioteca local de perguntas do banco de dados (SQLite).
3.  **Persistência**: Todas as perguntas geradas via IA são salvas no banco com a origem `groq`, enriquecendo a base de dados continuamente.

## 🛠️ Configuração da IA (Groq)

Para habilitar a geração via IA:
1.  Obtenha uma chave de API em [console.groq.com](https://console.groq.com/).
2.  Adicione a chave no painel de **Secrets** do AI Studio com o nome `GROQ_API_KEY`.
3.  O sistema detectará a chave automaticamente e ativará o modo inteligente.

## 🏗️ Estrutura do Projeto

### Backend (`src/server`)
- `domain/`: Entidades e tipos de negócio.
- `application/`: Lógica de serviços e motor inteligente.
- `infrastructure/`: Persistência de dados (SQLite) e configuração do banco.
- `api/`: Definição de rotas e controllers.

### Frontend (`src/`)
- `App.tsx`: Componente principal com roteamento interno de views.
- `index.css`: Configurações do Tailwind CSS.

## 🛠️ Como Rodar

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Rodar em Desenvolvimento**:
   ```bash
   npm run dev
   ```
   O servidor iniciará na porta 3000, servindo tanto a API quanto o frontend via Vite middleware.

3. **Build para Produção**:
   ```bash
   npm run build
   ```

## 🗄️ Modelagem de Dados

- **Usuários**: Nome, pontuação total, estatísticas de acertos/erros.
- **Linguagens**: C#, SQL Server, React, etc.
- **Tags**: Micro-habilidades vinculadas a linguagens (ex: POO, LINQ, Hooks).
- **Perguntas**: Enunciado, explicação didática, dificuldade e tags.
- **Sessões**: Registro de cada ciclo de estudo (Fixo ou Livre).
- **Respostas**: Registro individual de cada interação para alimentar o motor inteligente.

## 🎨 Design

O design segue uma linha profissional e limpa, utilizando a paleta `Indigo` e `Slate` do Tailwind, com animações suaves para transições de estado.
