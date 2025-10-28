// ============================================================
// Importación de la clase ASTNode (nodo del Árbol Sintáctico)
// ============================================================
import { ASTNode } from "./ast.js";
import { ErrorL } from "./error.js";

// ============================================================
// Clase principal Parser — Analizador Sintáctico para Java
// ============================================================
class Parser {
  // ------------------------------------------------------------
  // Constructor del parser
  // Recibe una lista de tokens producidos por el lexer
  // ------------------------------------------------------------
  constructor(tokens) {
    this.tokens = tokens;               // Lista de tokens de entrada
    this.pos = 0;                       // Índice actual dentro del arreglo de tokens
    this.errors = [];                   // Lista de errores sintácticos
    this.astRoot = null;                // Nodo raíz del árbol sintáctico (AST)
  }

  // ------------------------------------------------------------
  // Retorna el token actual sin avanzar la posición
  // ------------------------------------------------------------
  actual() {
    return this.tokens[this.pos];
  }

  // ------------------------------------------------------------
  // Retorna el token anterior
  // ------------------------------------------------------------
  anterior() {
    return this.tokens[this.pos - 1];
  }

  // ------------------------------------------------------------
  // Verifica si llegó al final de los tokens
  // ------------------------------------------------------------
  esFinDeArchivo() {
    return this.pos >= this.tokens.length;
  }

  // ------------------------------------------------------------
  // Verifica si el token actual coincide con un tipo esperado
  // Si coincide, avanza una posición y retorna el token
  // ------------------------------------------------------------
  coincidir(tipo) {
    const t = this.actual();
    if (t && t.type === tipo) {
      this.pos++;
      return t;
    }
    return null;
  }

  // ------------------------------------------------------------
  // Verifica múltiples tipos de tokens
  // ------------------------------------------------------------
  coincidirMultiple(...tipos) {
    for (let tipo of tipos) {
      if (this.coincidir(tipo)) {
        return this.anterior();
      }
    }
    return null;
  }

  // ------------------------------------------------------------
  // Espera un token específico, si no lo encuentra registra error
  // ------------------------------------------------------------
  esperar(tipo, mensaje) {
    const t = this.coincidir(tipo);
    if (!t) {
      const actual = this.actual();
      this.errors.push(
        new ErrorL(
          "Sintactico",
          mensaje || `Se esperaba ${tipo}, pero se encontro '${actual?.value ?? "EOF"}'`,
          actual?.line ?? 0,
          actual?.column ?? 0
        )
      );
    }
    return t;
  }

  // ============================================================
  // FUNCIÓN PRINCIPAL DE ANÁLISIS
  // ============================================================
  parse() {
    try {
      this.astRoot = this.programa();
      return this.astRoot;
    } catch (error) {
      console.error("Error crítico en el parser:", error);
      return this.astRoot;
    }
  }

  // ============================================================
  // GRAMÁTICA DE JAVA BÁSICO
  // ============================================================

  // programa -> clase
  programa() {
    const nodo = new ASTNode("Programa");
    
    // Puede haber múltiples clases, pero por ahora solo una
    const clase = this.clase();
    if (clase) {
      nodo.addChild(clase);
    }
    
    return nodo;
  }

  // clase -> [modificadores] 'class' IDENTIFICADOR '{' [miembros] '}'
  clase() {
    const nodo = new ASTNode("Clase");
    
    // Modificadores opcionales (public, private, etc.)
    while (this.coincidirMultiple("PUBLIC", "PRIVATE", "PROTECTED")) {
      const modificador = this.anterior();
      nodo.addChild(new ASTNode(`Modificador:${modificador.value}`));
    }
    
    // Palabra clave 'class'
    if (!this.esperar("CLASS", "Se esperaba 'class'")) {
      return null;
    }
    
    // Nombre de la clase
    const nombreClase = this.esperar("IDENTIFICADOR", "Se esperaba el nombre de la clase");
    if (nombreClase) {
      nodo.addChild(new ASTNode(`Nombre:${nombreClase.value}`));
    }
    
    // Llave de apertura
    this.esperar("LLAVE_ABRE", "Se esperaba '{'");
    
    // Miembros de la clase (métodos, variables)
    while (!this.esFinDeArchivo() && this.actual()?.type !== "LLAVE_CIERRA") {
      const miembro = this.miembro();
      if (miembro) {
        nodo.addChild(miembro);
      } else {
        // Si no se puede reconocer, avanzar para evitar bucle infinito
        this.pos++;
      }
    }
    
    // Llave de cierre
    this.esperar("LLAVE_CIERRA", "Se esperaba '}'");
    
    return nodo;
  }

