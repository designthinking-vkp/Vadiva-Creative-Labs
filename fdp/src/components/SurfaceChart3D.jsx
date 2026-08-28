// src/components/SurfaceChart3D.jsx
import React, { useEffect, useRef, useState } from 'react';

export default function SurfaceChart3D({ axes }) {
  const chartRef = useRef(null);
  const [plotlyLoaded, setPlotlyLoaded] = useState(false);

  useEffect(() => {
    // Check if Plotly is loaded from CDN
    const checkPlotly = setInterval(() => {
      if (window.Plotly) {
        setPlotlyLoaded(true);
        clearInterval(checkPlotly);
      }
    }, 100);

    return () => clearInterval(checkPlotly);
  }, []);

  useEffect(() => {
    if (!plotlyLoaded || !chartRef.current) return;

    // 1. Grid configurations
    const size = 45;
    const xGrid = [];
    const yGrid = [];
    const zGrid = [];

    // Generate grid coordinates in range [-110, 110]
    for (let i = 0; i < size; i++) {
      xGrid.push(-110 + (220 * i) / (size - 1));
      yGrid.push(-110 + (220 * i) / (size - 1));
    }

    const axesList = [
      { name: 'Trust', val: axes.Trust, theta: 0 },
      { name: 'Stability', val: axes.Stability, theta: (2 * Math.PI) / 5 },
      { name: 'Growth', val: axes.Growth, theta: (4 * Math.PI) / 5 },
      { name: 'Academic Strength', val: axes.AcademicStrength, theta: (6 * Math.PI) / 5 },
      { name: 'Governance', val: axes.Governance, theta: (8 * Math.PI) / 5 }
    ];

    // 2. Generate Z heights
    for (let i = 0; i < size; i++) {
      const row = [];
      const currentY = yGrid[i];
      for (let j = 0; j < size; j++) {
        const currentX = xGrid[j];
        const r = Math.sqrt(currentX * currentX + currentY * currentY);
        let theta = Math.atan2(currentY, currentX);
        if (theta < 0) theta += 2 * Math.PI;

        // Find boundary categories to interpolate between
        let axisA = axesList[0];
        let axisB = axesList[1];

        for (let k = 0; k < 5; k++) {
          const a = axesList[k];
          const b = axesList[(k + 1) % 5];
          const aTheta = a.theta;
          let bTheta = b.theta;
          if (bTheta === 0) bTheta = 2 * Math.PI;

          if (theta >= aTheta && theta <= bTheta) {
            axisA = a;
            axisB = b;
            break;
          }
        }

        // Wrap around case
        if (theta >= axesList[4].theta) {
          axisA = axesList[4];
          axisB = { ...axesList[0], theta: 2 * Math.PI };
        }

        // Interpolate target score
        const t = (theta - axisA.theta) / (axisB.theta - axisA.theta);
        const targetScore = (1 - t) * axisA.val + t * axisB.val;

        // Apply Gaussian profile: height = score * e^(-(r^2) / (2 * sigma^2))
        const sigma = 45;
        const height = targetScore * Math.exp(-(r * r) / (2 * sigma * sigma));
        row.push(height);
      }
      zGrid.push(row);
    }

    // 3. Setup Traces
    // Trace 1: 3D Surface
    const surfaceTrace = {
      type: 'surface',
      x: xGrid,
      y: yGrid,
      z: zGrid,
      colorscale: [
        [0.0, '#7f00ff'],   // Electric Purple
        [0.5, '#00f2fe'],   // Cyber Cyan
        [1.0, '#ff007f']    // Neon Pink
      ],
      showscale: false,
      hoverinfo: 'x+y+z',
      lighting: {
        ambient: 0.65,
        diffuse: 0.8,
        specular: 1.5,
        roughness: 0.15,
        fresnel: 0.6
      },
      contours: {
        z: {
          show: true,
          usecolormap: true,
          project: { z: true },
          width: 2
        }
      }
    };

    // Trace 2: Outer Markers & Floating Text Labels
    const labelsTrace = {
      type: 'scatter3d',
      mode: 'text+markers',
      x: axesList.map(a => 105 * Math.cos(a.theta)),
      y: axesList.map(a => 105 * Math.sin(a.theta)),
      z: axesList.map(a => a.val),
      text: axesList.map(a => `<b>${a.name}</b><br>${a.val}%`),
      textposition: 'top center',
      marker: {
        size: 7,
        color: '#00f2fe',
        symbol: 'circle',
        line: { color: '#06060c', width: 2 }
      },
      textfont: {
        family: 'Outfit, sans-serif',
        size: 11,
        color: '#e2e8f0'
      },
      hoverinfo: 'none'
    };

    // Trace 3: Radar Backbone Vectors (radial lines from center)
    const skeletonTraces = axesList.map(a => ({
      type: 'scatter3d',
      mode: 'lines',
      x: [0, 105 * Math.cos(a.theta)],
      y: [0, 105 * Math.sin(a.theta)],
      z: [0, a.val],
      line: {
        color: 'rgba(0, 242, 254, 0.4)',
        width: 3.5,
        dash: 'solid'
      },
      hoverinfo: 'none'
    }));

    // Trace 4: Base Circle Grid (to anchor the chart visually)
    const thetaCircle = Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 99);
    const circleTrace = {
      type: 'scatter3d',
      mode: 'lines',
      x: thetaCircle.map(t => 100 * Math.cos(t)),
      y: thetaCircle.map(t => 100 * Math.sin(t)),
      z: Array(100).fill(1),
      line: {
        color: 'rgba(255, 0, 127, 0.3)',
        width: 2,
        dash: 'dash'
      },
      hoverinfo: 'none'
    };

    const data = [surfaceTrace, labelsTrace, circleTrace, ...skeletonTraces];

    // 4. Layout
    const layout = {
      autosize: true,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: false,
      margin: { l: 0, r: 0, b: 0, t: 0 },
      scene: {
        camera: {
          eye: { x: 1.45, y: 1.45, z: 1.15 }
        },
        xaxis: {
          showgrid: false,
          zeroline: false,
          showline: false,
          showticklabels: false,
          title: { text: '' },
          range: [-130, 130]
        },
        yaxis: {
          showgrid: false,
          zeroline: false,
          showline: false,
          showticklabels: false,
          title: { text: '' },
          range: [-130, 130]
        },
        zaxis: {
          showgrid: true,
          gridcolor: 'rgba(255,255,255,0.05)',
          zeroline: false,
          showline: false,
          showticklabels: true,
          tickfont: { color: 'rgba(255,255,255,0.4)', size: 9 },
          title: { text: 'Performance %', font: { color: 'rgba(255,255,255,0.4)', size: 10 } },
          range: [0, 105]
        }
      }
    };

    // 5. Config
    const config = {
      responsive: true,
      displayModeBar: false,
      staticPlot: false
    };

    // Render chart
    window.Plotly.newPlot(chartRef.current, data, layout, config);

    // Resize listener
    const handleResize = () => {
      if (chartRef.current && window.Plotly) {
        window.Plotly.Plots.resize(chartRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current && window.Plotly) {
        window.Plotly.purge(chartRef.current);
      }
    };
  }, [plotlyLoaded, axes]);

  return (
    <div className="relative w-full h-full min-h-[350px] md:min-h-[450px] flex items-center justify-center">
      {!plotlyLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider text-cyber-cyan uppercase animate-pulse">
            Booting 3D Renderer...
          </span>
        </div>
      )}
      <div 
        ref={chartRef} 
        id="plotly-surface-chart" 
        className="w-full h-full select-none" 
      />
    </div>
  );
}
