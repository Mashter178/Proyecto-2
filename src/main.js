// ============================================================
// TRADUCTOR DE JAVA A PYTHON
// Sistema completo de análisis léxico, sintáctico, validación
// y traducción de código Java básico a Python
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Lexer } from './lexico.js';
import { Parser } from './parser.js';
import { Validator } from './validator.js';
import { Translator } from './translator.js';

// Configuración de rutas para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

/**
 * Genera un reporte HTML con los tokens y errores encontrados
 */
function generarReporteHTML(tokens, errores, nombreArchivo) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Análisis - ${nombreArchivo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    h1 { font-size: 2em; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 1.1em; }
    .content { padding: 30px; }
    h2 {
      color: #2a5298;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
      font-size: 1.5em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.9em;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
    }
    tr:hover { background-color: #f5f5f5; }
    tr:last-child td { border-bottom: none; }
    .error-item {
      background: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 5px solid;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .error-lexico { border-left-color: #e74c3c; background: #fef5f5; }
    .error-sintactico { border-left-color: #f39c12; background: #fef9f3; }
    .error-validacion { border-left-color: #3498db; background: #f4f9fc; }
    .error-titulo {
      font-weight: bold;
      margin-bottom: 8px;
      font-size: 1.1em;
    }
    .error-lexico .error-titulo { color: #e74c3c; }
    .error-sintactico .error-titulo { color: #f39c12; }
    .error-validacion .error-titulo { color: #3498db; }
    .error-descripcion { color: #555; line-height: 1.6; }
    .error-ubicacion {
      margin-top: 8px;
      font-family: 'Courier New', monospace;
      color: #666;
      font-size: 0.9em;
    }
    .success-message {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-size: 1.2em;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .stat-number { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
    .stat-label { opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Reporte de Análisis</h1>
      <div class="subtitle">Traductor Java → Python</div>
      <div class="subtitle" style="margin-top: 10px; font-size: 0.9em;">Archivo: ${nombreArchivo}</div>
    </header>
    
    <div class="content">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Tokens Generados</div>
          <div class="stat-number">${tokens.length}</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, ${errores.length === 0 ? '#11998e, #38ef7d' : '#e74c3c, #c0392b'});">
          <div class="stat-label">Errores Encontrados</div>
          <div class="stat-number">${errores.length}</div>
        </div>
      </div>

      ${errores.length === 0 ? 
        '<div class="success-message">✅ ¡Análisis completado sin errores! El código fue traducido exitosamente.</div>' 
        : ''}

      <h2>🔤 Tabla de Tokens</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Línea</th>
            <th>Columna</th>
          </tr>
        </thead>
        <tbody>
          ${tokens.map((token, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${token.type}</strong></td>
              <td><code>${escapeHtml(token.value)}</code></td>
              <td>${token.line}</td>
              <td>${token.column}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${errores.length > 0 ? `
        <h2>❌ Errores Detectados</h2>
        ${errores.map(error => {
          const tipoClase = error.tipo === 'Lexico' ? 'error-lexico' : 
                           error.tipo === 'Sintactico' ? 'error-sintactico' : 
                           'error-validacion';
          return `
            <div class="error-item ${tipoClase}">
              <div class="error-titulo">${error.tipo === 'Lexico' ? '🔴' : error.tipo === 'Sintactico' ? '🟠' : '🔵'} Error ${error.tipo}</div>
              <div class="error-descripcion">${escapeHtml(error.descripcion)}</div>
              ${error.linea ? `<div class="error-ubicacion">📍 Línea ${error.linea}, Columna ${error.columna}</div>` : ''}
            </div>
          `;
        }).join('')}
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const rutaReporte = path.join(__dirname, 'output', 'reporte.html');
  fs.writeFileSync(rutaReporte, html, 'utf-8');
  console.log(`\n📄 Reporte HTML generado: ${rutaReporte}`);
}

/**
 * Escapa caracteres HTML para prevenir inyección
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     🚀 TRADUCTOR DE JAVA A PYTHON                         ║');
  console.log('║     Sistema de Análisis y Traducción de Código           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Verificar argumento de archivo
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Error: Debes proporcionar un archivo Java como argumento.');
    console.log('\n💡 Uso: node src/main.js <archivo.java>\n');
    console.log('Ejemplo: node src/main.js src/test/Main.java\n');
    process.exit(1);
  }

  const archivoEntrada = args[0];
  
  // Verificar que el archivo existe
  if (!fs.existsSync(archivoEntrada)) {
    console.error(`❌ Error: El archivo "${archivoEntrada}" no existe.`);
    process.exit(1);
  }

  // Leer el código fuente
  console.log(`📖 Leyendo archivo: ${archivoEntrada}`);
  const codigoJava = fs.readFileSync(archivoEntrada, 'utf-8');
  
  const nombreArchivo = path.basename(archivoEntrada, '.java');
  const nombreSalida = `${nombreArchivo}.py`;
  const rutaSalida = path.join(__dirname, 'output', nombreSalida);

  // Asegurar que existe el directorio output
  const dirOutput = path.join(__dirname, 'output');
  if (!fs.existsSync(dirOutput)) {
    fs.mkdirSync(dirOutput, { recursive: true });
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('🔍 FASE 1: Análisis Léxico');
  console.log('─────────────────────────────────────────────────────────────');

  // 1. ANÁLISIS LÉXICO
  const lexer = new Lexer(codigoJava);
  const tokens = lexer.analizar();
  const erroresLexicos = lexer.errors;

  console.log(`✓ Tokens generados: ${tokens.length}`);
  console.log(`✓ Errores léxicos: ${erroresLexicos.length}`);

  if (erroresLexicos.length > 0) {
    console.log('\n❌ ERRORES LÉXICOS ENCONTRADOS:');
    erroresLexicos.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.descripcion} (Línea ${error.linea}, Columna ${error.columna})`);
    });
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('🔍 FASE 2: Análisis Sintáctico');
  console.log('─────────────────────────────────────────────────────────────');

  // 2. ANÁLISIS SINTÁCTICO
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const erroresSintacticos = parser.errors;

  console.log(`✓ AST generado: ${ast ? 'Sí' : 'No'}`);
  console.log(`✓ Errores sintácticos: ${erroresSintacticos.length}`);

  if (erroresSintacticos.length > 0) {
    console.log('\n❌ ERRORES SINTÁCTICOS ENCONTRADOS:');
    erroresSintacticos.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.descripcion} (Línea ${error.linea}, Columna ${error.columna})`);
    });
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('🔍 FASE 3: Validación de Estructura');
  console.log('─────────────────────────────────────────────────────────────');

  // 3. VALIDACIÓN DE ESTRUCTURA
  let erroresValidacion = [];
  if (ast && erroresLexicos.length === 0 && erroresSintacticos.length === 0) {
    const validator = new Validator(ast);
    erroresValidacion = validator.validate();
    console.log(`✓ Errores de validación: ${erroresValidacion.length}`);

    if (erroresValidacion.length > 0) {
      console.log('\n❌ ERRORES DE VALIDACIÓN ENCONTRADOS:');
      erroresValidacion.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.descripcion}`);
      });
    }
  } else {
    console.log('⚠ Validación omitida (existen errores previos)');
  }

  // Combinar todos los errores
  const todosLosErrores = [...erroresLexicos, ...erroresSintacticos, ...erroresValidacion];

  // 4. GENERAR REPORTE HTML
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('📊 FASE 4: Generación de Reporte');
  console.log('─────────────────────────────────────────────────────────────');
  
  generarReporteHTML(tokens, todosLosErrores, nombreArchivo + '.java');

  // 5. TRADUCCIÓN Y EJECUCIÓN (solo si no hay errores)
  if (todosLosErrores.length === 0 && ast) {
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('🔄 FASE 5: Traducción a Python');
    console.log('─────────────────────────────────────────────────────────────');

    const translator = new Translator();
    const codigoPython = translator.translate(ast);

    fs.writeFileSync(rutaSalida, codigoPython, 'utf-8');
    console.log(`✓ Archivo Python generado: ${rutaSalida}`);

    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('▶️  FASE 6: Ejecución del Código Python');
    console.log('─────────────────────────────────────────────────────────────');

    try {
      console.log('\n🐍 Ejecutando código Python...\n');
      console.log('═══════════════ SALIDA DEL PROGRAMA ═══════════════');
      const resultado = execSync(`python "${rutaSalida}"`, { encoding: 'utf-8' });
      console.log(resultado);
      console.log('═══════════════════════════════════════════════════');
      console.log('\n✅ Ejecución completada exitosamente');
    } catch (error) {
      console.error('\n❌ Error al ejecutar el código Python:');
      console.error(error.stderr || error.message);
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ PROCESO COMPLETADO EXITOSAMENTE                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } else {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  TRADUCCIÓN CANCELADA                                  ║');
    console.log('║  Se encontraron errores. Por favor, revisa el reporte.   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}

// ============================================================
// EJECUTAR PROGRAMA
// ============================================================
main();
// - Se exporta el archivo 'ast.dot' para visualizar el árbol.
// ============================================================