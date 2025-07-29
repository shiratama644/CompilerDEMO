/** @typedef {import('./type.js').AstNode} AstNode */
/** @typedef {import('./type.js').SymbolTable} SymbolTable */
/** @typedef {import('./type.js').Symbol} Symbol */

class SemanticError extends Error {
    constructor(message, node) {
        super(`${message} at line ${node.line}, column ${node.column}`);
        this.name = 'SemanticError';
    }
}

/** @type {SymbolTable} */
let symbolTable;
let globalMemoryOffset = 0;
let hasUsedRunSyntax = false; // --- NEW ---

function visit(node) {
    switch (node.type) {
        // --- NEW ---
        case 'RunAsmStatement':
        case 'RunAsmBlockStatement':
            hasUsedRunSyntax = true;
            break;
        // --- END NEW ---
        case 'AssignmentStatement': {
            const symbol = symbolTable.get(node.left.name);
            if (!symbol) throw new SemanticError(`Variable '${node.left.name}' is not declared`, node.left);
            if (symbol.kind === 'const') {
                throw new SemanticError(`Cannot assign to constant '${node.left.name}'`, node.left);
            }
            visit(node.right);
            break;
        }
        case 'Identifier': {
            if (!symbolTable.has(node.name)) {
                throw new SemanticError(`Identifier '${node.name}' is not defined`, node);
            }
            break;
        }
        case 'FunctionCall': {
            if (!symbolTable.has(node.name) || symbolTable.get(node.name)?.kind !== 'function') {
                throw new SemanticError(`Function '${node.name}' is not defined`, node);
            }
            break;
        }
        case 'BlockStatement':
            node.body.forEach(visit);
            break;
        case 'ReturnStatement':
            if (node.argument) visit(node.argument);
            break;
        case 'BinaryOperation':
            visit(node.left);
            visit(node.right);
            break;
    }
}

/**
 * @param {AstNode} ast
 * @returns {[AstNode, SymbolTable, boolean]}
 */
export function analyzer(ast) {
    symbolTable = new Map();
    globalMemoryOffset = 0;
    hasUsedRunSyntax = false; // Reset flag

    // 1st Pass: Collect all top-level declarations
    for (const node of ast.body) {
        if (symbolTable.has(node.name)) {
            throw new SemanticError(`Identifier '${node.name}' is already defined`, node);
        }
        if (node.type === 'FunctionDeclaration') {
            symbolTable.set(node.name, { name: node.name, kind: 'function', type: node.returnType, node });
        } else if (node.type === 'VariableDeclaration') {
            symbolTable.set(node.name, { name: node.name, kind: 'variable', type: node.dataType, address: globalMemoryOffset++, node });
        } else if (node.type === 'ConstantDeclaration') {
            if (node.value.type !== 'Literal') throw new SemanticError('Constant value must be a literal', node.value);
            symbolTable.set(node.name, { name: node.name, kind: 'const', type: 'int', value: node.value.value, node });
        }
    }

    if (!symbolTable.has('main') || symbolTable.get('main')?.type !== 'int') {
        throw new Error("Semantic Error: Entry point 'int main()' function not found.");
    }

    // 2nd Pass: Analyze function bodies
    for (const node of ast.body) {
        if (node.type === 'FunctionDeclaration') {
            visit(node.body);
        }
    }

    return [ast, symbolTable, hasUsedRunSyntax];
}