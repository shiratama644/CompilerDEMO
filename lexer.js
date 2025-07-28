/** @typedef {import('./type.js').Token} Token */
/** @typedef {import('./type.js').TokenType} TokenType */

const tokenDefinitions = [
    { type: 'WHITESPACE', regex: /^\s+/, ignore: true },
    { type: 'KEYWORD',    regex: /^\b(int|void|return|const)\b/ },
    { type: 'IDENTIFIER', regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'INTEGER',    regex: /^[0-9]+/ },
    { type: 'ASSIGN',     regex: /^=/ },
    { type: 'OPERATOR',   regex: /^[+\-]/ },
    { type: 'L_PAREN',    regex: /^\(/ },
    { type: 'R_PAREN',    regex: /^\)/ },
    { type: 'L_BRACE',    regex: /^\{/ },
    { type: 'R_BRACE',    regex: /^\}/ },
    { type: 'SEMICOLON',  regex: /^;/ },
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

                const lines = value.split('\n');
                if (lines.length > 1) {
                    line += lines.length - 1;
                    column = lines[lines.length - 1].length + 1;
                } else {
                    column += value.length;
                }
                
                cursor += value.length;
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