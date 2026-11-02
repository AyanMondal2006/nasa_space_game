import React, { useState } from 'react';
import { useMission } from '../state/MissionContext.jsx';
import { EDUCATIONAL_MODULES } from '../data/educationalContent.js';
import { 
  BookOpen, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Calculator, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function LearningCenterPage() {
  const { setActiveTab } = useMission();
  const [selectedModuleId, setSelectedModuleId] = useState(EDUCATIONAL_MODULES[0].id);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});

  const activeModule = EDUCATIONAL_MODULES.find(m => m.id === selectedModuleId) || EDUCATIONAL_MODULES[0];

  const handleSelectQuizOption = (modId, optionIdx) => {
    if (quizSubmitted[modId]) return;
    setQuizAnswers(prev => ({ ...prev, [modId]: optionIdx }));
  };

  const handleSubmitQuiz = (modId) => {
    setQuizSubmitted(prev => ({ ...prev, [modId]: true }));
  };

  const handleResetQuiz = (modId) => {
    setQuizSubmitted(prev => ({ ...prev, [modId]: false }));
    setQuizAnswers(prev => ({ ...prev, [modId]: null }));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-orbit-cyan/10 border border-orbit-cyan/30 text-orbit-cyan text-xs font-mono font-medium mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>AEROSPACE SYSTEMS ENGINEERING ACADEMY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
          Learning Center
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Master the fundamental physics and systems trade-offs of space mission design.
          Study physical equations, units, and test your knowledge with interactive flight challenges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Module Topic List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block px-1">
            Curriculum Modules
          </span>

          <div className="space-y-1.5">
            {EDUCATIONAL_MODULES.map((mod) => {
              const isSelected = selectedModuleId === mod.id;
              const hasAnswered = quizSubmitted[mod.id];
              const isCorrect = hasAnswered && quizAnswers[mod.id] === mod.quiz.correctIndex;

              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-mono transition border flex items-center justify-between ${
                    isSelected
                      ? 'border-orbit-cyan bg-space-850 text-white font-bold shadow-glow-cyan/20'
                      : 'border-space-border/60 bg-space-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-orbit-cyan uppercase tracking-wider block">
                      {mod.category}
                    </span>
                    <span className="text-sm font-semibold">{mod.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasAnswered && (
                      <span className={`w-2.5 h-2.5 rounded-full ${isCorrect ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    )}
                    <span className="text-[10px] text-slate-500">{mod.readTimeMinutes}m</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Module Reader & Interactive Challenge */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border/60 pb-3">
              <div>
                <span className="text-[10px] font-mono text-orbit-cyan uppercase tracking-wider">
                  {activeModule.category} • {activeModule.readTimeMinutes} MINUTE READ
                </span>
                <h2 className="text-xl font-bold font-mono text-white mt-0.5">
                  {activeModule.title}
                </h2>
              </div>

              {activeModule.simulatorLink && (
                <button
                  onClick={() => setActiveTab(activeModule.simulatorLink)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-space-800 hover:bg-orbit-cyan hover:text-space-950 text-xs font-mono text-orbit-cyan transition border border-space-border"
                >
                  <span>Open in Simulator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Markdown Text Body */}
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 font-sans">
              <div dangerouslySetInnerHTML={{ __html: activeModule.content.replace(/\n\n/g, '<br/><br/>').replace(/### (.*)/g, '<h3 class="text-white font-mono font-bold text-base mt-4 mb-2">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </div>

            {/* Formula & Unit Box */}
            {activeModule.formula && (
              <div className="p-4 rounded-lg bg-space-950/80 border border-orbit-cyan/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-orbit-cyan uppercase">
                  <Calculator className="w-4 h-4" />
                  <span>Physical Governing Formula: {activeModule.formula.title}</span>
                </div>
                <div className="p-3 rounded bg-space-900 border border-space-border font-mono text-sm text-center text-amber-300">
                  {activeModule.formula.equation}
                </div>
                <p className="text-xs text-slate-300">
                  {activeModule.formula.explanation}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  <span className="text-orbit-cyan">SI Units:</span> {activeModule.formula.units}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Knowledge Challenge Quiz */}
          {activeModule.quiz && (
            <div className="space-panel p-6 space-y-4 border-l-4 border-l-orbit-cyan bg-space-900/60">
              <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
                <HelpCircle className="w-4 h-4 text-orbit-cyan" />
                <span>Knowledge Check: Systems Engineering Challenge</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                {activeModule.quiz.question}
              </p>

              {/* Options */}
              <div className="space-y-2">
                {activeModule.quiz.options.map((opt, idx) => {
                  const isSelected = quizAnswers[activeModule.id] === idx;
                  const isSubmitted = quizSubmitted[activeModule.id];
                  const isCorrect = idx === activeModule.quiz.correctIndex;

                  let optionStyle = 'border-space-border bg-space-950/60 text-slate-300 hover:border-slate-500';
                  if (isSelected) {
                    optionStyle = 'border-orbit-cyan bg-orbit-cyan/15 text-white font-bold';
                  }
                  if (isSubmitted) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-500 bg-rose-500/20 text-rose-300 font-bold';
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectQuizOption(activeModule.id, idx)}
                      className={`p-3 rounded-lg text-xs font-mono transition border cursor-pointer flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{opt}</span>
                      {isSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {isSubmitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Quiz Submit Button & Explanation */}
              <div className="pt-2 flex items-center justify-between">
                {!quizSubmitted[activeModule.id] ? (
                  <button
                    onClick={() => handleSubmitQuiz(activeModule.id)}
                    disabled={quizAnswers[activeModule.id] == null}
                    className="px-5 py-2 rounded bg-orbit-cyan text-space-950 font-mono text-xs font-bold hover:bg-sky-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={() => handleResetQuiz(activeModule.id)}
                    className="px-4 py-1.5 rounded bg-space-800 text-slate-300 font-mono text-xs hover:text-white"
                  >
                    Try Again
                  </button>
                )}
              </div>

              {quizSubmitted[activeModule.id] && (
                <div className="mt-3 p-3 rounded-lg bg-space-950 border border-space-border text-xs text-slate-300 space-y-1">
                  <span className="font-mono font-bold text-orbit-cyan block">PHYSICS EXPLANATION:</span>
                  <p>{activeModule.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
