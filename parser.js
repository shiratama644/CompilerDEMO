/** @typedef {import('./type.js').Token} Token */
/** @typedef {import('./type.js').AstNode} AstNode */

let tokens = [];
let cursor = 0;

function currentToken() { return tokens[cursor]; }
function consumeToken() { return tokens[cursor++]; }
function peekToken() { return tokens[cursor + 1]; }

function expectToken(type) {
    const token = currentToken();
    if (token.type === type) {
        return consumeToken();
    }
    throw new Error(`Parser Error: Expected token type ${type} but got ${token.type} ('${token.value}') at line ${token.line}, column ${token.column}`);
}

function createNode(type, props) {
    // createNode should use the start token's position, so we get it before consuming
    const startToken = currentToken();
    return { type, line: startToken.line, column: startToken.column, ...props };
}

function parseExpression() {
    let node;
    const startToken = currentToken();
    if (startToken.type === 'INTEGER') {
        node = createNode('Literal', { value: parseInt(consumeToken().value, 10) });
    } else if (startToken.type === 'IDENTIFIER') {
        node = createNode('Identifier', { name: consumeToken().value });
    } else {
        throw new Error(`Parser Error: Unexpected token in expression: ${startToken.value}`);
    }

    if (currentToken().type === 'OPERATOR') {
        const op = consumeToken().value;
        const right = parseExpression();
        // The node for BinaryOperation should be created with its own position info
        node = { type: 'BinaryOperation', line: op.line, column: op.column, operator: op, left: node, right: right };
    }
    return node;
}

function parseStatement() {
    const token = currentToken();
    if (token.type === 'KEYWORD' && token.value === 'return') {
        const node = createNode('ReturnStatement', {});
        consumeToken(); // 'return'
        let argument = null;
        if (currentToken().type !== 'SEMICOLON') {
            argument = parseExpression();
        }
        expectToken('SEMICOLON');
        node.argument = argument;
        return node;
    }
    if (token.type === 'IDENTIFIER' && peekToken().type === 'L_PAREN') {
        const node = createNode('FunctionCall', { name: consumeToken().value });
        expectToken('L_PAREN');
        expectToken('R_PAREN');
        expectToken('SEMICOLON');
        return node;
    }
    if (token.type === 'IDENTIFIER' && peekToken().type === 'ASSIGN') {
        const node = createNode('AssignmentStatement', {});
        node.left = createNode('Identifier', { name: consumeToken().value });
        expectToken('ASSIGN');
        node.right = parseExpression();
        expectToken('SEMICOLON');
        return node;
    }
    if (token.type === 'RUN_ASM') {
        const node = createNode('RunAsmStatement', {});
        consumeToken(); // 'Run.Asm'
        expectToken('L_PAREN');
        node.code = expectToken('STRING').value.slice(1, -1); // Remove quotes
        expectToken('R_PAREN');
        expectToken('SEMICOLON');
        return node;
    }
    if (token.type === 'RUN_ASM_BLOCK') {
        const node = createNode('RunAsmBlockStatement', {});
        consumeToken(); // 'Run.AsmBlock'
        const rawAsmCode = expectToken('STRING').value;

        // --- NEW: Strip comments from the block content ---
        const cleanedAsmCode = rawAsmCode
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments first
            .replace(/\/\/.*/g, '');          // Remove single-line comments

        node.code = cleanedAsmCode;
        return node;
    }
    throw new Error(`Parser Error: Unexpected token '${token.value}' at line ${token.line}`);
}

function parseBlockStatement() {
    const node = createNode('BlockStatement', {});
    expectToken('L_BRACE');
    const body = [];
    while (currentToken().type !== 'R_BRACE' && currentToken().type !== 'EOF') {
        body.push(parseStatement());
    }
    expectToken('R_BRACE');
    node.body = body;
    return node;
}

function parseTopLevelDeclaration() {
    const startToken = currentToken();
    if (startToken.type === 'KEYWORD' && startToken.value === 'const') {
        const node = createNode('ConstantDeclaration', {});
        consumeToken(); // 'const'
        expectToken('KEYWORD'); // 'int'
        node.name = expectToken('IDENTIFIER').value;
        expectToken('ASSIGN');
        node.value = parseExpression();
        expectToken('SEMICOLON');
        return node;
    }

    const type = consumeToken().value; // 'int' or 'void'
    const name = expectToken('IDENTIFIER').value;

    if (currentToken().type === 'L_PAREN') { // Function Declaration
        const node = createNode('FunctionDeclaration', { returnType: type, name });
        expectToken('L_PAREN');
        expectToken('R_PAREN');
        node.body = parseBlockStatement();
        return node;
    } else { // Variable Declaration
        const node = createNode('VariableDeclaration', { dataType: type, name });
        let initializer = null;
        if (currentToken().type === 'ASSIGN') {
            consumeToken();
            initializer = parseExpression();
        }
        expectToken('SEMICOLON');
        node.initializer = initializer;
        return node;
    }
}

/**
 * @param {Token[]} inputTokens
 * @returns {AstNode}
 */
export function parser(inputTokens) {
    tokens = inputTokens;
    cursor = 0;
    const body = [];
    while (currentToken().type !== 'EOF') {
        body.push(parseTopLevelDeclaration());
    }
    return { type: 'Program', body };
}