  // miembro -> metodo | declaracionVariable
  miembro() {
    // Guardar posición por si necesitamos retroceder
    const posInicial = this.pos;
    
    // Saltar modificadores temporalmente para ver qué sigue
    let tempPos = this.pos;
    while (tempPos < this.tokens.length && 
           ["PUBLIC", "PRIVATE", "PROTECTED", "STATIC"].includes(this.tokens[tempPos]?.type)) {
      tempPos++;
    }
    
    // Verificar si hay un tipo
    if (tempPos < this.tokens.length && 
        ["INT", "DOUBLE", "BOOLEAN", "STRING", "VOID", "CHAR"].includes(this.tokens[tempPos]?.type)) {
      tempPos++;
      
      // Verificar si hay un identificador o MAIN (main es palabra reservada)
      if (tempPos < this.tokens.length && 
          (this.tokens[tempPos]?.type === "IDENTIFICADOR" || this.tokens[tempPos]?.type === "MAIN")) {
        tempPos++;
        
        // Saltar posibles array brackets []
        while (tempPos < this.tokens.length && this.tokens[tempPos]?.type === "CORCHETE_ABRE") {
          tempPos++;
          if (tempPos < this.tokens.length && this.tokens[tempPos]?.type === "CORCHETE_CIERRA") {
            tempPos++;
          }
        }
        
        // Si sigue un paréntesis, es un método
        if (tempPos < this.tokens.length && this.tokens[tempPos]?.type === "PAR_ABRE") {
          const metodo = this.metodo();
          if (metodo) return metodo;
        } else {
          // Es una declaración de variable
          this.pos = posInicial;
          const variable = this.declaracionVariable();
          if (variable) return variable;
        }
      }
    }
    
    return null;
  }

  // metodo -> [modificadores] tipo IDENTIFICADOR '(' [parametros] ')' bloque
  metodo() {
    const nodo = new ASTNode("Metodo");
    
    // Modificadores (public, static, etc.)
    while (this.coincidirMultiple("PUBLIC", "PRIVATE", "PROTECTED", "STATIC")) {
      const modificador = this.anterior();
      nodo.addChild(new ASTNode(`Modificador:${modificador.value}`));
    }
    
    // Tipo de retorno
    const tipo = this.tipo();
    if (!tipo) return null;
    nodo.addChild(new ASTNode(`TipoRetorno:${tipo}`));
    
    // Nombre del método (puede ser IDENTIFICADOR o MAIN)
    const nombreMetodo = this.coincidirMultiple("IDENTIFICADOR", "MAIN");
    if (!nombreMetodo) return null;
    nodo.addChild(new ASTNode(`Nombre:${nombreMetodo.value}`));
    
    // Parámetros
    if (!this.coincidir("PAR_ABRE")) return null;
    
    const parametros = this.parametros();
    if (parametros) {
      nodo.addChild(parametros);
    }
    
    if (!this.esperar("PAR_CIERRA", "Se esperaba ')'")) return null;
    
    // Cuerpo del método
    const cuerpo = this.bloque();
    if (cuerpo) {
      nodo.addChild(cuerpo);
    }
    
    return nodo;
  }

  // tipo -> 'int' | 'double' | 'char' | 'boolean' | 'String' | 'void'
  tipo() {
    const t = this.coincidirMultiple("INT", "DOUBLE", "CHAR", "BOOLEAN", "STRING", "VOID");
    if (t) return t.value;
    return null;
  }

