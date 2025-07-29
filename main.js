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
// ▶ボタンを押してコンパイルを試してください。

const int MAX_VALUE = 255;
int counter = 0;

void increment_counter() {
    counter = counter + 1;
}

int main() {
    increment_counter();
    increment_counter();
    
    if (counter == 2) {
        return MAX_VALUE;
    }

    return 0;
}
`;

// --- UI制御とロジック ---

/**
 * コンソールにメッセージとタイプに応じたスタイルでログを出力する
 * @param {string} message - 表示するメッセージ
 * @param {'info' | 'success' | 'error'} type - メッセージの種類
 */
function logToConsole(message, type = 'info') {
    consoleOutputEl.textContent = message;
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

    // 非同期にすることで、UIの「コンパイルを開始します...」の表示を確実にする
    setTimeout(() => {
        try {
            // 1. 字句解析
            const tokens = lexer(sourceCode);
            
            // 2. 構文解析
            const ast = parser(tokens);
            
            // 3. 意味解析
            const [analyzedAst, symbolTable] = analyzer(ast);
            
            // 4. コード生成
            const assemblyCode = generator(analyzedAst, symbolTable);
            
            // 成功時の処理
            compiledCode = assemblyCode;
            outputCodeEl.value = assemblyCode;
            logToConsole('コンパイルが正常に完了しました。', 'success');
            
            const outputFileName = currentFileName.replace(/\.zpp$/, '.asm') || 'compiled.asm';
            outputFilenameEl.textContent = `生成コード (${outputFileName})`;
            downloadBtn.style.display = 'inline-flex';
            downloadBtn.setAttribute('download', outputFileName);

        } catch (e) {
            // エラー時の処理
            logToConsole(e.message, 'error');
        }
    }, 10); // 10ミリ秒後に実行
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
        event.target.value = ''; // ファイル選択をリセット
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
    // aタグのhrefはクリック時に動的に設定する
    downloadBtn.href = url;
}

/**
 * 初期化処理
 */
function initialize() {
    // イベントリスナーを設定
    compileBtn.addEventListener('click', compile);
    fileUpload.addEventListener('change', handleFileUpload);
    downloadBtn.addEventListener('click', handleDownload);

    // エディタにサンプルコードをセット
    sourceCodeEl.value = sampleCode;
    sourceFilenameEl.textContent = `ソースコード (${currentFileName})`;

    // コンパイルボタンを有効化
    compileBtn.disabled = false;

    logToConsole('準備完了。コードを編集またはファイルをアップロードしてコンパイルしてください。', 'info');
}

// --- アプリケーションの開始 ---
initialize();