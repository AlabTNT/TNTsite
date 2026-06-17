"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import oopData from "@/data/oop_problems.json";
import Editor from "@monaco-editor/react";

// Types
type Option = {
  text: string;
  is_user_choice: boolean;
  is_correct: boolean | null;
};

type Problem = {
  q_type?: string;
  author?: string;
  stem?: string;
  options?: Option[];
  result?: string;
  title?: string;
  score?: string;
  organization?: string;
  description?: string;
  input_example?: string;
  output_example?: string;
  submitted_code?: string;
  limits?: Record<string, string>;
};

// Flatten data with week info
const ALL_WEEKS = Object.keys(oopData);
const ALL_PROBLEMS = ALL_WEEKS.flatMap(week => 
  ((oopData as Record<string, Problem[]>)[week] || []).map(p => ({ ...p, week }))
);

const CATEGORY_MAP: Record<string, string> = {
  single: "单选题",
  multi: "多选题",
  check: "判断题",
  blank: "填空题",
  program: "编程题",
  function: "函数题"
};

export default function OOPQuizPage() {
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [selectedTypesByWeek, setSelectedTypesByWeek] = useState<Record<string, Set<string>>>({});
  
  // Quiz State
  const [quizProblems, setQuizProblems] = useState<(Problem & { week: string })[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, Record<number, boolean>>>({});

  // Selection Logic
  const getTypesInWeek = (week: string) => {
    const problems = (oopData as Record<string, Problem[]>)[week] || [];
    return Array.from(new Set(problems.map(p => p.q_type).filter(Boolean))) as string[];
  };

  const toggleSelection = (week: string, type: string) => {
    setSelectedTypesByWeek(prev => {
      const next = { ...prev };
      if (!next[week]) next[week] = new Set();
      if (next[week].has(type)) {
        next[week].delete(type);
      } else {
        next[week].add(type);
      }
      return next;
    });
  };

  const selectGlobal = (types: string[]) => {
    const next: Record<string, Set<string>> = {};
    ALL_WEEKS.forEach(week => {
      const available = getTypesInWeek(week);
      next[week] = new Set();
      available.forEach(t => {
        if (types.includes(t)) next[week].add(t);
      });
    });
    setSelectedTypesByWeek(next);
  };

  const startQuiz = () => {
    const selected: (Problem & { week: string })[] = [];
    ALL_PROBLEMS.forEach(p => {
      if (p.q_type && selectedTypesByWeek[p.week]?.has(p.q_type)) {
        selected.push(p);
      }
    });

    // Shuffle
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    setQuizProblems(selected);
    setUserAnswers({});
    setIsQuizStarted(true);
  };

  const handleOptionToggle = (problemIndex: number, optionIndex: number) => {
    setUserAnswers(prev => {
      const current = prev[problemIndex] || {};
      return { ...prev, [problemIndex]: { ...current, [optionIndex]: !current[optionIndex] } };
    });
  };

  const checkAnswer = (problemIndex: number, options: Option[]) => {
    const answers = userAnswers[problemIndex] || {};
    let isCorrect = true;
    let hasAttempted = Object.keys(answers).length > 0;
    if (!hasAttempted) return null;

    options.forEach((opt, idx) => {
      const isSelected = !!answers[idx];
      if (opt.is_correct === true && !isSelected) isCorrect = false;
      if (opt.is_correct === false && isSelected) isCorrect = false;
    });
    return isCorrect;
  };

  // HTML content renderer with copy buttons
  const RawHTML = ({ html }: { html: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;
      const pres = containerRef.current.querySelectorAll('pre');
      
      pres.forEach(pre => {
        if (pre.querySelector('.copy-btn-wrapper')) return;
        
        pre.style.position = 'relative';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'copy-btn-wrapper absolute top-2 right-2';
        
        const btn = document.createElement('button');
        btn.innerHTML = '📋 复制';
        btn.className = 'px-2 py-1 text-xs bg-zinc-700/80 hover:bg-zinc-600 text-zinc-300 rounded border border-white/10 transition backdrop-blur-sm';
        
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const code = pre.innerText.replace('📋 复制', '').trim();
          navigator.clipboard.writeText(code);
          btn.innerHTML = '✅ 已复制';
          btn.classList.replace('text-zinc-300', 'text-green-400');
          setTimeout(() => {
            btn.innerHTML = '📋 复制';
            btn.classList.replace('text-green-400', 'text-zinc-300');
          }, 2000);
        };
        
        wrapper.appendChild(btn);
        pre.appendChild(wrapper);
      });
    }, [html]);

    return (
      <div ref={containerRef} className="relative w-full">
        <style dangerouslySetInnerHTML={{__html: `
          .quiz-content pre {
            background-color: #1e1e1e !important;
            border: 1px solid #52525b !important;
            border-radius: 0.75rem !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), inset 0 2px 4px 0 rgba(0, 0, 0, 0.5) !important;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace !important;
            padding: 1.25rem !important;
            overflow-x: auto !important;
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .quiz-content pre code {
            font-family: inherit !important;
            color: #e4e4e7 !important;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
          }
          .quiz-content p code, .quiz-content li code, .quiz-content span code {
            color: #93c5fd !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            padding: 0.125rem 0.375rem !important;
            border-radius: 0.25rem !important;
            border: 1px solid rgba(59, 130, 246, 0.2) !important;
            font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace !important;
            font-size: 0.9em !important;
          }
        `}} />
        <div 
          className="quiz-content prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      </div>
    );
  };

  if (isQuizStarted) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setIsQuizStarted(false)} className="inline-flex items-center text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> 返回选题
          </button>
          <div className="text-zinc-400">共 {quizProblems.length} 题</div>
        </div>

        <div className="space-y-12">
          {quizProblems.map((p, pIdx) => {
            const isMultipleChoice = !!p.options;
            return (
              <div key={pIdx} className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-bold border border-blue-500/20">
                    {p.week}
                  </span>
                  <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-sm">
                    {CATEGORY_MAP[p.q_type || ""] || p.q_type || "未知题型"}
                  </span>
                  {p.author && <span className="text-sm text-zinc-500">作者: {p.author}</span>}
                  {p.organization && <span className="text-sm text-zinc-500">单位: {p.organization}</span>}
                  {p.score && <span className="text-sm font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300 ml-auto">Score: {p.score}</span>}
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-4">
                    #{pIdx + 1} {p.title || (isMultipleChoice ? "客观题" : "主观题")}
                  </h3>
                </div>

                {isMultipleChoice && (
                  <div>
                    {p.stem && <RawHTML html={p.stem} />}
                    <div className="space-y-3 mt-6">
                      {p.options!.map((opt, oIdx) => {
                        const isSelected = !!(userAnswers[pIdx] && userAnswers[pIdx][oIdx]);
                        const attempted = Object.keys(userAnswers[pIdx] || {}).length > 0;
                        
                        let optClass = "border-white/10 bg-white/5 hover:bg-white/10";
                        if (isSelected) optClass = "border-blue-500 bg-blue-500/10";
                        
                        let icon = null;
                        if (attempted) {
                          if (opt.is_correct === true) {
                            optClass = "border-green-500 bg-green-500/10";
                            icon = <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />;
                          } else if (isSelected && opt.is_correct === false) {
                            optClass = "border-red-500 bg-red-500/10";
                            icon = <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
                          }
                        }

                        return (
                          <div key={oIdx} onClick={() => handleOptionToggle(pIdx, oIdx)} className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${optClass}`}>
                            <div className="flex-1"><RawHTML html={opt.text} /></div>
                            {icon && <div className="ml-4">{icon}</div>}
                          </div>
                        );
                      })}
                    </div>
                    {Object.keys(userAnswers[pIdx] || {}).length > 0 && (
                      <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 border border-white/5 flex items-center">
                        {checkAnswer(pIdx, p.options!) ? (
                          <><CheckCircle2 className="w-5 h-5 text-green-500 mr-2"/> <span className="text-green-400 font-medium">回答正确</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-red-500 mr-2"/> <span className="text-red-400 font-medium">回答有误或未完全正确</span></>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!isMultipleChoice && (
                  <div>
                    {p.description && <RawHTML html={p.description} />}
                    
                    {p.limits && Object.keys(p.limits).length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-6 p-4 bg-zinc-800/30 rounded-lg">
                        {Object.entries(p.limits).map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <span className="text-zinc-500">{k}: </span>
                            <span className="font-mono text-zinc-300">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      {p.input_example && (
                        <div>
                          <h4 className="font-semibold text-zinc-400 mb-2">输入样例:</h4>
                          <pre className="bg-[#1e1e1e] border border-white/10 p-4 rounded-xl overflow-x-auto text-sm font-mono text-zinc-300 relative group">
                            {p.input_example}
                          </pre>
                        </div>
                      )}
                      {p.output_example && (
                        <div>
                          <h4 className="font-semibold text-zinc-400 mb-2">输出样例:</h4>
                          <pre className="bg-[#1e1e1e] border border-white/10 p-4 rounded-xl overflow-x-auto text-sm font-mono text-zinc-300 relative group">
                            {p.output_example}
                          </pre>
                        </div>
                      )}
                    </div>

                    <h4 className="font-semibold text-zinc-400 mb-2 mt-8">代码编写 (本地草稿):</h4>
                    <div className="h-[500px] border border-white/10 rounded-xl overflow-hidden shadow-inner">
                      <Editor
                        height="100%"
                        defaultLanguage="cpp"
                        theme="vs-dark"
                        defaultValue={p.submitted_code || "// 在这里输入你的代码..."}
                        options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // State 1: Selection Screen
  const totalSelected = Object.values(selectedTypesByWeek).reduce((sum, set) => sum + set.size, 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/notes/2ss/oop" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> 返回 OOP 笔记
      </Link>
      
      <h1 className="text-4xl font-bold mb-8">OOP 模拟测试 (Quiz)</h1>

      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">选择题目范围</h2>
        
        {/* Global Selectors */}
        <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-white/10">
          <span className="text-zinc-500 py-2 mr-2">快速全选:</span>
          <button onClick={() => selectGlobal(["check"])} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition">全选判断题</button>
          <button onClick={() => selectGlobal(["single", "multi"])} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition">全选选择题</button>
          <button onClick={() => selectGlobal(["blank"])} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition">全选填空题</button>
          <button onClick={() => selectGlobal(["program", "function"])} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition">全选编程题</button>
          <button onClick={() => selectGlobal(["check", "single", "multi", "blank", "program", "function"])} className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition">全部题目</button>
          <button onClick={() => setSelectedTypesByWeek({})} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition ml-auto">清除选择</button>
        </div>

        {/* Granular Selector */}
        <div className="space-y-4">
          {ALL_WEEKS.map(week => {
            const types = getTypesInWeek(week);
            if (types.length === 0) return null;
            return (
              <div key={week} className="flex flex-col md:flex-row md:items-center gap-4 bg-zinc-950/50 p-4 rounded-lg border border-white/5">
                <div className="w-24 font-bold text-lg text-white">{week}</div>
                <div className="flex flex-wrap gap-2">
                  {types.map(t => {
                    const isSelected = selectedTypesByWeek[week]?.has(t);
                    return (
                      <button 
                        key={t}
                        onClick={() => toggleSelection(week, t)}
                        className={`px-3 py-1.5 rounded text-sm transition ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                      >
                        {CATEGORY_MAP[t] || t}
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <button 
            onClick={startQuiz}
            disabled={totalSelected === 0}
            className={`px-12 py-4 rounded-xl font-bold text-xl transition-all ${totalSelected > 0 ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-100 hover:scale-105' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed scale-100'}`}
          >
            开始答题 {totalSelected > 0 ? `(${totalSelected} 组已选)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
