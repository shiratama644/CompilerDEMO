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
let hasUsedRunSyntax = false;

// --- NEW: Function to check if an expression is constant ---
function isConstantExpression(node) {
    if (node.type === 'Literal') return true;
    if (node.type === 'Identifier') {
        const symbol = symbolTable.get(node.name);
        return symbol && symbol.kind === 'const';
    }
    if (node.type === 'BinaryOperation') {
        return isConstantExpression(node.left) && isConstantExpression(node.right);
    }
    return false;
}

function visit(node) {
    switch (node.type) {
        case 'RunAsmStatement':
        case 'RunAsmBlockStatement':
            hasUsedRunSyntax = true;
            break;
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
    hasUsedRunSyntax = false;

    for (const node of ast.body) {
        if (symbolTable.has(node.name)) {
            throw new SemanticError(`Identifier '${node.name}' is already defined`, node);
        }
        if (node.type === 'FunctionDeclaration') {
            symbolTable.set(node.name, { name: node.name, kind: 'function', type: node.returnType, node });
        } else if (node.type === 'VariableDeclaration') {
            // --- UPDATED: Check for constant initializer ---
            if (node.initializer && !isConstantExpression(node.initializer)) {
                throw new SemanticError('Global variable initializer must be a constant expression', node.initializer);
            }
            symbolTable.set(node.name, { name: node.name, kind: 'variable', type: node.dataType, address: globalMemoryOffset++, node });
        } else if (node.type === 'ConstantDeclaration') {
            if (!isConstantExpression(node.value)) throw new SemanticError('Constant value must be a constant expression', node.value);
            // We would need a compile-time evaluator to handle expressions here.
            // For now, we simplify and assume it's a literal.
            if (node.value.type !== 'Literal') throw new SemanticError('Constant initializer must be a literal for now.', node.value);
            symbolTable.set(node.name, { name: node.name, kind: 'const', type: 'int', value: node.value.value, node });
        }
    }

    if (!symbolTable.has('main') || symbolTable.get('main')?.type !== 'int') {
        throw new Error("Semantic Error: Entry point 'int main()' function not found.");
    }

    for (const node of ast.body) {
        if (node.type === 'FunctionDeclaration') {
            visit(node.body);
        }
    }

    return [ast, symbolTable, hasUsedRunSyntax];
}