import { lexer } from './lexer.js';
import { parser } from './parser.js';
import { analyzer } from './analyzer.js';
import { generator } from './generator.js';

const fileUpload = document.getElementById('file-upload');
const compileBtn = document.getElementById('compile-btn');
const downloadBtn = document.getElementById('download-btn');
const sourceCodeEl = document.getElementById('source-code');
const outputCodeEl = document.getElementById('output-code');
const consoleOutputEl = document.getElementById('console-output');
const sourceFilenameEl = document.getElementById('source-filename');
const outputFilenameEl = document.getElementById('output-filename');

let originalFileName = '';
let compiledCode = '';

function logToConsole(message, type = 'info') {
    consoleOutputEl.textContent = message;
    consoleOutputEl.className = `console-${type}`;
}

function compile() {
    const sourceCode = sourceCodeEl.value;
    if (!sourceCode) {
        logToConsole('エラー: ソースコードが空です。', 'error');
        return;
    }

    logToConsole('コンパイルを開始します...', 'info');
    outputCodeEl.value = '';
    downloadBtn.style.display = 'none';

    try {
        // 1. 字句解析
        const tokens = lexer(sourceCode);
        
        // 2. 構文解析
        const ast = parser(tokens);
        
        // 3. 意味解析
        const [analyzedAst, symbolTable] = analyzer(ast);
        
        // 4. コード生成
        const assemblyCode = generator(analyzedAst, symbolTable);
        
        // 成功
        compiledCode = assemblyCode;
        outputCodeEl.value = assemblyCode;
        logToConsole('コンパイルが正常に完了しました。', 'success');
        
        const outputFileName = originalFileName.replace('.zpp', '.asm') || 'compiled.asm';
        outputFilenameEl.textContent = `生成コード (${outputFileName})`;
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.setAttribute('download', outputFileName);

    } catch (e) {
        logToConsole(e.message, 'error');
    }
}

fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zpp')) {
        alert('.zppファイルを選択してください。');
        return;
    }

    originalFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        sourceCodeEl.value = e.target.result;
        sourceFilenameEl.textContent = `ソースコード (${originalFileName})`;
        compileBtn.disabled = false;
        logToConsole('.zppファイルの読み込みが完了しました。', 'info');
    };
    reader.readAsText(file);
});

compileBtn.addEventListener('click', compile);

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadBtn.href = url;
});