/** @typedef {import('./type.js').AstNode} AstNode */
/** @typedef {import('./type.js').SymbolTable} SymbolTable */

let codeBuilder;
let symbolTable;
let registerAllocator;

class CodeBuilder {
    constructor() { this.code = []; }
    emit(line) { this.code.push(line); }
    emitRaw(rawCode) { this.code.push(rawCode); }
    emitLabel(label) { this.code.push(`${label}:`); }
    getCode() { return this.code.join('\n'); }
}

class RegisterAllocator {
    constructor() {
        this.freeRegisters = ['r7', 'r6', 'r5']; // Callee-saved registers for expressions
    }
    acquire() {
        if (this.freeRegisters.length === 0) throw new Error("Generator Error: Out of registers! Expression too complex.");
        return this.freeRegisters.pop();
    }
    release(reg) {
        if (reg && !this.freeRegisters.includes(reg)) {
            this.freeRegisters.push(reg);
        }
    }
}

function evaluateExpression(node) {
    if (node.type === 'Literal') {
        const reg = registerAllocator.acquire();
        codeBuilder.emit(`    LDI ${reg}, ${node.value}`);
        return reg;
    }
    if (node.type === 'Identifier') {
        const symbol = symbolTable.get(node.name);
        const reg = registerAllocator.acquire();
        if (symbol.kind === 'const') {
            codeBuilder.emit(`    LDI ${reg}, ${symbol.name}`);
        } else if (symbol.kind === 'variable') {
            codeBuilder.emit(`    API ap1, ${symbol.address}`);
            codeBuilder.emit(`    MLD ${reg}, ap1, 0`);
        }
        return reg;
    }
    if (node.type === 'BinaryOperation') {
        const leftReg = evaluateExpression(node.left);
        const rightReg = evaluateExpression(node.right);
        
        const opMap = { '+': 'ADD', '-': 'SUB', '*': 'MUL', '/': 'DIV', '%': 'MOD' };
        const op = opMap[node.operator];
        if (!op) throw new Error(`Generator Error: Unsupported operator ${node.operator}`);

        codeBuilder.emit(`    ${op} ${leftReg}, ${rightReg}, ${leftReg}`);
        
        registerAllocator.release(rightReg);
        return leftReg;
    }
    throw new Error(`Generator Error: Cannot evaluate expression of type ${node.type}`);
}

// --- NEW: Compile-time evaluator for global initializers ---
function evaluateConstantExpression(node) {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'Identifier') {
        const symbol = symbolTable.get(node.name);
        if (symbol && symbol.kind === 'const') return symbol.value;
    }
    // For now, we don't support complex constant expressions
    throw new Error("Generator Error: Cannot evaluate non-literal constant expression at compile time.");
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
        case 'RunAsmStatement':
            codeBuilder.emitRaw(`    ${node.code}`);
            break;
        case 'RunAsmBlockStatement':
            codeBuilder.emitRaw(node.code);
            break;
        case 'AssignmentStatement': {
            const symbol = symbolTable.get(node.left.name);
            const valueReg = evaluateExpression(node.right);
            codeBuilder.emit(`    API ap1, ${symbol.address}`);
            codeBuilder.emit(`    MST ${valueReg}, ap1, 0`);
            registerAllocator.release(valueReg);
            break;
        }
        case 'ReturnStatement':
            if (node.argument) {
                const resultReg = evaluateExpression(node.argument);
                if (resultReg !== 'r15') {
                    codeBuilder.emit(`    MOV ${resultReg}, r15`);
                }
                registerAllocator.release(resultReg);
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
    registerAllocator = new RegisterAllocator();

    codeBuilder.emit('; Z++ Compiler Output');
    const consts = [...symbolTable.values()].filter(s => s.kind === 'const');
    if (consts.length > 0) {
        codeBuilder.emit('; --- Symbol Definitions ---');
        consts.forEach(c => codeBuilder.emit(`.define ${c.name} = ${c.value}`));
        codeBuilder.emit('');
    }

    codeBuilder.emit('    JMP _start');
    codeBuilder.emit('');

    ast.body.filter(n => n.type === 'FunctionDeclaration').forEach(visit);
    codeBuilder.emit('');

    codeBuilder.emit('_start:');
    const globals = [...symbolTable.values()].filter(s => s.kind === 'variable');
    if (globals.length > 0) {
      codeBuilder.emit('    ; --- Global Variable Initialization ---');
      globals.forEach(g => {
          // --- UPDATED: Use the evaluator ---
          const initValue = g.node.initializer ? evaluateConstantExpression(g.node.initializer) : 0;
          
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