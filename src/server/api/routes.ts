import { Router } from "express";
import { DevTrainService } from "../application/services.js";
import { GroqProvider } from "../infrastructure/groqClient.js";

const router = Router();

// Usuário
router.post("/usuarios", (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
    const usuario = DevTrainService.createUsuario(nome);
    res.json(usuario);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/usuarios/ranking", (req, res) => {
  try {
    const ranking = DevTrainService.getRanking();
    res.json(ranking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/usuarios/ranking/:linguagemId", (req, res) => {
  try {
    const ranking = DevTrainService.getRanking(parseInt(req.params.linguagemId));
    res.json(ranking);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Perguntas
router.get("/perguntas", (req, res) => {
  try {
    const { linguagemId, modo, tipoEstudo, usuarioId, quantidade } = req.query;
    const perguntas = DevTrainService.getPerguntas(
      parseInt(linguagemId as string),
      modo as string,
      tipoEstudo as string,
      parseInt(usuarioId as string),
      quantidade ? parseInt(quantidade as string) : undefined
    );
    res.json(perguntas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/perguntas/:id", (req, res) => {
  try {
    const pergunta = DevTrainService.getPergunta(parseInt(req.params.id));
    if (!pergunta) return res.status(404).json({ error: "Pergunta não encontrada" });
    res.json(pergunta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sessão
router.post("/sessao/iniciar", (req, res) => {
  try {
    const sessao = DevTrainService.iniciarSessao(req.body);
    res.json(sessao);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sessao/finalizar/:id", (req, res) => {
  try {
    const sessao = DevTrainService.finalizarSessao(parseInt(req.params.id));
    res.json(sessao);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resposta
router.post("/resposta", (req, res) => {
  try {
    const resposta = DevTrainService.registrarResposta(req.body);
    res.json(resposta);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard
router.get("/dashboard/:usuarioId", (req, res) => {
  try {
    const dashboard = DevTrainService.getDashboard(parseInt(req.params.usuarioId));
    if (!dashboard) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(dashboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Linguagens
router.get("/linguagens", (req, res) => {
  try {
    const linguagens = DevTrainService.getLinguagens();
    res.json(linguagens);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/perguntas/bulk", (req, res) => {
  try {
    const { linguagemId, perguntas, origem } = req.body;
    if (!linguagemId || !perguntas) return res.status(400).json({ error: "Dados incompletos" });
    const ids = DevTrainService.salvarPerguntasBulk(parseInt(linguagemId), perguntas, origem || 'manual');
    res.json({ success: true, ids });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/ia/gerar", async (req, res) => {
  try {
    const { linguagemId, linguagemNome, tags, dificuldade } = req.body;
    
    // 1. Check Rate Limit
    const canGenerate = DevTrainService.checkAndIncrementIARateLimit();
    
    if (!canGenerate) {
      return res.status(429).json({ 
        error: "Limite diário de IA atingido.",
        fallback: true,
        message: "Utilizando perguntas da biblioteca local (Modo de Economia)."
      });
    }

    // 2. Try to generate with Groq
    try {
      const perguntas = await GroqProvider.gerarPerguntas(linguagemNome, tags, dificuldade);
      
      if (perguntas && perguntas.length > 0) {
        // Save to DB
        DevTrainService.salvarPerguntasBulk(parseInt(linguagemId), perguntas, 'groq');
        return res.json({ success: true, perguntas, source: 'groq' });
      }
    } catch (groqError: any) {
      console.error("Groq Generation Error:", groqError);
      // Fallback to local DB if Groq fails
      return res.status(200).json({ 
        success: false, 
        fallback: true,
        message: `Erro na IA: ${groqError.message}. Utilizando biblioteca local.`,
        error: groqError.message
      });
    }

    res.status(500).json({ error: "Falha na geração de perguntas." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
