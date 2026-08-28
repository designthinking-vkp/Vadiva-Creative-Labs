// src/App.jsx
import React, { useState } from 'react';
import { QUESTIONS, calculateCategoryScores, calculate3DAxes, getSchoolClassification, CATEGORIES } from './data/questions';
import SurfaceChart3D from './components/SurfaceChart3D';
import PDFReport from './components/PDFReport';

export default function App() {
  // Application State
  const [screen, setScreen] = useState('welcome'); // 'welcome' | 'questions' | 'dashboard'
  const [principalName, setPrincipalName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Form Validation
  const [validationError, setValidationError] = useState('');

  const handleStartAssessment = (e) => {
    e.preventDefault();
    if (!principalName.trim() || !schoolName.trim()) {
      setValidationError('Please input both the Principal and School names to boot the system.');
      return;
    }
    setValidationError('');
    setScreen('questions');
  };

  const handleAnswerSelect = (choice) => {
    const questionId = QUESTIONS[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: choice }));

    // Advance to next question after short delay for visual feedback
    setTimeout(() => {
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setScreen('dashboard');
      }
    }, 180);
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setScreen('welcome');
    setPrincipalName('');
    setSchoolName('');
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  // Calculations for Dashboard
  const catScores = calculateCategoryScores(answers);
  const axesScores = calculate3DAxes(catScores);
  const classification = getSchoolClassification(catScores, axesScores);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progressPercent = Math.round(((currentQuestionIndex + 1) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-cyber-bg text-cyber-text font-sans selection:bg-cyber-cyan selection:text-black">
      
      {/* Background Floating Neon Orbs */}
      <div className="bg-glow-bubble w-[350px] h-[350px] bg-cyber-cyan/10 top-[10%] left-[5%]" />
      <div className="bg-glow-bubble w-[450px] h-[450px] bg-cyber-purple/10 bottom-[10%] right-[5%]" />
      <div className="bg-glow-bubble w-[300px] h-[300px] bg-cyber-pink/5 top-[40%] left-[45%]" />

      {/* Screen 1: Welcome / System Boot */}
      {screen === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-md glass-panel-neon rounded-2xl p-8 text-center border-t-4 border-t-cyber-cyan relative overflow-hidden">
            
            {/* Header / Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-neon-gradient p-0.5 mb-4 shadow-neon-cyan animate-pulse">
                <div className="w-full h-full bg-[#0d0d1e] rounded-[10px] flex items-center justify-center">
                  <span className="text-3xl">🚀</span>
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                ANTIGRAVITY
              </h1>
              <p className="text-xs uppercase font-mono tracking-widest text-cyber-cyan mt-1">
                Strategic Intelligence Assessment
              </p>
            </div>

            <form onSubmit={handleStartAssessment} className="space-y-5 text-left">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                  Principal Name
                </label>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Enter administrator name"
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all duration-300 text-white placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                  School Name
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter educational institution"
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan transition-all duration-300 text-white placeholder-gray-600"
                />
              </div>

              {validationError && (
                <div className="text-xs text-cyber-pink bg-cyber-pink/10 border border-cyber-pink/20 rounded-lg p-3 font-medium">
                  ⚠️ {validationError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl font-bold tracking-widest uppercase text-white bg-neon-gradient hover:brightness-110 shadow-neon-cyan transition-all duration-300 transform active:scale-[0.98] mt-6 flex items-center justify-center gap-2"
              >
                <span>Boot Diagnostic</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>

            <div className="mt-8 border-t border-gray-900 pt-4 text-center">
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                System Status: Ready. Ver 3.5.0
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: Question Wizard */}
      {screen === 'questions' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="w-full max-w-2xl glass-panel-neon rounded-2xl p-8 border-l-4 border-l-cyber-purple relative">
            
            {/* Top Wizard Info */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs font-mono text-cyber-cyan uppercase tracking-widest">
                  Diagnostic Module
                </span>
                <h2 className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">
                  {currentQuestion.theme}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-gray-500">
                  SEQUENCE
                </span>
                <div className="text-lg font-bold text-cyber-purple tech-font">
                  {currentQuestionIndex + 1} <span className="text-xs text-gray-600 font-normal">/ {QUESTIONS.length}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden mb-10 border border-gray-900">
              <div
                className="bg-neon-gradient h-full rounded-full transition-all duration-300 shadow-neon-cyan"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Question Text */}
            <div className="min-h-[120px] flex items-center mb-10">
              <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
                {currentQuestion.text}
              </p>
            </div>

            {/* Option Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Strongly Agree', key: 'stronglyAgree', glow: 'hover:shadow-neon-cyan border-gray-800 hover:border-cyber-cyan/50 text-emerald-400/90' },
                { label: 'Agree', key: 'agree', glow: 'hover:shadow-neon-cyan border-gray-800 hover:border-cyber-cyan/50 text-cyber-cyan/90' },
                { label: 'Disagree', key: 'disagree', glow: 'hover:shadow-neon-pink border-gray-800 hover:border-cyber-pink/50 text-amber-500/90' },
                { label: 'Strongly Disagree', key: 'stronglyDisagree', glow: 'hover:shadow-neon-pink border-gray-800 hover:border-cyber-pink/50 text-cyber-pink/90' }
              ].map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswerSelect(opt.key)}
                    className={`w-full py-4 px-6 rounded-xl border text-sm font-semibold transition-all duration-300 text-left flex items-center justify-between ${
                      isSelected 
                        ? 'bg-cyber-accent border-cyber-cyan text-white shadow-neon-cyan' 
                        : `bg-gray-950/60 ${opt.glow} hover:bg-gray-950`
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-cyber-cyan border-cyber-cyan' : 'border-gray-700'}`}></span>
                  </button>
                );
              })}
            </div>

            {/* Prev Navigation */}
            <div className="flex justify-between items-center mt-10 border-t border-gray-950 pt-6">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  currentQuestionIndex === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-cyber-cyan'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Back</span>
              </button>
              <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                Data Stream Encrypted
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Screen 3: Results Dashboard */}
      {screen === 'dashboard' && (
        <div className="flex-1 flex flex-col z-10 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-950/60 border border-gray-900 rounded-2xl p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <span className="text-xs uppercase font-mono tracking-widest text-cyber-cyan">Diagnostic Report</span>
                  <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
                    Strategic Balance Console
                  </h1>
                </div>
              </div>
            </div>

            {/* Administration Profile Badge */}
            <div className="flex items-center gap-4 bg-gray-900/60 px-5 py-3 rounded-xl border border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-cyber-purple/20 flex items-center justify-center font-bold text-cyber-cyan border border-cyber-cyan/30 text-lg uppercase shadow-neon-cyan">
                {principalName.slice(0, 2)}
              </div>
              <div>
                <div className="text-sm font-extrabold text-gray-200">{schoolName}</div>
                <div className="text-xs text-gray-400 font-medium">Principal: {principalName}</div>
              </div>
            </div>

            {/* Reset CTA */}
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-800 hover:border-cyber-pink hover:text-cyber-pink text-gray-400 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-300"
            >
              Reset Session
            </button>
          </div>

          {/* Grid Layout: 3D Surface Plot & Classification Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 3D Plotly Surface View */}
            <div className="lg:col-span-7 flex flex-col glass-panel-neon rounded-2xl p-6 border-t-2 border-t-cyber-cyan min-h-[480px]">
              <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    3D Institutional Balance Surface
                  </h2>
                  <p className="text-xs text-gray-500 font-mono">
                    Rotatable, interactive polar gradient simulation mesh
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyber-cyan/15 text-[10px] font-mono text-cyber-cyan border border-cyber-cyan/20 uppercase tracking-widest">
                  WebGL 3D
                </span>
              </div>
              
              <div className="flex-1 min-h-[350px]">
                <SurfaceChart3D axes={axesScores} />
              </div>
            </div>

            {/* AI Summary / School Classification */}
            <div className="lg:col-span-5 flex flex-col glass-panel rounded-2xl p-6 border-t-2 border-t-cyber-pink justify-between">
              
              <div>
                <div className="flex justify-between items-center border-b border-gray-900 pb-3 mb-5">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    Decision Engine Output
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-cyber-pink/15 text-[10px] font-mono text-cyber-pink border border-cyber-pink/20 uppercase tracking-widest">
                    AI Summary
                  </span>
                </div>

                {/* Classification Badge */}
                <div 
                  className="inline-block px-4 py-2 rounded-xl text-sm font-extrabold uppercase tracking-widest border mb-4 shadow-glass"
                  style={{ 
                    color: classification.color, 
                    borderColor: `${classification.color}50`,
                    backgroundColor: `${classification.color}15`
                  }}
                >
                  🏫 Classification: {classification.type}
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {classification.description}
                </p>

                {/* Actionable Recommendations Checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                    Recommended Strategic Directives:
                  </h3>
                  {classification.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-sm">
                      <span className="text-cyber-cyan mt-0.5 shrink-0">⚡</span>
                      <p className="text-gray-300 font-medium text-xs md:text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDF Download Trigger */}
              <div className="mt-8 border-t border-gray-900 pt-6">
                <PDFReport
                  principalName={principalName}
                  schoolName={schoolName}
                  catScores={catScores}
                  axes={axesScores}
                  classification={classification}
                />
              </div>

            </div>
          </div>

          {/* Grid Layout: Detailed Category Breakdowns */}
          <div className="glass-panel rounded-2xl p-6 border-t-2 border-t-cyber-purple">
            <div className="border-b border-gray-900 pb-3 mb-5">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Detailed Diagnostic Matrix
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                13 category percentage scores mapping specific school variables
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Object.entries(catScores).map(([catId, score]) => {
                const label = CATEGORIES[catId];
                // Color mapping: high (>=75) emerald, mid (50-74) cyber cyan, low (<50) cyber pink
                let progressColorClass = 'bg-cyber-pink shadow-neon-pink';
                let textColorClass = 'text-cyber-pink';
                if (score >= 75) {
                  progressColorClass = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
                  textColorClass = 'text-emerald-400';
                } else if (score >= 50) {
                  progressColorClass = 'bg-cyber-cyan shadow-neon-cyan';
                  textColorClass = 'text-cyber-cyan';
                }

                return (
                  <div key={catId} className="bg-gray-950/40 border border-gray-900/60 rounded-xl p-4 flex flex-col justify-between hover:border-gray-800 transition-colors duration-300">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-400 tracking-wide">{label}</span>
                      <span className={`text-sm font-extrabold font-mono shrink-0 ${textColorClass}`}>
                        {score}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden border border-gray-800/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-6 text-center border-t border-gray-950 z-10">
        <span className="text-[10px] font-mono text-gray-600 tracking-widest uppercase">
          AntiGravity Tactical Diagnostics Suite © 2026
        </span>
      </footer>
    </div>
  );
}
