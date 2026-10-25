
import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, Trash2, Download, Minus, Plus, Undo, Palette } from 'lucide-react';

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
        // Save current content
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight; // Full height minus header offset handled by CSS
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Restore content
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0);
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial history save
    saveHistory();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newStep = historyStep - 1;
      ctx.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = lineWidth;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'padhakuportal-whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 dark:bg-navy-950 animate-fade-in-up">
      {/* Toolbar */}
      <div className="bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-navy-800 p-4 shadow-sm z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                {/* Tool Selection */}
                <div className="flex bg-gray-100 dark:bg-navy-800 rounded-lg p-1">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded-md transition-all ${tool === 'pen' ? 'bg-white dark:bg-navy-700 text-brand-orange shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        title="Pen Tool"
                    >
                        <PenTool className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-white dark:bg-navy-700 text-brand-orange shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        title="Eraser"
                    >
                        <Eraser className="h-5 w-5" />
                    </button>
                </div>

                <div className="w-px h-8 bg-gray-200 dark:bg-navy-700 mx-2 hidden sm:block"></div>

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gray-400" />
                    <div className="flex gap-1">
                        {['#000000', '#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7'].map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool('pen'); }}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'pen' ? 'border-gray-400 dark:border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => { setColor(e.target.value); setTool('pen'); }}
                        className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent" 
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Stroke Width */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-navy-800 rounded-lg p-1 px-2">
                    <button onClick={() => setLineWidth(Math.max(1, lineWidth - 1))} className="p-1 text-gray-500 hover:text-navy-900 dark:hover:text-white">
                        <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium w-4 text-center text-gray-700 dark:text-gray-300">{lineWidth}</span>
                    <button onClick={() => setLineWidth(Math.min(20, lineWidth + 1))} className="p-1 text-gray-500 hover:text-navy-900 dark:hover:text-white">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="w-px h-8 bg-gray-200 dark:bg-navy-700 mx-2 hidden sm:block"></div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button onClick={undo} disabled={historyStep <= 0} className="p-2 text-gray-500 hover:text-navy-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 transition-colors" title="Undo">
                        <Undo className="h-5 w-5" />
                    </button>
                    <button onClick={clearCanvas} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Clear All">
                        <Trash2 className="h-5 w-5" />
                    </button>
                    <button onClick={downloadCanvas} className="px-2.5 py-1.5 bg-brand-orange text-white rounded-md hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold">
                        <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair bg-gray-200 dark:bg-navy-950 p-4 sm:p-8">
         <div className="w-full h-full bg-white shadow-2xl rounded-sm overflow-hidden">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="touch-none block w-full h-full"
            />
         </div>
      </div>
    </div>
  );
};

export default Whiteboard;
