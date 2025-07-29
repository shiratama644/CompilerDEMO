/** @typedef {import('./type.js').Token} Token */
/** @typedef {import('./type.js').TokenType} TokenType */

const tokenDefinitions = [
    // --- NEW: コメント定義を追加 ---
    // 無視するトークンは、他のどのトークンよりも先に定義するのが安全です。
    { type: 'WHITESPACE',          regex: /^\s+/,                ignore: true },
    { type: 'SINGLE_LINE_COMMENT', regex: /^\/\/.*/,              ignore: true },
    { type: 'MULTI_LINE_COMMENT',  regex: /^\/\*[\s\S]*?\*\//,    ignore: true },
    // --- END NEW ---

    // 'Run.AsmBlock' must be checked before 'Run.Asm'
    { type: 'RUN_ASM_BLOCK', regex: /^Run\.AsmBlock/ },
    { type: 'RUN_ASM',       regex: /^Run\.Asm/ },
    { type: 'KEYWORD',       regex: /^\b(int|void|return|const)\b/ },
    { type: 'IDENTIFIER',    regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'INTEGER',       regex: /^[0-9]+/ },
    { type: 'STRING',        regex: /^"[^"]*"/ },
    { type: 'ASSIGN',        regex: /^=/ },
    { type: 'OPERATOR',      regex: /^[+\-]/ },
    { type: 'L_PAREN',       regex: /^\(/ },
    { type: 'R_PAREN',       regex: /^\)/ },
    { type: 'L_BRACE',       regex: /^\{/ },
    { type: 'R_BRACE',       regex: /^\}/ },
    { type: 'SEMICOLON',     regex: /^;/ },
];

/**
 * @param {string} sourceCode
 * @returns {Token[]}
 */
export function lexer(sourceCode) {
    const tokens = [];
    let cursor = 0;
    let line = 1;
    let column = 1;

    const updatePosition = (text) => {
        const lines = text.split('\n');
        if (lines.length > 1) {
            line += lines.length - 1;
            column = lines[lines.length - 1].length + 1;
        } else {
            column += text.length;
        }
        cursor += text.length;
    };

    while (cursor < sourceCode.length) {
        let matched = false;
        const remainingCode = sourceCode.substring(cursor);

        for (const def of tokenDefinitions) {
            const match = remainingCode.match(def.regex);
            if (match) {
                const value = match[0];
                if (!def.ignore) {
                    tokens.push({ type: /** @type {TokenType} */ (def.type), value, line, column });
                }
                updatePosition(value);

                // Special handling for Run.AsmBlock content
                if (def.type === 'RUN_ASM_BLOCK') {
                    const blockStartMatch = remainingCode.substring(value.length).match(/^\s*\{/);
                    if (!blockStartMatch) throw new Error(`Lexer Error: Missing '{' after Run.AsmBlock at line ${line}`);
                    
                    updatePosition(blockStartMatch[0]);
                    
                    let blockContent = '';
                    let braceDepth = 1;
                    let blockCursor = cursor;

                    while (blockCursor < sourceCode.length && braceDepth > 0) {
                        if (sourceCode[blockCursor] === '{') braceDepth++;
                        if (sourceCode[blockCursor] === '}') braceDepth--;
                        if (braceDepth > 0) blockContent += sourceCode[blockCursor];
                        blockCursor++;
                    }

                    if (braceDepth > 0) throw new Error(`Lexer Error: Unterminated Run.AsmBlock at line ${line}`);
                    
                    tokens.push({ type: 'STRING', value: blockContent, line, column });
                    updatePosition(blockContent + '}');
                }

                matched = true;
                break;
            }
        }

        if (!matched) {
            throw new Error(`Lexer Error: Unexpected character '${remainingCode[0]}' at line ${line}, column ${column}`);
        }
    }
    tokens.push({ type: 'EOF', value: '', line, column });
    return tokens;
}