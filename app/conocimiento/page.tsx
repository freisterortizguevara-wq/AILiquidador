'use client';

import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface Documento {
  id: number;
  titulo: string;
  categoria: string;
  created_at: string;
}

export default function ConocimientoPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('normativa');
  const [file, setFile] = useState<File | null>(null);
  
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDocumentos = async () => {
    setCargandoLista(true);
    try {
      const res = await fetch('/api/rag/documentos');
      const data = await res.json();
      if (data.success) setDocumentos(data.documentos);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarDocumentos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !titulo) {
      setError('El título y el archivo PDF son obligatorios.');
      return;
    }

    setProcesando(true);
    setError(null);
    setExito(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('titulo', titulo);
      formData.append('categoria', categoria);

      const res = await fetch('/api/rag/documentos', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');

      setExito(data.mensaje);
      setTitulo('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await cargarDocumentos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este documento del conocimiento de la IA?')) return;
    try {
      await fetch(`/api/rag/documentos?id=${id}`, { method: 'DELETE' });
      await cargarDocumentos();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  return (
    <main className="min-h-screen relative">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 relative z-10 sm:px-6">
        
        <header className="mb-8 animate-fade-in-up">
          <h1 className="text-[42px] sm:text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900 dark:text-white">
            Base de Conocimiento
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
            Sube normativas, resoluciones o manuales en PDF. El Asistente IA los leerá y usará esta información para responder.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-6 items-start">
          
          {/* Formulario de Carga */}
          <form onSubmit={handleSubmit} className="glass-premium rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">Cargar Nuevo Documento</h2>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2">
                Título del documento (Ej: Decreto 780 de 2016)
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                placeholder="Ej: Resolución 1234 de Supersalud"
                className="w-full rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] px-4 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2">
                Categoría
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] px-4 py-3 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer"
              >
                <option value="normativa">Normativa / Leyes</option>
                <option value="manual">Manual de usuario</option>
                <option value="procedimiento">Procedimientos internos</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2">
                Archivo PDF
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                {file ? (
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Haz clic aquí para buscar un PDF</p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {exito && (
              <div className="flex items-start gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{exito}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={procesando || !file || !titulo}
              className="btn-shimmer w-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-medium shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {procesando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando y guardando...</>
              ) : (
                <><Upload className="w-4 h-4" /> Procesar y Alimentar IA</>
              )}
            </button>
          </form>

          {/* Lista de documentos */}
          <div className="glass-premium rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-4">Documentos en el Sistema</h2>
            
            {cargandoLista ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : documentos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No hay documentos cargados.</p>
            ) : (
              <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {documentos.map((doc) => (
                  <li key={doc.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.08]">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.titulo}</p>
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1">{doc.categoria}</p>
                    </div>
                    <button 
                      onClick={() => handleEliminar(doc.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      title="Eliminar del conocimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}