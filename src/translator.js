// ============================================================
// Traductor de AST de Java a código Python
// ============================================================
class Translator {
  constructor(ast = null) {
    this.ast = ast;           // Árbol sintáctico abstracto de entrada (opcional)
    this.pythonCode = "";     // Código Python generado
    this.indentLevel = 0;     // Nivel de indentación actual
  }

  // ------------------------------------------------------------
  // Obtiene la indentación actual (4 espacios por nivel en Python)
  // ------------------------------------------------------------
  getIndent() {
    return "    ".repeat(this.indentLevel);
  }

  // ------------------------------------------------------------
  // Agrega una línea de código con indentación
  // ------------------------------------------------------------
  addLine(line) {
    if (line.trim() !== "") {
      this.pythonCode += this.getIndent() + line + "\n";
    } else {
      this.pythonCode += "\n";
    }
  }

  // ------------------------------------------------------------
  // Incrementa el nivel de indentación
  // ------------------------------------------------------------
  indent() {
    this.indentLevel++;
  }

  // ------------------------------------------------------------
  // Decrementa el nivel de indentación
  // ------------------------------------------------------------
  dedent() {
    if (this.indentLevel > 0) {
      this.indentLevel--;
    }
  }

  // ============================================================
  // Función principal de traducción
  // ============================================================
  translate(ast) {
    this.ast = ast;           // Guardar referencia al AST
    this.pythonCode = "";
    this.indentLevel = 0;
    
    // Agregar comentario de cabecera
    this.addLine("# Código traducido automáticamente de Java a Python");
    this.addLine("");
    
    // Traducir el AST
    this.translateNode(this.ast);
    
    return this.pythonCode;
  }

  // ============================================================
  // Traduce un nodo del AST según su tipo
  // ============================================================
  translateNode(node) {
    if (!node) return;

    const label = node.label;

    // Programa
    if (label === "Programa") {
      for (const child of node.children) {
        this.translateNode(child);
      }
      return;
    }

    // Clase (en Python no hay clases para el main, se omite)
    if (label === "Clase") {
      this.translateClase(node);
      return;
    }

    // Método
    if (label === "Metodo") {
      this.translateMetodo(node);
      return;
    }

    // Bloque de código
    if (label === "Bloque") {
      this.translateBloque(node);
      return;
    }

    // Declaración de variable
    if (label === "DeclaracionVariable") {
      this.translateDeclaracionVariable(node);
      return;
    }

    // Asignación
    if (label === "Asignacion") {
      this.translateAsignacion(node);
      return;
    }

    // System.out.println
    if (label === "Println") {
      this.translatePrintln(node);
      return;
    }

    // If statement
    if (label === "If") {
      this.translateIf(node);
      return;
    }

    // While statement
    if (label === "While") {
      this.translateWhile(node);
      return;
    }

    // For statement
    if (label === "For") {
      this.translateFor(node);
      return;
    }

    // Incremento/Decremento (i++, i--)
    if (label === "Incremento") {
      this.translateIncremento(node);
      return;
    }
  }

  // ============================================================
  // Traduce una clase (en Python se omite, solo se traduce el contenido)
  // ============================================================
  translateClase(node) {
    // Ignorar modificadores y nombre de clase
    // Solo traducir los métodos dentro
    for (const child of node.children) {
      if (child.label === "Metodo") {
        this.translateNode(child);
      }
    }
  }

