# 📊 Diagramas del Sistema

## 🎯 Diagrama de Clases Completo

```mermaid
classDiagram
    class Token {
        +String type
        +String value
        +int line
        +int column
        +constructor(type, value, line, column)
    }

    class ErrorL {
        +String type
        +String message
        +int line
        +int column
        +constructor(type, message, line, column)
    }

    class ASTNode {
        +String label
        +Array~ASTNode~ children
        +constructor(label)
        +addChild(child)
        +toString(indent) String
    }

    class Lexer {
        -String code
        -Array~Token~ tokens
        -Array~ErrorL~ errors
        -int line
        -int column
        -int position
        +constructor(code)
        +analizar() Array~Token~
        -esLetra(c) boolean
        -esDigito(c) boolean
        -avanzar() void
    }

    class Parser {
        -Array~Token~ tokens
        -int pos
        -Array~ErrorL~ errors
        -ASTNode astRoot
        +constructor(tokens)
        +parse() ASTNode
        -actual() Token
        -anterior() Token
        -coincidir(tipo) Token
        -esperar(tipo, mensaje) Token
        -programa() ASTNode
        -clase() ASTNode
        -metodo() ASTNode
        -statement() ASTNode
        -expresion() ASTNode
    }

    class Validator {
        -ASTNode ast
        -Array~ErrorL~ errors
        +constructor(ast)
        +validate() Array~ErrorL~
        -buscarNodo(etiqueta) ASTNode
    }

    class Translator {
        -ASTNode ast
        -String pythonCode
        -int indentLevel
        +constructor(ast)
        +translate(ast) String
        -getIndent() String
        -addLine(line) void
        -indent() void
        -dedent() void
        -visitPrograma(node) void
        -visitClase(node) void
        -visitMetodo(node) void
        -visitStatement(node) void
        -visitExpresion(node) String
    }

    class Main {
        +main(argv) void
        +procesarArchivo(ruta) void
    }

    class Server {
        -Express app
        -int PORT
        +constructor()
        +iniciar() void
        -configurarRutas() void
        -servirArchivosEstaticos() void
    }

    Lexer "1" --> "*" Token : genera
    Lexer "1" --> "*" ErrorL : reporta
    Parser "1" --> "*" Token : consume
    Parser "1" --> "1" ASTNode : construye
    Parser "1" --> "*" ErrorL : reporta
    Validator "1" --> "1" ASTNode : valida
    Validator "1" --> "*" ErrorL : reporta
    Translator "1" --> "1" ASTNode : traduce
    Main ..> Lexer : usa
    Main ..> Parser : usa
    Main ..> Validator : usa
    Main ..> Translator : usa
    Server ..> Lexer : usa
    Server ..> Parser : usa
    Server ..> Validator : usa
    Server ..> Translator : usa
```

---

## 🔄 Diagrama de Secuencia - Análisis Completo

```mermaid
sequenceDiagram
    actor Usuario
    participant Web as Navegador
    participant Server as Express Server
    participant Main as main.js
    participant Lexer as Lexer
    participant Parser as Parser
    participant Validator as Validator
    participant Translator as Translator

    Usuario->>Web: Escribe código Java
    Usuario->>Web: Click "Analizar Código"
    
    Web->>Server: POST /api/analyze<br/>{codigo: "..."}
    
    activate Server
    Server->>Lexer: new Lexer(codigo)
    activate Lexer
    Server->>Lexer: analizar()
    Lexer->>Lexer: Escanear carácter por carácter
    Lexer->>Lexer: Identificar tokens
    alt Carácter inválido
        Lexer->>Lexer: Registrar error léxico
    end
    Lexer-->>Server: tokens[], errors[]
    deactivate Lexer
    
    Server->>Parser: new Parser(tokens)
    activate Parser
    Server->>Parser: parse()
    Parser->>Parser: Construir AST
    alt Token inesperado
        Parser->>Parser: Registrar error sintáctico
    end
    Parser-->>Server: ast, errors[]
    deactivate Parser
    
    Server->>Validator: new Validator(ast)
    activate Validator
    Server->>Validator: validate()
    Validator->>Validator: Verificar reglas Java
    alt Estructura inválida
        Validator->>Validator: Registrar error semántico
    end
    Validator-->>Server: errors[]
    deactivate Validator
    
    alt Sin errores
        Server->>Translator: new Translator(ast)
        activate Translator
        Server->>Translator: translate()
        Translator->>Translator: Recorrer AST
        Translator->>Translator: Generar código Python
        Translator-->>Server: pythonCode
        deactivate Translator
    end
    
    Server-->>Web: JSON Response<br/>{tokens, ast, errors, pythonCode, fases}
    deactivate Server
    
    Web->>Web: Actualizar UI
    Web->>Usuario: Mostrar resultados
```

