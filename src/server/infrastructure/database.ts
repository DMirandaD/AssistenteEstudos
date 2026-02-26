import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "../../../devtrain.db"));

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS Usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    pontuacaoTotal INTEGER DEFAULT 0,
    totalAcertos INTEGER DEFAULT 0,
    totalErros INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS Linguagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    linguagemId INTEGER,
    FOREIGN KEY (linguagemId) REFERENCES Linguagens(id)
  );

  CREATE TABLE IF NOT EXISTS Perguntas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    linguagemId INTEGER,
    tipo TEXT NOT NULL,
    dificuldade INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    explicacaoDidatica TEXT NOT NULL,
    codigoComErro TEXT,
    codigoCorreto TEXT,
    FOREIGN KEY (linguagemId) REFERENCES Linguagens(id)
  );

  CREATE TABLE IF NOT EXISTS PerguntaTags (
    perguntaId INTEGER,
    tagId INTEGER,
    PRIMARY KEY (perguntaId, tagId),
    FOREIGN KEY (perguntaId) REFERENCES Perguntas(id),
    FOREIGN KEY (tagId) REFERENCES Tags(id)
  );

  CREATE TABLE IF NOT EXISTS Alternativas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    perguntaId INTEGER,
    texto TEXT NOT NULL,
    correta BOOLEAN NOT NULL,
    FOREIGN KEY (perguntaId) REFERENCES Perguntas(id)
  );

  CREATE TABLE IF NOT EXISTS Sessoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuarioId INTEGER,
    linguagemId INTEGER,
    modo TEXT NOT NULL,
    tipoEstudo TEXT NOT NULL,
    quantidadePerguntas INTEGER,
    dataInicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    dataFim DATETIME,
    pontuacaoSessao INTEGER DEFAULT 0,
    FOREIGN KEY (usuarioId) REFERENCES Usuarios(id),
    FOREIGN KEY (linguagemId) REFERENCES Linguagens(id)
  );

  CREATE TABLE IF NOT EXISTS Respostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessaoId INTEGER,
    perguntaId INTEGER,
    acertou BOOLEAN NOT NULL,
    tempoResposta INTEGER NOT NULL,
    data DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessaoId) REFERENCES Sessoes(id),
    FOREIGN KEY (perguntaId) REFERENCES Perguntas(id)
  );
