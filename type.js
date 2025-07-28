/**
 * @typedef {'KEYWORD' | 'IDENTIFIER' | 'INTEGER' | 'OPERATOR' | 'ASSIGN' | 'L_PAREN' | 'R_PAREN' | 'L_BRACE' | 'R_BRACE' | 'SEMICOLON' | 'EOF'} TokenType
 */

/**
 * @typedef {{type: TokenType, value: string, line: number, column: number}} Token
 */

/**
 * @typedef {'Program' | 'FunctionDeclaration' | 'VariableDeclaration' | 'ConstantDeclaration' | 
 *           'BlockStatement' | 'ReturnStatement' | 'AssignmentStatement' | 'FunctionCall' | 
 *           'BinaryOperation' | 'Identifier' | 'Literal'} AstNodeType
 */

/**
 * @typedef {{type: AstNodeType, line: number, column: number, [key: string]: any}} AstNode
 */

/**
 * @typedef {{
 *   name: string,
 *   kind: 'function' | 'variable' | 'const',
 *   type: 'int' | 'void',
 *   address?: number,
 *   value?: number,
 *   node: AstNode
 * }} Symbol
 */

/**
 * @typedef {Map<string, Symbol>} SymbolTable
 */

export {}; // This file is a module.