  // parametros -> tipo IDENTIFICADOR (',' tipo IDENTIFICADOR)*
  parametros() {
    const nodo = new ASTNode("Parametros");
    
    // Primer parámetro
    const tipo1 = this.tipo();
    if (!tipo1) return nodo; // Sin parámetros
    
    // Soporte para arrays (String[])
    let tipoCompleto = tipo1;
    if (this.coincidir("CORCHETE_ABRE")) {
      this.esperar("CORCHETE_CIERRA", "Se esperaba ']'");
      tipoCompleto += "[]";
    }
    
    // Nombre del parámetro (puede ser IDENTIFICADOR o ARGS)
    const nombre1 = this.coincidirMultiple("IDENTIFICADOR", "ARGS");
    if (nombre1) {
      const param = new ASTNode("Parametro");
      param.addChild(new ASTNode(`Tipo:${tipoCompleto}`));
      param.addChild(new ASTNode(`Nombre:${nombre1.value}`));
      nodo.addChild(param);
    }
    
    // Parámetros adicionales
    while (this.coincidir("COMA")) {
      const tipo = this.tipo();
      if (!tipo) break;
      
      let tipoCompleto2 = tipo;
      if (this.coincidir("CORCHETE_ABRE")) {
        this.esperar("CORCHETE_CIERRA", "Se esperaba ']'");
        tipoCompleto2 += "[]";
      }
      
      // Nombre del parámetro (puede ser IDENTIFICADOR o ARGS)
      const nombre = this.coincidirMultiple("IDENTIFICADOR", "ARGS");
      if (!nombre) {
        this.errors.push(new ErrorL("Sintactico", "Se esperaba el nombre del parametro", 
                                    this.actual()?.line || 0, this.actual()?.column || 0));
        break;
      }
      const param = new ASTNode("Parametro");
      param.addChild(new ASTNode(`Tipo:${tipoCompleto2}`));
      param.addChild(new ASTNode(`Nombre:${nombre.value}`));
      nodo.addChild(param);
    }
    
    return nodo;
  }

  // bloque -> '{' statement* '}'
  bloque() {
    const nodo = new ASTNode("Bloque");
    
    if (!this.esperar("LLAVE_ABRE", "Se esperaba '{'")) return null;
    
    while (!this.esFinDeArchivo() && this.actual()?.type !== "LLAVE_CIERRA") {
      const stmt = this.statement();
      if (stmt) {
        nodo.addChild(stmt);
      } else {
        // Avanzar para evitar bucle infinito
        this.pos++;
      }
    }
    
    this.esperar("LLAVE_CIERRA", "Se esperaba '}'");
    
    return nodo;
  }

  // statement -> declaracionVariable | asignacion | println | ifStatement | whileStatement | forStatement | incremento | return
  statement() {
    const t = this.actual();
    if (!t) return null;
    
    // Declaración de variable (int x = 10;)
    if (["INT", "DOUBLE", "BOOLEAN", "STRING", "CHAR"].includes(t.type)) {
      return this.declaracionVariable();
    }
    
    // Asignación o Incremento (x = 10; o x++;)
    if (t.type === "IDENTIFICADOR") {
      // Mirar el siguiente token para decidir
      const siguiente = this.tokens[this.pos + 1];
      if (siguiente && (siguiente.type === "INCREMENTO" || siguiente.type === "DECREMENTO")) {
        return this.incrementoStatement();
      }
      return this.asignacion();
    }
    
    // System.out.println
    if (t.type === "SYSTEM") {
      return this.println();
    }
    
    // Estructuras de control
    if (t.type === "IF") return this.ifStatement();
    if (t.type === "WHILE") return this.whileStatement();
    if (t.type === "FOR") return this.forStatement();
    
    return null;
  }

  // incrementoStatement -> IDENTIFICADOR ('++' | '--') ';'
  incrementoStatement() {
    const nodo = new ASTNode("Incremento");
    
    const id = this.coincidir("IDENTIFICADOR");
    if (!id) return null;
    
    nodo.addChild(new ASTNode(`Variable:${id.value}`));
    
    if (this.coincidir("INCREMENTO")) {
      nodo.addChild(new ASTNode("Operador:++"));
    } else if (this.coincidir("DECREMENTO")) {
      nodo.addChild(new ASTNode("Operador:--"));
    }
    
    this.esperar("PUNTOYCOMA", "Se esperaba ';'");
    
    return nodo;
  }

