// ============================================================
// SERVIDOR WEB PARA EL TRADUCTOR JAVA → PYTHON
// Interfaz visual para análisis léxico, sintáctico y traducción
// ============================================================

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Lexer } from './lexico.js';
import { Parser } from './parser.js';
import { Validator } from './validator.js';
import { Translator } from './translator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// RUTA: Página principal
// ============================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// RUTA: Analizar código Java
// ============================================================
app.post('/api/analyze', (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No se proporcionó código' });
    }

    // Fase 1: Análisis Léxico
    const lexer = new Lexer(code);
    const tokens = lexer.analizar();
    const erroresLexicos = lexer.errors;

    // Fase 2: Análisis Sintáctico
    let ast = null;
    let erroresSintacticos = [];
    
    if (erroresLexicos.length === 0) {
      const parser = new Parser(tokens);
      ast = parser.parse();
      erroresSintacticos = parser.errors;
    }

    // Fase 3: Validación
    let erroresValidacion = [];
    
    if (erroresLexicos.length === 0 && erroresSintacticos.length === 0 && ast) {
      const validator = new Validator(ast);
      const validacionExitosa = validator.validate();
      erroresValidacion = validator.errors;
    }

    // Fase 4: Traducción
    let codigoPython = null;
    
    if (erroresLexicos.length === 0 && 
        erroresSintacticos.length === 0 && 
        erroresValidacion.length === 0 && 
        ast) {
      const translator = new Translator();
      codigoPython = translator.translate(ast);
    }

    // Respuesta JSON
    res.json({
      success: true,
      tokens: tokens.map(t => ({
        tipo: t.type,
        valor: t.value,
        linea: t.line,
        columna: t.column
      })),
      erroresLexicos: erroresLexicos.map(e => ({
        tipo: e.tipo,
        mensaje: e.mensaje,
        linea: e.linea,
        columna: e.columna
      })),
      ast: ast,
      erroresSintacticos: erroresSintacticos.map(e => ({
        tipo: e.tipo,
        mensaje: e.mensaje,
        linea: e.linea,
        columna: e.columna
      })),
      erroresValidacion: erroresValidacion.map(e => ({
        tipo: e.tipo,
        mensaje: e.mensaje,
        linea: e.linea,
        columna: e.columna
      })),
      codigoPython: codigoPython,
      estadisticas: {
        totalTokens: tokens.length,
        totalErrores: erroresLexicos.length + erroresSintacticos.length + erroresValidacion.length,
        fasesCompletadas: [
          erroresLexicos.length === 0,
          erroresSintacticos.length === 0,
          erroresValidacion.length === 0,
          codigoPython !== null
        ].filter(Boolean).length
      }
    });

  } catch (error) {
    console.error('Error en /api/analyze:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      detalles: error.message 
    });
  }
});

// ============================================================
// RUTA: Listar ejemplos disponibles
// ============================================================
app.get('/api/ejemplos', (req, res) => {
  try {
    const ejemplosDir = path.join(__dirname, 'ejemplos');
    const archivos = fs.readdirSync(ejemplosDir)
      .filter(f => f.endsWith('.java'))
      .map(f => ({
        nombre: f,
        ruta: `/api/ejemplo/${f}`
      }));

    res.json({ ejemplos: archivos });
  } catch (error) {
    res.status(500).json({ error: 'Error al listar ejemplos' });
  }
});

// ============================================================
// RUTA: Obtener código de ejemplo
// ============================================================
app.get('/api/ejemplo/:nombre', (req, res) => {
  try {
    const { nombre } = req.params;
    const archivoPath = path.join(__dirname, 'ejemplos', nombre);

    if (!fs.existsSync(archivoPath)) {
      return res.status(404).json({ error: 'Ejemplo no encontrado' });
    }

    const codigo = fs.readFileSync(archivoPath, 'utf-8');
    res.json({ codigo, nombre });

  } catch (error) {
    res.status(500).json({ error: 'Error al leer el ejemplo' });
  }
});

// ============================================================
// Iniciar servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════
║     🚀 SERVIDOR FUNCIONANDO                              
║                                                            
║     🌐 http://localhost:${PORT}                              
║                                                                  
╚═══════════════════════════════════════════════════════════
  `);
});