`);

// Seed initial data if empty
const linguagensCount = db.prepare("SELECT COUNT(*) as count FROM Linguagens").get() as { count: number };
if (linguagensCount.count === 0) {
  const insertLinguagem = db.prepare("INSERT INTO Linguagens (nome) VALUES (?)");
  const csharpId = insertLinguagem.run("C#").lastInsertRowid;
  const sqlId = insertLinguagem.run("SQL Server").lastInsertRowid;
  const reactId = insertLinguagem.run("React").lastInsertRowid;
  const jsId = insertLinguagem.run("JavaScript").lastInsertRowid;
  const webId = insertLinguagem.run("Web Fundamentals").lastInsertRowid;

  const insertTag = db.prepare("INSERT INTO Tags (nome, linguagemId) VALUES (?, ?)");
  // C# Tags
  const tagSintaxe = insertTag.run("Sintaxe", csharpId).lastInsertRowid;
  const tagPoo = insertTag.run("POO", csharpId).lastInsertRowid;
  const tagLinq = insertTag.run("LINQ", csharpId).lastInsertRowid;
  // SQL Tags
  const tagSelect = insertTag.run("SELECT", sqlId).lastInsertRowid;
  const tagJoin = insertTag.run("JOIN", sqlId).lastInsertRowid;
  const tagProc = insertTag.run("Procedures", sqlId).lastInsertRowid;
  // React Tags
  const tagHooks = insertTag.run("Hooks", reactId).lastInsertRowid;
  const tagEstado = insertTag.run("Estado", reactId).lastInsertRowid;
  // Web Tags
  const tagHttp = insertTag.run("HTTP", webId).lastInsertRowid;
  const tagCss = insertTag.run("CSS", webId).lastInsertRowid;

  // Seed some questions
  const insertPergunta = db.prepare(`
    INSERT INTO Perguntas (linguagemId, tipo, dificuldade, enunciado, explicacaoDidatica)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAlternativa = db.prepare("INSERT INTO Alternativas (perguntaId, texto, correta) VALUES (?, ?, ?)");
  const insertPerguntaTag = db.prepare("INSERT INTO PerguntaTags (perguntaId, tagId) VALUES (?, ?)");

  // --- WEB FUNDAMENTALS ---
  const qWeb1 = insertPergunta.run(webId, "multipla_escolha", 1, "O que é o protocolo HTTP?", "HTTP é a base da comunicação na web, definindo como mensagens são formatadas e transmitidas.").lastInsertRowid;
  insertAlternativa.run(qWeb1, "HyperText Transfer Protocol", 1);
  insertAlternativa.run(qWeb1, "Hyperlink Text Tool Process", 0);
  insertPerguntaTag.run(qWeb1, tagHttp);

  const qWeb2 = insertPergunta.run(webId, "multipla_escolha", 2, "Qual a principal diferença entre HTTP e HTTPS?", "O 'S' no HTTPS significa Secure, indicando que os dados são criptografados via SSL/TLS.").lastInsertRowid;
  insertAlternativa.run(qWeb2, "HTTPS possui criptografia (SSL/TLS)", 1);
  insertAlternativa.run(qWeb2, "HTTP é mais rápido que HTTPS", 0);
  insertPerguntaTag.run(qWeb2, tagHttp);

  const qWeb3 = insertPergunta.run(webId, "multipla_escolha", 1, "O que é FlexBox no CSS?", "Flexbox é um modelo de layout unidimensional para organizar itens em linhas ou colunas.").lastInsertRowid;
  insertAlternativa.run(qWeb3, "Um modelo de layout para alinhar itens em containers", 1);
  insertAlternativa.run(qWeb3, "Uma biblioteca JavaScript de animação", 0);
  insertPerguntaTag.run(qWeb3, tagCss);

  // --- SQL SERVER ---
  const qSql1 = insertPergunta.run(sqlId, "multipla_escolha", 1, "Qual comando SQL para filtrar todos os produtos?", "O comando SELECT * seleciona todas as colunas de uma tabela.").lastInsertRowid;
  insertAlternativa.run(qSql1, "SELECT * FROM Produtos", 1);
  insertAlternativa.run(qSql1, "GET ALL FROM Produtos", 0);
  insertPerguntaTag.run(qSql1, tagSelect);

  const qSql2 = insertPergunta.run(sqlId, "multipla_escolha", 2, "Como filtrar produtos que contenham 'bolacha' na descrição?", "O operador LIKE com '%' permite buscar padrões dentro de strings.").lastInsertRowid;
  insertAlternativa.run(qSql2, "SELECT * FROM Produtos WHERE Descricao LIKE '%bolacha%'", 1);
  insertAlternativa.run(qSql2, "SELECT * FROM Produtos WHERE Descricao = 'bolacha'", 0);
  insertPerguntaTag.run(qSql2, tagSelect);

  // --- C# ---
  const qCs1 = insertPergunta.run(csharpId, "multipla_escolha", 2, "Quais são os 4 pilares da POO?", "Abstração, Encapsulamento, Herança e Polimorfismo são os fundamentos da Orientação a Objetos.").lastInsertRowid;
  insertAlternativa.run(qCs1, "Abstração, Encapsulamento, Herança e Polimorfismo", 1);
  insertAlternativa.run(qCs1, "Classes, Objetos, Métodos e Atributos", 0);
  insertPerguntaTag.run(qCs1, tagPoo);

  const qCs2 = insertPergunta.run(csharpId, "multipla_escolha", 3, "O que é LINQ em C#?", "Language Integrated Query permite realizar consultas em coleções de dados usando uma sintaxe similar ao SQL.").lastInsertRowid;
  insertAlternativa.run(qCs2, "Uma forma de realizar consultas em coleções de dados", 1);
  insertAlternativa.run(qCs2, "Um framework para criação de interfaces gráficas", 0);
  insertPerguntaTag.run(qCs2, tagLinq);

  // --- REACT ---
  const qRe1 = insertPergunta.run(reactId, "multipla_escolha", 2, "O que são React Hooks?", "Hooks são funções que permitem 'ligar' o estado e o ciclo de vida do React em componentes funcionais.").lastInsertRowid;
  insertAlternativa.run(qRe1, "Funções para usar estado em componentes funcionais", 1);
  insertAlternativa.run(qRe1, "Plugins externos para o React", 0);
  insertPerguntaTag.run(qRe1, tagHooks);
}

export default db;
