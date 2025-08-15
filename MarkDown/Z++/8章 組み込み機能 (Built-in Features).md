# 8章 組み込み機能 (Built-in Features)

## 8.1. I/O操作関数

Z++は、8ビットCPUの物理的なI/Oポートとの間で効率的にデータの送受信を行うための組み込みI/O関数を提供します。これらの関数は、ハードウェアを抽象化しつつ、実行時の効率性を保持します。

### 8.1.1. 単一値I/O関数

#### Output(value, port) - 出力関数

指定された値を特定のポートに出力します。

**書式:**
```zpp
Output(value, port);
```

**パラメータ:**
- `value`: `uint8`型の値、変数、式、または`bool`型（出力する値）
- `port`: `uint8`型の値、変数、式（出力先のポート番号）

#### アセンブリレベルでの実装原理

`Output`関数は、8ビットCPUの`PST`（Port Store）命令を使用してハードウェア抽象化を実現します：

**Z++ソースコード:**
```zpp
const uint8 LED_PORT = 3;
uint8 brightness = 128;
Output(brightness, LED_PORT);
```

**生成されるアセンブリコード:**
```assembly
; Output(brightness, LED_PORT) の実装
; 1. value（brightness）を評価してr1に格納
MLD r1, ap0, brightness_addr   ; brightness の値をr1にロード

; 2. port（LED_PORT）を評価してr2に格納  
LDI r2, LED_PORT               ; ポート番号3をr2にロード

; 3. ポートアドレスをアドレスポインタap1に設定
APD r2, r0, ap1                ; ap1 = r2 + 0（ポートアドレス計算）

; 4. 実際の出力実行
PST r1, ap1, 0                 ; ポートap1に値r1を出力
```

#### ハードウェア抽象化のメカニズム

1. **ポートアドレス計算:** `APD`命令でポート番号を物理アドレスに変換
2. **統一インターフェース:** Z++レベルでは簡単な関数呼び出し、アセンブリレベルでは効率的なポート命令
3. **型安全性:** コンパイル時に引数の型をチェックし、不正なポートアクセスを防止

#### Input(port, variable) - 入力関数

指定されたポートから値を読み取り、変数に格納します。

**書式:**
```zpp
Input(port, variable);
```

**パラメータ:**
- `port`: `uint8`型の値、変数、式（入力元のポート番号）
- `variable`: `uint8`型または`bool`型の変数（値を格納する変数）

#### アセンブリレベルでの実装原理

**Z++ソースコード:**
```zpp
const uint8 SENSOR_PORT = 2;
uint8 sensor_value;
Input(SENSOR_PORT, sensor_value);
```

**生成されるアセンブリコード:**
```assembly
; Input(SENSOR_PORT, sensor_value) の実装
; 1. 変数のアドレスをr1に格納
API r1, sensor_value_addr      ; sensor_value のアドレスをr1に設定

; 2. ポート番号をr2に格納
LDI r2, SENSOR_PORT            ; ポート番号2をr2にロード

; 3. メモリアドレスをアドレスポインタap1に設定
MOV r1, ap1                    ; 変数アドレスをap1に設定

; 4. ポートアドレスをアドレスポインタap2に設定
APD r2, r0, ap2                ; ポートアドレスをap2に設定

; 5. ポートから値を読み込み
PLD r3, ap2, 0                 ; ポートから値をr3にロード

; 6. 変数に格納
MST r3, ap1, 0                 ; 読み込んだ値を変数に格納
```

#### 使用例

```zpp
const uint8 SENSOR_PORT = 2;
const uint8 LED_PORT = 1;
const bool DEBUG_MODE = true;

uint8 sensor_value;
bool button_pressed;

// ポート2から値を読み込み
Input(SENSOR_PORT, sensor_value);

// ポート0からブール値を読み込み  
Input(0, button_pressed);

// 読み取った値をLEDに出力
Output(sensor_value, LED_PORT);

// デバッグモードの場合は追加の出力
if (DEBUG_MODE) {
    Output(255, LED_PORT + 1);
}
```

### 8.1.2. 配列I/O関数（v2.0新機能）

#### Output(port, array, length) - 配列出力関数

配列の内容を指定したポートに連続して出力します。

**書式:**
```zpp
Output(port, array, length);
```

**パラメータ:**
- `port`: `uint8`型（出力開始ポート番号）
- `array`: 配列の開始要素（`array[start_idx]`の形式で開始位置を指定）
- `length`: `uint8`型（出力する要素数）

#### アセンブリレベルでの配列出力実装