---

## 🌳 Diagrama de Árbol Sintáctico (AST)

```mermaid
graph TD
    A[Programa] --> B[Clase]
    B --> C[Modificador: public]
    B --> D[Nombre: Main]
    B --> E[Metodo]
    
    E --> F[Modificador: public]
    E --> G[Modificador: static]
    E --> H[TipoRetorno: void]
    E --> I[Nombre: main]
    E --> J[Parametros]
    E --> K[Bloque]
    
    J --> L[Parametro]
    L --> M[Tipo: String[]]
    L --> N[Nombre: args]
    
    K --> O[DeclaracionVariable]
    K --> P[Println]
    
    O --> Q[Tipo: int]
    O --> R[Nombre: x]
    O --> S[Numero: 10]
    
    P --> T[Variable: x]
    
    style A fill:#e1f5ff
    style B fill:#fff4e6
    style E fill:#fff4e6
    style K fill:#f3e5f5
    style O fill:#e8f5e9
    style P fill:#e8f5e9
```

---

## 🔀 Diagrama de Flujo - Análisis Léxico

```mermaid
flowchart TD
    Start([Inicio]) --> Init[position = 0<br/>tokens = []<br/>errors = []]
    Init --> Loop{position < length?}
    
    Loop -->|No| End([Retornar tokens])
    Loop -->|Sí| GetChar[c = code[position]]
    
    GetChar --> CheckSpace{¿Espacio o tab?}
    CheckSpace -->|Sí| Advance1[avanzar<>]
    Advance1 --> Loop
    
    CheckSpace -->|No| CheckNewline{¿Salto de línea?}
    CheckNewline -->|Sí| NewLine[line++<br/>column=1]
    NewLine --> Advance2[avanzar<>]
    Advance2 --> Loop
    
    CheckNewline -->|No| CheckComment{¿Comentario?}
    CheckComment -->|// o /* */| SkipComment[Saltar comentario]
    SkipComment --> Loop
    
    CheckComment -->|No| CheckString{¿Comilla doble?}
    CheckString -->|Sí| ParseString[Extraer cadena]
    ParseString --> CheckStringError{¿Sin cerrar?}
    CheckStringError -->|Sí| AddError1[Agregar error]
    CheckStringError -->|No| AddToken1[Agregar CADENA]
    AddError1 --> Loop
    AddToken1 --> Loop
    
    CheckString -->|No| CheckChar{¿Comilla simple?}
    CheckChar -->|Sí| ParseChar[Extraer carácter]
    ParseChar --> AddToken2[Agregar CARACTER]
    AddToken2 --> Loop
    
    CheckChar -->|No| CheckLetter{¿Letra o _?}
    CheckLetter -->|Sí| ParseId[Extraer identificador]
    ParseId --> CheckKeyword{¿Palabra reservada?}
    CheckKeyword -->|Sí| AddKeyword[Agregar token palabra clave]
    CheckKeyword -->|No| AddId[Agregar IDENTIFICADOR]
    AddKeyword --> Loop
    AddId --> Loop
    
    CheckLetter -->|No| CheckDigit{¿Dígito?}
    CheckDigit -->|Sí| ParseNumber[Extraer número]
    ParseNumber --> AddNumber[Agregar NUMERO]
    AddNumber --> Loop
    
    CheckDigit -->|No| CheckSymbol{¿Símbolo conocido?}
    CheckSymbol -->|Sí| AddSymbol[Agregar token símbolo]
    AddSymbol --> Loop
    
    CheckSymbol -->|No| ErrorLex[Agregar error léxico]
    ErrorLex --> Advance3[avanzar<>]
    Advance3 --> Loop
    
    style Start fill:#4CAF50
    style End fill:#4CAF50
    style ErrorLex fill:#f44336
    style AddError1 fill:#f44336
```