  // declaracionVariable -> tipo IDENTIFICADOR ['=' expresion] ';'
  declaracionVariable() {
    const nodo = new ASTNode("DeclaracionVariable");
    
    const tipo = this.tipo();
    if (!tipo) return null;
    nodo.addChild(new ASTNode(`Tipo:${tipo}`));
    
    const nombre = this.esperar("IDENTIFICADOR", "Se esperaba el nombre de la variable");
    if (nombre) {
      nodo.addChild(new ASTNode(`Nombre:${nombre.value}`));
    }
    
    // Inicialización opcional
    if (this.coincidir("ASIGNACION")) {
      const valor = this.expresion();
      if (valor) {
        nodo.addChild(valor);
      }
    }
    
    this.esperar("PUNTOYCOMA", "Se esperaba ';'");
    
    return nodo;
  }

  // asignacion -> IDENTIFICADOR '=' expresion ';'
  asignacion() {
    const nodo = new ASTNode("Asignacion");
    
    const nombre = this.coincidir("IDENTIFICADOR");
    if (!nombre) return null;
    nodo.addChild(new ASTNode(`Variable:${nombre.value}`));
    
    if (!this.esperar("ASIGNACION", "Se esperaba '='")) return null;
    
    const valor = this.expresion();
    if (valor) {
      nodo.addChild(valor);
    }
    
    this.esperar("PUNTOYCOMA", "Se esperaba ';'");
    
    return nodo;
  }

  // println -> 'System' '.' 'out' '.' 'println' '(' expresion ')' ';'
  println() {
    const nodo = new ASTNode("Println");
    
    this.coincidir("SYSTEM");
    this.esperar("PUNTO", "Se esperaba '.'");
    this.esperar("OUT", "Se esperaba 'out'");
    this.esperar("PUNTO", "Se esperaba '.'");
    this.esperar("PRINTLN", "Se esperaba 'println'");
    this.esperar("PAR_ABRE", "Se esperaba '('");
    
    const expresion = this.expresion();
    if (expresion) {
      nodo.addChild(expresion);
    }
    
    this.esperar("PAR_CIERRA", "Se esperaba ')'");
    this.esperar("PUNTOYCOMA", "Se esperaba ';'");
    
    return nodo;
  }

  // ifStatement -> 'if' '(' expresion ')' bloque ['else' bloque]
  ifStatement() {
    const nodo = new ASTNode("If");
    
    this.coincidir("IF");
    this.esperar("PAR_ABRE", "Se esperaba '('");
    
    const condicion = this.expresion();
    if (condicion) {
      nodo.addChild(condicion);
    }
    
    this.esperar("PAR_CIERRA", "Se esperaba ')'");
    
    const bloqueIf = this.bloque();
    if (bloqueIf) {
      nodo.addChild(bloqueIf);
    }
    
    // Else opcional
    if (this.coincidir("ELSE")) {
      const bloqueElse = this.bloque();
      if (bloqueElse) {
        nodo.addChild(bloqueElse);
      }
    }
    
    return nodo;
  }

  // whileStatement -> 'while' '(' expresion ')' bloque
  whileStatement() {
    const nodo = new ASTNode("While");
    
    this.coincidir("WHILE");
    this.esperar("PAR_ABRE", "Se esperaba '('");
    
    const condicion = this.expresion();
    if (condicion) {
      nodo.addChild(condicion);
    }
    
    this.esperar("PAR_CIERRA", "Se esperaba ')'");
    
    const cuerpo = this.bloque();
    if (cuerpo) {
      nodo.addChild(cuerpo);
    }
    
    return nodo;
  }

  // forStatement -> 'for' '(' [declaracion|asignacion] ';' expresion ';' [incremento|asignacion] ')' bloque
  forStatement() {
    const nodo = new ASTNode("For");
    
    this.coincidir("FOR");
    this.esperar("PAR_ABRE", "Se esperaba '('");
    
    // Inicialización
    const init = this.statement();
    if (init) nodo.addChild(init);
    
    // Condición
    const condicion = this.expresion();
    if (condicion) nodo.addChild(condicion);
    this.esperar("PUNTOYCOMA", "Se esperaba ';'");
    
    // Incremento: puede ser asignacion (x = x + 1) o incremento (x++)
    const incremento = this.incrementoOAsignacion();
    if (incremento) nodo.addChild(incremento);
    
    this.esperar("PAR_CIERRA", "Se esperaba ')'");
    
    const cuerpo = this.bloque();
    if (cuerpo) {
      nodo.addChild(cuerpo);
    }
    
    return nodo;
  }

