// ============================================================
// APLICACIÓN CLIENTE PARA EL TRADUCTOR JAVA → PYTHON
// Maneja la interfaz y comunicación con el servidor
// ============================================================

// Referencias DOM
const editorJava = document.getElementById('editorJava');
const editorPython = document.getElementById('editorPython');
const btnAnalizar = document.getElementById('btnAnalizar');
const btnLimpiar = document.getElementById('btnLimpiar');
const selectEjemplos = document.getElementById('selectEjemplos');
const loadingOverlay = document.getElementById('loadingOverlay');

// Estadísticas
const statTokens = document.getElementById('statTokens');
const statErrores = document.getElementById('statErrores');

// Contenedores de resultados
const tokensGrid = document.getElementById('tokensGrid');
const astViewer = document.getElementById('astViewer');
const erroresList = document.getElementById('erroresList');

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  cargarEjemplos();
  configurarEventos();
  configurarPestañas();
});

// ============================================================
// CARGAR EJEMPLOS DISPONIBLES
// ============================================================
async function cargarEjemplos() {
  try {
    const response = await fetch('/api/ejemplos');
    const data = await response.json();

    data.ejemplos.forEach(ejemplo => {
      const option = document.createElement('option');
      option.value = ejemplo.nombre;
      option.textContent = ejemplo.nombre;
      selectEjemplos.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar ejemplos:', error);
  }
}

// ============================================================
// CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
  btnAnalizar.addEventListener('click', analizarCodigo);
  btnLimpiar.addEventListener('click', limpiarTodo);
  
  selectEjemplos.addEventListener('change', async (e) => {
    const nombreEjemplo = e.target.value;
    if (!nombreEjemplo) return;

    try {
      const response = await fetch(`/api/ejemplo/${nombreEjemplo}`);
      const data = await response.json();
      editorJava.value = data.codigo;
    } catch (error) {
      console.error('Error al cargar ejemplo:', error);
    }
  });

  // Atajo de teclado: Ctrl+Enter para analizar
  editorJava.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      analizarCodigo();
    }
  });
}

// ============================================================
// CONFIGURAR PESTAÑAS
// ============================================================
function configurarPestañas() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover clase active de todas las pestañas
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      // Activar pestaña seleccionada
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// ============================================================
// ANALIZAR CÓDIGO
// ============================================================
async function analizarCodigo() {
  const codigo = editorJava.value.trim();

  if (!codigo) {
    alert('Por favor, escribe o carga código Java');
    return;
  }

  // Mostrar loading
  loadingOverlay.classList.add('active');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: codigo })
    });

    const data = await response.json();

    if (data.success) {
      mostrarResultados(data);
    } else {
      alert('Error: ' + data.error);
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error al analizar el código');
  } finally {
    loadingOverlay.classList.remove('active');
  }
}

// ============================================================
// MOSTRAR RESULTADOS
// ============================================================
function mostrarResultados(data) {
  // Actualizar estadísticas
  statTokens.textContent = data.estadisticas.totalTokens;
  statErrores.textContent = data.estadisticas.totalErrores;

  // Mostrar código Python
  if (data.codigoPython) {
    editorPython.value = data.codigoPython;
  } else {
    editorPython.value = '# Error: No se pudo generar el código Python\n# Revisa los errores en la pestaña correspondiente';
  }

  // Mostrar tokens
  mostrarTokens(data.tokens);

  // Mostrar AST
  mostrarAST(data.ast);

  // Mostrar errores
  mostrarErrores(data.erroresLexicos, data.erroresSintacticos, data.erroresValidacion);
}

// ============================================================
// MOSTRAR TOKENS
// ============================================================
function mostrarTokens(tokens) {
  if (tokens.length === 0) {
    tokensGrid.innerHTML = '<p class="empty-message">No se generaron tokens</p>';
    return;
  }

  tokensGrid.innerHTML = tokens.map(token => `
    <div class="token-card">
      <div class="token-tipo">${token.tipo}</div>
      <div class="token-valor">${escapeHtml(token.valor)}</div>
      <div class="token-posicion">Línea ${token.linea}, Col ${token.columna}</div>
    </div>
  `).join('');
}

// ============================================================
// MOSTRAR AST
// ============================================================
function mostrarAST(ast) {
  if (!ast) {
    astViewer.innerHTML = '<p class="empty-message">No se generó el AST</p>';
    return;
  }

  const astFormatted = JSON.stringify(ast, null, 2);
  astViewer.innerHTML = `<pre>${syntaxHighlight(astFormatted)}</pre>`;
}

// Resaltado de sintaxis para JSON
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'ast-value';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'ast-key';
      } else {
        cls = 'ast-string';
      }
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

// ============================================================
// MOSTRAR ERRORES
// ============================================================
function mostrarErrores(erroresLexicos, erroresSintacticos, erroresValidacion) {
  const todosErrores = [
    ...erroresLexicos.map(e => ({ ...e, categoria: 'lexico' })),
    ...erroresSintacticos.map(e => ({ ...e, categoria: 'sintactico' })),
    ...erroresValidacion.map(e => ({ ...e, categoria: 'validacion' }))
  ];

  if (todosErrores.length === 0) {
    erroresList.innerHTML = '<p class="empty-message">✓ No se detectaron errores</p>';
    return;
  }

  erroresList.innerHTML = todosErrores.map(error => `
    <div class="error-card ${error.categoria}">
      <div class="error-header">
        <span class="error-tipo">${error.tipo}</span>
        <span class="error-posicion">Línea ${error.linea}, Col ${error.columna}</span>
      </div>
      <div class="error-mensaje">${escapeHtml(error.mensaje)}</div>
    </div>
  `).join('');
}

// ============================================================
// ============================================================
// LIMPIAR TODO
// ============================================================
function limpiarTodo() {
  editorJava.value = '';
  editorPython.value = '';
  tokensGrid.innerHTML = '<p class="empty-message">Ejecuta el análisis para ver los tokens...</p>';
  astViewer.innerHTML = '<p class="empty-message">Ejecuta el análisis para ver el AST...</p>';
  erroresList.innerHTML = '<p class="empty-message">✓ No hay errores detectados</p>';
  
  statTokens.textContent = '0';
  statErrores.textContent = '0';
  statFases.textContent = '0/4';

  // Resetear fases
  document.querySelectorAll('.fase-item').forEach(item => {
    item.classList.remove('completada', 'error');
  });

  document.querySelectorAll('.fase-status').forEach(status => {
    status.textContent = '⏳ Pendiente';
    status.classList.remove('completado', 'error');
  });

  selectEjemplos.value = '';
}

// ============================================================
// UTILIDADES
// ============================================================
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