配列I/Oは効率的なループ構造でハードウェアを直接操作します：

**Z++ソースコード:**
```zpp
uint8 led_values[8] = {255, 128, 64, 32, 16, 8, 4, 2};
Output(0, led_values[0], 4);  // ポート0に4要素を連続出力
```

**生成されるアセンブリコード:**
```assembly
; Output(0, led_values[0], 4) の実装
; 1. パラメータ設定
LDI r1, 0                      ; ポート番号
API r2, led_values_addr        ; 配列の先頭アドレス
LDI r3, 4                      ; 出力する要素数

; 2. ポートアドレス設定
APD r1, r0, ap1                ; ポートアドレスをap1に設定

; 3. ループカウンタ初期化
LDI r4, 0                      ; ループカウンタi = 0

output_loop:
; 4. ループ終了条件チェック
CMP r4, r3                     ; i と length を比較
JGE output_end                 ; i >= length なら終了

; 5. 配列要素をロードして出力
MLD r5, r2, r4                 ; array[i] をr5にロード
PST r5, ap1, 0                 ; ポートに出力

; 6. ループカウンタインクリメント
INC r4                         ; i++
JMP output_loop                ; ループ継続

output_end:
; 配列出力完了
```

#### Input(port, array, length) - 配列入力関数

指定したポートから連続して値を読み込み、配列に格納します。

**書式:**
```zpp
Input(port, array, length);
```

**パラメータ:**
- `port`: `uint8`型（入力元ポート番号）
- `array`: 配列の開始要素（格納開始位置）
- `length`: `uint8`型（入力する要素数）

#### アセンブリレベルでの配列入力実装

**Z++ソースコード:**
```zpp
uint8 sensor_data[10];
Input(0, sensor_data[0], 5);  // ポート0から5要素を連続入力
```

**生成されるアセンブリコード:**
```assembly
; Input(0, sensor_data[0], 5) の実装
; 1. パラメータ設定
LDI r1, 0                      ; ポート番号
API r2, sensor_data_addr       ; 配列の先頭アドレス
LDI r3, 5                      ; 入力する要素数

; 2. ポートアドレス設定
APD r1, r0, ap1                ; ポートアドレスをap1に設定

; 3. ループカウンタ初期化
LDI r4, 0                      ; ループカウンタi = 0

input_loop:
; 4. ループ終了条件チェック
CMP r4, r3                     ; i と length を比較
JGE input_end                  ; i >= length なら終了

; 5. ポートから読み込んで配列に格納
PLD r5, ap1, 0                 ; ポートから値をr5にロード
MST r5, r2, r4                 ; array[i] = r5

; 6. ループカウンタインクリメント
INC r4                         ; i++
JMP input_loop                 ; ループ継続

input_end:
; 配列入力完了
```

#### 配列I/Oの効率性

1. **ハードウェア直接アクセス:** 中間バッファを使わず、ポートから直接配列に格納
2. **ループ最適化:** コンパイラが効率的なループを生成
3. **メモリ連続性:** 配列の物理的な連続性を活用

### 8.1.3. 使用例

```zpp
// センサーデータ収集システム
const uint8 SENSOR_PORT = 0;
const uint8 LED_PORT = 1;
const uint8 CONTROL_PORT = 2;

uint8 sensor_readings[16];
uint8 led_pattern[8] = {1, 2, 4, 8, 16, 32, 64, 128};
uint8 control_signals[4] = {0xFF, 0x80, 0x40, 0x20};

uint8 main() {
    // 16個のセンサー値を連続読み込み
    Input(SENSOR_PORT, sensor_readings[0], 16);
    
    // LEDパターンを連続出力
    Output(LED_PORT, led_pattern[0], 8);
    
    // 制御信号を部分出力
    Output(CONTROL_PORT, control_signals[1], 2);  // 0x80, 0x40を出力
    
    // 単一値でのステータス出力
    uint8 status = 0xFF;
    Output(CONTROL_PORT + 1, status);
    
    return 0;
}
```

## 8.2. アセンブリ埋め込み機能

Z++コード内に直接アセンブリコードを埋め込む機能です。8ビットCPUの特定の命令を使用したい場合や、極限まで最適化されたコードが必要な場合に使用します。

### 8.2.1. 単一行アセンブリ

**書式:**
```zpp
Run.Asm("アセンブリ命令");
```

#### アセンブリレベルでの動作

`Run.Asm`は、文字列として指定されたアセンブリ命令をそのままコード内に埋め込みます：

