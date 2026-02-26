# DevTrain - Plataforma de Treino Inteligente para Programadores

Esta é uma plataforma base completa para treino de programação, focada em feedback didático e evolução adaptativa.

## 🚀 Tecnologias

- **Frontend**: React 19, Tailwind CSS 4, Motion (Framer Motion), Lucide React.
- **Backend**: Node.js com Express (Estruturado em Clean Architecture: Domain, Application, Infrastructure, API).
- **Banco de Dados**: SQLite (via `better-sqlite3`) para persistência real e simplicidade de setup.
- **Linguagem**: TypeScript em todo o projeto.

## 🧠 Motor Inteligente

O sistema implementa um algoritmo de recomendação baseado em desempenho por Tag:
1. Calcula a taxa de acerto do usuário para cada micro-habilidade (Tag).
2. Classifica as tags em: **Forte** (>=80%), **Médio** (60-79%) e **Fraco** (<60%).
3. Atribui pesos (Forte: 1, Médio: 2, Fraco: 4).
4. No modo **Inteligente**, o sistema prioriza perguntas que contenham tags com maior peso (pontos fracos).

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