  // ============================================================
  // Traduce un método
  // ============================================================
  translateMetodo(node) {
    let nombreMetodo = "";
    let esMain = false;

    // Extraer información del método
    for (const child of node.children) {
      if (child.label.startsWith("Nombre:")) {
        nombreMetodo = child.label.replace("Nombre:", "");
        if (nombreMetodo === "main") {
          esMain = true;
        }
      }
    }

    // Si es el método main, no crear una función en Python
    // Solo traducir su contenido directamente
    if (esMain) {
      this.addLine("# Método main");
      for (const child of node.children) {
        if (child.label === "Bloque") {
          this.translateBloque(child);
        }
      }
    } else {
      // Otros métodos se traducen como funciones Python
      this.addLine(`def ${nombreMetodo}():`);
      this.indent();
      
      let tieneContenido = false;
      for (const child of node.children) {
        if (child.label === "Bloque") {
          tieneContenido = true;
          this.translateBloque(child);
        }
      }
      
      if (!tieneContenido) {
        this.addLine("pass");
      }
      
      this.dedent();
      this.addLine("");
    }
  }

  // ============================================================
  // Traduce un bloque de código
  // ============================================================
  translateBloque(node) {
    for (const child of node.children) {
      this.translateNode(child);
    }
  }

  // ============================================================
  // Traduce una declaración de variable: int x = 10; → x = 10
  // ============================================================
  translateDeclaracionVariable(node) {
    let nombre = "";
    let valor = null;

    for (const child of node.children) {
      if (child.label.startsWith("Nombre:")) {
        nombre = child.label.replace("Nombre:", "");
      } else if (child.label.startsWith("Numero:") || 
                 child.label.startsWith("Cadena:") ||
                 child.label.startsWith("Caracter:") ||
                 child.label.startsWith("Booleano:") ||
                 child.label.startsWith("Variable:") ||
                 child.label.startsWith("Operador:")) {
        valor = this.translateExpresion(child);
      }
    }

    if (nombre) {
      if (valor) {
        this.addLine(`${nombre} = ${valor}`);
      } else {
        // Variable sin inicializar (en Python se puede omitir o usar None)
        this.addLine(`${nombre} = None`);
      }
    }
  }

  // ============================================================
  // Traduce una asignación: x = 20;
  // ============================================================
  translateAsignacion(node) {
    let nombre = "";
    let valor = "";

    for (const child of node.children) {
      if (child.label.startsWith("Variable:")) {
        nombre = child.label.replace("Variable:", "");
      } else {
        valor = this.translateExpresion(child);
      }
    }

    if (nombre && valor) {
      this.addLine(`${nombre} = ${valor}`);
    }
  }

  // ============================================================
  // Traduce System.out.println → print()
  // ============================================================
  translatePrintln(node) {
    let expresion = "";

    for (const child of node.children) {
      expresion = this.translateExpresion(child);
    }

    this.addLine(`print(${expresion})`);
  }

  // ============================================================
  // Traduce una expresión (números, variables, operadores)
  // ============================================================
  translateExpresion(node) {
    if (!node) return "";

    const label = node.label;

    // Número literal
    if (label.startsWith("Numero:")) {
      return label.replace("Numero:", "");
    }

    // Cadena literal
    if (label.startsWith("Cadena:")) {
      const cadena = label.replace("Cadena:", "");
      return `"${cadena}"`;
    }

    // Carácter literal (en Python se representa como string de 1 carácter)
    if (label.startsWith("Caracter:")) {
      const caracter = label.replace("Caracter:", "");
      // Escapar caracteres especiales
      if (caracter === "\n") return "'\\n'";
      if (caracter === "\t") return "'\\t'";
      if (caracter === "'") return "\"'\"";
      if (caracter === "\\") return "'\\\\'";
      return `'${caracter}'`;
    }

    // Variable
    if (label.startsWith("Variable:")) {
      return label.replace("Variable:", "");
    }

    // Booleano
    if (label.startsWith("Booleano:")) {
      const valor = label.replace("Booleano:", "");
      // Java: true/false → Python: True/False
      return valor === "true" ? "True" : "False";
    }

    // Null
    if (label === "Null") {
      return "None";
    }

    // Operador
    if (label.startsWith("Operador:")) {
      const operador = label.replace("Operador:", "");
      
      // Traducir operadores especiales
      let opPython = operador;
      if (operador === "&&") opPython = "and";
      if (operador === "||") opPython = "or";
      if (operador === "!") opPython = "not";
      
      // Obtener operandos
      if (node.children.length === 2) {
        const izq = this.translateExpresion(node.children[0]);
        const der = this.translateExpresion(node.children[1]);
        return `(${izq} ${opPython} ${der})`;
      } else if (node.children.length === 1) {
        // Operador unario (negación)
        const operando = this.translateExpresion(node.children[0]);
        return `${opPython} ${operando}`;
      }
    }

    return "";
  }

