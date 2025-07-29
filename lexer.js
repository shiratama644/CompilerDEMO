// lexer.js

// Moo is loaded from CDN and available on the window object
// We must explicitly reference it as window.moo inside a module.
const mooLexer = window.moo.compile({
    WS:      { match: /\s+/, lineBreaks: true },
    COMMENT: [
        /\/\/.*/,
        /\/\*[\s\S]*?\*\//,
    ],
    RUN_ASM_BLOCK: {
        match: /Run\.AsmBlock\s*\{/,
        push: 'asmBlock' // Enter a new state for the block content
    },
    RUN_ASM: 'Run.Asm',
    KEYWORD: {
        match: /\b(?:int|void|return|const)\b/,
        type: window.moo.keywords({ // Also here
            'keyword_int': 'int',
            'keyword_void': 'void',
            'keyword_return': 'return',
            'keyword_const': 'const',
        })
    },
    STRING:   /"(?:\\["\\]|[^\n"\\])*"/,
    INTEGER:  /[0-9]+/,
    IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/,
    ASSIGN:   '=',
    LPAREN:   '(',
    RPAREN:   ')',
    LBRACE:   '{',
    RBRACE:   '}',
    SEMICOLON: ';',
    OPERATOR: ['+', '-', '*', '/', '%'],
});

// Special state for capturing everything inside Run.AsmBlock
mooLexer.states.asmBlock = {
    RBRACE_ASM: { match: '}', pop: 1 }, // Pop back to the main state
    BLOCK_CONTENT: { match: /[^}]+/, lineBreaks: true },
};


/**
 * @param {string} sourceCode
 * @returns {import('./type.js').Token[]}
 */
export function lexer(sourceCode) {
    mooLexer.reset(sourceCode);
    const tokens = [];
    let token;
    while (token = mooLexer.next()) {
        if (token.type !== 'WS' && token.type !== 'COMMENT') {
            tokens.push({
                type: token.type.toUpperCase(), // Standardize to uppercase
                value: token.value,
                line: token.line,
                column: token.col,
            });
        }
    }
    return tokens;
}