import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Trophy, 
  LayoutDashboard, 
  Play, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Info,
  ArrowLeft,
  User,
  Star,
  BrainCircuit,
  Sparkles,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

// --- Types ---
interface Usuario {
  id: number;
  nome: string;
  pontuacaoTotal: number;
}

interface Linguagem {
  id: number;
  nome: string;
}

interface Pergunta {
  id: number;
  enunciado: string;
  explicacaoDidatica: string;
  tipo: string;
  alternativas: { id: number; texto: string; correta: boolean }[];
}

interface Sessao {
  id: number;
  usuarioId: number;
  linguagemId: number;
  pontuacaoSessao: number;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const variants: any = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none',
    secondary: 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700',
    ghost: 'bg-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex flex-col items-center flex-1" 
         onMouseEnter={() => setShow(true)} 
         onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 z-[100] w-40 p-2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] leading-tight rounded-lg shadow-xl pointer-events-none text-center font-medium"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'quiz' | 'summary' | 'ranking' | 'dashboard'>('home');
  const [user, setUser] = useState<Usuario | null>(null);
  const [linguagens, setLinguagens] = useState<Linguagem[]>([]);
  const [selectedLang, setSelectedLang] = useState<number | null>(null);
  const [modo, setModo] = useState<'sessao_fixa' | 'livre'>('sessao_fixa');
  const [tipoEstudo, setTipoEstudo] = useState<'manual' | 'inteligente'>('manual');
  const [quantidadePerguntas, setQuantidadePerguntas] = useState(12);
  
  const [currentSessao, setCurrentSessao] = useState<Sessao | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('devtrain_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('devtrain_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const fetchLinguagens = () => {
      fetch('/api/linguagens')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setLinguagens(data);
          }
        })
        .catch(err => console.error("Erro ao buscar linguagens:", err));
    };

    if (linguagens.length === 0) {
      fetchLinguagens();
    }
    
    const savedUser = localStorage.getItem('devtrain_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, [view]); // Re-check when view changes

  const handleStart = async (nome: string) => {
    if (!selectedLang) return;
    
    setIsGenerating(true);
    setFallbackMessage(null);
    try {
      let activeUser = user;
      if (!activeUser || activeUser.nome !== nome) {
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome })
        });
        activeUser = await res.json();
        setUser(activeUser);
        localStorage.setItem('devtrain_user', JSON.stringify(activeUser));
      }

      // Se for modo inteligente, vamos tentar gerar com IA no backend
      if (tipoEstudo === 'inteligente') {
        const dashRes = await fetch(`/api/dashboard/${activeUser!.id}`);
        const dashData = await dashRes.json();
        const weakTags = dashData.pontosFracos.map((p: any) => p.tag);
        const langName = linguagens.find(l => l.id === selectedLang)?.nome || "Programação";

        const aiRes = await fetch('/api/ia/gerar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linguagemId: selectedLang,
            linguagemNome: langName,
            tags: weakTags.length > 0 ? weakTags : ["Básico"],
            dificuldade: 3
          })
        });

        const aiData = await aiRes.json();
        if (aiData.fallback) {
          setFallbackMessage(aiData.message);
        }
      }

      const sessaoRes = await fetch('/api/sessao/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: activeUser!.id,
          linguagemId: selectedLang,
          modo,
          tipoEstudo,
          quantidadePerguntas: modo === 'sessao_fixa' ? quantidadePerguntas : null
        })
      });
      const sessao = await sessaoRes.json();
      setCurrentSessao(sessao);

      const perguntasRes = await fetch(`/api/perguntas?linguagemId=${selectedLang}&modo=${modo}&tipoEstudo=${tipoEstudo}&usuarioId=${activeUser!.id}&quantidade=${quantidadePerguntas}`);
      const data = await perguntasRes.json();
      
      const fullPerguntas = await Promise.all(data.map((p: any) => fetch(`/api/perguntas/${p.id}`).then(r => r.json())));
      
      setPerguntas(fullPerguntas);
      setCurrentIdx(0);
      setView('quiz');
      setStartTime(Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async () => {
    if (selectedAlt === null || !currentSessao) return;
    
    const pergunta = perguntas[currentIdx];
    const alternativa = pergunta.alternativas.find(a => a.id === selectedAlt);
    const correct = alternativa?.correta || false;
    const tempo = Math.floor((Date.now() - startTime) / 1000);

    await fetch('/api/resposta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessaoId: currentSessao.id,
        perguntaId: pergunta.id,
        acertou: correct,
        tempoResposta: tempo
      })
    });

    setFeedback({
      correct,
      message: correct ? "Boa! 👏 Você entendeu bem esse conceito." : "Quase lá 👀 Vamos simplificar isso juntos:"
    });
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < perguntas.length) {
      setCurrentIdx(currentIdx + 1);
      setSelectedAlt(null);
      setFeedback(null);
      setStartTime(Date.now());
    } else {
      finishSessao();
    }
  };

  const finishSessao = async () => {
    if (currentSessao) {
      const res = await fetch(`/api/sessao/finalizar/${currentSessao.id}`, { method: 'POST' });
      const finalSessao = await res.json();
      setCurrentSessao(finalSessao);
    }
    setView('summary');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <Code2 size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight dark:text-white">DevTrain</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setView('ranking')} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <Trophy size={20} />
            </button>
            <button onClick={() => user && setView('dashboard')} className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <LayoutDashboard size={20} />
            </button>
            {user && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                <User size={14} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.nome}</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {fallbackMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex items-center gap-2"
            >
              <Info size={16} /> {fallbackMessage}
            </motion.div>
          )}

          {view === 'home' && (
            <HomeView 
              user={user} 
              linguagens={linguagens} 
              selectedLang={selectedLang}
              setSelectedLang={setSelectedLang}
              modo={modo}
              setModo={setModo}
              tipoEstudo={tipoEstudo}
              setTipoEstudo={setTipoEstudo}
              quantidadePerguntas={quantidadePerguntas}
              setQuantidadePerguntas={setQuantidadePerguntas}
              onStart={handleStart} 
              isGenerating={isGenerating}
            />
          )}

          {view === 'quiz' && perguntas[currentIdx] && (
            <QuizView 
              pergunta={perguntas[currentIdx]} 
              currentIdx={currentIdx}
              total={perguntas.length}
              selectedAlt={selectedAlt}
              setSelectedAlt={setSelectedAlt}
              feedback={feedback}
              onAnswer={handleAnswer}
              onNext={nextQuestion}
            />
          )}

          {view === 'summary' && (
            <SummaryView 
              sessao={currentSessao} 
              totalPerguntas={perguntas.length}
              onBack={() => {
                setPerguntas([]);
                setCurrentIdx(0);
                setSelectedAlt(null);
                setFeedback(null);
                setView('home');
              }} 
            />
          )}

          {view === 'ranking' && (
            <RankingView linguagens={linguagens} />
          )}

          {view === 'dashboard' && user && (
            <DashboardView usuarioId={user.id} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- View Components ---

function HomeView({ user, linguagens, selectedLang, setSelectedLang, modo, setModo, tipoEstudo, setTipoEstudo, quantidadePerguntas, setQuantidadePerguntas, onStart, isGenerating }: any) {
  const [nome, setNome] = useState(user?.nome || '');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"></h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Evolua sua lógica com feedback adaptativo.</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Seu Nome</label>
          <input 
            type="text" 
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como quer ser chamado?"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Linguagem</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {linguagens.length === 0 ? (
              <div className="col-span-full text-center py-4 text-slate-400 animate-pulse">Carregando linguagens...</div>
            ) : (
              linguagens.map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLang(l.id)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedLang === l.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {l.nome}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Modo</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
              <Tooltip text="Sessão com número definido de perguntas e resumo final.">
                <button 
                  onClick={() => setModo('sessao_fixa')}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${modo === 'sessao_fixa' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                >
                  FIXO
                </button>
              </Tooltip>
              <Tooltip text="Treino contínuo sem fim definido. Pratique livremente.">
                <button 
                  onClick={() => setModo('livre')}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${modo === 'livre' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                >
                  LIVRE
                </button>
              </Tooltip>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tipo</label>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
              <Tooltip text="Utiliza perguntas da biblioteca local do sistema.">
                <button 
                  onClick={() => setTipoEstudo('manual')}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${tipoEstudo === 'manual' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                >
                  MANUAL
                </button>
              </Tooltip>
              <Tooltip text="A IA gera perguntas focadas nos seus pontos fracos.">
                <button 
                  onClick={() => setTipoEstudo('inteligente')}
                  className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${tipoEstudo === 'inteligente' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'}`}
                >
                  INTELIGENTE
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {modo === 'sessao_fixa' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex justify-between">
              Quantidade de Perguntas
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{quantidadePerguntas}</span>
            </label>
            <input 
              type="range" 
              min="12" 
              max="50" 
              step="1"
              value={quantidadePerguntas}
              onChange={(e) => setQuantidadePerguntas(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Mín: 12</span>
              <span>Máx: 50</span>
            </div>
          </div>
        )}

        <Button 
          onClick={() => onStart(nome)} 
          disabled={!nome || !selectedLang || isGenerating}
          className="w-full py-4 text-lg"
        >
          {isGenerating ? (
            <>Gerando Treino IA... <Loader2 className="animate-spin" size={20} /></>
          ) : (
            <>Começar Treino <Play size={20} fill="currentColor" /></>
          )}
        </Button>
      </Card>
    </motion.div>
  );
}

function QuizView({ pergunta, currentIdx, total, selectedAlt, setSelectedAlt, feedback, onAnswer, onNext }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Questão {currentIdx + 1} de {total}</span>
          <div className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500" style={{ width: `${((currentIdx + 1) / total) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(pergunta.dificuldade)].map((_, i) => (
            <Star key={i} size={14} className="text-amber-400" fill="currentColor" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{pergunta.enunciado}</h2>
        
        <div className="space-y-3">
          {pergunta.alternativas.map((alt: any) => (
            <button
              key={alt.id}
              disabled={!!feedback}
              onClick={() => setSelectedAlt(alt.id)}
              className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${
                selectedAlt === alt.id 
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              } ${feedback && alt.correta ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : ''}
                ${feedback && selectedAlt === alt.id && !alt.correta ? 'border-rose-500 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : ''}
              `}
            >
              <span className="font-medium">{alt.texto}</span>
              {selectedAlt === alt.id && !feedback && <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>}
              {feedback && alt.correta && <CheckCircle2 size={20} className="text-emerald-500" />}
              {feedback && selectedAlt === alt.id && !alt.correta && <XCircle size={20} className="text-rose-500" />}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4"
          >
            <div className={`p-4 rounded-xl flex gap-3 ${feedback.correct ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200'}`}>
              {feedback.correct ? <CheckCircle2 className="shrink-0" /> : <Info className="shrink-0" />}
              <div className="space-y-1">
                <p className="font-bold">{feedback.message}</p>
                <p className="text-sm opacity-90">{pergunta.explicacaoDidatica}</p>
              </div>
            </div>
            <Button onClick={onNext} className="w-full">
              Próxima Pergunta <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!feedback && (
        <Button 
          onClick={onAnswer} 
          disabled={selectedAlt === null}
          className="w-full py-4"
        >
          Responder
        </Button>
      )}
    </motion.div>
  );
}

function SummaryView({ sessao, totalPerguntas, onBack }: any) {
  const precisao = sessao && totalPerguntas > 0 
    ? Math.round((sessao.pontuacaoSessao / (totalPerguntas * 10)) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100 dark:shadow-none">
        <Trophy size={48} />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Sessão Finalizada!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Você completou seu ciclo de estudos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-600 dark:bg-indigo-600 text-white border-none flex flex-col items-center justify-center py-8">
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">Pontos Ganhos</p>
          <p className="text-5xl font-black mt-2">+{sessao?.pontuacaoSessao || 0}</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-8">
          <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest">Precisão</p>
          <p className="text-5xl font-black text-slate-900 dark:text-white mt-2">{precisao}%</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onBack} className="w-full">Treinar Novamente</Button>
        <Button onClick={onBack} variant="ghost" className="w-full">Voltar ao Início</Button>
      </div>
    </motion.div>
  );
}

function RankingView({ linguagens }: any) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    const url = filter ? `/api/usuarios/ranking/${filter}` : '/api/usuarios/ranking';
    fetch(url).then(res => res.json()).then(setRanking);
  }, [filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white">
          <Trophy className="text-amber-400" /> Ranking
        </h1>
        <select 
          onChange={(e) => setFilter(e.target.value ? parseInt(e.target.value) : null)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-sm outline-none"
        >
          <option value="">Geral</option>
          {linguagens.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {ranking.map((item, idx) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                idx === 0 ? 'bg-amber-100 text-amber-600' : 
                idx === 1 ? 'bg-slate-100 text-slate-600' :
                idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {idx + 1}
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{item.nome}</span>
            </div>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{item.pontuacaoTotal} pts</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function DashboardView({ usuarioId }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/dashboard/${usuarioId}`).then(res => res.json()).then(setData);
  }, [usuarioId]);

  if (!data) return <div className="text-center py-20">Carregando...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">Seu Desempenho</h1>
        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold">
          Rank #{data.rankingGeral}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pontos</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{data.usuario.pontuacaoTotal}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Acertos</p>
          <p className="text-2xl font-black text-emerald-500 dark:text-emerald-400">{data.usuario.totalAcertos}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Erros</p>
          <p className="text-2xl font-black text-rose-500 dark:text-rose-400">{data.usuario.totalErros}</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2 dark:text-white"><BrainCircuit size={20} className="text-indigo-600" /> Diagnóstico por Tag</h3>
        <div className="space-y-3">
          {data.desempenhoTags.map((tag: any) => (
            <div key={tag.tag} className="space-y-1">
              <div className="flex justify-between text-sm font-medium dark:text-slate-300">
                <span>{tag.tag}</span>
                <span>{Math.round(tag.taxaAcerto)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${tag.taxaAcerto >= 80 ? 'bg-emerald-500' : tag.taxaAcerto >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                  style={{ width: `${tag.taxaAcerto}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.pontosFracos.length > 0 && (
        <Card className="bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30">
          <h3 className="font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2 mb-3">
            <Info size={18} /> Focar nestes tópicos:
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.pontosFracos.map((p: any) => (
              <span key={p.tag} className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                {p.tag}
              </span>
            ))}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