---

## 🏗️ Diagrama de Flujo - Análisis Sintáctico

```mermaid
flowchart TD
    Start([parse<>]) --> ParseProg[programa<>]
    ParseProg --> ParseClass[clase<>]
    
    ParseClass --> CheckPublic{¿public?}
    CheckPublic -->|Sí| AddMod[Agregar modificador]
    CheckPublic -->|No| CheckClass
    AddMod --> CheckClass
    
    CheckClass{¿'class'?} -->|No| Error1[Error: Se esperaba 'class']
    CheckClass -->|Sí| ExpectId{¿IDENTIFICADOR?}
    
    ExpectId -->|No| Error2[Error: Se esperaba nombre]
    ExpectId -->|Sí| AddName[Agregar nombre clase]
    
    AddName --> ExpectBrace{¿'{'?}
    ExpectBrace -->|No| Error3[Error: Se esperaba '{']
    ExpectBrace -->|Sí| LoopMembers{¿Más miembros?}
    
    LoopMembers -->|No| ExpectClose{¿'}'?}
    LoopMembers -->|Sí| ParseMember[miembro<>]
    
    ParseMember --> CheckMethod{¿Es método?}
    CheckMethod -->|Sí| ParseMethod[metodo<>]
    CheckMethod -->|No| ParseVar[declaracionVariable<>]
    
    ParseMethod --> AddMember1[Agregar al AST]
    ParseVar --> AddMember2[Agregar al AST]
    AddMember1 --> LoopMembers
    AddMember2 --> LoopMembers
    
    ExpectClose -->|No| Error4[Error: Se esperaba '}']
    ExpectClose -->|Sí| Return[Retornar AST]
    
    Error1 --> Return
    Error2 --> Return
    Error3 --> Return
    Error4 --> Return
    
    Return --> End([Fin])
    
    style Start fill:#2196F3
    style End fill:#2196F3
    style Error1 fill:#f44336
    style Error2 fill:#f44336
    style Error3 fill:#f44336
    style Error4 fill:#f44336
```

---

## 🔍 Diagrama de Estados - Lexer

```mermaid
stateDiagram-v2
    [*] --> Inicial
    
    Inicial --> Espacio: espacio/tab
    Espacio --> Inicial: avanzar
    
    Inicial --> NuevaLinea: \n
    NuevaLinea --> Inicial: line++, col=1
    
    Inicial --> Comentario: // o /*
    Comentario --> Inicial: fin comentario
    
    Inicial --> Cadena: "
    Cadena --> Cadena: c != "
    Cadena --> TokenCadena: "
    Cadena --> Error: \n sin cerrar
    TokenCadena --> Inicial
    
    Inicial --> Caracter: '
    Caracter --> TokenCaracter: c + '
    Caracter --> Error: mal formado
    TokenCaracter --> Inicial
    
    Inicial --> Identificador: letra
    Identificador --> Identificador: letra/dígito
    Identificador --> TokenID: otro
    TokenID --> Inicial
    
    Inicial --> Numero: dígito
    Numero --> Numero: dígito
    Numero --> Decimal: .
    Decimal --> Decimal: dígito
    Decimal --> TokenNumero: otro
    Numero --> TokenNumero: otro
    TokenNumero --> Inicial
    
    Inicial --> Simbolo: símbolo
    Simbolo --> TokenSimbolo: reconocido
    TokenSimbolo --> Inicial
    
    Inicial --> Error: desconocido
    Error --> Inicial: continuar
    
    Inicial --> [*]: EOF
```

---

## 📊 Diagrama de Componentes

