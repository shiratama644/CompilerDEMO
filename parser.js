// parser.js

// Nearley is loaded from CDN and available on the window object
// We must explicitly reference it as window.nearley inside a module.

// Helper function to create AST nodes with position info
function createNode(type, d, pos = 0) {
    const token = Array.isArray(d) ? d[pos] : d;
    // Ensure token is a valid object before accessing properties
    const line = token && token.line ? token.line : 0;
    const column = token && token.column ? token.column : 0;

    // Remove the token itself from the final node properties
    const props = (typeof d === 'object' && !Array.isArray(d)) ? d : {};

    return { type, ...props, line, column };
}

// 1. Define the grammar using Nearley's syntax
const grammar = {
    Lexer: undefined, // We use our external Moo lexer
    ParserRules: [
        { name: "Program", symbols: ["_ml", "TopLevelDeclarations", "_ml"], postprocess: d => createNode('Program', { body: d[1] }) },
        
        { name: "TopLevelDeclarations", symbols: ["TopLevelDeclaration"], postprocess: d => [d[0]] },
        { name: "TopLevelDeclarations", symbols: ["TopLevelDeclarations", "_ml", "TopLevelDeclaration"], postprocess: d => [...d[0], d[2]] },
        
        { name: "TopLevelDeclaration", symbols: ["FunctionDeclaration"] },
        { name: "TopLevelDeclaration", symbols: ["VariableDeclaration"] },
        { name: "TopLevelDeclaration", symbols: ["ConstantDeclaration"] },

        { name: "ConstantDeclaration", symbols: [{"type":"KEYWORD_CONST"}, "_", {"type":"KEYWORD_INT"}, "_", {"type":"IDENTIFIER"}, "_", {"type":"ASSIGN"}, "_", "Expression", "_", {"type":"SEMICOLON"}], postprocess: d => createNode('ConstantDeclaration', { name: d[4].value, value: d[8] }, d[0]) },
        
        { name: "VariableDeclaration", symbols: [{"type":"KEYWORD_INT"}, "_", {"type":"IDENTIFIER"}, "_", {"type":"SEMICOLON"}], postprocess: d => createNode('VariableDeclaration', { dataType: d[0].value, name: d[2].value, initializer: null }, d[0]) },
        { name: "VariableDeclaration", symbols: [{"type":"KEYWORD_INT"}, "_", {"type":"IDENTIFIER"}, "_", {"type":"ASSIGN"}, "_", "Expression", "_", {"type":"SEMICOLON"}], postprocess: d => createNode('VariableDeclaration', { dataType: d[0].value, name: d[2].value, initializer: d[6] }, d[0]) },

        { name: "FunctionDeclaration", symbols: ["Type", "_", {"type":"IDENTIFIER"}, "_", {"type":"LPAREN"}, "_", {"type":"RPAREN"}, "_", "BlockStatement"], postprocess: d => createNode('FunctionDeclaration', { returnType: d[0], name: d[2].value, body: d[8] }, d[0]) },
        { name: "Type", symbols: [{"type":"KEYWORD_INT"}], postprocess: d => d[0].value },
        { name: "Type", symbols: [{"type":"KEYWORD_VOID"}], postprocess: d => d[0].value },

        { name: "BlockStatement", symbols: [{"type":"LBRACE"}, "_ml", "Statements", "_ml", {"type":"RBRACE"}], postprocess: d => createNode('BlockStatement', { body: d[2] }, d[0]) },
        { name: "BlockStatement", symbols: [{"type":"LBRACE"}, "_ml", {"type":"RBRACE"}], postprocess: d => createNode('BlockStatement', { body: [] }, d[0]) },
        
        { name: "Statements", symbols: ["Statement"], postprocess: d => [d[0]] },
        { name: "Statements", symbols: ["Statements", "_ml", "Statement"], postprocess: d => [...d[0], d[2]] },
        
        { name: "Statement", symbols: ["ReturnStatement"] },
        { name: "Statement", symbols: ["AssignmentStatement"] },
        { name: "Statement", symbols: ["FunctionCallStatement"] },
        { name: "Statement", symbols: ["RunAsmStatement"] },
        { name: "Statement", symbols: ["RunAsmBlockStatement"] },

        { name: "ReturnStatement", symbols: [{"type":"KEYWORD_RETURN"}, "_", "Expression", "_", {"type":"SEMICOLON"}], postprocess: d => createNode('ReturnStatement', { argument: d[2] }, d[0]) },
        { name: "ReturnStatement", symbols: [{"type":"KEYWORD_RETURN"}, "_", {"type":"SEMICOLON"}], postprocess: d => createNode('ReturnStatement', { argument: null }, d[0]) },
        
        { name: "AssignmentStatement", symbols: [{"type":"IDENTIFIER"}, "_", {"type":"ASSIGN"}, "_", "Expression", "_", {"type":"SEMICOLON"}], postprocess: d => createNode('AssignmentStatement', { left: createNode('Identifier', { name: d[0].value }, d[0]), right: d[4] }, d[0]) },
        
        { name: "FunctionCallStatement", symbols: [{"type":"IDENTIFIER"}, "_", {"type":"LPAREN"}, "_", {"type":"RPAREN"}, "_", {"type":"SEMICOLON"}], postprocess: d => createNode('FunctionCall', { name: d[0].value }, d[0]) },
        
        { name: "RunAsmStatement", symbols: [{"type":"RUN_ASM"}, "_", {"type":"LPAREN"}, "_", {"type":"STRING"}, "_", {"type":"RPAREN"}, "_", {"type":"SEMICOLON"}], postprocess: d => createNode('RunAsmStatement', { code: d[4].value.slice(1, -1) }, d[0]) },
        { name: "RunAsmBlockStatement", symbols: [{"type":"RUN_ASM_BLOCK"}, {"type":"BLOCK_CONTENT"}, {"type":"RBRACE_ASM"}], postprocess: d => createNode('RunAsmBlockStatement', { code: d[1].value.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '') }, d[0]) },

        // Expression Precedence Rules
        { name: "Expression", symbols: ["Additive"], postprocess: d => d[0] },
        { name: "Additive", symbols: ["Multiplicative"], postprocess: d => d[0] },
        { name: "Additive", symbols: ["Additive", "_", {"type":"OPERATOR", "value":"+"}, "_", "Multiplicative"], postprocess: d => createNode('BinaryOperation', { operator: d[2].value, left: d[0], right: d[4] }, d[2]) },
        { name: "Additive", symbols: ["Additive", "_", {"type":"OPERATOR", "value":"-"}, "_", "Multiplicative"], postprocess: d => createNode('BinaryOperation', { operator: d[2].value, left: d[0], right: d[4] }, d[2]) },
        
        { name: "Multiplicative", symbols: ["Primary"], postprocess: d => d[0] },
        { name: "Multiplicative", symbols: ["Multiplicative", "_", {"type":"OPERATOR", "value":"*"}, "_", "Primary"], postprocess: d => createNode('BinaryOperation', { operator: d[2].value, left: d[0], right: d[4] }, d[2]) },
        { name: "Multiplicative", symbols: ["Multiplicative", "_", {"type":"OPERATOR", "value":"/"}, "_", "Primary"], postprocess: d => createNode('BinaryOperation', { operator: d[2].value, left: d[0], right: d[4] }, d[2]) },
        { name: "Multiplicative", symbols: ["Multiplicative", "_", {"type":"OPERATOR", "value":"%"}, "_", "Primary"], postprocess: d => createNode('BinaryOperation', { operator: d[2].value, left: d[0], right: d[4] }, d[2]) },

        { name: "Primary", symbols: [{"type":"INTEGER"}], postprocess: d => createNode('Literal', { value: parseInt(d[0].value, 10) }, d[0]) },
        { name: "Primary", symbols: [{"type":"IDENTIFIER"}], postprocess: d => createNode('Identifier', { name: d[0].value }, d[0]) },
        { name: "Primary", symbols: [{"type":"LPAREN"}, "_", "Expression", "_", {"type":"RPAREN"}], postprocess: d => d[2] },

        // Whitespace helpers
        { name: "_", symbols: [] },
        { name: "_", symbols: [{"type":"WS"}] },
        { name: "_ml", symbols: [] },
        { name: "_ml", symbols: ["_ml", {"type":"WS"}] },
    ],
    ParserStart: "Program",
};

// 2. Create the Nearley Parser object
const nearleyGrammar = window.nearley.Grammar.fromCompiled(grammar);

/**
 * @param {import('./type.js').Token[]} tokens
 * @returns {import('./type.js').AstNode}
 */
export function parser(tokens) {
    const nearleyParser = new window.nearley.Parser(nearleyGrammar);
    try {
        nearleyParser.feed(tokens);
        if (nearleyParser.results.length > 1) {
            console.warn("Ambigous grammar detected!");
        }
        if (nearleyParser.results.length === 0) {
            throw new Error("Parser Error: Unexpected end of input. The code seems incomplete.");
        }
        return nearleyParser.results[0];
    } catch (e) {
        const token = e.token || tokens[tokens.length - 1] || { value: 'end of file', line: 'unknown', col: 'unknown' };
        throw new Error(`Parser Error: Unexpected token '${token.value}' at line ${token.line}, column ${token.col}.`);
    }
}