// src/components/PDFReport.jsx
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CATEGORIES } from '../data/questions';

export default function PDFReport({ principalName, schoolName, catScores, axes, classification }) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      // 1. Get Plotly 3D Surface Chart image base64
      let chartImgUrl = '';
      if (window.Plotly) {
        const chartElement = document.getElementById('plotly-surface-chart');
        if (chartElement) {
          chartImgUrl = await window.Plotly.toImage(chartElement, {
            format: 'png',
            width: 750,
            height: 500
          });
        }
      }

      // 2. Insert image into print view
      const imgPlaceholder = document.getElementById('pdf-chart-image');
      if (imgPlaceholder && chartImgUrl) {
        imgPlaceholder.src = chartImgUrl;
        // Wait for image to load
        await new Promise((resolve) => {
          imgPlaceholder.onload = resolve;
          // Fallback if image fails to load or is cached
          setTimeout(resolve, 500);
        });
      }

      // 3. Render Page 1 to Canvas
      const page1El = document.getElementById('pdf-page-1');
      const canvas1 = await html2canvas(page1El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#06060c',
        logging: false
      });

      // 4. Render Page 2 to Canvas
      const page2El = document.getElementById('pdf-page-2');
      const canvas2 = await html2canvas(page2El, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#06060c',
        logging: false
      });

      // 5. Build PDF (A4 size: 210mm x 297mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas1.height * imgWidth) / canvas1.width; // Should span roughly full height or scale
      
      // Page 1
      const pageData1 = canvas1.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageData1, 'JPEG', 0, 0, imgWidth, 297);

      // Page 2
      pdf.addPage();
      const pageData2 = canvas2.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageData2, 'JPEG', 0, 0, imgWidth, 297);

      // Save the PDF
      const filename = `${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_leadership_assessment.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div>
      {/* Trigger Button */}
      <button
        onClick={handleDownload}
        disabled={generating}
        className={`w-full py-4 px-6 rounded-xl font-bold tracking-wider uppercase transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
          generating
            ? 'bg-cyber-accent text-gray-500 cursor-not-allowed border border-gray-800'
            : 'bg-neon-gradient text-white shadow-neon-cyan hover:brightness-110'
        }`}
      >
        {generating ? (
          <>
            <div className="w-5 h-5 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div>
            Compiling Intelligence Report...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Intelligence PDF
          </>
        )}
      </button>

      {/* OFF-SCREEN PRINT VIEW */}
      {/* We keep it in the DOM but positioned far outside the viewport. We must apply styled Tailwind classes matching the dark theme to make sure html2canvas captures a beautiful document. */}
      <div className="absolute top-0 left-[-9999px] w-[794px] flex flex-col gap-0 text-white font-sans">
        
        {/* ================= PAGE 1 ================= */}
        <div 
          id="pdf-page-1" 
          className="w-[794px] h-[1123px] bg-cyber-bg p-12 flex flex-col justify-between border-b border-gray-900 relative"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Top glow overlay */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-900/10 filter blur-[80px] pointer-events-none rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-900/10 filter blur-[80px] pointer-events-none rounded-full"></div>

          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
              <div>
                <span className="text-xs uppercase font-semibold tracking-widest text-cyber-cyan">Strategic Diagnostics</span>
                <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-transparent bg-clip-text bg-neon-gradient">
                  ANTIGRAVITY LEADERSHIP ANALYTICS
                </h1>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-gray-500 uppercase">System Verification</div>
                <div className="text-sm font-semibold text-cyber-pink">VER. 3.5.0-ALPHA</div>
              </div>
            </div>

            {/* School & Principal details */}
            <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-950/60 border border-gray-800/80 rounded-xl p-6">
              <div>
                <div className="text-xs uppercase font-mono tracking-wider text-gray-500">Institution Name</div>
                <div className="text-lg font-bold text-cyber-text mt-1">{schoolName}</div>
              </div>
              <div>
                <div className="text-xs uppercase font-mono tracking-wider text-gray-500">Principal Administrator</div>
                <div className="text-lg font-bold text-cyber-text mt-1">{principalName}</div>
              </div>
              <div className="mt-2">
                <div className="text-xs uppercase font-mono tracking-wider text-gray-500">Assessment Timestamp</div>
                <div className="text-sm font-semibold text-gray-400 mt-1">{currentDate}</div>
              </div>
              <div className="mt-2">
                <div className="text-xs uppercase font-mono tracking-wider text-gray-500">Diagnostic Status</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Completed & Verified
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="mb-6 border-l-4 p-5 rounded-r-xl bg-gray-950/30 border-cyber-cyan" style={{ borderColor: classification.color }}>
              <div className="text-xs uppercase font-mono tracking-widest text-gray-400">Institutional Classification</div>
              <div className="text-2xl font-extrabold mt-1" style={{ color: classification.color }}>
                {classification.type}
              </div>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">
                {classification.description}
              </p>
            </div>

            {/* Chart Container */}
            <div className="flex flex-col items-center justify-center bg-gray-950/40 border border-gray-900 rounded-xl p-4 mt-6">
              <div className="text-xs uppercase font-mono tracking-wider text-gray-500 mb-2">3D Surface Alignment Radar</div>
              {/* Plotly chart image will be injected here before PDF capture */}
              <img 
                id="pdf-chart-image" 
                alt="3D Leadership Balance Plot" 
                className="w-[600px] h-[400px] object-contain rounded-lg border border-gray-900 bg-black/30"
              />
            </div>
          </div>

          {/* Footer Page 1 */}
          <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-900 pt-4">
            <div>ANTIGRAVITY SYSTEM DECISION ENGINE © 2026</div>
            <div className="font-mono">PAGE 1 OF 2</div>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div 
          id="pdf-page-2" 
          className="w-[794px] h-[1123px] bg-cyber-bg p-12 flex flex-col justify-between relative"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Top glow overlay */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-purple-900/10 filter blur-[80px] pointer-events-none rounded-full"></div>
          
          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-6 mb-8">
              <div>
                <span className="text-xs uppercase font-semibold tracking-widest text-cyber-cyan">Detailed Diagnostics</span>
                <h2 className="text-2xl font-bold mt-1 text-gray-100">
                  METRIC MATRIX & STRATEGIC PATHWAY
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-gray-500 uppercase">Assessment Suite</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column: 5 Main Axes */}
              <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-cyan border-b border-gray-800 pb-2 mb-4">
                  Main Balance Dimensions (Axes)
                </h3>
                <div className="space-y-4">
                  {Object.entries(axes).map(([axisName, score]) => (
                    <div key={axisName}>
                      <div className="flex justify-between text-sm font-semibold text-gray-300 mb-1">
                        <span>{axisName}</span>
                        <span className="text-cyber-cyan font-mono">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-cyber-cyan h-full rounded-full" 
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: 13 Mapped Categories */}
              <div className="bg-gray-950/40 border border-gray-900 rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyber-pink border-b border-gray-800 pb-2 mb-4">
                  Sub-Category Percentages
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(catScores).map(([catId, score]) => (
                    <div key={catId} className="flex justify-between items-center text-xs border-b border-gray-900 pb-1.5">
                      <span className="text-gray-400 font-medium">{CATEGORIES[catId]}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${
                          score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-cyber-cyan' : 'text-cyber-pink'
                        }`}>
                          {score}%
                        </span>
                        <div className="w-12 bg-gray-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              score >= 75 ? 'bg-emerald-400' : score >= 50 ? 'bg-cyber-cyan' : 'bg-cyber-pink'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategic Recommendations */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-6 mt-4">
              <h3 className="text-base font-bold uppercase tracking-wide text-transparent bg-clip-text bg-neon-gradient mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyber-cyan" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Engine-Generated Strategic Directive
              </h3>
              <div className="space-y-4">
                {classification.recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-cyan font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Page 2 */}
          <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-900 pt-4">
            <div>ANTIGRAVITY SYSTEM DECISION ENGINE © 2026</div>
            <div className="font-mono">PAGE 2 OF 2</div>
          </div>
        </div>

      </div>
    </div>
  );
}
