import React, { useRef, useEffect, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import 'markmap-toolbar/dist/style.css';

const transformer = new Transformer();

const DEFAULT_MARKDOWN = `# ☁️ AWS Architecture Overview
## Compute
- **EC2**: Virtual Servers
- **Lambda**: Serverless Functions
- **ECS**: Container Service
## Storage
- **S3**: Object Storage
- **EBS**: Block Storage
## Database
- **RDS**: Relational Database
- **DynamoDB**: NoSQL KV Store
## Networking
- **VPC**: Isolated Network
- **Route53**: DNS Service
`;

const TEMPLATES = {
  aws: DEFAULT_MARKDOWN,
  swot: `# 📊 SWOT Analysis
## Strengths
- High brand recognition
- Strong R&D budget
- Global supply chain
## Weaknesses
- High operational costs
- Dependency on single supplier
## Opportunities
- New market expansion
- AI integration
## Threats
- Intense competition
- Changing regulations`,
  roadmap: `# 🚀 Learning Roadmap
## Phase 1: Fundamentals
- HTML & CSS
- Basic JavaScript
## Phase 2: React
- Hooks
- Context API
- State Management
## Phase 3: Advanced
- Next.js
- Performance Testing
- Security Patterns`,
  project: `# 📅 Project Plan
## Q1: Research
- Competitive Analysis
- User Interviews
## Q2: Design
- Prototyping
- Design System
## Q3: Development
- Core Engine
- API Integration
## Q4: Launch
- Beta Testing
- Public Release`
};

export default function MindmapViewer() {
  const [markdown, setMarkdown] = useState(() => localStorage.getItem('mindmap_content') || DEFAULT_MARKDOWN);
  const [showEditor, setShowEditor] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('mindmap_theme') || 'dark');
  const [showTemplates, setShowTemplates] = useState(false);
  const svgRef = useRef(null);
  const mmRef = useRef(null);
  const toolbarRef = useRef(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('mindmap_content', markdown);
    localStorage.setItem('mindmap_theme', theme);
  }, [markdown, theme]);

  // Sync Mindmap with Markdown and Theme
  useEffect(() => {
    if (svgRef.current) {
        const { root } = transformer.transform(markdown);
        svgRef.current.innerHTML = '';
        mmRef.current = Markmap.create(svgRef.current, {
            autoFit: true,
            duration: 200,
            paddingX: 16,
            color: (l) => {
              const darkColors = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
              const lightColors = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706'];
              const colors = theme === 'dark' ? darkColors : lightColors;
              return colors[l.depth % colors.length];
            }
        }, root);

        if (toolbarRef.current) {
            toolbarRef.current.innerHTML = ''; 
            const toolbar = Toolbar.create(mmRef.current);
            toolbar.setBrand(false);
            toolbarRef.current.appendChild(toolbar.el);
        }
    }
  }, [markdown, theme]);

  const handleFileUpload = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => setMarkdown(e.target.result);
      reader.readAsText(file);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleExportSVG = () => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const box = svg.getBBox();
    const padding = 120; // Tăng padding đáng kể để không bị cắt chữ
    
    // Hardcoded colors for export
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0b0f19' : '#ffffff'; 
    const textColor = isDark ? '#FFFFFF' : '#1e293b';
    const linkColor = isDark ? '#475569' : '#94a3b8'; // Đậm hơn
    const circleBg = isDark ? '#1e293b' : '#000000'; 
    const circleStroke = isDark ? '#60a5fa' : '#1e293b'; 
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('width', box.width + padding * 3); 
    svgClone.setAttribute('height', box.height + padding * 2);
    svgClone.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${box.width + padding * 3} ${box.height + padding * 2}`);

    // Fix: Tăng chiều rộng của tất cả foreignObject để không bị cắt chữ
    svgClone.querySelectorAll('foreignObject').forEach(fo => {
        const w = parseFloat(fo.getAttribute('width') || 0);
        fo.setAttribute('width', w + 200); // Tăng thêm 200px nữa để thoải mái không gian cho Bold text
    });

    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = `
      svg {
        --markmap-circle-open-bg: ${circleBg} !important;
        --markmap-circle-bg: ${circleBg} !important;
      }
      .markmap-foreign {
        overflow: visible !important;
      }
      .markmap-foreign div {
        white-space: nowrap !important;
        font-family: 'Inter', 'Be Vietnam Pro', sans-serif !important;
        color: ${textColor} !important;
      }
      text { 
        fill: ${textColor} !important; 
        font-family: 'Inter', 'Be Vietnam Pro', sans-serif !important; 
        font-weight: 600 !important; 
        font-size: 16px !important; 
      }
      .markmap-link { 
        stroke: ${linkColor} !important;
        stroke-opacity: 1.0 !important; 
        stroke-width: 3.5px !important; 
      }
      .markmap-node-circle { 
        fill: ${circleBg} !important; 
        stroke: ${circleStroke} !important; 
        stroke-width: 3px !important; 
      }
    `;
    svgClone.insertBefore(styleElement, svgClone.firstChild);
    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", box.x - padding);
    rect.setAttribute("y", box.y - padding);
    rect.setAttribute("width", box.width + padding * 3);
    rect.setAttribute("height", box.height + padding * 2);
    rect.setAttribute("fill", bgColor);
    svgClone.insertBefore(rect, styleElement);

    const serializer = new XMLSerializer();
    let svgData = serializer.serializeToString(svgClone);
    
    if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const blob = new Blob([`<?xml version="1.0" standalone="no"?>\r\n${svgData}`], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${new Date().getTime()}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 150);
  };

  const handleExportPNG = () => {
    const svg = svgRef.current;
    if (!svg) return;

    const box = svg.getBBox();
    const padding = 120;
    const scale = 2;

    // Fix context variables
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0b0f19' : '#ffffff';
    const textColor = isDark ? '#FFFFFF' : '#1e293b';
    const linkColor = isDark ? '#475569' : '#94a3b8';
    const circleBg = isDark ? '#1e293b' : '#000000';
    const circleStroke = isDark ? '#60a5fa' : '#1e293b';

    const svgClone = svg.cloneNode(true);
    const width = box.width + padding * 3;
    const height = box.height + padding * 2;
    
    svgClone.setAttribute('width', width);
    svgClone.setAttribute('height', height);
    svgClone.setAttribute('viewBox', `${box.x - padding} ${box.y - padding} ${width} ${height}`);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); // Ensure xmlns

    // Fix: Tăng chiều rộng của tất cả foreignObject để không bị cắt chữ
    svgClone.querySelectorAll('foreignObject').forEach(fo => {
        const w = parseFloat(fo.getAttribute('width') || 0);
        fo.setAttribute('width', w + 200); 
    });

    // Remove potentially problematic styles/scripts that might reference external resources
    svgClone.querySelectorAll('style, script').forEach(el => el.remove());

    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = `
      svg {
        --markmap-circle-open-bg: ${circleBg} !important;
        --markmap-circle-bg: ${circleBg} !important;
      }
      .markmap-foreign {
        overflow: visible !important;
      }
      .markmap-foreign div {
        white-space: nowrap !important;
        font-family: 'Inter', 'Be Vietnam Pro', sans-serif !important;
        color: ${textColor} !important;
      }
      text { 
        fill: ${textColor} !important; 
        font-family: 'Inter', 'Be Vietnam Pro', sans-serif !important; 
        font-weight: 600 !important; 
        font-size: 16px !important; 
      }
      .markmap-link { 
        stroke: ${linkColor} !important;
        stroke-opacity: 1.0 !important; 
        stroke-width: 3.5px !important; 
      }
      .markmap-node-circle { 
        fill: ${circleBg} !important; 
        stroke: ${circleStroke} !important; 
        stroke-width: 3px !important; 
      }
    `;
    svgClone.insertBefore(styleElement, svgClone.firstChild);

    // Add background rect inside SVG for better rendering
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", box.x - padding);
    rect.setAttribute("y", box.y - padding);
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", bgColor);
    svgClone.insertBefore(rect, styleElement);

    const serializer = new XMLSerializer();
    let svgData = serializer.serializeToString(svgClone);
    
    // Ensure XML Declaration and namespace
    if (!svgData.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    // Use base64 with explicit charset to avoid security issues in some browsers
    const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
    img.src = `data:image/svg+xml;base64,${svgBase64}`;

    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      
      try {
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `mindmap-${new Date().getTime()}.png`;
        link.click();
      } catch (e) {
        console.error("Export failed", e);
        alert("Lỗi xuất PNG. Hãy sử dụng SVG hoặc PDF.");
      }
    };
    
    img.onerror = (e) => {
      console.error("Image load error", e);
      alert("Không thể tạo ảnh PNG. Hãy thử lại hoặc dùng SVG.");
    };
  };

  const handleApplyTemplate = (key) => {
    setMarkdown(TEMPLATES[key]);
    setShowTemplates(false);
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#0b0f19] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Sidebar Editor */}
      {showEditor && (
        <aside className={`w-[400px] flex flex-col border-r transition-all duration-300 z-20 ${theme === 'dark' ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <span className={`font-bold tracking-tight !font-['Inter'] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Concept Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleTheme} className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-yellow-400' : 'text-slate-500 hover:text-blue-600'}`}>
                      {theme === 'dark' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      )}
                  </button>
                  <button onClick={() => setShowEditor(false)} className="text-slate-500 hover:text-red-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
            </div>
            
            <div className={`p-3 border-b flex gap-2 overflow-x-auto scrollbar-hide ${theme === 'dark' ? 'border-white/5 bg-black/10' : 'border-slate-100 bg-slate-50'}`}>
              <button 
                onClick={() => setShowTemplates(!showTemplates)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-blue-600 text-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                Mẫu Sơ Đồ
              </button>
              {showTemplates && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  {Object.keys(TEMPLATES).map(key => (
                    <button 
                      key={key}
                      onClick={() => handleApplyTemplate(key)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 p-0 relative">
                <textarea 
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    placeholder="Nhập Markdown tại đây..."
                    className={`w-full h-full bg-transparent p-6 text-sm font-mono leading-relaxed outline-none resize-none whitespace-pre scrollbar-hide focus:ring-1 transition-colors ${theme === 'dark' ? 'text-blue-100/90 focus:ring-blue-500/20' : 'text-slate-700 focus:ring-blue-500/10'}`}
                />
            </div>

            <div className={`p-4 border-t space-y-3 ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex gap-2">
                    <label className={`flex-1 cursor-pointer border py-2.5 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2 !font-['Inter'] ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 shadow-sm'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Import MD
                        <input type="file" accept=".md" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <div className="flex-1 relative group">
                      <button className="w-full h-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 !font-['Inter']">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Xuất File
                      </button>
                      {/* Menu Xuất File - Loại bỏ mb-2 và thêm pb-3 để giữ hover không bị ngắt quãng */}
                      <div className={`invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute bottom-[90%] left-0 right-0 pb-3 transition-all duration-200 z-50`}>
                        <div className={`p-1.5 rounded-xl border backdrop-blur-xl ${theme === 'dark' ? 'bg-[#1e293b]/90 border-white/10 shadow-2xl' : 'bg-white/95 border-slate-100 shadow-xl'}`}>
                          <button onClick={handleExportSVG} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                             <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> SVG Vector
                          </button>
                          <button onClick={handleExportPNG} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> PNG Image
                          </button>
                          <button onClick={() => window.print()} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                             <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> PDF / Print
                          </button>
                        </div>
                      </div>
                    </div>
                </div>
            </div>
        </aside>
      )}

      {/* Main Viewport */}
      <main className={`flex-1 relative flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-slate-50'}`}>
        {!showEditor && (
            <div className="absolute top-6 left-6 z-30 flex gap-2">
              <button 
                  onClick={() => setShowEditor(true)}
                  className={`w-10 h-10 backdrop-blur-xl border rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-md'}`}
              >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <button 
                  onClick={toggleTheme}
                  className={`w-10 h-10 backdrop-blur-xl border rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-white/10 border-white/10 text-white hover:text-yellow-400' : 'bg-white border-slate-200 text-slate-800 shadow-md hover:text-blue-600'}`}
              >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
              </button>
            </div>
        )}

        {/* Dynamic Canvas Background (Only in Dark) */}
        {theme === 'dark' && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
          </div>
        )}

        {/* The Mindmap */}
        <div className="w-full h-full cursor-grab active:cursor-grabbing">
          <svg ref={svgRef} className="w-full h-full" id="markmap-svg" />
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-10 left-10 pointer-events-auto" ref={toolbarRef} />
        
        {/* Branding Overlay */}
        <div className={`absolute top-6 right-8 backdrop-blur-md border px-4 py-2 rounded-2xl flex items-center gap-3 transition-colors ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white/80 border-slate-200 shadow-sm'}`}>
             <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'dark' ? 'bg-green-500' : 'bg-blue-600'}`} />
             <span className={`text-[11px] font-bold tracking-[0.2em] uppercase !font-['Inter'] ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>Live Engine v2.5</span>
        </div>
      </main>

      {/* Deep Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

        #markmap-svg {
          --markmap-circle-open-bg: ${theme === 'dark' ? '#1e293b' : '#000000'} !important;
          --markmap-circle-bg: ${theme === 'dark' ? '#0f172a' : '#cbd5e1'} !important;
        }

        :root {
          --mm-text-color: ${theme === 'dark' ? '#FFFFFF' : '#1e293b'};
          --mm-link-opacity: ${theme === 'dark' ? '0.8' : '0.8'};
          --mm-circle-bg: ${theme === 'dark' ? '#0f172a' : '#cbd5e1'};
          --mm-circle-stroke: ${theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#1e293b'};
          --mm-toolbar-bg: ${theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
          --mm-toolbar-item-bg: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.03)'};
          --mm-toolbar-item-color: ${theme === 'dark' ? 'white' : '#475569'};
          --mm-toolbar-border: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'border-slate-200'};
        }

        #markmap-svg, 
        #markmap-svg * {
          font-family: 'Inter', 'Be Vietnam Pro', system-ui, sans-serif !important;
        }

        #markmap-svg text {
          fill: var(--mm-text-color) !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          letter-spacing: -0.01em !important;
        }

        #markmap-svg div {
          color: var(--mm-text-color) !important;
          font-family: 'Inter', 'Be Vietnam Pro', system-ui, sans-serif !important;
          font-weight: 600 !important;
        }

        #markmap-svg .markmap-link {
          stroke-opacity: var(--mm-link-opacity) !important;
          stroke-width: 4px !important;
          ${theme === 'dark' ? 'filter: drop-shadow(0 0 2px rgba(255,255,255,0.1));' : ''}
          transition: all 0.3s ease;
        }
        
        #markmap-svg .markmap-node-circle {
          fill: var(--mm-circle-bg) !important;
          stroke: var(--mm-circle-stroke) !important;
          stroke-width: 2.5px !important;
        }

        .mm-toolbar {
          background: var(--mm-toolbar-bg) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid var(--mm-toolbar-border) !important;
          border-radius: 14px !important;
          padding: 6px !important;
          gap: 6px !important;
          box-shadow: ${theme === 'dark' ? '0 20px 25px -5px rgba(0,0,0,0.3)' : '0 10px 15px -3px rgba(0,0,0,0.1)'} !important;
        }
        .mm-toolbar-item {
          background: var(--mm-toolbar-item-bg) !important;
          border-radius: 8px !important;
          color: var(--mm-toolbar-item-color) !important;
        }
        .mm-toolbar-item:hover {
          background: #3b82f6 !important;
          color: white !important;
        }
      `}} />
    </div>
  );
}