```mermaid
graph TB
    subgraph "Frontend - Navegador"
        HTML[index.html]
        CSS[styles.css]
        JS[app.js]
    end
    
    subgraph "Backend - Node.js"
        Server[server.js<br/>Express]
        Main[main.js<br/>CLI]
    end
    
    subgraph "Core - Compilador"
        Lexer[lexico.js<br/>Tokenización]
        Parser[parser.js<br/>AST]
        Validator[validator.js<br/>Validación]
        Translator[translator.js<br/>Generación]
    end
    
    subgraph "Modelos"
        Token[token.js]
        Error[error.js]
        AST[ast.js]
    end
    
    subgraph "Datos"
        Examples[ejemplos/<br/>test.java]
        Output[output/<br/>traducidos]
    end
    
    HTML --> JS
    CSS --> HTML
    JS -->|AJAX| Server
    
    Server --> Lexer
    Server --> Examples
    Main --> Lexer
    
    Lexer --> Token
    Lexer --> Error
    Lexer --> Parser
    
    Parser --> AST
    Parser --> Error
    Parser --> Validator
    
    Validator --> Error
    Validator --> Translator
    
    Translator --> Output
    
    style Frontend fill:#e3f2fd
    style Backend fill:#fff3e0
    style Core fill:#f3e5f5
    style Modelos fill:#e8f5e9
    style Datos fill:#fce4ec
```

---

## 🎯 Diagrama de Casos de Uso

```mermaid
graph LR
    Usuario((Usuario))
    
    Usuario --> UC1[Escribir código Java]
    Usuario --> UC2[Cargar ejemplo]
    Usuario --> UC3[Analizar código]
    Usuario --> UC4[Ver tokens]
    Usuario --> UC5[Ver AST]
    Usuario --> UC6[Ver errores]
    Usuario --> UC7[Copiar código Python]
    Usuario --> UC8[Descargar resultado]
    
    UC3 --> UC4
    UC3 --> UC5
    UC3 --> UC6
    UC3 --> UC7
    
    style Usuario fill:#4CAF50
    style UC3 fill:#2196F3
```

---

## 🗺️ Diagrama de Navegación - Interfaz Web

```mermaid
flowchart TD
    Home[Página Principal] --> Editor[Editor de Código]
    
    Editor --> Load[Botón: Cargar Ejemplo]
    Editor --> Analyze[Botón: Analizar Código]
    Editor --> Clear[Botón: Limpiar]
    
    Load --> SelectFile{Seleccionar archivo}
    SelectFile --> LoadMain[Main.java]
    SelectFile --> LoadTest[test.java]
    LoadMain --> Editor
    LoadTest --> Editor
    
    Analyze --> ShowResults[Mostrar Resultados]
    
    ShowResults --> Tab1[Pestaña: Tokens]
    ShowResults --> Tab2[Pestaña: AST]
    ShowResults --> Tab3[Pestaña: Errores]
    ShowResults --> Tab4[Editor Python]
    
    Tab1 --> Table[Tabla de Tokens]
    Tab2 --> Tree[Árbol Visual]
    Tab3 --> ErrorList[Lista de Errores]
    Tab4 --> PythonCode[Código Traducido]
    
    PythonCode --> Copy[Copiar código]
    
    Clear --> Editor
    
    style Home fill:#4CAF50
    style Analyze fill:#2196F3
    style ShowResults fill:#FF9800
```

---

## 🔧 Diagrama de Despliegue

```mermaid
graph TB
    subgraph "Máquina Local"
        subgraph "Node.js Runtime"
            Express[Express Server<br/>:3000]
        end
        
        subgraph "Sistema de Archivos"
            Source[src/]
            Public[public/]
            Examples[ejemplos/]
            Output[output/]
        end
        
        Express --> Source
        Express --> Public
        Express --> Examples
        Express --> Output
    end
    
    subgraph "Navegador Web"
        Browser[Chrome/Firefox/Edge<br/>localhost:3000]
    end
    
    Browser -->|HTTP GET/POST| Express
    Express -->|HTML/CSS/JS| Browser
    Express -->|JSON API| Browser
    
    style Express fill:#4CAF50
    style Browser fill:#2196F3
```

---

**Colección completa de diagramas del sistema 📊**
