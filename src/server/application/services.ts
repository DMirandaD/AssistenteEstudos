import db from "../infrastructure/database.js";
import { Usuario, Linguagem, Sessao, Pergunta, Resposta, Tag } from "../domain/entities.js";

export class DevTrainService {
  // Usuário
  static createUsuario(nome: string): Usuario {
    const result = db.prepare("INSERT INTO Usuarios (nome) VALUES (?)").run(nome);
    return db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(result.lastInsertRowid) as Usuario;
  }

  static getRanking(linguagemId?: number) {
    if (linguagemId) {
      // For simplicity in this base version, we use total score. 
      // A more complex version would join with sessions of that language.
      return db.prepare(`
        SELECT DISTINCT u.id, u.nome, SUM(s.pontuacaoSessao) as pontuacaoTotal
        FROM Usuarios u
        JOIN Sessoes s ON u.id = s.usuarioId
        WHERE s.linguagemId = ?
        GROUP BY u.id
        ORDER BY pontuacaoTotal DESC
        LIMIT 10
      `).all(linguagemId);
    }
    return db.prepare("SELECT id, nome, pontuacaoTotal FROM Usuarios ORDER BY pontuacaoTotal DESC LIMIT 10").all();
  }

  // Perguntas
  static getPerguntas(linguagemId: number, modo: string, tipoEstudo: string, usuarioId: number): Pergunta[] {
    if (tipoEstudo === "inteligente") {
      return this.getIntelligentPerguntas(linguagemId, usuarioId);
    }
    
    // Manual/Random mode
    const query = `
      SELECT p.* FROM Perguntas p 
      WHERE p.linguagemId = ? 
      ORDER BY RANDOM() 
      LIMIT 10
    `;
    return db.prepare(query).all(linguagemId) as Pergunta[];
  }

  private static getIntelligentPerguntas(linguagemId: number, usuarioId: number): Pergunta[] {
    // 1. Get performance per tag for this user
    const tagStats = db.prepare(`
      SELECT t.id, t.nome, 
             COUNT(r.id) as total,
             SUM(CASE WHEN r.acertou = 1 THEN 1 ELSE 0 END) as acertos
      FROM Tags t
      LEFT JOIN PerguntaTags pt ON t.id = pt.tagId
      LEFT JOIN Respostas r ON pt.perguntaId = r.perguntaId
      LEFT JOIN Sessoes s ON r.sessaoId = s.id AND s.usuarioId = ?
      WHERE t.linguagemId = ?
      GROUP BY t.id
    `).all(usuarioId, linguagemId) as any[];

    const tagWeights = tagStats.map(stat => {
      const rate = stat.total > 0 ? (stat.acertos / stat.total) * 100 : 0;
      let weight = 4; // Default to weak if no data
      if (stat.total > 0) {
        if (rate >= 80) weight = 1;
        else if (rate >= 60) weight = 2;
        else weight = 4;
      }
      return { tagId: stat.id, weight };
    });

    // 2. Get all questions for this language with their tags
    const questions = db.prepare(`
      SELECT p.* FROM Perguntas p WHERE p.linguagemId = ?
    `).all(linguagemId) as any[];

    // 3. Calculate weight for each question based on its tags
    const weightedQuestions = questions.map(q => {
      const qTags = db.prepare("SELECT tagId FROM PerguntaTags WHERE perguntaId = ?").all(q.id) as any[];
      let maxWeight = 1;
      qTags.forEach(qt => {
        const tw = tagWeights.find(w => w.tagId === qt.tagId);
        if (tw && tw.weight > maxWeight) maxWeight = tw.weight;
      });
      return { ...q, weight: maxWeight };
    });

    // 4. Weighted random selection (simplified: sort by weight and take top or random sample)
    // Sort by weight descending (weakest tags first)
    return weightedQuestions
      .sort((a, b) => b.weight - a.weight + (Math.random() - 0.5))
      .slice(0, 10) as Pergunta[];
  }

  static getPergunta(id: number): any {
    const pergunta = db.prepare("SELECT * FROM Perguntas WHERE id = ?").get(id) as any;
    if (pergunta) {
      pergunta.alternativas = db.prepare("SELECT * FROM Alternativas WHERE perguntaId = ?").all(id);
      pergunta.tags = db.prepare(`
        SELECT t.* FROM Tags t 
        JOIN PerguntaTags pt ON t.id = pt.tagId 
        WHERE pt.perguntaId = ?
      `).all(id);
    }
    return pergunta;
  }

  // Sessão
  static iniciarSessao(data: any): Sessao {
    const { usuarioId, linguagemId, modo, tipoEstudo, quantidadePerguntas } = data;
    const result = db.prepare(`
      INSERT INTO Sessoes (usuarioId, linguagemId, modo, tipoEstudo, quantidadePerguntas)
      VALUES (?, ?, ?, ?, ?)
    `).run(usuarioId, linguagemId, modo, tipoEstudo, quantidadePerguntas);
    return db.prepare("SELECT * FROM Sessoes WHERE id = ?").get(result.lastInsertRowid) as Sessao;
  }

