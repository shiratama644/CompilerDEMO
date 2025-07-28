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
    const token = currentToken();
    return { type, line: token.line, column: token.column, ...props };
}

function parseExpression() {
    let node;
    if (currentToken().type === 'INTEGER') {
        node = createNode('Literal', { value: parseInt(consumeToken().value, 10) });
    } else if (currentToken().type === 'IDENTIFIER') {
        node = createNode('Identifier', { name: consumeToken().value });
    } else {
        throw new Error(`Parser Error: Unexpected token in expression: ${currentToken().value}`);
    }

    if (currentToken().type === 'OPERATOR') {
        const op = consumeToken().value;
        const right = parseExpression();
        node = createNode('BinaryOperation', { operator: op, left: node, right: right });
    }
    return node;
}

function parseStatement() {
    const token = currentToken();
    if (token.type === 'KEYWORD' && token.value === 'return') {
        consumeToken(); // 'return'
        let argument = null;
        if (currentToken().type !== 'SEMICOLON') {
            argument = parseExpression();
        }
        expectToken('SEMICOLON');
        return createNode('ReturnStatement', { argument });
    }
    if (token.type === 'IDENTIFIER' && peekToken().type === 'L_PAREN') {
        const name = consumeToken().value;
        expectToken('L_PAREN');
        expectToken('R_PAREN');
        expectToken('SEMICOLON');
        return createNode('FunctionCall', { name });
    }
    if (token.type === 'IDENTIFIER' && peekToken().type === 'ASSIGN') {
        const left = createNode('Identifier', { name: consumeToken().value });
        expectToken('ASSIGN');
        const right = parseExpression();
        expectToken('SEMICOLON');
        return createNode('AssignmentStatement', { left, right });
    }
    throw new Error(`Parser Error: Unexpected token '${token.value}' at line ${token.line}`);
}

function parseBlockStatement() {
    expectToken('L_BRACE');
    const body = [];
    while (currentToken().type !== 'R_BRACE' && currentToken().type !== 'EOF') {
        body.push(parseStatement());
    }
    expectToken('R_BRACE');
    return createNode('BlockStatement', { body });
}

function parseTopLevelDeclaration() {
    const startToken = currentToken();
    if (startToken.type === 'KEYWORD' && startToken.value === 'const') {
        consumeToken(); // 'const'
        expectToken('KEYWORD'); // 'int'
        const name = expectToken('IDENTIFIER').value;
        expectToken('ASSIGN');
        const value = parseExpression();
        expectToken('SEMICOLON');
        return createNode('ConstantDeclaration', { name, value });
    }

    const type = consumeToken().value; // 'int' or 'void'
    const name = expectToken('IDENTIFIER').value;

    if (currentToken().type === 'L_PAREN') { // Function Declaration
        expectToken('L_PAREN');
        expectToken('R_PAREN');
        const body = parseBlockStatement();
        return createNode('FunctionDeclaration', { returnType: type, name, body });
    } else { // Variable Declaration
        let initializer = null;
        if (currentToken().type === 'ASSIGN') {
            consumeToken();
            initializer = parseExpression();
        }
        expectToken('SEMICOLON');
        return createNode('VariableDeclaration', { dataType: type, name, initializer });
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