  // ============================================================
  // Traduce un if statement
  // ============================================================
  translateIf(node) {
    let condicion = "";
    let bloqueIf = null;
    let bloqueElse = null;

    // Primer hijo: condición
    // Segundo hijo: bloque if
    // Tercer hijo (opcional): bloque else
    if (node.children.length >= 2) {
      condicion = this.translateExpresion(node.children[0]);
      bloqueIf = node.children[1];
      
      if (node.children.length >= 3) {
        bloqueElse = node.children[2];
      }
    }

    this.addLine(`if ${condicion}:`);
    this.indent();
    
    if (bloqueIf) {
      this.translateNode(bloqueIf);
    } else {
      this.addLine("pass");
    }
    
    this.dedent();

    if (bloqueElse) {
      this.addLine("else:");
      this.indent();
      this.translateNode(bloqueElse);
      this.dedent();
    }
  }

  // ============================================================
  // Traduce un while statement
  // ============================================================
  translateWhile(node) {
    let condicion = "";
    let bloque = null;

    if (node.children.length >= 2) {
      condicion = this.translateExpresion(node.children[0]);
      bloque = node.children[1];
    }

    this.addLine(`while ${condicion}:`);
    this.indent();
    
    if (bloque) {
      this.translateNode(bloque);
    } else {
      this.addLine("pass");
    }
    
    this.dedent();
  }

  // ============================================================
  // Traduce un for statement (conversión básica)
  // ============================================================
  translateFor(node) {
    // For en Java es más complejo, traducción simplificada
    // for(int i=0; i<10; i++) → for i in range(10)
    
    this.addLine("# For loop traducido (version simplificada)");
    
    // Analizar estructura del for
    let inicializacion = null;
    let condicion = null;
    let incremento = null;
    let bloque = null;

    for (const child of node.children) {
      if (child.label === "DeclaracionVariable" || child.label === "Asignacion") {
        if (!inicializacion) inicializacion = child;
        else incremento = child;
      } else if (child.label === "Incremento") {
        incremento = child;
      } else if (child.label === "Bloque") {
        bloque = child;
      } else {
        if (!condicion) condicion = child;
      }
    }

    // Traducción simple: convertir a while
    if (inicializacion) {
      this.translateNode(inicializacion);
    }
    
    if (condicion) {
      const condStr = this.translateExpresion(condicion);
      this.addLine(`while ${condStr}:`);
    } else {
      this.addLine("while True:");
    }
    
    this.indent();
    
    if (bloque) {
      this.translateNode(bloque);
    }
    
    if (incremento) {
      this.translateIncremento(incremento);
    }
    
    this.dedent();
  }

  // ============================================================
  // Traduce incremento/decremento: i++ → i = i + 1 o i += 1
  // ============================================================
  translateIncremento(node) {
    let variable = "";
    let operador = "";

    for (const child of node.children) {
      if (child.label.startsWith("Variable:")) {
        variable = child.label.replace("Variable:", "");
      } else if (child.label.startsWith("Operador:")) {
        operador = child.label.replace("Operador:", "");
      }
    }

    if (variable) {
      if (operador === "++") {
        this.addLine(`${variable} += 1`);
      } else if (operador === "--") {
        this.addLine(`${variable} -= 1`);
      } else {
        // Si es una asignación normal, usar translateNode
        this.translateNode(node);
      }
    }
  }
}

// ============================================================
// Exportación de la clase Translator
// ============================================================
export { Translator };

