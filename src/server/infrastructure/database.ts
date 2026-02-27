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
    origem TEXT DEFAULT 'manual',
    FOREIGN KEY (linguagemId) REFERENCES Linguagens(id)
  );

  CREATE TABLE IF NOT EXISTS Configuracao (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    dataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  INSERT OR IGNORE INTO Configuracao (chave, valor) VALUES ('ia_requests_today', '0');
  INSERT OR IGNORE INTO Configuracao (chave, valor) VALUES ('last_reset_date', CURRENT_DATE);

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

// Migration: Add origem column if it doesn't exist
try {
  const columns = db.prepare("PRAGMA table_info(Perguntas)").all() as any[];
  const hasOrigem = columns.some(c => c.name === 'origem');
  if (!hasOrigem) {
    db.exec("ALTER TABLE Perguntas ADD COLUMN origem TEXT DEFAULT 'manual'");
    console.log("Migration: Added 'origem' column to Perguntas table.");
  }
} catch (err) {
  console.error("Migration error:", err);
}

// Seed initial data
const linguagensCount = db.prepare("SELECT COUNT(*) as count FROM Linguagens").get() as { count: number };
if (linguagensCount.count === 0) {
  const insertLinguagem = db.prepare("INSERT INTO Linguagens (nome) VALUES (?)");
  db.exec("BEGIN");
  insertLinguagem.run("C#");
  insertLinguagem.run("SQL Server");
  insertLinguagem.run("React");
  insertLinguagem.run("JavaScript");
  insertLinguagem.run("Web Fundamentals");
  db.exec("COMMIT");
}

// Ensure Tags exist
const tagsCount = db.prepare("SELECT COUNT(*) as count FROM Tags").get() as { count: number };
if (tagsCount.count === 0) {
  const linguagens = db.prepare("SELECT * FROM Linguagens").all() as any[];
  const insertTag = db.prepare("INSERT INTO Tags (nome, linguagemId) VALUES (?, ?)");
  
  linguagens.forEach(l => {
    if (l.nome === "C#") {
      insertTag.run("Sintaxe", l.id);
      insertTag.run("POO", l.id);
      insertTag.run("LINQ", l.id);
    } else if (l.nome === "SQL Server") {
      insertTag.run("SELECT", l.id);
      insertTag.run("JOIN", l.id);
      insertTag.run("Procedures", l.id);
    } else if (l.nome === "React") {
      insertTag.run("Hooks", l.id);
      insertTag.run("Estado", l.id);
    } else if (l.nome === "Web Fundamentals") {
      insertTag.run("HTTP", l.id);
      insertTag.run("CSS", l.id);
    }
  });
}

// Ensure some basic questions exist for each language
const questionsCount = db.prepare("SELECT COUNT(*) as count FROM Perguntas").get() as { count: number };
if (questionsCount.count < 10) {
  const linguagens = db.prepare("SELECT * FROM Linguagens").all() as any[];
  const insertPergunta = db.prepare(`
    INSERT INTO Perguntas (linguagemId, tipo, dificuldade, enunciado, explicacaoDidatica)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertAlternativa = db.prepare("INSERT INTO Alternativas (perguntaId, texto, correta) VALUES (?, ?, ?)");
  
  linguagens.forEach(l => {
    if (l.nome === "SQL Server") {
      const q1 = insertPergunta.run(l.id, "multipla_escolha", 1, "Qual comando SQL para filtrar todos os produtos?", "O comando SELECT * seleciona todas as colunas de uma tabela.").lastInsertRowid;
      insertAlternativa.run(q1, "SELECT * FROM Produtos", 1);
      insertAlternativa.run(q1, "GET ALL FROM Produtos", 0);

      const q2 = insertPergunta.run(l.id, "multipla_escolha", 2, "Como filtrar produtos que contenham 'bolacha' na descrição?", "O operador LIKE permite busca parcial.").lastInsertRowid;
      insertAlternativa.run(q2, "SELECT * FROM Produtos WHERE Descricao LIKE '%bolacha%'", 1);
      insertAlternativa.run(q2, "SELECT * FROM Produtos WHERE Descricao = 'bolacha'", 0);
      
      const q3 = insertPergunta.run(l.id, "multipla_escolha", 2, "O que é um Primary Key?", "Identificador único.").lastInsertRowid;
      insertAlternativa.run(q3, "Identificador único", 1);
      insertAlternativa.run(q3, "Uma senha", 0);
    }
    // Add more for others if needed, but SQL is what user is testing
  });
}

export default db;