**Z++ソースコード:**
```zpp
uint8 value = 0x55;
Run.Asm("XOR r1, r1, r1");  // r1レジスタをゼロクリア
```

**生成されるアセンブリコード:**
```assembly
; uint8 value = 0x55;
LDI r1, 0x55
MST r1, ap0, value_addr

; Run.Asm("XOR r1, r1, r1");
XOR r1, r1, r1              ; 埋め込まれたアセンブリ命令
```

### 8.2.2. 複数行アセンブリブロック

**書式:**
```zpp
Run.AsmBlock {
    // 複数行のアセンブリコードを記述
}
```

#### 使用例

**Z++ソースコード:**
```zpp
uint8 calculate_checksum(uint8 data[], uint8 size) {
    uint8 checksum = 0;
    
    // 高速チェックサム計算（アセンブリ最適化）
    Run.AsmBlock {
        ; データポインタをap1に設定
        API ap1, data_addr
        
        ; サイズをr2、チェックサムをr3に設定
        MLD r2, ap0, size_addr
        LDI r3, 0
        
        ; チェックサムループ
        checksum_loop:
            CMP r2, 0
            JZ checksum_end
            MLD r4, ap1, 0
            ADD r3, r4, r3
            INC ap1
            DEC r2
            JMP checksum_loop
            
        checksum_end:
            MST r3, ap0, checksum_addr
    }
    
    return checksum;
}
```

### 8.2.3. レジスタ破壊とコンパイラ協調

#### 重要な注意点

> **警告:** Z++の変数やレジスタ割り当てを破壊しないよう、CPUの仕様を熟知した上で使用する必要があります。

#### レジスタ使用規則

アセンブリ埋め込み使用時は以下の規則を遵守する必要があります：

| レジスタ分類 | レジスタ | 使用制限 | 備考 |
|-------------|----------|----------|------|
| **自由使用可能** | `r5-r14` | アセンブリブロック内で自由に使用可能 | ただし元の値を復元すること |
| **注意して使用** | `r1-r4` | 一時的な使用のみ | 関数引数や一時変数で使用される可能性 |
| **使用禁止** | `r15` | 使用禁止 | 戻り値レジスタ |
| **使用禁止** | `ap14` | 使用禁止 | スタックポインタ |

#### 安全なアセンブリ埋め込みパターン

```zpp
void safe_assembly_example() {
    uint8 temp1 = 10;
    uint8 temp2 = 20;
    
    Run.AsmBlock {
        ; 使用するレジスタを事前に退避
        PSH r5
        PSH r6
        
        ; 安全にr5, r6を使用
        MLD r5, ap0, temp1_addr
        MLD r6, ap0, temp2_addr
        ADD r5, r6, r5
        MST r5, ap0, temp1_addr
        
        ; 使用したレジスタを復元
        POP r6
        POP r5
    }
}
```

#### 危険なアセンブリ埋め込み例

```zpp
void unsafe_assembly_example() {
    uint8 value = 100;
    
    Run.AsmBlock {
        ; 危険：スタックポインタを破壊
        LDI ap14, 0x00        ; ← これは危険！
        
        ; 危険：戻り値レジスタを意図せず変更
        LDI r15, 0xFF         ; ← これも危険！
        
        ; 危険：レジスタを復元せずに変更
        LDI r5, 0x55          ; ← r5を元に戻さない
    }
    // この後のコードが予期しない動作をする可能性
}
```

## 8.3. デバッグ出力機能 (`Run.Debug`)

プログラムの実行を妨げることなく、開発中のデバッグ情報をホストPC（IDE）に送信する機能です。この機能はZ++言語の「透明性」原則を体現する重要な機能です。

### 8.3.1. 書式

```zpp
Run.Debug("フォーマット文字列", expression1, expression2, ...);
```

### 8.3.2. 二重実行環境の実装原理

`Run.Debug`は、コンパイル時とIDE実行時で異なる動作をする特殊な機能です：

#### コンパイル時の動作 (`.zpp` → `.asm`)

**重要な特徴:** Z++コンパイラは、`Run.Debug`文を**何のアセンブリコードにも変換せず、完全に無視**します。

**Z++ソースコード:**
```zpp
uint8 sensor_value = Input(0);
Run.Debug("Sensor reading: {}", sensor_value);
Output(sensor_value, 1);
```

**生成されるアセンブリコード:**
```assembly
; uint8 sensor_value = Input(0);
LDI r1, 0
API r2, sensor_value_addr
; ...Input関数のアセンブリ実装...

; Run.Debug文は完全に無視される（アセンブリコード生成なし）

; Output(sensor_value, 1);
MLD r1, ap0, sensor_value_addr
LDI r2, 1
; ...Output関数のアセンブリ実装...
```

