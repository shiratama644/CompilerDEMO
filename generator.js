/** @typedef {import('./type.js').AstNode} AstNode */
/** @typedef {import('./type.js').SymbolTable} SymbolTable */

let codeBuilder = [];
let symbolTable;

class CodeBuilder {
    constructor() { this.code = []; }
    emit(line) { this.code.push(line); }
    emitRaw(rawCode) { this.code.push(rawCode); } // --- NEW ---
    emitLabel(label) { this.code.push(`${label}:`); }
    getCode() { return this.code.join('\n'); }
}

function evaluateExpression(node) {
    if (node.type === 'Literal') {
        const reg = 'r5';
        codeBuilder.emit(`    LDI ${reg}, ${node.value}`);
        return reg;
    }
    if (node.type === 'Identifier') {
        const symbol = symbolTable.get(node.name);
        const reg = 'r5';
        if (symbol.kind === 'const') {
            codeBuilder.emit(`    LDI ${reg}, ${symbol.name}`);
        } else if (symbol.kind === 'variable') {
            codeBuilder.emit(`    API ap1, ${symbol.address}`);
            codeBuilder.emit(`    MLD ${reg}, ap1, 0`);
        }
        return reg;
    }
    if (node.type === 'BinaryOperation') {
        // Simplified for now, assumes right side is a literal
        const leftReg = evaluateExpression(node.left);
        const rightReg = 'r6';
        codeBuilder.emit(`    LDI ${rightReg}, ${node.right.value}`);
        
        const destReg = 'r15';
        const op = node.operator === '+' ? 'ADD' : 'SUB';
        codeBuilder.emit(`    ${op} ${leftReg}, ${rightReg}, ${destReg}`);
        return destReg;
    }
    throw new Error(`Generator Error: Cannot evaluate expression of type ${node.type}`);
}

function visit(node) {
    switch (node.type) {
        case 'FunctionDeclaration':
            codeBuilder.emitLabel(node.name);
            visit(node.body);
            codeBuilder.emit('    RET');
            break;
        case 'BlockStatement':
            node.body.forEach(visit);
            break;
        // --- NEW ---
        case 'RunAsmStatement':
            codeBuilder.emitRaw(`    ; Run.Asm`);
            codeBuilder.emitRaw(`    ${node.code}`);
            break;
        case 'RunAsmBlockStatement':
            codeBuilder.emitRaw(`    ; Run.AsmBlock`);
            codeBuilder.emitRaw(node.code);
            break;
        // --- END NEW ---
        case 'AssignmentStatement': {
            const symbol = symbolTable.get(node.left.name);
            const valueReg = evaluateExpression(node.right);
            codeBuilder.emit(`    API ap1, ${symbol.address}`);
            codeBuilder.emit(`    MST ${valueReg}, ap1, 0`);
            break;
        }
        case 'ReturnStatement':
            if (node.argument) {
                const resultReg = evaluateExpression(node.argument);
                if (resultReg !== 'r15') {
                    codeBuilder.emit(`    MOV ${resultReg}, r15`);
                }
            }
            break;
        case 'FunctionCall':
            codeBuilder.emit(`    CAL ${node.name}`);
            break;
    }
}

/**
 * @param {AstNode} ast
 * @param {SymbolTable} symTable
 * @returns {string}
 */
export function generator(ast, symTable) {
    codeBuilder = new CodeBuilder();
    symbolTable = symTable;

    // 1. .define section
    codeBuilder.emit('; Z++ Compiler Output');
    const consts = [...symbolTable.values()].filter(s => s.kind === 'const');
    if (consts.length > 0) {
        codeBuilder.emit('; --- Symbol Definitions ---');
        consts.forEach(c => codeBuilder.emit(`.define ${c.name} = ${c.value}`));
        codeBuilder.emit('');
    }

    // 2. Entry point jump
    codeBuilder.emit('    JMP _start');
    codeBuilder.emit('');

    // 3. Function definitions
    ast.body.filter(n => n.type === 'FunctionDeclaration').forEach(visit);
    codeBuilder.emit('');

    // 4. _start section
    codeBuilder.emit('_start:');
    // Global variable initializations
    const globals = [...symbolTable.values()].filter(s => s.kind === 'variable');
    if (globals.length > 0) {
      codeBuilder.emit('    ; --- Global Variable Initialization ---');
      globals.forEach(g => {
          const initValue = g.node.initializer ? g.node.initializer.value : 0;
          codeBuilder.emit(`    ; Initialize ${g.name} to ${initValue}`);
          codeBuilder.emit(`    LDI r1, ${initValue}`);
          codeBuilder.emit(`    API ap1, ${g.address}`);
          codeBuilder.emit(`    MST r1, ap1, 0`);
      });
    }

    codeBuilder.emit('    ; --- Main Execution ---');
    codeBuilder.emit('    CAL main');
    codeBuilder.emit('    HLT');

    return codeBuilder.getCode();
}