  static finalizarSessao(id: number): Sessao {
    db.prepare("UPDATE Sessoes SET dataFim = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return db.prepare("SELECT * FROM Sessoes WHERE id = ?").get(id) as Sessao;
  }

  // Resposta
  static registrarResposta(data: any): Resposta {
    const { sessaoId, perguntaId, acertou, tempoResposta } = data;
    const result = db.prepare(`
      INSERT INTO Respostas (sessaoId, perguntaId, acertou, tempoResposta)
      VALUES (?, ?, ?, ?)
    `).run(sessaoId, perguntaId, acertou ? 1 : 0, tempoResposta);

    if (acertou) {
      // Update session and user score
      db.prepare("UPDATE Sessoes SET pontuacaoSessao = pontuacaoSessao + 10 WHERE id = ?").run(sessaoId);
      const sessao = db.prepare("SELECT usuarioId FROM Sessoes WHERE id = ?").get(sessaoId) as any;
      db.prepare("UPDATE Usuarios SET pontuacaoTotal = pontuacaoTotal + 10, totalAcertos = totalAcertos + 1 WHERE id = ?").run(sessao.usuarioId);
    } else {
      const sessao = db.prepare("SELECT usuarioId FROM Sessoes WHERE id = ?").get(sessaoId) as any;
      db.prepare("UPDATE Usuarios SET totalErros = totalErros + 1 WHERE id = ?").run(sessao.usuarioId);
    }

    return db.prepare("SELECT * FROM Respostas WHERE id = ?").get(result.lastInsertRowid) as Resposta;
  }

  // Dashboard
  static getDashboard(usuarioId: number) {
    const usuario = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(usuarioId) as Usuario;
    if (!usuario) return null;

    const rankingGeral = db.prepare("SELECT COUNT(*) + 1 as rank FROM Usuarios WHERE pontuacaoTotal > ?").get(usuario.pontuacaoTotal) as any;
    
    const tagStats = db.prepare(`
      SELECT t.nome, 
             COUNT(r.id) as total,
             SUM(CASE WHEN r.acertou = 1 THEN 1 ELSE 0 END) as acertos
      FROM Tags t
      JOIN PerguntaTags pt ON t.id = pt.tagId
      JOIN Respostas r ON pt.perguntaId = r.perguntaId
      JOIN Sessoes s ON r.sessaoId = s.id
      WHERE s.usuarioId = ?
      GROUP BY t.id
    `).all(usuarioId) as any[];

    const desempenhoTags = tagStats.map(s => ({
      tag: s.nome,
      taxaAcerto: s.total > 0 ? (s.acertos / s.total) * 100 : 0
    }));

    const pontosFracos = [...desempenhoTags]
      .sort((a, b) => a.taxaAcerto - b.taxaAcerto)
      .slice(0, 3);

    return {
      usuario,
      rankingGeral: rankingGeral.rank,
      desempenhoTags,
      pontosFracos
    };
  }

  static getLinguagens(): Linguagem[] {
    return db.prepare("SELECT * FROM Linguagens").all() as Linguagem[];
  }

  static salvarPerguntasBulk(linguagemId: number, perguntas: any[]) {
    const insertPergunta = db.prepare(`
      INSERT INTO Perguntas (linguagemId, tipo, dificuldade, enunciado, explicacaoDidatica)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertAlternativa = db.prepare(`
      INSERT INTO Alternativas (perguntaId, texto, correta)
      VALUES (?, ?, ?)
    `);
    const insertPerguntaTag = db.prepare(`
      INSERT INTO PerguntaTags (perguntaId, tagId)
      VALUES (?, ?)
    `);
    const findTag = db.prepare("SELECT id FROM Tags WHERE nome = ? AND linguagemId = ?");
    const createTag = db.prepare("INSERT INTO Tags (nome, linguagemId) VALUES (?, ?)");

    const savedIds: number[] = [];

    const transaction = db.transaction((perguntasList) => {
      for (const p of perguntasList) {
        const result = insertPergunta.run(
          linguagemId,
          p.tipo,
          p.dificuldade,
          p.enunciado,
          p.explicacaoDidatica
        );
        const perguntaId = result.lastInsertRowid as number;
        savedIds.push(perguntaId);

        for (const alt of p.alternativas) {
          insertAlternativa.run(perguntaId, alt.texto, alt.correta ? 1 : 0);
        }

        if (p.tags) {
          for (const tagName of p.tags) {
            let tag = findTag.get(tagName, linguagemId) as any;
            let tagId;
            if (!tag) {
              const tagResult = createTag.run(tagName, linguagemId);
              tagId = tagResult.lastInsertRowid;
            } else {
              tagId = tag.id;
            }
            insertPerguntaTag.run(perguntaId, tagId);
          }
        }
      }
    });

    transaction(perguntas);
    return savedIds;
  }
}
