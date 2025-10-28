import { Token } from "./token.js";
import { ErrorL } from "./error.js";

class Lexer {
  constructor(code) {
    this.code = code;
    this.tokens = [];
    this.errors = [];
    this.line = 1;
    this.column = 1;
    this.position = 0;
  }

  esLetra(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  esDigito(c) {
    return c >= '0' && c <= '9';
  }

  avanzar() {
    this.position++;
    this.column++;
  }

  analizar() {
    while (this.position < this.code.length) {
      let c = this.code[this.position];

      // Espacios en blanco
      if (c === " " || c === "\t" || c === "\r") {
        this.avanzar();
        continue;
      }

      // Saltos de línea
      if (c === "\n") {
        this.line++;
        this.column = 1;
        this.avanzar();
        continue;
      }

      // Comentarios de línea //
      if (c === "/" && this.position + 1 < this.code.length && this.code[this.position + 1] === "/") {
        while (this.position < this.code.length && this.code[this.position] !== "\n") {
          this.avanzar();
        }
        continue;
      }

      // Comentarios de bloque /* */
      if (c === "/" && this.position + 1 < this.code.length && this.code[this.position + 1] === "*") {
        this.avanzar();
        this.avanzar();
        
        while (this.position + 1 < this.code.length) {
          if (this.code[this.position] === "\n") {
            this.line++;
            this.column = 1;
            this.position++;
          } else if (this.code[this.position] === "*" && this.code[this.position + 1] === "/") {
            this.avanzar();
            this.avanzar();
            break;
          } else {
            this.avanzar();
          }
        }
        continue;
      }

      // Cadenas de texto
      if (c === '"') {
        let inicioLinea = this.line;
        let inicioColumna = this.column;
        let valor = "";
        this.avanzar();

        while (this.position < this.code.length && this.code[this.position] !== '"') {
          if (this.code[this.position] === "\n") {
            this.errors.push(new ErrorL("Lexico", `Cadena sin cerrar`, inicioLinea, inicioColumna));
            break;
          }
          
          if (this.code[this.position] === "\\" && this.position + 1 < this.code.length) {
            this.avanzar();
            let escapedChar = this.code[this.position];
            if (escapedChar === "n") valor += "\n";
            else if (escapedChar === "t") valor += "\t";
            else if (escapedChar === '"') valor += '"';
            else if (escapedChar === "\\") valor += "\\";
            else valor += escapedChar;
          } else {
            valor += this.code[this.position];
          }
          this.avanzar();
        }

        if (this.position < this.code.length && this.code[this.position] === '"') {
          this.avanzar();
          this.tokens.push(new Token("CADENA", valor, inicioLinea, inicioColumna));
        }
        continue;
      }

      // Caracteres
      if (c === "'") {
        let inicioLinea = this.line;
        let inicioColumna = this.column;
        let valor = "";
        this.avanzar();

        if (this.position < this.code.length && this.code[this.position] !== "'") {
          if (this.code[this.position] === "\\" && this.position + 1 < this.code.length) {
            this.avanzar();
            let escapedChar = this.code[this.position];
            if (escapedChar === "n") valor = "\n";
            else if (escapedChar === "t") valor = "\t";
            else if (escapedChar === "'") valor = "'";
            else if (escapedChar === "\\") valor = "\\";
            else valor = escapedChar;
            this.avanzar();
          } else {
            valor = this.code[this.position];
            this.avanzar();
          }

          if (this.position < this.code.length && this.code[this.position] === "'") {
            this.avanzar();
            this.tokens.push(new Token("CARACTER", valor, inicioLinea, inicioColumna));
          } else {
            this.errors.push(new ErrorL("Lexico", "Caracter mal formado: falta comilla de cierre", inicioLinea, inicioColumna));
          }
        } else {
          this.errors.push(new ErrorL("Lexico", "Caracter vacio no permitido", inicioLinea, inicioColumna));
          if (this.position < this.code.length && this.code[this.position] === "'") {
            this.avanzar();
          }
        }
        continue;
      }

      // Identificadores y palabras clave
      if (this.esLetra(c)) {
        let inicioColumna = this.column;
        let valor = "";

        while (this.position < this.code.length && 
              (this.esLetra(this.code[this.position]) || this.esDigito(this.code[this.position]))) {
          valor += this.code[this.position];
          this.avanzar();
        }

        const palabrasReservadas = {
          "public": "PUBLIC", "class": "CLASS", "static": "STATIC", "void": "VOID",
          "main": "MAIN", "String": "STRING", "args": "ARGS", "int": "INT",
          "double": "DOUBLE", "char": "CHAR", "boolean": "BOOLEAN", "true": "TRUE",
          "false": "FALSE", "if": "IF", "else": "ELSE", "for": "FOR",
          "while": "WHILE", "System": "SYSTEM", "out": "OUT", "println": "PRINTLN"
        };

        let tipo = palabrasReservadas[valor] || "IDENTIFICADOR";
        this.tokens.push(new Token(tipo, valor, this.line, inicioColumna));
        continue;
      }

      // Números
      if (this.esDigito(c)) {
        let inicioColumna = this.column;
        let valor = "";

        while (this.position < this.code.length && this.esDigito(this.code[this.position])) {
          valor += this.code[this.position];
          this.avanzar();
        }

        if (this.position < this.code.length && this.code[this.position] === ".") {
          valor += ".";
          this.avanzar();
          
          while (this.position < this.code.length && this.esDigito(this.code[this.position])) {
            valor += this.code[this.position];
            this.avanzar();
          }
        }

        this.tokens.push(new Token("NUMERO", valor, this.line, inicioColumna));
        continue;
      }

      // Símbolos y operadores
      const simbolosSimples = {
        "{": "LLAVE_ABRE", "}": "LLAVE_CIERRA", "(": "PAR_ABRE", ")": "PAR_CIERRA",
        "[": "CORCHETE_ABRE", "]": "CORCHETE_CIERRA", ";": "PUNTOYCOMA", ",": "COMA",
        ".": "PUNTO", "+": "MAS", "-": "MENOS", "*": "MULTIPLICACION", "/": "DIVISION", "%": "MODULO"
      };

      // Operadores de dos caracteres
      if (c === "=" && this.position + 1 < this.code.length && this.code[this.position + 1] === "=") {
        this.tokens.push(new Token("IGUAL_IGUAL", "==", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "!" && this.position + 1 < this.code.length && this.code[this.position + 1] === "=") {
        this.tokens.push(new Token("DIFERENTE", "!=", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "<" && this.position + 1 < this.code.length && this.code[this.position + 1] === "=") {
        this.tokens.push(new Token("MENOR_IGUAL", "<=", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === ">" && this.position + 1 < this.code.length && this.code[this.position + 1] === "=") {
        this.tokens.push(new Token("MAYOR_IGUAL", ">=", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "&" && this.position + 1 < this.code.length && this.code[this.position + 1] === "&") {
        this.tokens.push(new Token("AND", "&&", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "|" && this.position + 1 < this.code.length && this.code[this.position + 1] === "|") {
        this.tokens.push(new Token("OR", "||", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "+" && this.position + 1 < this.code.length && this.code[this.position + 1] === "+") {
        this.tokens.push(new Token("INCREMENTO", "++", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "-" && this.position + 1 < this.code.length && this.code[this.position + 1] === "-") {
        this.tokens.push(new Token("DECREMENTO", "--", this.line, this.column));
        this.avanzar(); this.avanzar();
        continue;
      }

      if (c === "=") {
        this.tokens.push(new Token("ASIGNACION", "=", this.line, this.column));
        this.avanzar();
        continue;
      }

      if (c === "<") {
        this.tokens.push(new Token("MENOR", "<", this.line, this.column));
        this.avanzar();
        continue;
      }

      if (c === ">") {
        this.tokens.push(new Token("MAYOR", ">", this.line, this.column));
        this.avanzar();
        continue;
      }

      if (c === "!") {
        this.tokens.push(new Token("NEGACION", "!", this.line, this.column));
        this.avanzar();
        continue;
      }

      if (simbolosSimples[c]) {
        this.tokens.push(new Token(simbolosSimples[c], c, this.line, this.column));
        this.avanzar();
        continue;
      }

      // Error lexico
      this.errors.push(new ErrorL("Lexico", `Caracter no reconocido: '${c}'`, this.line, this.column));
      this.avanzar();
    }

    return this.tokens;
  }
}

export { Lexer };