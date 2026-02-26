// Domain Entities
export interface Usuario {
  id: number;
  nome: string;
  dataCriacao: string;
  pontuacaoTotal: number;
  totalAcertos: number;
  totalErros: number;
}

export interface Linguagem {
  id: number;
  nome: string;
}

export interface Tag {
  id: number;
  nome: string;
  linguagemId: number;
}

export type PerguntaTipo = "multipla_escolha" | "aberta" | "corrigir_codigo";

export interface Pergunta {
  id: number;
  linguagemId: number;
  tipo: PerguntaTipo;
  dificuldade: number;
  enunciado: string;
  explicacaoDidatica: string;
  codigoComErro?: string;
  codigoCorreto?: string;
  tags?: Tag[];
}

export interface Alternativa {
  id: number;
  perguntaId: number;
  texto: string;
  correta: boolean;
}

export type SessaoModo = "sessao_fixa" | "livre";
export type SessaoTipoEstudo = "manual" | "inteligente";

export interface Sessao {
  id: number;
  usuarioId: number;
  linguagemId: number;
  modo: SessaoModo;
  tipoEstudo: SessaoTipoEstudo;
  quantidadePerguntas?: number;
  dataInicio: string;
  dataFim?: string;
  pontuacaoSessao: number;
}

export interface Resposta {
  id: number;
  sessaoId: number;
  perguntaId: number;
  acertou: boolean;
  tempoResposta: number;
  data: string;
}
