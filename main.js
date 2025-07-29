// main.js

import { lexer } from './lexer.js';
import { parser } from './parser.js';
import { analyzer } from './analyzer.js';
import { generator } from './generator.js';

// --- DOM要素の取得 ---
const fileUpload = document.getElementById('file-upload');
const compileBtn = document.getElementById('compile-btn');
const downloadBtn = document.getElementById('download-btn');
const sourceCodeEl = document.getElementById('source-code');
const outputCodeEl = document.getElementById('output-code');
const consoleOutputEl = document.getElementById('console-output');
const sourceFilenameEl = document.getElementById('source-filename');
const outputFilenameEl = document.getElementById('output-filename');

// --- 状態変数 ---
let currentFileName = 'untitled.zpp';
let compiledCode = '';

// --- サンプルコード ---
const sampleCode = `// Welcome to Z++ Online Compiler!
// You can edit this code and click Compile.

const int MY_VALUE = 123;
int result = 0;

void calculate() {
    result = MY_VALUE * 2; // 123 * 2 = 246
}

int main() {
    calculate();
    Run.Asm("NOP"); // Insert a No-Operation
    return result + 5; // 246 + 5 = 251
}
`;

// --- UI制御とロジック ---

function logToConsole(message, type = 'info') {
    consoleOutputEl.innerHTML = message;
    consoleOutputEl.className = `console-${type}`;
}

// --- NEW: Function to update compile button state ---
function updateCompileButtonState() {
    const hasContent = sourceCodeEl.value.trim().length > 0;
    compileBtn.disabled = !hasContent;
}

function compile() {
    const sourceCode = sourceCodeEl.value;
    if (!sourceCode.trim()) {
        logToConsole('エラー: ソースコードが空です。', 'error');
        return;
    }

    logToConsole('コンパイルを開始します...', 'info');
    outputCodeEl.value = '';
    downloadBtn.style.display = 'none';

    setTimeout(() => {
        try {
            const tokens = lexer(sourceCode);
            const ast = parser(tokens);
            const [analyzedAst, symbolTable, hasUsedRun] = analyzer(ast);
            const assemblyCode = generator(analyzedAst, symbolTable);
            
            compiledCode = assemblyCode;
            outputCodeEl.value = assemblyCode;
            
            let successMessage = 'コンパイルが正常に完了しました。';
            if (hasUsedRun) {
                successMessage += '<br><b>警告:</b> Run.Asm/Run.AsmBlockが使用されました。アセンブリコードの内容は検証されていません。';
            }
            logToConsole(successMessage, 'success');
            
            const outputFileName = currentFileName.replace(/\.zpp$/, '.asm') || 'compiled.asm';
            outputFilenameEl.textContent = `生成コード (${outputFileName})`;
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.setAttribute('download', outputFileName);

        } catch (e) {
            logToConsole(e.message, 'error');
        }
    }, 10);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zpp')) {
        alert('.zppファイルを選択してください。');
        event.target.value = '';
        return;
    }

    currentFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        sourceCodeEl.value = e.target.result;
        sourceFilenameEl.textContent = `ソースコード (${currentFileName})`;
        logToConsole(`ファイル '${currentFileName}' の読み込みが完了しました。`, 'info');
        updateCompileButtonState(); // --- ADDED: Update button state after file load ---
    };
    reader.readAsText(file);
}

function handleDownload() {
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadBtn.href = url;
}

function initialize() {
    // イベントリスナーを設定
    compileBtn.addEventListener('click', compile);
    fileUpload.addEventListener('change', handleFileUpload);
    downloadBtn.addEventListener('click', handleDownload);
    // --- NEW: Add event listener for textarea input ---
    sourceCodeEl.addEventListener('input', updateCompileButtonState);

    // エディタにサンプルコードをセット
    sourceCodeEl.value = sampleCode;
    sourceFilenameEl.textContent = `ソースコード (${currentFileName})`;

    // --- UPDATED: Set initial button state ---
    updateCompileButtonState();

    logToConsole('準備完了。コードを編集またはファイルをアップロードしてコンパイルしてください。', 'info');
}

// --- アプリケーションの開始 ---
initialize();