  // incrementoOAsignacion -> IDENTIFICADOR ('++' | '--' | '=' expresion)
  incrementoOAsignacion() {
    const nodo = new ASTNode("Incremento");
    
    const id = this.coincidir("IDENTIFICADOR");
    if (!id) return null;
    
    nodo.addChild(new ASTNode(`Variable:${id.value}`));
    
    // Verificar si es ++ o --
    if (this.coincidir("INCREMENTO")) {
      nodo.addChild(new ASTNode("Operador:++"));
      return nodo;
    }
    
    if (this.coincidir("DECREMENTO")) {
      nodo.addChild(new ASTNode("Operador:--"));
      return nodo;
    }
    
    // Si no es ++ ni --, debe ser una asignación
    if (this.coincidir("ASIGNACION")) {
      const asignacionNode = new ASTNode("Asignacion");
      asignacionNode.addChild(new ASTNode(`Variable:${id.value}`));
      
      const valor = this.expresion();
      if (valor) {
        asignacionNode.addChild(valor);
      }
      
      return asignacionNode;
    }
    
    return null;
  }

  // expresion -> comparacion
  expresion() {
    return this.comparacion();
  }

  // comparacion -> suma (('==' | '!=' | '<' | '>' | '<=' | '>=') suma)*
  comparacion() {
    let nodo = this.suma();
    if (!nodo) return null;
    
    while (this.coincidirMultiple("IGUAL_IGUAL", "DIFERENTE", "MENOR", "MAYOR", "MENOR_IGUAL", "MAYOR_IGUAL")) {
      const operador = this.anterior();
      const derecha = this.suma();
      
      const opNode = new ASTNode(`Operador:${operador.value}`);
      opNode.addChild(nodo);
      opNode.addChild(derecha);
      nodo = opNode;
    }
    
    return nodo;
  }

  // suma -> termino (('+' | '-') termino)*
  suma() {
    let nodo = this.termino();
    if (!nodo) return null;
    
    while (this.coincidirMultiple("MAS", "MENOS")) {
      const operador = this.anterior();
      const derecha = this.termino();
      
      const opNode = new ASTNode(`Operador:${operador.value}`);
      opNode.addChild(nodo);
      opNode.addChild(derecha);
      nodo = opNode;
    }
    
    return nodo;
  }

  // termino -> factor (('*' | '/' | '%') factor)*
  termino() {
    let nodo = this.factor();
    if (!nodo) return null;
    
    while (this.coincidirMultiple("MULTIPLICACION", "DIVISION", "MODULO")) {
      const operador = this.anterior();
      const derecha = this.factor();
      
      const opNode = new ASTNode(`Operador:${operador.value}`);
      opNode.addChild(nodo);
      opNode.addChild(derecha);
      nodo = opNode;
    }
    
    return nodo;
  }

  // factor -> NUMERO | CADENA | CARACTER | IDENTIFICADOR | TRUE | FALSE | NULL | '(' expresion ')'
  factor() {
    // Números
    if (this.coincidirMultiple("NUMERO")) {
      return new ASTNode(`Numero:${this.anterior().value}`);
    }
    
    // Cadenas
    if (this.coincidirMultiple("CADENA")) {
      return new ASTNode(`Cadena:${this.anterior().value}`);
    }
    
    // Caracteres
    if (this.coincidirMultiple("CARACTER")) {
      return new ASTNode(`Caracter:${this.anterior().value}`);
    }
    
    // Identificadores (variables)
    if (this.coincidirMultiple("IDENTIFICADOR")) {
      return new ASTNode(`Variable:${this.anterior().value}`);
    }
    
    // Literales booleanos
    if (this.coincidirMultiple("TRUE", "FALSE")) {
      return new ASTNode(`Booleano:${this.anterior().value}`);
    }
    
    // Null
    if (this.coincidirMultiple("NULL")) {
      return new ASTNode("Null");
    }
    
    // Expresiones entre paréntesis
    if (this.coincidir("PAR_ABRE")) {
      const expresion = this.expresion();
      this.esperar("PAR_CIERRA", "Se esperaba ')'");
      return expresion;
    }
    
    return null;
  }
}

// ============================================================
// Exportación de la clase Parser para uso en otros módulos
// ============================================================
export { Parser };