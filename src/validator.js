// ============================================================
// Validador de estructura Java obligatoria
// ============================================================
import { ErrorL } from "./error.js";

class Validator {
  constructor(ast) {
    this.ast = ast;
    this.errors = [];
  }

  // ============================================================
  // Valida todas las reglas obligatorias
  // ============================================================
  validate() {
    this.errors = [];

    // Verificar que existe el nodo Programa
    if (!this.ast || this.ast.label !== "Programa") {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "No se encontro un programa valido",
          0,
          0
        )
      );
      return this.errors;
    }

    // Buscar la clase
    let claseNode = null;
    for (const child of this.ast.children) {
      if (child.label === "Clase") {
        claseNode = child;
        break;
      }
    }

    // REGLA 1: Debe tener una clase pública
    if (!claseNode) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "El programa debe contener una clase",
          0,
          0
        )
      );
      return this.errors;
    }

    // Verificar que la clase es pública
    let esPublica = false;
    for (const child of claseNode.children) {
      if (child.label === "Modificador:public") {
        esPublica = true;
        break;
      }
    }

    if (!esPublica) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "La clase debe ser publica (public class ...)",
          0,
          0
        )
      );
    }

    // REGLA 2: La clase debe contener un método main
    let mainNode = null;
    for (const child of claseNode.children) {
      if (child.label === "Metodo") {
        // Verificar si es el método main
        for (const metodoChild of child.children) {
          if (metodoChild.label === "Nombre:main") {
            mainNode = child;
            break;
          }
        }
        if (mainNode) break;
      }
    }

    if (!mainNode) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "La clase debe contener un metodo main",
          0,
          0
        )
      );
      return this.errors;
    }

    // Verificar que main es public static void
    let esPublicMain = false;
    let esStaticMain = false;
    let esVoidMain = false;

    for (const child of mainNode.children) {
      if (child.label === "Modificador:public") esPublicMain = true;
      if (child.label === "Modificador:static") esStaticMain = true;
      if (child.label === "TipoRetorno:void") esVoidMain = true;
    }

    if (!esPublicMain) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "El metodo main debe ser publico (public)",
          0,
          0
        )
      );
    }

    if (!esStaticMain) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "El metodo main debe ser estatico (static)",
          0,
          0
        )
      );
    }

    if (!esVoidMain) {
      this.errors.push(
        new ErrorL(
          "Sintactico",
          "El metodo main debe retornar void",
          0,
          0
        )
      );
    }

    // Verificar que main tiene la firma correcta: String[] args
    let tieneParametrosCorrecto = false;
    for (const child of mainNode.children) {
      if (child.label === "Parametros") {
        // Verificar que tiene un parámetro String[] args
        for (const param of child.children) {
          if (param.label === "Parametro") {
            let tipoOk = false;
            let nombreOk = false;
            for (const paramChild of param.children) {
              if (paramChild.label === "Tipo:String[]") tipoOk = true;
              if (paramChild.label === "Nombre:args") nombreOk = true;
            }
            if (tipoOk && nombreOk) {
              tieneParametrosCorrecto = true;
              break;
            }
          }
        }
      }
    }

    if (!tieneParametrosCorrecto) {
      this.errors.push(
        new ErrorL(
          "Sintáctico",
          "El método main debe tener la firma: main(String[] args)",
          0,
          0
        )
      );
    }

    // REGLA 3: Todas las sentencias deben estar dentro del método main
    // (Ya está garantizado por la gramática, pero verificamos que no haya otros métodos con código)
    for (const child of claseNode.children) {
      if (child.label === "Metodo") {
        let esMain = false;
        for (const metodoChild of child.children) {
          if (metodoChild.label === "Nombre:main") {
            esMain = true;
            break;
          }
        }
        
        if (!esMain) {
          this.errors.push(
            new ErrorL(
              "Sintáctico",
              "Solo se permite el método main. No se permiten otros métodos en la clase",
              0,
              0
            )
          );
        }
      }

      // Verificar que no haya declaraciones de variables fuera de main
      if (child.label === "DeclaracionVariable") {
        this.errors.push(
          new ErrorL(
            "Sintáctico",
            "Las declaraciones de variables deben estar dentro del método main",
            0,
            0
          )
        );
      }
    }

    return this.errors;
  }

  // ============================================================
  // Retorna true si la validación fue exitosa
  // ============================================================
  isValid() {
    return this.errors.length === 0;
  }
}

// ============================================================
// Exportación
// ============================================================
export { Validator };
