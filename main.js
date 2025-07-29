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
let currentFileName = 'untitled.zpp'; // デフォルトのファイル名
let compiledCode = '';

// --- サンプルコード ---
const sampleCode = `// Welcome to Z++ Online Compiler!
// You can use Run.Asm for inline assembly.

const int MY_VALUE = 123;

int main() {
    Run.Asm("LDI r1, MY_VALUE");
    Run.AsmBlock {
        ; This is a block of assembly
        ; It will be inserted as is.
        ADD r1, r0, r15
    }
    return;
}
`;

// --- UI制御とロジック ---

/**
 * コンソールにメッセージとタイプに応じたスタイルでログを出力する
 * @param {string} message - 表示するメッセージ
 * @param {'info' | 'success' | 'error' | 'warning'} type - メッセージの種類
 */
function logToConsole(message, type = 'info') {
    consoleOutputEl.innerHTML = message; // Use innerHTML to render line breaks
    consoleOutputEl.className = `console-${type}`;
}

/**
 * メインのコンパイル処理
 */
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
            // --- UPDATED ---
            const [analyzedAst, symbolTable, hasUsedRun] = analyzer(ast);
            const assemblyCode = generator(analyzedAst, symbolTable);
            
            compiledCode = assemblyCode;
            outputCodeEl.value = assemblyCode;
            
            let successMessage = 'コンパイルが正常に完了しました。';
            if (hasUsedRun) {
                successMessage += '<br><b>警告:</b> Run.Asm/Run.AsmBlockが使用されました。アセンブリコードの内容は検証されていません。';
            }
            logToConsole(successMessage, 'success');
            // --- END UPDATED ---
            
            const outputFileName = currentFileName.replace(/\.zpp$/, '.asm') || 'compiled.asm';
            outputFilenameEl.textContent = `生成コード (${outputFileName})`;
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.setAttribute('download', outputFileName);

        } catch (e) {
            logToConsole(e.message, 'error');
        }
    }, 10);
}

/**
 * ファイルアップロード時の処理
 * @param {Event} event 
 */
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
    };
    reader.readAsText(file);
}

/**
 * ダウンロードボタンの処理
 */
function handleDownload() {
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadBtn.href = url;
}

/**
 * 初期化処理
 */
function initialize() {
    compileBtn.addEventListener('click', compile);
    fileUpload.addEventListener('change', handleFileUpload);
    downloadBtn.addEventListener('click', handleDownload);

    sourceCodeEl.value = sampleCode;
    sourceFilenameEl.textContent = `ソースコード (${currentFileName})`;
    compileBtn.disabled = false;

    logToConsole('準備完了。コードを編集またはファイルをアップロードしてコンパイルしてください。', 'info');
}

// --- アプリケーションの開始 ---
initialize();