#### IDE実行時の動作（デバッグ環境）

IDEはソースコードを独立して解析し、`Run.Debug`文を特別に処理します：

1. **ソースコード解析:** IDEが`.zpp`ファイルを直接解析
2. **実行ポイント追跡:** プログラムカウンタと行番号の対応付け
3. **式評価:** `expression`部分をIDE内のインタープリターで評価
4. **フォーマット出力:** 結果をデバッグコンソールに表示

#### デバッグ実行のアルゴリズム

```
1. IDEがアセンブリコードを1行ずつ実行
2. 現在の実行位置に対応するZ++ソースコード行を特定
3. その行にRun.Debug文があるかチェック
4. Run.Debug文がある場合：
   a. expression部分を現在のCPU状態で評価
   b. フォーマット文字列の{}部分に値を埋め込み
   c. デバッグコンソールに出力
5. 次の命令に進む
```

### 8.3.3. ゼロオーバーヘッドの保証

この設計により、以下の重要な特性が保証されます：

1. **製品版コードサイズへの影響なし:** `Run.Debug`は最終バイナリに含まれない
2. **実行速度への影響なし:** 実際のデバイスでの実行には一切影響しない
3. **開発効率の向上:** IDEでのデバッグ時のみ有効

### 8.3.4. 重要な注意点

#### 副作用のある式の扱い

```zpp
uint8 counter = 0;

void problematic_debug() {
    // 危険：Run.Debug内で副作用のある式を使用
    Run.Debug("Counter value: {}", counter++);  // ← これは避けるべき
}
```

**問題点:**
- **IDEデバッグ時:** `counter++`が評価され、counterが変更される
- **実際のデバイス実行時:** `counter++`は実行されず、counterは変更されない
- **結果:** IDEでのテスト結果と実機での動作が異なる

#### 推奨される安全なデバッグパターン

```zpp
uint8 counter = 0;

void safe_debug() {
    // 安全：副作用なしでデバッグ出力
    Run.Debug("Counter value: {}", counter);
    
    // 実際の処理で副作用を発生させる
    counter++;
}
```

### 8.3.5. 使用例

```zpp
struct Point {
    uint8 x;
    uint8 y;
};

uint8 process_sensor_data() {
    struct Point sensor_pos;
    uint8 reading_count = 0;
    
    // センサー初期化
    sensor_pos.x = 50;
    sensor_pos.y = 100;
    Run.Debug("Sensor initialized at position: ({}, {})", sensor_pos.x, sensor_pos.y);
    
    // データ読み込みループ
    for (uint8 i = 0; i < 10; i++) {
        uint8 sensor_value = Input(i);
        reading_count++;
        
        // 進行状況をデバッグ出力
        Run.Debug("Reading sensor {}: value={}, total_readings={}", i, sensor_value, reading_count);
        
        if (sensor_value > 200) {
            Run.Debug("High value detected on sensor {}", i);
            Output(255, i);
        }
    }
    
    // 処理完了
    Run.Debug("Processing complete. Total readings: {}", reading_count);
    
    return reading_count;
}

uint8 main() {
    Run.Debug("System initialization started");
    
    uint8 total_readings = process_sensor_data();
    
    Run.Debug("Main function complete. Total readings: {}", total_readings);
    return 0;
}
```

### 8.3.6. IDEでのデバッグ出力表示例

上記のコードをIDEで実行すると、デバッグコンソールに以下のような出力が表示されます：

```
[DEBUG] System initialization started
[DEBUG] Sensor initialized at position: (50, 100)
[DEBUG] Reading sensor 0: value=45, total_readings=1
[DEBUG] Reading sensor 1: value=127, total_readings=2
[DEBUG] Reading sensor 2: value=203, total_readings=3
[DEBUG] High value detected on sensor 2
[DEBUG] Reading sensor 3: value=89, total_readings=4
...
[DEBUG] Processing complete. Total readings: 10
[DEBUG] Main function complete. Total readings: 10
```

---

**注記:** 本章で説明した組み込み機能の詳細は、Z++の「透明性」と「効率性」の原則に基づいています。I/O関数は8ビットCPUの命令と直接対応し、アセンブリ埋め込みは完全な制御を提供し、デバッグ機能は開発効率を損なわずに実行時性能を保証します。これらの機能により、開発者は8ビット環境での効率的なプログラム開発が可能になります。