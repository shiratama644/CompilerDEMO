# Z++詳細言語仕様書 v3.0

## 目次
1. [はじめに](#1章-はじめに-introduction)
2. [字句構造](#2章-字句構造-lexical-structure)
3. [データ型、変数、定数](#3章-データ型変数定数-data-types-variables-and-constants)
4. [式と演算子](#4章-式と演算子-expressions-and-operators)
5. [演算子の優先順位](#5章-演算子の優先順位)
6. [文と制御構造](#6章-文と制御構造-statements-and-control-structures)
7. [関数](#7章-関数-functions)
8. [組み込み機能](#8章-組み込み機能-built-in-features)
9. [名前空間とモジュール](#9章-名前空間とモジュール-namespaces-and-modules)
10. [クラスと構造体](#10章-クラスと構造体-classes-and-structures)
11. [付録](#付録)

---

## 1章 はじめに (Introduction)

### 1.1. Z++とは
Z++は、本ドキュメントで規定される**8ビットCPU向けに設計された、C++ライクな静的型付け高級プログラミング言語**です。C++の強力な表現力と抽象化能力を継承しつつ、リソースが限られた8ビット環境でも効率的に動作するよう、仕様が最適化されています。

Z++で記述されたソースコードの拡張子は **`.zpp`** とします。

### 1.2. 設計思想の詳細化
Z++は、以下の4つの核心原則を基盤として設計されています。これらの原則は、8ビット組み込みシステム開発における実践的な要求から導かれたものです。

#### 1.2.1. 透明性 (Transparency)
Z++のすべての高級言語構造は、**予測可能なアセンブリコード**に変換されます。これにより開発者は：
- メモリ使用量を正確に予測できる
- 実行時間を事前に見積もることができる
- パフォーマンスクリティカルな部分を特定し最適化できる
- デバッグ時にハードウェアレベルでの動作を理解できる

**具体例：**
```zpp
uint8 a = 10, b = 20;
uint8 result = a + b;
```
このコードは以下のアセンブリに変換されます：
```asm
LDI r1, 10        ; a = 10
LDI r2, 20        ; b = 20  
ADD r1, r2, r3    ; result = a + b
MST r3, ap0, 0    ; resultを変数領域に格納
```

#### 1.2.2. 効率性 (Efficiency)
生成されるコードは、8ビットCPUアーキテクチャを最大限活用します：
- **ゼロコスト抽象化**：高級言語の機能が実行時オーバーヘッドを発生させない
- **レジスタ効率最適化**：16個の汎用レジスタを最大限活用
- **メモリ使用量最小化**：256バイトのRAMを効率的に使用
- **デッドコード除去**：未使用関数や変数の完全排除

#### 1.2.3. 表現力 (Expressiveness)
8ビットシステム特有の複雑な低レベル操作を、直感的な高級言語構文で記述：
- **ハードウェアI/O抽象化**：ポート操作を関数呼び出しに抽象化
- **型安全なハードウェア制御**：enum型による型安全なデバイス制御
- **アセンブリ統合**：必要に応じてアセンブリを直接埋め込み可能

#### 1.2.4. 実用性 (Practicality)
実際の組み込みシステム開発で必要とされる機能を重視：
- **リアルタイム性**：実行時間が予測可能
- **メモリ制約対応**：限られたリソースでの動作を保証
- **デバッグ支援**：開発時のデバッグを強力にサポート
- **保守性**：大規模プロジェクトにも対応可能なモジュール化機能

### 1.3. v3.0の主な改良点
v3.0では、v1.0の詳細な技術解説とv2.0の型システム改善を統合し、さらに以下の拡張を行いました：

#### 1.3.1. 型システムの完全移行
- **基本データ型**：`int`から`uint8`への完全移行
- **bool型の追加**：型安全な論理値の導入
- **enum型の型安全性強化**：より厳密な型変換規則

#### 1.3.2. 組み込み機能の拡張
- **新しいI/O関数体系**：`Output`/`Input`関数による直感的なI/O操作
- **配列I/O の高速化**：連続データ転送の効率化
- **デバッグ機能の強化**：`Run.Debug`による実行時デバッグ支援

#### 1.3.3. アセンブリレベル解説の復活・拡張
- **const定数のアセンブリ変換**：`.define`ディレクティブの詳細解説
- **関数呼び出し規約**：レジスタ割り当ての完全なドキュメント化
- **最適化アルゴリズム**：コンパイラの内部動作の詳細説明
- **CPU命令対応表**：すべての演算子とCPU命令の対応関係

---

## 2章 字句構造 (Lexical Structure)

### 2.1. トークン解析の詳細

Z++コンパイラの字句解析器（レクサー）は、ソースコードを以下のトークン種別に分類します：

#### 2.1.1. トークンの種類
1. **識別子 (Identifier)**：変数名、関数名、型名など
2. **キーワード (Keyword)**：`if`, `while`, `uint8`, `bool`など
3. **リテラル (Literal)**：数値、文字、文字列リテラル
4. **演算子 (Operator)**：`+`, `-`, `==`, `&&`など
5. **区切り子 (Delimiter)**：`{`, `}`, `(`, `)`, `;`など
6. **コメント (Comment)**：プログラムの動作に影響しない注釈

#### 2.1.2. 字句解析の内部処理
字句解析器は以下のステップでトークンを生成します：

1. **文字入力**：ソースファイルから1文字ずつ読み込み
2. **状態遷移**：有限状態オートマトン（FSA）による状態管理
3. **トークン認識**：パターンマッチングによるトークン種別判定
4. **エラー検出**：不正な文字列や文法エラーの検出

**状態遷移の例：**
```
状態: START
文字: 'i' → 状態: IDENTIFIER
文字: 'f' → 状態: IDENTIFIER  
EOF/空白 → トークン: "if" (KEYWORD)

状態: START
文字: '1' → 状態: NUMBER
文字: '0' → 状態: NUMBER
EOF/空白 → トークン: "10" (NUMBER_LITERAL)
```

### 2.2. コメント (Comments)
ソースコード内に記述できる、プログラムの動作に影響を与えない注釈です。

#### 2.2.1. 単一行コメント
`//` から行末までがコメントになります。
```zpp
uint8 led_pin = 3; // LEDを接続するピン番号
```

**アセンブリ生成への影響：**
コメントはトークン化段階で完全に除去され、生成されるアセンブリコードに一切影響しません。

#### 2.2.2. 複数行コメント
`/*` と `*/` で囲まれた範囲がコメントになります。
```zpp
/*
    このブロックは複数行にわたる
    コメントのサンプルです。
*/
```

**ネストの制限：**
複数行コメントのネストは**サポートされません**：
```zpp
/* 外側のコメント /* 内側のコメント */ ここは再びコードとして解釈される */
```

### 2.3. 識別子 (Identifiers)
変数名、関数名、型名などに使用される名前です。

#### 2.3.1. 命名規則
- **開始文字**：英字（`a`-`z`, `A`-`Z`）またはアンダースコア（`_`）
- **続く文字**：英字、数字（`0`-`9`）、アンダースコア
- **大文字・小文字の区別**：あり（`MyVariable`と`myvariable`は別の識別子）

#### 2.3.2. 予約語との区別
以下のキーワードは識別子として使用できません：

**データ型キーワード：**
`uint8`, `bool`, `const`, `enum`, `struct`, `class`

**制御構造キーワード：**
`if`, `else`, `while`, `for`, `do`, `switch`, `case`, `default`, `break`, `continue`, `return`

**名前空間・モジュールキーワード：**
`namespace`, `using`, `include`

**組み込み機能キーワード：**
`Output`, `Input`, `Run`

#### 2.3.3. 識別子の内部表現
コンパイラ内部では、識別子は**シンボルテーブル**で管理されます：

```
識別子: "sensor_value"
├─ 型: uint8
├─ スコープ: local
├─ メモリアドレス: 0x10
└─ レジスタ割り当て: r5 (一時的)
```

### 2.4. リテラル (Literals)

#### 2.4.1. 数値リテラル

**整数リテラル：**
```zpp
42          // 10進数
0x2A        // 16進数（同じく42）
0b00101010  // 2進数（同じく42）
```

**アセンブリ生成例：**
```zpp
uint8 value = 42;
```
↓コンパイル↓
```asm
LDI r1, 42      ; 即値42をr1にロード
MST r1, ap0, 0  ; 変数valueに格納
```

**範囲チェック：**
uint8型では0-255の範囲のみ有効です。範囲外の値はコンパイル時エラーとなります：
```zpp
uint8 invalid = 256;  // コンパイルエラー：範囲外
```

#### 2.4.2. 論理値リテラル
```zpp
bool flag1 = true;   // 内部的には1
bool flag2 = false;  // 内部的には0
```

**メモリ効率：**
bool値も8ビット（1バイト）として格納されますが、論理演算において最適化されます。

#### 2.4.3. 文字リテラル
```zpp
uint8 ch = 'A';      // ASCIIコード65として格納
uint8 newline = '\n'; // ASCIIコード10として格納
```

**エスケープシーケンス対応：**
- `'\n'` : 改行（10）
- `'\t'` : タブ（9）  
- `'\\'` : バックスラッシュ（92）
- `'\''` : 単一引用符（39）

### 2.5. 演算子とデリミタ

#### 2.5.1. 演算子の字句解析
演算子は長い記号から優先的にマッチします：

```zpp
a == b   // "==" として認識（"=" + "=" ではない）
a <<= b  // "<<=" として認識
```

#### 2.5.2. 複合演算子の認識
字句解析器は以下の順序で演算子を認識します：
1. 3文字演算子：`<<=`, `>>=`
2. 2文字演算子：`==`, `!=`, `<=`, `>=`, `&&`, `||`, `<<`, `>>`, `+=`, `-=`, `++`, `--`
3. 1文字演算子：`+`, `-`, `*`, `/`, `%`, `&`, `|`, `^`, `~`, `<`, `>`, `=`, `!`

---

## 3章 データ型、変数、定数 (Data Types, Variables, and Constants)

### 3.1. メモリレイアウトとアセンブリ変換の詳細

Z++の型システムは、8ビットCPUアーキテクチャと256バイトRAM制約に最適化されています。すべてのデータ型は、メモリ効率とCPU命令との親和性を重視して設計されています。

#### 3.1.1. メモリマップの構造

**RAMメモリレイアウト (256バイト)：**
```
アドレス    用途                    サイズ
0x00-0x0F  システム予約領域         16バイト
0x10-0x1F  グローバル変数領域       16バイト
0x20-0x7F  ローカル変数プール       96バイト
0x80-0xDF  動的スタック領域         96バイト
0xE0-0xEF  一時計算用バッファ       16バイト
0xF0-0xFF  システムバッファ         16バイト
```

### 3.2. 基本データ型とその実装詳細

#### 3.2.1. uint8型 - 8ビット符号なし整数

**メモリ占有量：** 1バイト  
**値の範囲：** 0 ～ 255  
**アライメント：** 1バイト境界

```zpp
uint8 sensor_value;
uint8 brightness = 128;
```

**アセンブリレベルでの操作：**
```asm
; uint8 a = 10, b = 20;
LDI r1, 10        ; a = 10
MST r1, ap0, 0    ; aを変数領域に格納
LDI r2, 20        ; b = 20  
MST r2, ap0, 1    ; bを変数領域に格納

; uint8 sum = a + b;
MLD r3, ap0, 0    ; aをr3にロード
MLD r4, ap0, 1    ; bをr4にロード
ADD r3, r4, r5    ; sum = a + b
MST r5, ap0, 2    ; sumを格納
```

**算術演算の実装詳細：**
- **加算・減算**：単一のADD/SUB命令で実装
- **乗算**：MUL命令（下位8ビット）とMUH命令（上位8ビット）を使い分け
- **除算**：DIV命令（商）とMOD命令（余り）
- **オーバーフロー**：8ビット境界でのラップアラウンド

#### 3.2.2. bool型 - 論理値型

**メモリ占有量：** 1バイト（uint8と同じ）  
**値の範囲：** true (1) または false (0)  
**特別な最適化：** 論理演算での分岐最適化

```zpp
bool is_ready = true;
bool has_error = false;
```

**内部表現とアセンブリ変換：**
```zpp
bool condition = (sensor_value > 100);
```
↓コンパイル↓
```asm
MLD r1, ap0, sensor_value_addr  ; sensor_valueをロード
LDI r2, 100                     ; 比較値100をロード
SUB r1, r2, r3                  ; 差分を計算
BRH NC, set_true               ; キャリーなし（>=）なら分岐
LDI r4, 0                      ; false (0) をセット
JMP store_result
set_true:
LDI r4, 1                      ; true (1) をセット
store_result:
MST r4, ap0, condition_addr    ; 結果を格納
```

**論理演算の最適化：**
```zpp
if (flag1 && flag2) { ... }
```
↓短絡評価による最適化↓
```asm
MLD r1, ap0, flag1_addr    ; flag1をロード
LDI r2, 0
SUB r1, r2, r3            ; flag1 == 0 をチェック
BRH Z, skip_block         ; flag1がfalseなら即座にスキップ
MLD r1, ap0, flag2_addr   ; flag2をロード（flag1がtrueの場合のみ実行）
SUB r1, r2, r3           
BRH Z, skip_block         ; flag2もチェック
; 両方がtrueの場合の処理
skip_block:
```

#### 3.2.3. 配列型の詳細実装

**配列のメモリ配置：**
```zpp
uint8 data[8] = {1, 2, 3, 4, 5, 6, 7, 8};
```

**メモリ上での配置：**
```
アドレス  値   説明
0x20     0x01  data[0]
0x21     0x02  data[1]  
0x22     0x03  data[2]
0x23     0x04  data[3]
0x24     0x05  data[4]
0x25     0x06  data[5]
0x26     0x07  data[6]
0x27     0x08  data[7]
```

**配列アクセスのアセンブリ変換：**
```zpp
uint8 value = data[3];
```
↓コンパイル↓
```asm
LDI r1, 3              ; インデックス3
APD r1, ap0, ap1       ; ベースアドレス + オフセット → ap1
MLD r2, ap1, 0         ; data[3]をr2にロード
MST r2, ap0, value_addr ; valueに格納
```

### 3.3. const定数のアセンブリ変換詳細

const定数は、コンパイル時に`.define`ディレクティブに展開され、ROM領域の使用量を削減しつつ実行時性能を向上させます。

#### 3.3.1. .defineディレクティブへの展開過程

**Z++コード：**
```zpp
const uint8 LED_PIN = 3;
const uint8 MAX_SENSORS = 8; 
const uint8 TIMEOUT_MS = 100;

void setup() {
    Output(LED_PIN, 255);
    for (uint8 i = 0; i < MAX_SENSORS; i++) {
        // センサー初期化
    }
}
```

**生成されるアセンブリ（.defineディレクティブ）：**
```asm
.define LED_PIN = 3
.define MAX_SENSORS = 8
.define TIMEOUT_MS = 100

; void setup() の実装
setup:
    ; Output(LED_PIN, 255); → Output(3, 255);
    LDI r1, 255           ; 出力値255をr1にロード
    LDI r2, LED_PIN       ; ポート番号（3）をr2にロード → LDI r2, 3
    APD r2, r0, ap2       ; ポートアドレス設定
    PST r1, ap2, 0        ; ポートに出力
    
    ; for (uint8 i = 0; i < MAX_SENSORS; i++)
    LDI r3, 0             ; i = 0で初期化
loop_start:
    LDI r4, MAX_SENSORS   ; 比較値（8）をr4にロード → LDI r4, 8
    SUB r3, r4, r5        ; i - MAX_SENSORS
    BRH NC, loop_end      ; i >= MAX_SENSORS なら終了
    ; ループ本体の処理
    ADI r3, 1             ; i++
    JMP loop_start
loop_end:
    RET
```

#### 3.3.2. ROM配置とRAM節約の仕組み

**ROM使用量の比較：**

*通常の変数の場合：*
```zpp
uint8 LED_PIN = 3;  // RAM使用量: 1バイト, 初期化コード必要
```
```asm
; 初期化コードが必要（ROM使用量増加）
LDI r1, 3
MST r1, ap0, LED_PIN_addr

; 使用時
MLD r1, ap0, LED_PIN_addr  ; RAMからロード（余計な命令）
```

*const定数の場合：*
```zpp
const uint8 LED_PIN = 3;  // RAM使用量: 0バイト
```
```asm
; 初期化コード不要
; 使用時
LDI r1, 3  ; 直接即値として埋め込み（効率的）
```

**メモリ効率の具体例：**
```zpp
// 10個のconst定数を使用する場合
const uint8 CONSTANTS[10] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// 通常の変数なら: RAM使用量 10バイト + 初期化コード 30バイト（ROM）
// const定数なら:  RAM使用量  0バイト + 初期化コード  0バイト（ROM）
```

#### 3.3.3. シンボル置換の具体例

**段階的な変換プロセス：**

*ステップ1: Z++ソースコード*
```zpp
const uint8 SENSOR_PORT = 2;
const uint8 LED_BRIGHT = 200;

uint8 read_sensor() {
    uint8 value;
    Input(SENSOR_PORT, value);
    Output(SENSOR_PORT + 1, LED_BRIGHT);
    return value;
}
```

*ステップ2: シンボル展開後*
```zpp
// const定数がリテラル値に置換される
uint8 read_sensor() {
    uint8 value;
    Input(2, value);              // SENSOR_PORT → 2
    Output(2 + 1, 200);          // SENSOR_PORT + 1 → 3, LED_BRIGHT → 200
    return value;
}
```

*ステップ3: 式評価後*
```zpp
uint8 read_sensor() {
    uint8 value;
    Input(2, value);
    Output(3, 200);              // 2 + 1 → 3 (コンパイル時計算)
    return value;
}
```

*ステップ4: 最終アセンブリ*
```asm
.define SENSOR_PORT = 2
.define LED_BRIGHT = 200

read_sensor:
    ; Input(2, value);
    LDI r2, 2                ; ポート番号2
    APD r2, r0, ap2         ; ポートアドレス設定  
    PLD r3, ap2, 0          ; ポートから入力
    MST r3, ap1, 0          ; valueに格納
    
    ; Output(3, 200);
    LDI r1, 200             ; 出力値200
    LDI r2, 3               ; ポート番号3（コンパイル時に計算済み）
    APD r2, r0, ap2         ; ポートアドレス設定
    PST r1, ap2, 0          ; ポートに出力
    
    ; return value;
    MLD r15, ap1, 0         ; 戻り値をr15に設定
    RET
```

### 3.4. 列挙型 (enum) - 型安全な定数グループ

enumは、関連する定数をグループ化し、型安全性を提供する強力な機能です。v3.0では、より厳密な型変換規則とゼロコスト抽象化を実現しています。

#### 3.4.1. enum型の型安全性の背景と意図

**設計目標：**
1. **コンパイル時エラー検出**：無効な値の代入をコンパイル時に防ぐ
2. **コード可読性の向上**：マジックナンバーの排除
3. **メモリ効率**：実行時オーバーヘッドなし

**型安全性の実装例：**
```zpp
enum DeviceState {
    IDLE = 0,
    RUNNING = 1,
    ERROR = 2
};

enum SensorType {
    TEMPERATURE = 0,
    HUMIDITY = 1,
    PRESSURE = 2  
};

void process_device(DeviceState state) {
    // 正しい使用法
    if (state == DeviceState::RUNNING) { ... }
    
    // 以下はコンパイルエラー（型安全性の保証）
    // if (state == SensorType::TEMPERATURE) { ... }  // 異なるenum型同士の比較
    // if (state == 1) { ... }                        // uint8との直接比較
}
```

#### 3.4.2. uint8 ↔ enum変換規則の詳細表

| 変換の方向 | 記述例 | 許可/エラー | アセンブリへの影響 | 型安全性レベル |
|------------|--------|-----------|--------------------|---------------|
| `enum` → `uint8` (暗黙的) | `uint8 i = DeviceState::RUNNING;` | **許可** | ゼロコスト（値そのまま） | **高**（常に安全） |
| `uint8` → `enum` (暗黙的) | `DeviceState s = 1;` | **エラー** | - | **最高**（不正値を完全排除） |
| `uint8` → `enum` (明示的キャスト) | `DeviceState s = (DeviceState)1;` | **許可** | ゼロコスト（値そのまま） | **中**（プログラマの責任） |
| `enum` → `enum` (異なる型) | `DeviceState s = SensorType::TEMPERATURE;` | **エラー** | - | **最高**（型混合を防止） |
| `enum` → `enum` (キャスト) | `DeviceState s = (DeviceState)SensorType::TEMPERATURE;` | **許可** | ゼロコスト | **低**（要注意） |

#### 3.4.3. 暗黙的/明示的変換の仕組み

**コンパイラの型チェック処理：**

```zpp
enum LedState { OFF = 0, ON = 1 };

void test_conversions() {
    LedState led = LedState::ON;
    
    // Case 1: enum → uint8 (暗黙的変換)
    uint8 value1 = led;  // OK: 常に安全
    
    // Case 2: uint8 → enum (暗黙的変換)
    uint8 raw_value = 1;
    LedState led2 = raw_value;  // コンパイルエラー
    
    // Case 3: uint8 → enum (明示的キャスト)
    LedState led3 = (LedState)raw_value;  // OK: プログラマの責任
}
```

**型チェックアルゴリズム（コンパイラ内部）：**
```
1. 代入文の解析: target_type = source_expression
2. source_expressionの型推論
3. 変換の可否判定:
   - 同一型？ → OK
   - enum → uint8？ → OK（暗黙的変換）
   - uint8 → enum？ → ERROR（明示的キャストが必要）
   - 異なるenum型？ → ERROR
4. アセンブリコード生成（変換が必要な場合）
```

#### 3.4.4. ゼロコスト抽象化の実現方法

enum型は**コンパイル時にのみ存在**し、実行時には通常のuint8値として扱われます：

**Z++コード：**
```zpp
enum Priority { LOW = 1, MEDIUM = 5, HIGH = 10 };

Priority task_priority = Priority::HIGH;
if (task_priority == Priority::MEDIUM) {
    // 中優先度タスクの処理
}
uint8 numeric_priority = task_priority;
```

**生成されるアセンブリ：**
```asm
; Priority task_priority = Priority::HIGH;
LDI r1, 10              ; HIGH = 10 を直接ロード
MST r1, ap0, task_priority_addr

; if (task_priority == Priority::MEDIUM)
MLD r2, ap0, task_priority_addr    ; task_priorityをロード
LDI r3, 5                          ; MEDIUM = 5
SUB r2, r3, r4                     ; 差分計算  
BRH NZ, skip_medium_task          ; 等しくないならスキップ
; 中優先度タスクの処理
skip_medium_task:

; uint8 numeric_priority = task_priority;
MLD r5, ap0, task_priority_addr    ; そのままコピー
MST r5, ap0, numeric_priority_addr ; 型変換なし（ゼロコスト）
```

**重要な特徴：**
1. **型情報の消失**：実行時にはenum型とuint8型の区別なし
2. **値の保持**：enum値は対応するuint8値と完全に同一
3. **最適化の効果**：分岐やループでの効率的なコード生成

---

## 4章 式と演算子 (Expressions and Operators)

### 4.1. CPU命令との対応とアセンブリ変換の詳細

Z++の演算子は、8ビットCPUの命令セットと直接対応するよう設計されています。これにより、高級言語の表現力を保ちつつ、効率的なアセンブリコードの生成を実現しています。

### 4.2. 算術演算子とCPU命令マッピング

#### 4.2.1. 基本算術演算

| 演算子 | 説明 | CPU命令対応 | 備考 |
|--------|------|-------------|------|
| `+` | 加算 | ADD | オーバーフローでラップアラウンド |
| `-` | 減算 | SUB | |
| `*` | 乗算（下位） | MUL | 8×8ビット結果の下位8ビット |
| `**` | 乗算（上位） | MUH | 8×8ビット結果の上位8ビット |
| `/` | 除算 | DIV | 商（整数部） |
| `%` | 剰余 | MOD | 余り |

#### 4.2.2. 算術演算のアセンブリ生成詳細

**基本的な二項演算：**
```zpp
uint8 a = 15, b = 7;
uint8 sum = a + b;
uint8 diff = a - b;
uint8 product_low = a * b;
uint8 product_high = a ** b;
uint8 quotient = a / b;
uint8 remainder = a % b;
```

**生成されるアセンブリコード：**
```asm
; 変数の初期化
LDI r1, 15            ; a = 15
MST r1, ap0, 0        ; aを格納
LDI r2, 7             ; b = 7
MST r2, ap0, 1        ; bを格納

; sum = a + b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
ADD r3, r4, r5        ; a + b → r5
MST r5, ap0, 2        ; sumを格納

; diff = a - b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
SUB r3, r4, r5        ; a - b → r5
MST r5, ap0, 3        ; diffを格納

; product_low = a * b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
MUL r3, r4, r5        ; (a * b) & 0xFF → r5
MST r5, ap0, 4        ; product_lowを格納

; product_high = a ** b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
MUH r3, r4, r5        ; (a * b) >> 8 → r5
MST r5, ap0, 5        ; product_highを格納

; quotient = a / b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
DIV r3, r4, r5        ; a / b → r5
MST r5, ap0, 6        ; quotientを格納

; remainder = a % b
MLD r3, ap0, 0        ; aをロード
MLD r4, ap0, 1        ; bをロード
MOD r3, r4, r5        ; a % b → r5
MST r5, ap0, 7        ; remainderを格納
```

#### 4.2.3. 複合代入演算子の最適化

```zpp
uint8 counter = 100;
counter += 5;  // counter = counter + 5;
counter *= 2;  // counter = counter * 2;
```

**最適化されたアセンブリ（直接操作）：**
```asm
; uint8 counter = 100;
LDI r1, 100
MST r1, ap0, counter_addr

; counter += 5; (最適化：RAMから一度だけロード)
MLD r1, ap0, counter_addr    ; counterをロード
ADI r1, 5                    ; counter + 5（即値加算命令）
MST r1, ap0, counter_addr    ; 結果を格納

; counter *= 2; (最適化：直接操作)
MLD r1, ap0, counter_addr    ; counterをロード
LDI r2, 2                    ; 乗数2
MUL r1, r2, r1              ; counter * 2 → r1（同じレジスタに結果）
MST r1, ap0, counter_addr    ; 結果を格納
```

#### 4.2.4. インクリメント・デクリメント演算子

```zpp
uint8 i = 10;
uint8 a = ++i;  // 前置インクリメント：iを増加してからaに代入
uint8 b = i++;  // 後置インクリメント：iをbに代入してから増加
```

**前置インクリメントのアセンブリ：**
```asm
; uint8 a = ++i;
MLD r1, ap0, i_addr         ; iをロード
ADI r1, 1                   ; i + 1
MST r1, ap0, i_addr         ; iに格納（更新）
MST r1, ap0, a_addr         ; aに格納（同じ値）
```

**後置インクリメントのアセンブリ：**
```asm
; uint8 b = i++;
MLD r1, ap0, i_addr         ; iをロード
MST r1, ap0, b_addr         ; 元の値をbに格納
ADI r1, 1                   ; i + 1
MST r1, ap0, i_addr         ; iに格納（更新）
```

### 4.3. ビット単位演算子の実装

#### 4.3.1. ビット演算のCPU命令対応

| 演算子 | 説明 | CPU命令対応 | 実装の詳細 |
|--------|------|-------------|------------|
| `&` | ビットAND | AND | 直接対応 |
| `\|` | ビットOR | 複合実装 | AND + XOR + NORで実装 |
| `^` | ビットXOR | XOR | 直接対応 |
| `~` | ビットNOT | NOR | `r0`（ゼロ）との論理和否定 |
| `<<` | 左シフト | LSH | 論理左シフト |
| `>>` | 右シフト | RSH | 論理右シフト |

#### 4.3.2. ビットOR演算の複合実装

CPUにはOR命令がないため、以下の論理的等価性を利用：
**`A | B = ~(~A & ~B)`** (ド・モルガンの法則)

```zpp
uint8 result = a | b;
```

**アセンブリ実装：**
```asm
; result = a | b の実装
MLD r1, ap0, a_addr         ; aをロード
MLD r2, ap0, b_addr         ; bをロード

; ~A を計算
NOR r1, r0, r3              ; ~a → r3

; ~B を計算  
NOR r2, r0, r4              ; ~b → r4

; ~A & ~B を計算
AND r3, r4, r5              ; (~a) & (~b) → r5

; ~(~A & ~B) = A | B を計算
NOR r5, r0, r6              ; ~((~a) & (~b)) → r6 = a | b

MST r6, ap0, result_addr    ; 結果を格納
```

#### 4.3.3. シフト演算の詳細実装

**左シフト（2倍化）：**
```zpp
uint8 doubled = value << 1;
```
```asm
MLD r1, ap0, value_addr     ; valueをロード
LDI r2, 1                   ; シフト量1
LSH r1, r2, r3              ; value << 1 → r3
MST r3, ap0, doubled_addr   ; 結果を格納
```

**右シフト（半分化）：**
```zpp
uint8 halved = value >> 1;
```
```asm
MLD r1, ap0, value_addr     ; valueをロード
LDI r2, 1                   ; シフト量1
RSH r1, r2, r3              ; value >> 1 → r3
MST r3, ap0, halved_addr    ; 結果を格納
```

### 4.4. 比較演算子の実装詳細

#### 4.4.1. 比較演算のアセンブリ変換

| 演算子 | 説明 | 実装方法 | 条件コード |
|--------|------|----------|------------|
| `==` | 等しい | SUB + Z判定 | Z (Zero) |
| `!=` | 等しくない | SUB + NZ判定 | NZ (Not Zero) |
| `<` | 小なり | SUB + C判定 | C (Carry) |
| `>=` | 大なりイコール | SUB + NC判定 | NC (Not Carry) |
| `>` | 大なり | 複合実装 | !(a <= b) |
| `<=` | 小なりイコール | 複合実装 | (a < b) \|\| (a == b) |

#### 4.4.2. 比較演算の具体的実装

**等価比較（==）：**
```zpp
bool is_equal = (a == b);
```
```asm
MLD r1, ap0, a_addr         ; aをロード
MLD r2, ap0, b_addr         ; bをロード
SUB r1, r2, r3              ; a - b → r3
BRH Z, set_true             ; ゼロ（等しい）なら分岐
LDI r4, 0                   ; false
JMP store_result
set_true:
LDI r4, 1                   ; true
store_result:
MST r4, ap0, is_equal_addr  ; 結果を格納
```

**大なり比較（>）の複合実装：**
```zpp
bool is_greater = (a > b);
```
```asm
; a > b は !(a <= b) として実装
MLD r1, ap0, a_addr         ; aをロード
MLD r2, ap0, b_addr         ; bをロード

; a < b をチェック
SUB r1, r2, r3              ; a - b
BRH C, set_false           ; キャリー（a < b）なら false

; a == b をチェック
SUB r1, r2, r3              ; a - b
BRH Z, set_false           ; ゼロ（a == b）なら false

; a > b が成立
LDI r4, 1                   ; true
JMP store_result

set_false:
LDI r4, 0                   ; false

store_result:
MST r4, ap0, is_greater_addr ; 結果を格納
```

### 4.5. 論理演算子と短絡評価

#### 4.5.1. 短絡評価の実装

**論理AND（&&）：**
```zpp
bool result = condition1 && condition2;
```
```asm
; 短絡評価実装
MLD r1, ap0, condition1_addr ; condition1をロード
LDI r2, 0
SUB r1, r2, r3              ; condition1 == 0 をチェック
BRH Z, set_false           ; condition1がfalseなら即座にfalse

; condition1がtrueの場合のみcondition2を評価
MLD r1, ap0, condition2_addr ; condition2をロード
SUB r1, r2, r3              ; condition2 == 0 をチェック
BRH Z, set_false           ; condition2もfalseならfalse

; 両方がtrueの場合
LDI r4, 1                   ; true
JMP store_result

set_false:
LDI r4, 0                   ; false

store_result:
MST r4, ap0, result_addr    ; 結果を格納
```

**論理OR（||）：**
```zpp
bool result = condition1 || condition2;
```
```asm
; 短絡評価実装
MLD r1, ap0, condition1_addr ; condition1をロード
LDI r2, 0
SUB r1, r2, r3              ; condition1 == 0 をチェック
BRH NZ, set_true           ; condition1がtrueなら即座にtrue

; condition1がfalseの場合のみcondition2を評価
MLD r1, ap0, condition2_addr ; condition2をロード
SUB r1, r2, r3              ; condition2 == 0 をチェック
BRH NZ, set_true           ; condition2がtrueならtrue

; 両方がfalseの場合
LDI r4, 0                   ; false
JMP store_result

set_true:
LDI r4, 1                   ; true

store_result:
MST r4, ap0, result_addr    ; 結果を格納
```

---

## 5章 演算子の優先順位

### 5.1. 優先順位表とパーサー実装の対応

Z++の演算子優先順位は、パーサーの実装と直接対応しており、予測可能な評価順序を保証します。

| 優先順位 | 演算子 | 結合方向 | 説明 | パーサーの実装レベル |
|----------|--------|----------|------|---------------------|
| 1 (最高) | `()`, `[]`, `.`, `->` | 左→右 | 関数呼び出し、配列添字、メンバアクセス | primary_expression |
| 2 | `++`, `--` (後置) | 左→右 | 後置インクリメント・デクリメント | postfix_expression |
| 3 | `**` | 左→右 | 乗算（上位） | multiplicative_expression |
| 4 | `++`, `--`, `~`, `&`, `sizeof` (単項) | **右→左** | 単項演算子 | unary_expression |
| 5 | `*`, `/`, `%` | 左→右 | 乗除算 | multiplicative_expression |
| 6 | `+`, `-` | 左→右 | 加減算 | additive_expression |
| 7 | `<<`, `>>` | 左→右 | ビットシフト | shift_expression |
| 8 | `<`, `>`, `<=`, `>=` | 左→右 | 関係演算子 | relational_expression |
| 9 | `==`, `!=` | 左→右 | 等価演算子 | equality_expression |
| 10 | `&` | 左→右 | ビットAND | and_expression |
| 11 | `^` | 左→右 | ビットXOR | exclusive_or_expression |
| 12 | `\|` | 左→右 | ビットOR | inclusive_or_expression |
| 13 | `&&` | 左→右 | 論理AND | logical_and_expression |
| 14 | `\|\|` | 左→右 | 論理OR | logical_or_expression |
| 15 (最低) | `=`, `+=`, `-=`, `*=`, `**=`, `/=`, `%=`, `&=`, `\|=`, `^=`, `<<=`, `>>=` | **右→左** | 代入演算子 | assignment_expression |

### 5.2. パーサーの再帰下降実装

Z++コンパイラは、演算子優先順位を再帰下降パーサーで実装します：

#### 5.2.1. 式解析の階層構造

```cpp
// パーサーの内部実装（概念的なC++コード）
class Parser {
public:
    Expression* assignment_expression() {
        Expression* left = logical_or_expression();
        if (current_token.type == ASSIGN_OP) {
            Token op = consume_token();
            Expression* right = assignment_expression(); // 右結合
            return new AssignmentExpression(left, op, right);
        }
        return left;
    }
    
    Expression* logical_or_expression() {
        Expression* left = logical_and_expression();
        while (current_token.type == LOGICAL_OR) {
            Token op = consume_token();
            Expression* right = logical_and_expression();
            left = new BinaryExpression(left, op, right); // 左結合
        }
        return left;
    }
    
    Expression* logical_and_expression() {
        Expression* left = inclusive_or_expression();
        while (current_token.type == LOGICAL_AND) {
            Token op = consume_token();
            Expression* right = inclusive_or_expression();
            left = new BinaryExpression(left, op, right);
        }
        return left;
    }
    
    // 他の優先順位レベルも同様に実装...
};
```

#### 5.2.2. 優先順位による評価順序の実例

**複雑な式の解析例：**
```zpp
uint8 result = a + b * c >> 1 & 0x0F;
```

**パーサーによる解析ツリー：**
```
assignment_expression
├─ result (識別子)
└─ additive_expression
   ├─ a (識別子)
   └─ shift_expression
      ├─ multiplicative_expression
      │  ├─ b (識別子)
      │  └─ c (識別子)
      └─ and_expression
         ├─ 1 (リテラル)
         └─ 0x0F (リテラル)
```

**評価順序：**
1. `b * c` (乗算、優先順位5)
2. `a + (b * c)` (加算、優先順位6)
3. `(a + b * c) >> 1` (右シフト、優先順位7)
4. `((a + b * c) >> 1) & 0x0F` (ビットAND、優先順位10)
5. `result = ...` (代入、優先順位15)

**生成されるアセンブリコード：**
```asm
; b * c
MLD r1, ap0, b_addr
MLD r2, ap0, c_addr
MUL r1, r2, r3              ; b * c → r3

; a + (b * c)
MLD r4, ap0, a_addr
ADD r4, r3, r5              ; a + (b * c) → r5

; (a + b * c) >> 1
LDI r6, 1
RSH r5, r6, r7              ; (a + b * c) >> 1 → r7

; ((a + b * c) >> 1) & 0x0F
LDI r8, 0x0F
AND r7, r8, r9              ; ((a + b * c) >> 1) & 0x0F → r9

; result = ...
MST r9, ap0, result_addr    ; 結果を格納
```

### 5.3. 結合性の実装詳細

#### 5.3.1. 左結合（Left Associative）

大多数の演算子は左結合です：
```zpp
uint8 result = a - b - c;  // (a - b) - c として解釈
```

#### 5.3.2. 右結合（Right Associative）

代入演算子と単項演算子は右結合です：
```zpp
uint8 a, b, c;
a = b = c = 100;  // a = (b = (c = 100)) として解釈
```

**右結合の実装：**
```asm
; c = 100
LDI r1, 100
MST r1, ap0, c_addr

; b = c (= 100)
MST r1, ap0, b_addr         ; 同じ値を使用

; a = b (= 100)  
MST r1, ap0, a_addr         ; 同じ値を使用
```

---

## 6章 文と制御構造 (Statements and Control Structures)

### 6.1. アセンブリ生成の詳細とCPU命令との対応

Z++の制御構造は、8ビットCPUの分岐命令を効率的に活用するよう設計されています。すべての制御フローは、予測可能なアセンブリコードに変換され、実行時間の見積もりが可能です。

### 6.2. 条件分岐の実装詳細

#### 6.2.1. if文の基本構造

```zpp
if (condition) {
    // 条件が真の場合の処理
    statement1;
    statement2;
}
```

**アセンブリ生成パターン：**
```asm
; conditionの評価
MLD r1, ap0, condition_addr
LDI r2, 0
SUB r1, r2, r3              ; condition - 0
BRH Z, skip_if_block       ; conditionが0（false）ならスキップ

; if文の本体
; statement1のコード
; statement2のコード

skip_if_block:
; 後続の処理
```

#### 6.2.2. if-else文の最適化実装

```zpp
if (sensor_value > 100) {
    Output(LED_PORT, 255);    // LED点灯
} else {
    Output(LED_PORT, 0);      // LED消灯
}
```

**最適化されたアセンブリ：**
```asm
; sensor_value > 100 の評価
MLD r1, ap0, sensor_value_addr
LDI r2, 100
SUB r1, r2, r3              ; sensor_value - 100
BRH C, else_block          ; sensor_value < 100 なら else へ
BRH Z, else_block          ; sensor_value == 100 なら else へ

; if文の本体（sensor_value > 100）
LDI r1, 255                 ; LED点灯値
LDI r2, LED_PORT
APD r2, r0, ap2
PST r1, ap2, 0
JMP end_if

else_block:
; else文の本体
LDI r1, 0                   ; LED消灯値
LDI r2, LED_PORT
APD r2, r0, ap2
PST r1, ap2, 0

end_if:
; 後続の処理
```

#### 6.2.3. if-else if-else チェーンの実装

```zpp
if (temperature > 80) {
    fan_speed = 255;          // 最高速
} else if (temperature > 60) {
    fan_speed = 128;          // 中速
} else if (temperature > 40) {
    fan_speed = 64;           // 低速
} else {
    fan_speed = 0;            // 停止
}
```

**効率的なアセンブリ生成：**
```asm
; temperature > 80 のチェック
MLD r1, ap0, temperature_addr
LDI r2, 80
SUB r1, r2, r3
BRH C, check_60            ; temperature <= 80 なら次へ
BRH Z, check_60            ; temperature == 80 なら次へ

; 最高速設定
LDI r4, 255
JMP store_fan_speed

check_60:
; temperature > 60 のチェック
MLD r1, ap0, temperature_addr
LDI r2, 60
SUB r1, r2, r3
BRH C, check_40            ; temperature <= 60 なら次へ
BRH Z, check_40            ; temperature == 60 なら次へ

; 中速設定
LDI r4, 128
JMP store_fan_speed

check_40:
; temperature > 40 のチェック
MLD r1, ap0, temperature_addr
LDI r2, 40
SUB r1, r2, r3
BRH C, set_stop            ; temperature <= 40 なら停止へ
BRH Z, set_stop            ; temperature == 40 なら停止へ

; 低速設定
LDI r4, 64
JMP store_fan_speed

set_stop:
; 停止設定
LDI r4, 0

store_fan_speed:
MST r4, ap0, fan_speed_addr
```

### 6.3. ループ構造の実装詳細

#### 6.3.1. while文の実装

```zpp
while (counter < 10) {
    Output(LED_PORT, counter);
    counter++;
}
```

**アセンブリ生成：**
```asm
loop_start:
; counter < 10 の条件チェック
MLD r1, ap0, counter_addr
LDI r2, 10
SUB r1, r2, r3
BRH NC, loop_end           ; counter >= 10 なら終了

; ループ本体
; Output(LED_PORT, counter)
MLD r1, ap0, counter_addr   ; counterをロード
LDI r2, LED_PORT
APD r2, r0, ap2
PST r1, ap2, 0

; counter++
MLD r1, ap0, counter_addr
ADI r1, 1
MST r1, ap0, counter_addr

JMP loop_start             ; ループの先頭に戻る

loop_end:
; 後続の処理
```

#### 6.3.2. for文の最適化実装

```zpp
for (uint8 i = 0; i < 8; i++) {
    data[i] = i * 10;
}
```

**最適化されたアセンブリ（レジスタ最適化）：**
```asm
; for文の初期化: i = 0
LDI r1, 0                   ; i をr1に保持（メモリアクセス削減）

for_loop:
; i < 8 の条件チェック
LDI r2, 8
SUB r1, r2, r3
BRH NC, for_end            ; i >= 8 なら終了

; data[i] = i * 10 の計算
LDI r2, 10
MUL r1, r2, r4             ; i * 10 → r4

; data[i] への格納
APD r1, ap0, ap1           ; data配列のベースアドレス + i → ap1
MST r4, ap1, 0             ; data[i] = i * 10

; i++ (レジスタ内で直接インクリメント)
ADI r1, 1

JMP for_loop

for_end:
; iをメモリに書き戻し（必要な場合のみ）
MST r1, ap0, i_addr
```

#### 6.3.3. do-while文の実装

```zpp
do {
    Input(SENSOR_PORT, sensor_value);
    process_data();
} while (sensor_value != 0);
```

**アセンブリ生成：**
```asm
do_loop_start:
; ループ本体（最低1回は実行される）
; Input(SENSOR_PORT, sensor_value)
LDI r2, SENSOR_PORT
APD r2, r0, ap2
PLD r3, ap2, 0
MST r3, ap0, sensor_value_addr

; process_data()の呼び出し
CAL process_data

; while (sensor_value != 0) の条件チェック
MLD r1, ap0, sensor_value_addr
LDI r2, 0
SUB r1, r2, r3
BRH NZ, do_loop_start      ; sensor_value != 0 なら継続

; ループ終了
```

### 6.4. switch文のジャンプテーブル最適化

#### 6.4.1. 基本的なswitch文

```zpp
switch (device_state) {
    case IDLE:
        led_brightness = 0;
        break;
    case RUNNING:
        led_brightness = 128;
        break;
    case ERROR:
        led_brightness = 255;
        break;
    default:
        led_brightness = 64;
}
```

**ジャンプテーブル実装：**
```asm
; switch式の評価
MLD r1, ap0, device_state_addr

; 範囲チェック（0 <= device_state <= 2）
LDI r2, 3
SUB r1, r2, r3
BRH NC, switch_default     ; device_state >= 3 ならdefault

; ジャンプテーブルのアドレス計算
; jump_table_base + (device_state * 2) (16ビットアドレスのため)
LDI r2, 2
MUL r1, r2, r3             ; device_state * 2
APD r3, ap_jump_table, ap1 ; ジャンプテーブルエントリのアドレス
MLD r4, ap1, 0             ; ジャンプ先アドレス（下位）
MLD r5, ap1, 1             ; ジャンプ先アドレス（上位）
; ジャンプ先アドレスに分岐（実装依存）

; ジャンプテーブル（ROM内のデータ）
jump_table_base:
.word case_idle           ; IDLE = 0 のジャンプ先
.word case_running        ; RUNNING = 1 のジャンプ先  
.word case_error          ; ERROR = 2 のジャンプ先

case_idle:
LDI r1, 0                  ; led_brightness = 0
JMP switch_end

case_running:
LDI r1, 128                ; led_brightness = 128
JMP switch_end

case_error:
LDI r1, 255                ; led_brightness = 255
JMP switch_end

switch_default:
LDI r1, 64                 ; led_brightness = 64

switch_end:
MST r1, ap0, led_brightness_addr
```

#### 6.4.2. 連続しないcase値の最適化

```zpp
switch (error_code) {
    case 10:
        handle_timeout();
        break;
    case 20:
        handle_overflow();
        break;
    case 30:
        handle_underflow();
        break;
    default:
        handle_unknown_error();
}
```

**線形探索実装（ジャンプテーブル不適用）：**
```asm
MLD r1, ap0, error_code_addr

; case 10 のチェック
LDI r2, 10
SUB r1, r2, r3
BRH Z, case_10

; case 20 のチェック
LDI r2, 20
SUB r1, r2, r3
BRH Z, case_20

; case 30 のチェック
LDI r2, 30
SUB r1, r2, r3
BRH Z, case_30

; default case
JMP switch_default

case_10:
CAL handle_timeout
JMP switch_end

case_20:
CAL handle_overflow
JMP switch_end

case_30:
CAL handle_underflow
JMP switch_end

switch_default:
CAL handle_unknown_error

switch_end:
; 後続の処理
```

### 6.5. break文とcontinue文の実装詳細

#### 6.5.1. break文の実装

```zpp
for (uint8 i = 0; i < 100; i++) {
    if (data[i] == target) {
        found_index = i;
        break;  // ループから抜ける
    }
    process_data(data[i]);
}
```

**アセンブリ生成：**
```asm
LDI r1, 0                   ; i = 0

for_loop:
LDI r2, 100
SUB r1, r2, r3
BRH NC, for_end            ; i >= 100 なら終了

; data[i] をロード
APD r1, ap0, ap1           ; data + i のアドレス
MLD r4, ap1, 0             ; data[i] をロード

; if (data[i] == target) のチェック
MLD r5, ap0, target_addr
SUB r4, r5, r6
BRH NZ, continue_processing ; data[i] != target なら処理続行

; found_index = i (breakの前の処理)
MST r1, ap0, found_index_addr
JMP for_end                ; break: ループから脱出

continue_processing:
; process_data(data[i]) の呼び出し
MOV r4, r1                 ; data[i]を引数レジスタに
CAL process_data

; i++
ADI r1, 1
JMP for_loop

for_end:
MST r1, ap0, i_addr        ; 必要に応じてiを保存
```

#### 6.5.2. continue文の実装

```zpp
for (uint8 i = 0; i < 10; i++) {
    if (data[i] == 0) {
        continue;  // 次のイテレーションに進む
    }
    Output(LED_PORT, data[i]);
}
```

**アセンブリ生成：**
```asm
LDI r1, 0                   ; i = 0

for_loop:
LDI r2, 10
SUB r1, r2, r3
BRH NC, for_end            ; i >= 10 なら終了

; data[i] をロード
APD r1, ap0, ap1
MLD r4, ap1, 0             ; data[i] をロード

; if (data[i] == 0) のチェック
LDI r5, 0
SUB r4, r5, r6
BRH Z, continue_iteration  ; data[i] == 0 なら continue

; Output(LED_PORT, data[i])
MOV r4, r1                 ; data[i]を出力値に
LDI r2, LED_PORT
APD r2, r0, ap2
PST r1, ap2, 0

continue_iteration:
; i++ (continueの着地点)
ADI r1, 1
JMP for_loop

for_end:
; ループ終了
```

### 6.6. return文の実装詳細

#### 6.6.1. 値を返すreturn文

```zpp
uint8 calculate_checksum(uint8 data[], uint8 length) {
    uint8 checksum = 0;
    for (uint8 i = 0; i < length; i++) {
        checksum += data[i];
    }
    return checksum;
}
```

**アセンブリ生成：**
```asm
calculate_checksum:
; 関数プロローグ（必要に応じてレジスタ退避）
PSH r5
PSH r6

; uint8 checksum = 0
LDI r5, 0                   ; checksum = 0 (r5で管理)

; for (uint8 i = 0; i < length; i++)
LDI r6, 0                   ; i = 0 (r6で管理)

checksum_loop:
; i < length のチェック
SUB r6, r2, r7             ; i - length (r2 = length引数)
BRH NC, checksum_return    ; i >= length なら終了

; checksum += data[i]
APD r6, r1, ap1            ; data + i のアドレス (r1 = data引数)
MLD r7, ap1, 0             ; data[i] をロード
ADD r5, r7, r5             ; checksum += data[i]

; i++
ADI r6, 1
JMP checksum_loop

checksum_return:
; return checksum
MOV r5, r15                ; 戻り値をr15に設定

; 関数エピローグ（レジスタ復帰）
POP r6
POP r5
RET
```

#### 6.6.2. void関数のreturn文

```zpp
void initialize_system() {
    if (system_already_initialized) {
        return;  // 早期リターン
    }
    
    // システム初期化処理
    setup_hardware();
    load_configuration();
    system_initialized = true;
}
```

**アセンブリ生成：**
```asm
initialize_system:
; if (system_already_initialized) のチェック
MLD r1, ap0, system_already_initialized_addr
LDI r2, 0
SUB r1, r2, r3
BRH Z, continue_init       ; falseなら初期化続行

; return (早期リターン)
RET

continue_init:
; システム初期化処理
CAL setup_hardware
CAL load_configuration

; system_initialized = true
LDI r1, 1
MST r1, ap0, system_initialized_addr

; 関数終了（暗黙のreturn）
RET
```

---

## 7章 関数 (Functions)

### 7.1. 関数呼び出し規約の完全解説

Z++の関数呼び出し規約は、8ビットCPUの16個の汎用レジスタとハードウェアスタックを効率的に活用するよう設計されています。この規約により、関数呼び出しのオーバーヘッドを最小化し、予測可能なパフォーマンスを実現します。

#### 7.1.1. レジスタ割り当て（r1-r4, r15）の詳細

**引数レジスタの割り当て：**
- **r1**: 第1引数（またはthisポインタ）
- **r2**: 第2引数  
- **r3**: 第3引数
- **r4**: 第4引数
- **r15**: 戻り値レジスタ

**例：基本的な関数呼び出し**
```zpp
uint8 add_three_numbers(uint8 a, uint8 b, uint8 c) {
    return a + b + c;
}

uint8 result = add_three_numbers(10, 20, 30);
```

**呼び出し側のアセンブリ：**
```asm
; 引数の設定
LDI r1, 10              ; 第1引数 a = 10
LDI r2, 20              ; 第2引数 b = 20  
LDI r3, 30              ; 第3引数 c = 30

; 関数呼び出し
CAL add_three_numbers

; 戻り値の取得
MST r15, ap0, result_addr ; result = 戻り値
```

**関数側のアセンブリ：**
```asm
add_three_numbers:
; 引数は既にr1, r2, r3に設定済み
; return a + b + c の計算
ADD r1, r2, r4          ; a + b → r4
ADD r4, r3, r15         ; (a + b) + c → r15 (戻り値レジスタ)

RET                     ; 呼び出し元に戻る
```

#### 7.1.2. Caller-saved/Callee-saved規則の実装

**Caller-Saved (呼び出し側退避) - r1-r4, r15:**
これらのレジスタは、関数を呼び出す側が必要に応じて退避する責任を持ちます。

```zpp
uint8 complex_calculation() {
    uint8 temp1 = get_sensor_data();    // r1-r4が破壊される可能性
    uint8 temp2 = process_value(temp1); // temp1を保持する必要がある
    return temp1 + temp2;
}
```

**Caller-saved実装例：**
```asm
complex_calculation:
; get_sensor_data()の呼び出し
CAL get_sensor_data
MOV r15, r5             ; temp1 = 戻り値をr5に退避（Caller-saved）

; process_value(temp1)の呼び出し
MOV r5, r1              ; temp1を第1引数に設定
CAL process_value
MOV r15, r6             ; temp2 = 戻り値をr6に退避

; return temp1 + temp2
ADD r5, r6, r15         ; temp1 + temp2 → 戻り値

RET
```

**Callee-Saved (呼び出される側退避) - r5-r14:**
これらのレジスタは、関数内で使用する場合、その関数が退避・復元する責任を持ちます。

```zpp
uint8 process_array(uint8 array[], uint8 length) {
    uint8 sum = 0;         // r5で管理
    uint8 i = 0;           // r6で管理
    uint8 temp = 0;        // r7で管理
    
    for (i = 0; i < length; i++) {
        temp = array[i] * 2;
        sum += temp;
        call_external_function(); // 外部関数呼び出し
    }
    return sum;
}
```

**Callee-saved実装例：**
```asm
process_array:
; プロローグ：Callee-savedレジスタの退避
PSH r5                  ; sum用レジスタを退避
PSH r6                  ; i用レジスタを退避  
PSH r7                  ; temp用レジスタを退避

; 変数の初期化
LDI r5, 0              ; sum = 0
LDI r6, 0              ; i = 0

process_loop:
; i < length のチェック
SUB r6, r2, r8         ; i - length (r2は引数length)
BRH NC, process_end    ; i >= length なら終了

; temp = array[i] * 2
APD r6, r1, ap1        ; array + i のアドレス (r1は引数array)
MLD r7, ap1, 0         ; array[i] をロード
LDI r8, 2
MUL r7, r8, r7         ; array[i] * 2 → r7 (temp)

; sum += temp
ADD r5, r7, r5         ; sum += temp

; call_external_function() - r1-r4, r15が破壊される可能性があるが、
; r5-r7は呼び出される関数によって保護される
CAL call_external_function

; i++
ADI r6, 1
JMP process_loop

process_end:
; return sum
MOV r5, r15            ; sum → 戻り値

; エピローグ：Callee-savedレジスタの復元
POP r7                 ; temp用レジスタを復元
POP r6                 ; i用レジスタを復元
POP r5                 ; sum用レジスタを復元

RET
```

#### 7.1.3. スタックフレームの構造

引数が5個以上の場合、またはローカル変数が多数ある場合に使用されるスタックフレーム：

```zpp
uint8 complex_function(uint8 a, uint8 b, uint8 c, uint8 d, uint8 e, uint8 f) {
    uint8 local1, local2, local3;
    // 処理...
    return local1 + local2 + local3;
}
```

**スタックフレームのレイアウト：**
```
高位アドレス
┌─────────────────┐
│ 第6引数 (f)      │ [sp + 8]
├─────────────────┤
│ 第5引数 (e)      │ [sp + 7]  
├─────────────────┤
│ 戻りアドレス     │ [sp + 6] (CAL命令により自動設定)
├─────────────────┤
│ 保存されたr5     │ [sp + 5]
├─────────────────┤
│ 保存されたr6     │ [sp + 4]
├─────────────────┤
│ 保存されたr7     │ [sp + 3]
├─────────────────┤
│ local3          │ [sp + 2]
├─────────────────┤
│ local2          │ [sp + 1]
├─────────────────┤
│ local1          │ [sp + 0] ← スタックポインタ
└─────────────────┘
低位アドレス
```

**スタックフレーム使用の実装：**
```asm
complex_function:
; プロローグ：レジスタ退避
PSH r5
PSH r6  
PSH r7

; ローカル変数用スペース確保（3バイト）
; スタック操作により実現

; 第5,6引数の取得（スタックから）
; スタックアドレス計算が必要（実装依存）

; 関数の処理...

; エピローグ：スタック復元
POP r7
POP r6
POP r5

RET
```

#### 7.1.4. thisポインタの扱い（r1レジスタ）

クラスのメンバ関数では、r1レジスタがthisポインタとして予約されます：

```zpp
class Sensor {
    uint8 value;
    uint8 status;
    
public:
    uint8 read_value() {
        return value;
    }
    
    void set_status(uint8 new_status) {
        status = new_status;
    }
};

Sensor my_sensor;
uint8 data = my_sensor.read_value();
```

**thisポインタの実装：**
```asm
; Sensor my_sensor; (メモリ上のオブジェクト)
; my_sensor のベースアドレスを ap3 とする

; my_sensor.read_value() の呼び出し
APD ap3, r0, ap1        ; my_sensorのアドレスをap1に
MOV ap1, r1             ; thisポインタをr1に設定
CAL Sensor_read_value   ; メンバ関数呼び出し

; 戻り値の処理
MST r15, ap0, data_addr

; Sensor::read_value() の実装
Sensor_read_value:
; r1 = thisポインタ（my_sensorのアドレス）
MLD r2, r1, 0           ; this->value をロード（オフセット0）
MOV r2, r15             ; 戻り値に設定
RET

; my_sensor.set_status(100) の呼び出し
APD ap3, r0, ap1        ; thisポインタ設定
MOV ap1, r1
LDI r2, 100             ; 引数new_status
CAL Sensor_set_status

; Sensor::set_status() の実装  
Sensor_set_status:
; r1 = thisポインタ, r2 = new_status
MST r2, r1, 1           ; this->status = new_status（オフセット1）
RET
```

### 7.2. 関数の定義と呼び出しの詳細

#### 7.2.1. 関数プロトタイプと実装の分離

```zpp
// プロトタイプ宣言
uint8 fibonacci(uint8 n);
bool is_prime(uint8 number);

// 実装
uint8 fibonacci(uint8 n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

bool is_prime(uint8 number) {
    if (number < 2) return false;
    for (uint8 i = 2; i * i <= number; i++) {
        if (number % i == 0) return false;
    }
    return true;
}
```

**再帰関数の実装（fibonacci）：**
```asm
fibonacci:
; プロローグ：必要レジスタの退避
PSH r5                  ; 再帰呼び出し保護用

; if (n <= 1) return n;
LDI r2, 1
SUB r1, r2, r3         ; n - 1
BRH C, fib_base_case   ; n < 1 なら基底ケース
BRH Z, fib_base_case   ; n == 1 なら基底ケース

; 再帰ケース：fibonacci(n-1) + fibonacci(n-2)
MOV r1, r5             ; nを退避

; fibonacci(n - 1)
SBI r1, 1              ; n - 1
CAL fibonacci
MOV r15, r4            ; fibonacci(n-1)の結果を退避

; fibonacci(n - 2)  
MOV r5, r1             ; nを復元
SBI r1, 2              ; n - 2
CAL fibonacci

; fibonacci(n-1) + fibonacci(n-2)
ADD r4, r15, r15       ; 結果を戻り値に

JMP fib_end

fib_base_case:
; n <= 1 の場合、nをそのまま返す
MOV r1, r15

fib_end:
; エピローグ
POP r5
RET
```

#### 7.2.2. デフォルト引数の実装

```zpp
void set_led_brightness(uint8 pin, uint8 brightness = 255) {
    Output(pin, brightness);
}

// 呼び出し例
set_led_brightness(3);        // pin=3, brightness=255（デフォルト）
set_led_brightness(3, 128);   // pin=3, brightness=128（明示的）
```

**デフォルト引数のコンパイラ実装：**
```asm
; set_led_brightness(3); の呼び出し
; コンパイラが自動的にデフォルト値を補完
LDI r1, 3               ; pin = 3
LDI r2, 255             ; brightness = 255（デフォルト値）
CAL set_led_brightness

; set_led_brightness(3, 128); の呼び出し
LDI r1, 3               ; pin = 3  
LDI r2, 128             ; brightness = 128（明示的）
CAL set_led_brightness

; set_led_brightness関数の実装
set_led_brightness:
; Output(pin, brightness)
; r1 = pin, r2 = brightness
APD r1, r0, ap1         ; ポートアドレス設定
PST r2, ap1, 0          ; ポートに出力
RET
```

#### 7.2.3. 配列の引き渡し（特殊ケース）

配列を関数に渡す場合、常に先頭要素へのアドレスが渡されます：

```zpp
uint8 calculate_sum(uint8 arr[], uint8 length) {
    uint8 sum = 0;
    for (uint8 i = 0; i < length; i++) {
        sum += arr[i];
    }
    return sum;
}

uint8 my_data[5] = {1, 2, 3, 4, 5};
uint8 total = calculate_sum(my_data, 5);
```

**配列引き渡しの実装：**
```asm
; uint8 my_data[5] = {1, 2, 3, 4, 5}; の初期化
; my_data のベースアドレスを ap2 とする
LDI r1, 1
MST r1, ap2, 0          ; my_data[0] = 1
LDI r1, 2  
MST r1, ap2, 1          ; my_data[1] = 2
LDI r1, 3
MST r1, ap2, 2          ; my_data[2] = 3
LDI r1, 4
MST r1, ap2, 3          ; my_data[3] = 4
LDI r1, 5
MST r1, ap2, 4          ; my_data[4] = 5

; calculate_sum(my_data, 5) の呼び出し
MOV ap2, r1             ; 配列の先頭アドレスを第1引数に
LDI r2, 5               ; length = 5
CAL calculate_sum
MST r15, ap0, total_addr ; 戻り値を total に格納

; calculate_sum 関数の実装
calculate_sum:
; r1 = arr（配列のアドレス）, r2 = length
PSH r5                  ; sum用レジスタ退避
PSH r6                  ; i用レジスタ退避

LDI r5, 0              ; sum = 0
LDI r6, 0              ; i = 0

sum_loop:
; i < length のチェック
SUB r6, r2, r7
BRH NC, sum_end        ; i >= length なら終了

; sum += arr[i]
APD r6, r1, ap1        ; arr + i のアドレス
MLD r7, ap1, 0         ; arr[i] をロード
ADD r5, r7, r5         ; sum += arr[i]

; i++
ADI r6, 1
JMP sum_loop

sum_end:
MOV r5, r15            ; sum を戻り値に

POP r6
POP r5
RET
```

### 7.3. 関数ポインタと間接呼び出し

Z++では、関数ポインタによる間接呼び出しもサポートします：

```zpp
typedef uint8 (*operation_func)(uint8, uint8);

uint8 add_op(uint8 a, uint8 b) { return a + b; }
uint8 sub_op(uint8 a, uint8 b) { return a - b; }

operation_func current_op = add_op;
uint8 result = current_op(10, 5);
```

**関数ポインタの実装：**
```asm
; 関数ポインタテーブル（ROM内）
function_table:
.word add_op            ; add_op関数のアドレス
.word sub_op            ; sub_op関数のアドレス

; operation_func current_op = add_op;
LDI r1, 0               ; add_opのインデックス
MST r1, ap0, current_op_addr

; uint8 result = current_op(10, 5);
MLD r1, ap0, current_op_addr    ; 関数インデックスをロード
LDI r2, 2
MUL r1, r2, r3                  ; インデックス * 2（16ビットアドレス）
APD r3, ap_function_table, ap1  ; 関数テーブルエントリアドレス
MLD r4, ap1, 0                  ; 関数アドレス（実際の呼び出しは実装依存）

; 引数設定
LDI r1, 10              ; 第1引数
LDI r2, 5               ; 第2引数
; 間接呼び出し（実装依存の命令）
CAL [r4]                ; 関数ポインタ経由の呼び出し

MST r15, ap0, result_addr ; 戻り値を格納
```

---

## 8章 組み込み機能 (Built-in Features)

### 8.1. I/O関数の内部動作完全解説

Z++のI/O関数は、8ビットCPUのポートアクセス命令を抽象化し、型安全で直感的なハードウェア制御を提供します。すべてのI/O操作は、予測可能なアセンブリコードに変換され、リアルタイム性を保証します。

#### 8.1.1. Output(Port, Value)のCPU命令への変換

**基本的なOutput関数：**
```zpp
Output(3, 255);  // ポート3に255を出力
```

**段階的なアセンブリ変換：**

*ステップ1: 引数評価*
```asm
; ポート番号の設定
LDI r2, 3               ; ポート番号3をr2に

; 出力値の設定  
LDI r1, 255             ; 出力値255をr1に
```

*ステップ2: ポートアドレス計算*
```asm
; ポートアドレスの計算（0x100 + port_number）
APD r2, r0, ap2         ; ベースアドレス0x00 + ポート番号 → ap2
; 実際のハードウェアでは出力ポートベースアドレスが使用される
```

*ステップ3: 実際の出力操作*
```asm
; ポートへの書き込み
PST r1, ap2, 0          ; r1の値をap2が指すポートに出力
```

**完全なアセンブリコード：**
```asm
; Output(3, 255)の完全な実装
LDI r1, 255             ; 出力値
LDI r2, 3               ; ポート番号
APD r2, r0, ap2         ; ポートアドレス計算
PST r1, ap2, 0          ; ポート出力
```

#### 8.1.2. 変数を使ったOutput関数の最適化

```zpp
uint8 led_port = 3;
uint8 brightness = 200;
Output(led_port, brightness);
```

**非最適化版：**
```asm
; 変数からの読み込み
MLD r2, ap0, led_port_addr     ; led_portをメモリから読み込み
MLD r1, ap0, brightness_addr   ; brightnessをメモリから読み込み
APD r2, r0, ap2               ; ポートアドレス計算
PST r1, ap2, 0                ; ポート出力
```

**レジスタ最適化版（変数がレジスタに保持されている場合）：**
```asm
; レジスタ内の値を直接使用（led_port=r5, brightness=r6と仮定）
APD r5, r0, ap2               ; ポートアドレス計算  
PST r6, ap2, 0                ; ポート出力（高速）
```

#### 8.1.3. Input(Port, Var)の参照渡しメカニズム

**基本的なInput関数：**
```zpp
uint8 sensor_value;
Input(2, sensor_value);
```

**参照渡しの実装：**

*ステップ1: 変数アドレスの取得*
```asm
; sensor_valueのアドレスを計算
APD sensor_value_offset, ap0, ap1  ; グローバル変数のアドレス → ap1
```

*ステップ2: ポートからの入力*
```asm
; ポート設定
LDI r2, 2               ; ポート番号2
APD r2, r0, ap2         ; 入力ポートアドレス → ap2

; ポートからの読み込み
PLD r3, ap2, 0          ; ポート2から値をr3に読み込み
```

*ステップ3: 変数への格納*
```asm
; 読み込んだ値を変数に格納
MST r3, ap1, 0          ; sensor_valueに値を格納
```

**完全なアセンブリコード：**
```asm
; Input(2, sensor_value)の完全な実装
LDI r2, 2                          ; ポート番号
APD r2, r0, ap2                    ; 入力ポートアドレス計算
PLD r3, ap2, 0                     ; ポートから入力
APD sensor_value_offset, ap0, ap1  ; 変数アドレス計算
MST r3, ap1, 0                     ; 変数に格納
```

#### 8.1.4. 配列要素を使ったInput関数

```zpp
uint8 sensor_data[4];
Input(sensor_ports[i], sensor_data[i]);
```

**動的アドレス計算を含む実装：**
```asm
; sensor_ports[i]の計算
MLD r1, ap0, i_addr             ; iをロード
APD r1, ap_sensor_ports, ap1    ; sensor_ports + i → ap1
MLD r2, ap1, 0                  ; sensor_ports[i] をロード

; sensor_data[i]のアドレス計算
APD r1, ap_sensor_data, ap2     ; sensor_data + i → ap2

; ポートアドレス計算
APD r2, r0, ap3                 ; 入力ポートアドレス → ap3

; 入力操作
PLD r3, ap3, 0                  ; ポートから入力
MST r3, ap2, 0                  ; sensor_data[i]に格納
```

#### 8.1.5. 配列I/O (Output(Port, Array, Length))の連続処理

配列I/Oは、複数の値を効率的に連続転送する機能です：

```zpp
uint8 data[4] = {10, 20, 30, 40};
Output(LED_PORT, data, 4);
```

**連続転送の最適化実装：**
```asm
; Output(LED_PORT, data, 4)の実装
LDI r1, LED_PORT        ; ポート番号
APD r1, r0, ap1         ; ポートアドレス → ap1
LDI r2, 4               ; 転送長
APD data_offset, ap0, ap2 ; 配列アドレス → ap2

; 連続転送ループ
transfer_loop:
; 転送長チェック
LDI r3, 0
SUB r2, r3, r4
BRH Z, transfer_end     ; 転送長=0なら終了

; 1要素の転送
MLD r5, ap2, 0          ; data[current]をロード
PST r5, ap1, 0          ; ポートに出力

; ポインタと カウンタの更新
ADI ap2, 1              ; 配列ポインタを次の要素に
SBI r2, 1               ; 転送長をデクリメント

JMP transfer_loop

transfer_end:
```

**高度な最適化（アンローリング）：**
小さな固定長配列の場合、ループをアンローリングして性能を向上：

```zpp
uint8 rgb[3] = {255, 128, 64};
Output(RGB_PORT, rgb, 3);
```

**アンローリング版：**
```asm
; 3要素の直接転送（ループなし）
LDI r1, RGB_PORT
APD r1, r0, ap1         ; ポートアドレス

; 要素1
MLD r2, ap0, rgb_addr + 0
PST r2, ap1, 0

; 要素2  
MLD r2, ap0, rgb_addr + 1
PST r2, ap1, 0

; 要素3
MLD r2, ap0, rgb_addr + 2
PST r2, ap1, 0
```

#### 8.1.6. ポート指定での配列要素使用の実装

```zpp
uint8 port_map[4] = {1, 2, 3, 4};
uint8 values[4] = {100, 150, 200, 250};

for (uint8 i = 0; i < 4; i++) {
    Output(port_map[i], values[i]);
}
```

**効率的なループ実装：**
```asm
; for文の初期化
LDI r1, 0               ; i = 0

output_loop:
; i < 4 のチェック
LDI r2, 4
SUB r1, r2, r3
BRH NC, output_end      ; i >= 4 なら終了

; port_map[i]の取得
APD r1, ap_port_map, ap1
MLD r4, ap1, 0          ; port_map[i] → r4

; values[i]の取得
APD r1, ap_values, ap2
MLD r5, ap2, 0          ; values[i] → r5

; Output(port_map[i], values[i])
APD r4, r0, ap3         ; ポートアドレス計算
PST r5, ap3, 0          ; 出力

; i++
ADI r1, 1
JMP output_loop

output_end:
```

### 8.2. デバッグ機能の詳細メカニズム

#### 8.2.1. Run.Debug のコンパイル時完全無視

`Run.Debug`は開発時のデバッグ専用機能で、製品版バイナリには一切影響しません：

```zpp
uint8 calculate_average(uint8 data[], uint8 length) {
    uint8 sum = 0;
    
    Run.Debug("Starting average calculation", length);
    
    for (uint8 i = 0; i < length; i++) {
        sum += data[i];
        Run.Debug("Processing element", i, data[i], sum);
    }
    
    uint8 average = sum / length;
    Run.Debug("Final average", average);
    
    return average;
}
```

**デバッグ版コンパイル（IDE向け）：**
```asm
calculate_average:
; デバッグ情報の記録（IDEが解釈）
.debug_info "Starting average calculation", length_symbol

PSH r5                  ; sum用レジスタ退避
PSH r6                  ; i用レジスタ退避
LDI r5, 0              ; sum = 0
LDI r6, 0              ; i = 0

calc_loop:
SUB r6, r2, r7
BRH NC, calc_end

APD r6, r1, ap1
MLD r7, ap1, 0         ; data[i]
ADD r5, r7, r5         ; sum += data[i]

; デバッグ情報の記録
.debug_info "Processing element", r6, r7, r5

ADI r6, 1
JMP calc_loop

calc_end:
DIV r5, r2, r15        ; average = sum / length

; デバッグ情報の記録
.debug_info "Final average", r15

POP r6
POP r5
RET
```

**製品版コンパイル（デバッグ情報なし）：**
```asm
calculate_average:
; Run.Debugは完全に除去される
PSH r5
PSH r6
LDI r5, 0
LDI r6, 0

calc_loop:
SUB r6, r2, r7
BRH NC, calc_end

APD r6, r1, ap1
MLD r7, ap1, 0
ADD r5, r7, r5

ADI r6, 1
JMP calc_loop

calc_end:
DIV r5, r2, r15

POP r6
POP r5
RET
```

#### 8.2.2. IDEによる実行時評価の仕組み

IDE（統合開発環境）は、デバッグ情報を使用してリアルタイムでプログラムの状態を監視します：

**デバッグ情報の構造：**
```
.debug_info "message", symbol1, symbol2, ...

message: 表示メッセージ
symbol1, symbol2: 評価する変数やレジスタ
```

**IDE側の処理フロー：**
1. **ブレークポイント設定**：`.debug_info`の位置に自動ブレークポイント
2. **状態取得**：指定されたシンボルの値をCPUから読み取り
3. **表示更新**：IDE上でデバッグメッセージと変数値を表示
4. **実行継続**：ユーザーの指示により実行を継続

#### 8.2.3. 副作用のない式評価の保証

`Run.Debug`で指定される式は、プログラムの動作に影響を与えません：

```zpp
uint8 process_data(uint8 value) {
    Run.Debug("Input value", value);
    
    uint8 result = value * 2;
    
    Run.Debug("Intermediate result", result, value + 10);  // value + 10は評価のみ
    
    if (result > 200) {
        result = 200;
        Run.Debug("Clamped result", result);
    }
    
    return result;
}
```

**副作用なし評価の実装：**
- **純粋な読み取り**：メモリやレジスタから値を読み取るのみ
- **一時的な計算**：IDE側で計算を実行（CPUに影響なし）
- **状態保持**：CPU状態を変更せずに評価結果のみ表示

#### 8.2.4. 製品版バイナリへの影響ゼロの実現

**コンパイラのプリプロセッサ処理：**
```cpp
// コンパイラ内部の条件コンパイル
#ifdef DEBUG_BUILD
    #define Run.Debug(...) generate_debug_info(__VA_ARGS__)
#else
    #define Run.Debug(...) // 完全に除去
#endif
```

**ROM使用量の比較：**
```
デバッグ版:   1024バイト (デバッグ情報含む)
製品版:       800バイト  (224バイト節約)

節約率: 21.9%
```

### 8.3. アセンブリ埋め込みの完全解説

#### 8.3.1. Run.AsmとRun.AsmBlockの使い分け

**Run.Asm - 単一命令の埋め込み：**
```zpp
void precise_delay() {
    Run.Asm("NOP");     // 1クロック待機
    Run.Asm("NOP");     // さらに1クロック待機
    Run.Asm("NOP");     // 合計3クロック待機
}
```

**生成されるアセンブリ：**
```asm
precise_delay:
NOP                     ; 1クロック
NOP                     ; 1クロック  
NOP                     ; 1クロック
RET
```

**Run.AsmBlock - 複数命令のブロック：**
```zpp
uint8 fast_multiply_by_10(uint8 value) {
    uint8 result;
    
    Run.AsmBlock {
        MLD r1, ap0, value_addr    // valueをロード
        LDI r2, 10                 // 乗数10
        MUL r1, r2, r3            // value * 10
        MST r3, ap0, result_addr   // resultに格納
    };
    
    return result;
}
```

**生成されるアセンブリ：**
```asm
fast_multiply_by_10:
; Run.AsmBlockの内容がそのまま展開
MLD r1, ap0, value_addr
LDI r2, 10
MUL r1, r2, r3
MST r3, ap0, result_addr

; return result
MLD r15, ap0, result_addr
RET
```

#### 8.3.2. .defineディレクティブの使用

アセンブリブロック内でconst定数を使用：

```zpp
const uint8 BUFFER_SIZE = 16;

void clear_buffer() {
    Run.AsmBlock {
        LDI r1, 0                    // クリア値
        LDI r2, BUFFER_SIZE          // サイズ（.defineにより16に置換）
        APD buffer_base, r0, ap1     // バッファベースアドレス
        
    clear_loop:
        MST r1, ap1, 0               // バッファをクリア
        ADI ap1, 1                   // 次のアドレス
        SBI r2, 1                    // カウンタデクリメント
        BRH NZ, clear_loop           // 0でないなら継続
    };
}
```

#### 8.3.3. ラベルとジャンプの実装

```zpp
uint8 find_first_zero(uint8 array[], uint8 length) {
    uint8 result;
    
    Run.AsmBlock {
        LDI r3, 0                    // インデックス初期化
        
    search_loop:
        SUB r3, r2, r4               // インデックス - length
        BRH NC, not_found            // インデックス >= length
        
        APD r3, r1, ap1              // array + index
        MLD r5, ap1, 0               // array[index]
        LDI r6, 0
        SUB r5, r6, r7               // array[index] - 0
        BRH Z, found_zero            // 0が見つかった
        
        ADI r3, 1                    // インデックス++
        JMP search_loop
        
    found_zero:
        MST r3, ap0, result_addr     // インデックスを結果に
        JMP search_end
        
    not_found:
        LDI r7, 255                  // 見つからない場合は255
        MST r7, ap0, result_addr
        
    search_end:
    };
    
    return result;
}
```

#### 8.3.4. レジスタ退避・復元のベストプラクティス

**重要なレジスタの保護：**
```zpp
void critical_timing_operation() {
    uint8 saved_state = get_current_state();
    
    Run.AsmBlock {
        // 使用するCallee-savedレジスタを退避
        PSH r5
        PSH r6
        PSH r7
        
        // クリティカルなタイミング処理
        LDI r5, CRITICAL_VALUE
        LDI r6, 100                  // ループカウンタ
        
    timing_loop:
        // 正確な1クロック処理
        PST r5, ap_critical_port, 0
        NOP                          // タイミング調整
        SBI r6, 1
        BRH NZ, timing_loop
        
        // レジスタ復元
        POP r7
        POP r6
        POP r5
    };
    
    restore_state(saved_state);
}
```

#### 8.3.5. Z++変数との連携方法

**Z++変数とアセンブリの相互運用：**
```zpp
struct SensorData {
    uint8 temperature;
    uint8 humidity;
    uint8 pressure;
};

void read_sensor_fast(SensorData& data) {
    Run.AsmBlock {
        // structのメンバアクセス（thisポインタがr1に設定済み）
        
        // temperature の読み取り（オフセット0）
        LDI r2, TEMP_SENSOR_PORT
        APD r2, r0, ap2
        PLD r3, ap2, 0
        MST r3, r1, 0                // data.temperature = sensor_value
        
        // humidity の読み取り（オフセット1）  
        LDI r2, HUMID_SENSOR_PORT
        APD r2, r0, ap2
        PLD r3, ap2, 0
        MST r3, r1, 1                // data.humidity = sensor_value
        
        // pressure の読み取り（オフセット2）
        LDI r2, PRESS_SENSOR_PORT
        APD r2, r0, ap2
        PLD r3, ap2, 0
        MST r3, r1, 2                // data.pressure = sensor_value
    };
}

SensorData current_data;
read_sensor_fast(current_data);
```

**実装時の注意事項：**
1. **レジスタ競合の回避**：Z++コンパイラが使用するレジスタとの衝突を避ける
2. **メモリレイアウトの理解**：構造体のメンバオフセットを正確に把握
3. **呼び出し規約の遵守**：関数の引数・戻り値規約を守る
4. **例外処理**：アセンブリ内でのエラー処理を適切に実装

---

## 9章 名前空間とモジュール (Namespaces and Modules)

### 9.1. プリプロセッサの詳細動作

Z++のプリプロセッサは、C++互換の`#include`機能を提供し、大規模なプロジェクトでのモジュール化を支援します。

#### 9.1.1. #includeのテキスト展開過程

**基本的なインクルード処理：**

*main.zpp:*
```zpp
#include "sensor.zpp"
#include "display.zpp"

uint8 main() {
    uint8 temp = read_temperature();
    show_value(temp);
    return 0;
}
```

*sensor.zpp:*
```zpp
#ifndef SENSOR_ZPP
#define SENSOR_ZPP

const uint8 TEMP_SENSOR_PORT = 1;

uint8 read_temperature() {
    uint8 value;
    Input(TEMP_SENSOR_PORT, value);
    return value;
}

#endif
```

*display.zpp:*
```zpp
#ifndef DISPLAY_ZPP
#define DISPLAY_ZPP

const uint8 DISPLAY_PORT = 3;

void show_value(uint8 value) {
    Output(DISPLAY_PORT, value);
}

#endif
```

**プリプロセッサ処理後の展開結果：**
```zpp
// sensor.zpp の内容が展開
const uint8 TEMP_SENSOR_PORT = 1;

uint8 read_temperature() {
    uint8 value;
    Input(1, value);  // TEMP_SENSOR_PORTが展開済み
    return value;
}

// display.zpp の内容が展開
const uint8 DISPLAY_PORT = 3;

void show_value(uint8 value) {
    Output(3, value);  // DISPLAY_PORTが展開済み
}

// main.zpp の内容
uint8 main() {
    uint8 temp = read_temperature();
    show_value(temp);
    return 0;
}
```

#### 9.1.2. インクルードガードの動作原理と必要性

**インクルードガードなしの問題：**

*common.zpp:*
```zpp
const uint8 BUFFER_SIZE = 64;
uint8 shared_buffer[BUFFER_SIZE];
```

*module1.zpp:*
```zpp
#include "common.zpp"
void process_data1() { /* ... */ }
```

*module2.zpp:*
```zpp
#include "common.zpp"
void process_data2() { /* ... */ }
```

*main.zpp:*
```zpp
#include "module1.zpp"
#include "module2.zpp"  // common.zppが二重インクルードされる

uint8 main() {
    process_data1();
    process_data2();
    return 0;
}
```

**二重定義エラーの発生：**
```asm
; 展開後のコード（エラー）
.define BUFFER_SIZE = 64        ; 1回目の定義
shared_buffer: .space 64        ; 1回目の定義

.define BUFFER_SIZE = 64        ; 2回目の定義（エラー！）
shared_buffer: .space 64        ; 2回目の定義（エラー！）
```

**インクルードガードによる解決：**
```cpp
// プリプロセッサの内部状態管理
struct IncludeGuard {
    std::set<std::string> defined_macros;
    
    bool is_defined(const string& macro) {
        return defined_macros.find(macro) != defined_macros.end();
    }
    
    void define(const string& macro) {
        defined_macros.insert(macro);
    }
};

// common.zpp の処理
if (!guard.is_defined("COMMON_ZPP")) {
    guard.define("COMMON_ZPP");
    // ファイル内容を展開
    emit("const uint8 BUFFER_SIZE = 64;");
    emit("uint8 shared_buffer[BUFFER_SIZE];");
}
// 2回目以降は内容がスキップされる
```

#### 9.1.3. 二重定義エラーの回避メカニズム

**プリプロセッサのシンボルテーブル管理：**
```cpp
class Preprocessor {
private:
    std::map<std::string, bool> macro_definitions;
    std::map<std::string, std::string> macro_values;
    
public:
    void process_ifndef(const std::string& macro) {
        if (macro_definitions.find(macro) == macro_definitions.end()) {
            // マクロが未定義なら処理を継続
            conditional_stack.push(true);
        } else {
            // 既に定義済みなら処理をスキップ
            conditional_stack.push(false);
            skip_until_endif();
        }
    }
    
    void process_define(const std::string& macro, const std::string& value = "") {
        macro_definitions[macro] = true;
        macro_values[macro] = value;
    }
};
```

### 9.2. 名前空間の実装詳細

#### 9.2.1. スコープ解決演算子::の内部処理

**名前空間の定義と使用：**
```zpp
namespace Hardware {
    const uint8 LED_PORT = 1;
    const uint8 SENSOR_PORT = 2;
    
    void init_ports() {
        Output(LED_PORT, 0);
    }
}

namespace Display {
    const uint8 LCD_PORT = 3;
    
    void show_message(uint8 code) {
        Output(LCD_PORT, code);
    }
}

uint8 main() {
    Hardware::init_ports();
    Display::show_message(100);
    return 0;
}
```

**コンパイラの名前解決処理：**
```cpp
class NamespaceResolver {
private:
    struct Symbol {
        std::string name;
        std::string namespace_name;
        std::string full_name;  // namespace::name
        SymbolType type;
        uint16_t address;
    };
    
    std::map<std::string, Symbol> symbol_table;
    
public:
    Symbol* resolve_symbol(const std::string& name) {
        // 1. 完全修飾名での検索 (namespace::name)
        auto it = symbol_table.find(name);
        if (it != symbol_table.end()) {
            return &it->second;
        }
        
        // 2. 現在の名前空間での検索
        std::string current_qualified = current_namespace + "::" + name;
        it = symbol_table.find(current_qualified);
        if (it != symbol_table.end()) {
            return &it->second;
        }
        
        // 3. グローバル名前空間での検索
        it = symbol_table.find("::" + name);
        if (it != symbol_table.end()) {
            return &it->second;
        }
        
        return nullptr;  // 見つからない
    }
};
```

**生成されるアセンブリでの名前修飾：**
```asm
; namespace Hardware { const uint8 LED_PORT = 1; }
.define Hardware_LED_PORT = 1

; namespace Hardware { void init_ports() }
Hardware_init_ports:
    LDI r1, 0
    LDI r2, Hardware_LED_PORT    ; 1に展開
    APD r2, r0, ap2
    PST r1, ap2, 0
    RET

; namespace Display { const uint8 LCD_PORT = 3; }
.define Display_LCD_PORT = 3

; namespace Display { void show_message(uint8 code) }
Display_show_message:
    ; r1 = code (引数)
    LDI r2, Display_LCD_PORT     ; 3に展開
    APD r2, r0, ap2
    PST r1, ap2, 0
    RET

; uint8 main()
main:
    CAL Hardware_init_ports      ; Hardware::init_ports()
    LDI r1, 100
    CAL Display_show_message     ; Display::show_message(100)
    LDI r15, 0
    RET
```

#### 9.2.2. using宣言による名前インポートの仕組み

**using宣言の処理：**
```zpp
namespace Math {
    uint8 add(uint8 a, uint8 b) { return a + b; }
    uint8 multiply(uint8 a, uint8 b) { return a * b; }
}

namespace Utility {
    uint8 clamp(uint8 value, uint8 min, uint8 max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
}

using Math::add;           // Math::add のみインポート
using Utility::clamp;      // Utility::clamp のみインポート

uint8 main() {
    uint8 result = add(10, 20);              // OK: Math::add
    uint8 safe_value = clamp(result, 0, 100); // OK: Utility::clamp
    // uint8 product = multiply(5, 6);        // エラー: multiplyは未インポート
    return safe_value;
}
```

**コンパイラの using 処理：**
```cpp
class UsingDirectiveProcessor {
private:
    std::map<std::string, std::string> imported_symbols;  // local_name -> full_name
    
public:
    void process_using_declaration(const std::string& full_name) {
        // Math::add から add を抽出
        size_t pos = full_name.find_last_of("::");
        if (pos != std::string::npos && pos > 0) {
            std::string local_name = full_name.substr(pos + 1);
            imported_symbols[local_name] = full_name;
        }
    }
    
    std::string resolve_imported_name(const std::string& name) {
        auto it = imported_symbols.find(name);
        if (it != imported_symbols.end()) {
            return it->second;  // フル名を返す
        }
        return name;  // インポートされていない
    }
};
```

**生成されるアセンブリ：**
```asm
; using Math::add; により add は Math_add にマッピング
; using Utility::clamp; により clamp は Utility_clamp にマッピング

main:
    ; uint8 result = add(10, 20);
    LDI r1, 10
    LDI r2, 20
    CAL Math_add                 ; add は Math_add に解決

    ; uint8 safe_value = clamp(result, 0, 100);
    MOV r15, r1                  ; result を第1引数に
    LDI r2, 0                    ; min
    LDI r3, 100                  ; max
    CAL Utility_clamp           ; clamp は Utility_clamp に解決

    ; return safe_value;
    ; 戻り値は既にr15にある
    RET
```

#### 9.2.3. 無名名前空間によるファイルスコープ限定

**無名名前空間の使用：**

*implementation.zpp:*
```zpp
namespace {  // 無名名前空間（このファイル内でのみ有効）
    const uint8 INTERNAL_BUFFER_SIZE = 32;
    uint8 internal_buffer[INTERNAL_BUFFER_SIZE];
    
    void internal_helper_function() {
        // 内部処理
        for (uint8 i = 0; i < INTERNAL_BUFFER_SIZE; i++) {
            internal_buffer[i] = 0;
        }
    }
}

// 公開インターフェース
void clear_all_buffers() {
    internal_helper_function();  // 無名名前空間の関数を使用
}

uint8 get_buffer_size() {
    return INTERNAL_BUFFER_SIZE;  // 無名名前空間の定数を使用
}
```

**コンパイラの無名名前空間処理：**
```cpp
class AnonymousNamespaceHandler {
private:
    std::string generate_unique_namespace_name(const std::string& filename) {
        // ファイル名とタイムスタンプを使って一意な名前を生成
        return "__anonymous_" + filename + "_" + std::to_string(compile_time);
    }
    
public:
    void process_anonymous_namespace(const std::string& filename) {
        std::string unique_name = generate_unique_namespace_name(filename);
        
        // 無名名前空間の内容を一意な名前付き名前空間として処理
        current_namespace = unique_name;
        
        // この名前空間からの自動 using 宣言を追加
        add_using_directive(unique_name + "::*");
    }
};
```

**生成されるアセンブリ（一意な名前付け）：**
```asm
; 無名名前空間は一意な名前に変換される
.define __anonymous_implementation_zpp_12345_INTERNAL_BUFFER_SIZE = 32

__anonymous_implementation_zpp_12345_internal_buffer: .space 32

__anonymous_implementation_zpp_12345_internal_helper_function:
    LDI r1, 0                   ; i = 0
    LDI r2, __anonymous_implementation_zpp_12345_INTERNAL_BUFFER_SIZE
    APD __anonymous_implementation_zpp_12345_internal_buffer, r0, ap1

clear_loop:
    SUB r1, r2, r3
    BRH NC, clear_end
    
    LDI r4, 0
    MST r4, ap1, 0              ; buffer[i] = 0
    ADI ap1, 1                  ; 次の要素
    ADI r1, 1                   ; i++
    JMP clear_loop

clear_end:
    RET

; 公開関数
clear_all_buffers:
    CAL __anonymous_implementation_zpp_12345_internal_helper_function
    RET

get_buffer_size:
    LDI r15, __anonymous_implementation_zpp_12345_INTERNAL_BUFFER_SIZE
    RET
```

### 9.3. デッドコード除去とROM効率の最適化アルゴリズム

#### 9.3.1. 生存コード分析の詳細ステップ

Z++コンパイラは、main関数を起点とした到達可能性解析により、実際に使用される関数のみを最終バイナリに含めます。

**生存コード分析のアルゴリズム：**
```cpp
class DeadCodeEliminator {
private:
    std::set<std::string> reachable_functions;
    std::set<std::string> reachable_variables;
    std::map<std::string, std::vector<std::string>> call_graph;
    
public:
    void build_call_graph() {
        // 各関数から呼び出される関数のリストを構築
        for (auto& function : all_functions) {
            call_graph[function.name] = extract_function_calls(function);
        }
    }
    
    void mark_reachable_from(const std::string& function_name) {
        if (reachable_functions.find(function_name) != reachable_functions.end()) {
            return;  // 既に処理済み
        }
        
        reachable_functions.insert(function_name);
        
        // この関数から呼び出される全ての関数を再帰的にマーク
        for (const std::string& called_func : call_graph[function_name]) {
            mark_reachable_from(called_func);
        }
        
        // この関数で使用される全ての変数をマーク
        for (const std::string& var : get_used_variables(function_name)) {
            reachable_variables.insert(var);
        }
    }
    
    void eliminate_dead_code() {
        // main関数から到達可能性解析を開始
        mark_reachable_from("main");
        
        // 到達不可能な関数と変数を除去
        remove_unreachable_functions();
        remove_unreachable_variables();
    }
};
```

**具体例での動作：**

*library.zpp:*
```zpp
namespace Math {
    uint8 add(uint8 a, uint8 b) { return a + b; }
    uint8 subtract(uint8 a, uint8 b) { return a - b; }
    uint8 multiply(uint8 a, uint8 b) { return a * b; }
    uint8 divide(uint8 a, uint8 b) { return a / b; }  // 未使用
}

namespace Display {
    void show_number(uint8 n) { Output(1, n); }
    void show_text(uint8 code) { Output(2, code); }   // 未使用
}
```

*main.zpp:*
```zpp
#include "library.zpp"

uint8 main() {
    uint8 a = 10;
    uint8 b = 5;
    uint8 result = Math::add(a, b);      // Math::add のみ使用
    Display::show_number(result);        // Display::show_number のみ使用
    return 0;
}
```

**到達可能性解析の結果：**
```
Step 1: main から開始
  - Math::add を呼び出し → Math::add をマーク
  - Display::show_number を呼び出し → Display::show_number をマーク

Step 2: Math::add の解析
  - 他の関数を呼び出さない → 終了

Step 3: Display::show_number の解析  
  - Output を呼び出し → Output をマーク（組み込み関数）

最終結果:
  到達可能: main, Math::add, Display::show_number, Output
  未到達: Math::subtract, Math::multiply, Math::divide, Display::show_text
```

**最適化後の生成アセンブリ：**
```asm
; 到達可能な関数のみが生成される
Math_add:
    ADD r1, r2, r15
    RET

Display_show_number:
    LDI r2, 1
    APD r2, r0, ap2
    PST r1, ap2, 0
    RET

main:
    LDI r1, 10                  ; a = 10
    LDI r2, 5                   ; b = 5
    CAL Math_add                ; Math::add(a, b)
    MOV r15, r1                 ; result
    CAL Display_show_number     ; Display::show_number(result)
    LDI r15, 0
    RET

; Math::subtract, Math::multiply, Math::divide, Display::show_text は生成されない
```

#### 9.3.2. mainからの到達可能性解析

**複雑な呼び出し関係での解析：**
```zpp
void function_a() { function_b(); }
void function_b() { function_c(); }  
void function_c() { /* ... */ }
void function_d() { function_e(); }  // mainから呼ばれない
void function_e() { /* ... */ }      // mainから呼ばれない

uint8 main() {
    function_a();  // function_a -> function_b -> function_c の連鎖
    return 0;
}
```

**到達可能性グラフ：**
```
main
 └── function_a (到達可能)
     └── function_b (到達可能)
         └── function_c (到達可能)

function_d (未到達)
 └── function_e (未到達)
```

#### 9.3.3. 条件付きコンパイルでの最適化

**条件付きでのデッドコード除去：**
```zpp
const bool DEBUG_MODE = false;

void debug_print(uint8 value) {
    if (DEBUG_MODE) {  // 常にfalse
        Output(DEBUG_PORT, value);
    }
}

uint8 main() {
    uint8 result = calculate_something();
    debug_print(result);  // 実質的に何もしない
    return result;
}
```

**最適化後のアセンブリ：**
```asm
; debug_print 関数は実質的に空になる
debug_print:
    RET                         ; 何もせずに戻る

; さらなる最適化でdebug_print呼び出しも除去される可能性
main:
    CAL calculate_something
    ; CAL debug_print             ; 除去される
    RET
```

#### 9.3.4. ROM効率最適化の具体例

**最適化前後のROM使用量比較：**

```
最適化前（全関数を含む）:
  関数数: 15個
  ROM使用量: 1,200バイト
  
最適化後（到達可能な関数のみ）:
  関数数: 6個  
  ROM使用量: 480バイト
  
節約量: 720バイト (60%削減)
```

**メモリマップの最適化：**
```
最適化前のROMレイアウト:
0x0000-0x004B: 使用される関数 (480バイト)
0x004C-0x04AF: 未使用関数 (720バイト) ← 除去対象
0x04B0-0x07FF: 空き領域 (848バイト)

最適化後のROMレイアウト:  
0x0000-0x004B: 使用される関数 (480バイト)
0x004C-0x07FF: 空き領域 (1,568バイト) ← 大幅に拡大
```

この最適化により、限られた2KiBのROM領域をより効率的に活用でき、より複雑な機能を実装する余地が生まれます。

---

## 10章 クラスと構造体 (Classes and Structures)

### 10.1. アクセス指定子の実装

#### 10.1.1. public/privateのコンパイル時チェック

Z++のアクセス制御は完全にコンパイル時に実行され、実行時のオーバーヘッドはありません：

```zpp
class Sensor {
private:
    uint8 raw_value;     // プライベートメンバ
    bool is_calibrated;  // プライベートメンバ
    
public:
    void calibrate() {   // パブリックメソッド
        is_calibrated = true;
        raw_value = 0;
    }
    
    uint8 get_value() {  // パブリックメソッド
        if (!is_calibrated) {
            calibrate();
        }
        Input(SENSOR_PORT, raw_value);
        return raw_value;
    }
};

uint8 main() {
    Sensor temp_sensor;
    temp_sensor.calibrate();           // OK: public
    uint8 value = temp_sensor.get_value(); // OK: public
    // temp_sensor.raw_value = 100;    // エラー: private
    return value;
}
```

**コンパイラのアクセス制御チェック：**
```cpp
class AccessController {
private:
    struct MemberInfo {
        std::string name;
        AccessLevel access;  // PUBLIC, PRIVATE, PROTECTED
        MemberType type;     // VARIABLE, FUNCTION
    };
    
    std::map<std::string, std::vector<MemberInfo>> class_members;
    
public:
    bool check_member_access(const std::string& class_name, 
                           const std::string& member_name,
                           const std::string& access_context) {
        auto& members = class_members[class_name];
        
        for (const auto& member : members) {
            if (member.name == member_name) {
                if (member.access == PUBLIC) {
                    return true;  // パブリックは常にアクセス可能
                }
                
                if (member.access == PRIVATE) {
                    // プライベートはクラス内部からのみアクセス可能
                    return access_context == class_name;
                }
            }
        }
        
        return false;  // メンバが見つからない
    }
};
```

#### 10.1.2. デフォルトアクセス権の違い

**struct（デフォルト: public）：**
```zpp
struct Point {
    uint8 x;  // public（デフォルト）
    uint8 y;  // public（デフォルト）
    
private:
    bool is_valid;  // 明示的にprivate
    
public:
    void set_position(uint8 new_x, uint8 new_y) {
        x = new_x;
        y = new_y;
        is_valid = true;
    }
};
```

**class（デフォルト: private）：**
```zpp
class Rectangle {
    uint8 width;   // private（デフォルト）
    uint8 height;  // private（デフォルト）
    
public:
    void set_size(uint8 w, uint8 h) {
        width = w;
        height = h;
    }
    
    uint8 get_area() {
        return width * height;  // プライベートメンバにアクセス可能
    }
};
```

### 10.2. メモリレイアウトと実装詳細

#### 10.2.1. クラスのメモリ配置

```zpp
class SensorController {
private:
    uint8 sensor_id;      // オフセット 0
    uint8 current_value;  // オフセット 1
    bool is_active;       // オフセット 2
    uint8 calibration;    // オフセット 3
    
public:
    void initialize(uint8 id) {
        sensor_id = id;
        current_value = 0;
        is_active = false;
        calibration = 128;
    }
    
    void read_sensor() {
        if (is_active) {
            Input(sensor_id, current_value);
        }
    }
};

SensorController controller1;  // 4バイトのメモリ領域
SensorController controller2;  // 別の4バイトのメモリ領域
```

**メモリレイアウト：**
```
controller1 のメモリ配置:
アドレス 0x20: sensor_id      (1バイト)
アドレス 0x21: current_value  (1バイト)  
アドレス 0x22: is_active      (1バイト)
アドレス 0x23: calibration    (1バイト)

controller2 のメモリ配置:
アドレス 0x24: sensor_id      (1バイト)
アドレス 0x25: current_value  (1バイト)
アドレス 0x26: is_active      (1バイト)  
アドレス 0x27: calibration    (1バイト)
```

#### 10.2.2. メンバ関数の呼び出し実装

```zpp
controller1.initialize(5);
controller1.read_sensor();
```

**生成されるアセンブリ：**
```asm
; controller1.initialize(5) の呼び出し
APD controller1_offset, ap0, ap1  ; controller1のアドレス → ap1
MOV ap1, r1                       ; thisポインタをr1に設定
LDI r2, 5                         ; 引数id = 5
CAL SensorController_initialize

; controller1.read_sensor() の呼び出し
APD controller1_offset, ap0, ap1  ; controller1のアドレス → ap1
MOV ap1, r1                       ; thisポインタをr1に設定
CAL SensorController_read_sensor

; SensorController::initialize の実装
SensorController_initialize:
    ; r1 = thisポインタ, r2 = id
    
    ; sensor_id = id (オフセット0)
    MST r2, r1, 0
    
    ; current_value = 0 (オフセット1)
    LDI r3, 0
    MST r3, r1, 1
    
    ; is_active = false (オフセット2)
    LDI r3, 0
    MST r3, r1, 2
    
    ; calibration = 128 (オフセット3)
    LDI r3, 128
    MST r3, r1, 3
    
    RET

; SensorController::read_sensor の実装
SensorController_read_sensor:
    ; r1 = thisポインタ
    
    ; if (is_active) のチェック (オフセット2)
    MLD r2, r1, 2              ; is_activeをロード
    LDI r3, 0
    SUB r2, r3, r4
    BRH Z, read_sensor_end     ; falseなら終了
    
    ; Input(sensor_id, current_value)
    MLD r2, r1, 0              ; sensor_idをロード (オフセット0)
    APD r2, r0, ap2            ; ポートアドレス計算
    PLD r3, ap2, 0             ; ポートから入力
    MST r3, r1, 1              ; current_valueに格納 (オフセット1)
    
read_sensor_end:
    RET
```

### 10.3. コンストラクタとデストラクタ

#### 10.3.1. コンストラクタの実装

```zpp
class Timer {
private:
    uint8 duration;
    uint8 current_time;
    bool is_running;
    
public:
    Timer(uint8 initial_duration) {  // コンストラクタ
        duration = initial_duration;
        current_time = 0;
        is_running = false;
    }
    
    void start() {
        is_running = true;
        current_time = 0;
    }
    
    bool tick() {  // 1単位時間の経過
        if (!is_running) return false;
        
        current_time++;
        if (current_time >= duration) {
            is_running = false;
            return true;  // タイマー終了
        }
        return false;
    }
};

uint8 main() {
    Timer system_timer(100);  // コンストラクタ呼び出し
    system_timer.start();
    
    while (!system_timer.tick()) {
        // メインループ
    }
    
    return 0;
}
```

**コンストラクタの実装：**
```asm
; Timer system_timer(100); の処理
; 1. オブジェクトのメモリ確保（コンパイル時）
system_timer: .space 3      ; 3バイトの領域確保

; 2. コンストラクタ呼び出し
APD system_timer_offset, ap0, ap1  ; オブジェクトのアドレス
MOV ap1, r1                        ; thisポインタ
LDI r2, 100                        ; initial_duration = 100
CAL Timer_constructor

; Timer::Timer(uint8 initial_duration) の実装
Timer_constructor:
    ; r1 = thisポインタ, r2 = initial_duration
    
    ; duration = initial_duration (オフセット0)
    MST r2, r1, 0
    
    ; current_time = 0 (オフセット1)  
    LDI r3, 0
    MST r3, r1, 1
    
    ; is_running = false (オフセット2)
    LDI r3, 0
    MST r3, r1, 2
    
    RET
```

#### 10.3.2. インスタンス生成時の自動呼び出し

コンパイラは、オブジェクトの宣言を検出すると自動的にコンストラクタ呼び出しコードを生成します：

```cpp
class ObjectInstantiator {
public:
    void generate_object_creation(const ObjectDeclaration& decl) {
        // 1. メモリ領域の確保
        emit_memory_allocation(decl.class_name, decl.object_name);
        
        // 2. オブジェクトアドレスの設定
        emit("APD " + decl.object_name + "_offset, ap0, ap1");
        emit("MOV ap1, r1");  // thisポインタ設定
        
        // 3. コンストラクタ引数の設定
        for (size_t i = 0; i < decl.constructor_args.size(); i++) {
            emit_expression(decl.constructor_args[i], "r" + std::to_string(i + 2));
        }
        
        // 4. コンストラクタ呼び出し
        emit("CAL " + decl.class_name + "_constructor");
    }
};
```

### 10.4. メンバ関数のクラス外定義

#### 10.4.1. 宣言と定義の分離

```zpp
class Calculator {
private:
    uint8 accumulator;
    
public:
    Calculator();                    // コンストラクタ宣言
    void add(uint8 value);          // メンバ関数宣言
    void subtract(uint8 value);     // メンバ関数宣言
    uint8 get_result();             // メンバ関数宣言
};

// クラス外での定義
Calculator::Calculator() {
    accumulator = 0;
}

void Calculator::add(uint8 value) {
    accumulator += value;
}

void Calculator::subtract(uint8 value) {
    accumulator -= value;
}

uint8 Calculator::get_result() {
    return accumulator;
}
```

#### 10.4.2. ::演算子による名前解決

**コンパイラの::演算子処理：**
```cpp
class ScopeResolver {
public:
    std::string resolve_member_function(const std::string& class_name,
                                      const std::string& function_name) {
        // Calculator::add → Calculator_add に変換
        return class_name + "_" + function_name;
    }
    
    void validate_member_function_definition(const std::string& class_name,
                                           const std::string& function_name) {
        // クラス内に対応する宣言があることを確認
        if (!has_member_declaration(class_name, function_name)) {
            emit_error("Member function not declared in class");
        }
    }
};
```

**生成されるアセンブリ：**
```asm
; Calculator::Calculator()
Calculator_constructor:
    LDI r2, 0
    MST r2, r1, 0              ; accumulator = 0
    RET

; Calculator::add(uint8 value)
Calculator_add:
    ; r1 = thisポインタ, r2 = value
    MLD r3, r1, 0              ; accumulatorをロード
    ADD r3, r2, r4             ; accumulator + value
    MST r4, r1, 0              ; 結果を格納
    RET

; Calculator::subtract(uint8 value)  
Calculator_subtract:
    ; r1 = thisポインタ, r2 = value
    MLD r3, r1, 0              ; accumulatorをロード
    SUB r3, r2, r4             ; accumulator - value
    MST r4, r1, 0              ; 結果を格納
    RET

; Calculator::get_result()
Calculator_get_result:
    ; r1 = thisポインタ
    MLD r15, r1, 0             ; accumulatorを戻り値に
    RET
```

### 10.5. 継承・仮想関数非サポートの技術的理由

Z++では、8ビット環境の制約により、継承と仮想関数をサポートしていません：

#### 10.5.1. メモリ制約による制限

**仮想関数テーブルのメモリオーバーヘッド：**
```cpp
// もし仮想関数をサポートする場合の概算
class Base {
    virtual void func1();  // 仮想関数テーブル エントリ1
    virtual void func2();  // 仮想関数テーブル エントリ2
};

class Derived : public Base {
    virtual void func1() override;  // オーバーライド
    virtual void func3();           // 新しい仮想関数
};
```

```
仮想関数テーブルのメモリ使用量:
- Base クラス: 2エントリ × 2バイト = 4バイト
- Derived クラス: 3エントリ × 2バイト = 6バイト
- オブジェクトごとのvptrオーバーヘッド: 2バイト

小さなオブジェクト（例：3バイトの実データ）でも
5バイト（実データ3 + vptr2）になり、67%のオーバーヘッド
```

#### 10.5.2. 実行時オーバーヘッドの回避

**仮想関数呼び出しのコスト：**
```asm
; 通常の関数呼び出し（Z++の現在の実装）
CAL function_name              ; 1命令、直接呼び出し

; 仮想関数呼び出し（サポートした場合の想定）
MLD r1, object_addr, 0         ; vptrをロード
APD r1, vfunc_offset, ap1      ; 仮想関数テーブル内のオフセット計算  
MLD r2, ap1, 0                 ; 関数アドレスをロード
CAL [r2]                       ; 間接呼び出し
; 合計4命令、300%のオーバーヘッド
```

#### 10.5.3. 代替設計パターン

継承の代わりに、組み合わせ（composition）と明示的な委譲を推奨：

```zpp
// 継承の代わりに組み合わせを使用
struct SensorData {
    uint8 temperature;
    uint8 humidity;
};

struct DisplayController {
    uint8 port;
    
    void show_value(uint8 value) {
        Output(port, value);
    }
};

class EnvironmentMonitor {
private:
    SensorData sensors;           // 組み合わせ
    DisplayController display;    // 組み合わせ
    
public:
    EnvironmentMonitor(uint8 display_port) {
        display.port = display_port;
        sensors.temperature = 0;
        sensors.humidity = 0;
    }
    
    void update_and_display() {
        Input(TEMP_SENSOR_PORT, sensors.temperature);
        Input(HUMID_SENSOR_PORT, sensors.humidity);
        
        display.show_value(sensors.temperature);  // 明示的な委譲
    }
};
```

この設計により、継承の利点を保ちつつ、8ビット環境での効率性を維持しています。

---

## 付録

### 付録A: CPU命令対応表

Z++の全演算子とCPU命令の完全対応表：

#### A.1 算術演算子

| Z++演算子 | 説明 | CPU命令 | オペランド | フラグ影響 | 実行サイクル |
|-----------|------|---------|------------|------------|--------------|
| `a + b` | 加算 | `ADD rA, rB, rC` | r1=a, r2=b → r3=result | Z, C | 1サイクル |
| `a - b` | 減算 | `SUB rA, rB, rC` | r1=a, r2=b → r3=result | Z, C | 1サイクル |
| `a * b` | 乗算(下位) | `MUL rA, rB, rC` | r1=a, r2=b → r3=low | なし | 3サイクル |
| `a ** b` | 乗算(上位) | `MUH rA, rB, rC` | r1=a, r2=b → r3=high | なし | 3サイクル |
| `a / b` | 除算 | `DIV rA, rB, rC` | r1=a, r2=b → r3=商 | なし | 8サイクル |
| `a % b` | 剰余 | `MOD rA, rB, rC` | r1=a, r2=b → r3=余り | なし | 8サイクル |
| `++a` | 前置増分 | `ADI rA, 1` | r1=a → r1=a+1 | Z, C | 1サイクル |
| `--a` | 前置減分 | `SBI rA, 1` | r1=a → r1=a-1 | Z, C | 1サイクル |

#### A.2 ビット演算子

| Z++演算子 | 説明 | CPU命令 | 実装方法 | 実行サイクル |
|-----------|------|---------|----------|--------------|
| `a & b` | ビットAND | `AND rA, rB, rC` | 直接実装 | 1サイクル |
| `a \| b` | ビットOR | 複合実装 | `~(~a & ~b)` | 4サイクル |
| `a ^ b` | ビットXOR | `XOR rA, rB, rC` | 直接実装 | 1サイクル |
| `~a` | ビットNOT | `NOR rA, r0, rB` | r0との論理和否定 | 1サイクル |
| `a << b` | 左シフト | `LSH rA, rB, rC` | 直接実装 | 1サイクル |
| `a >> b` | 右シフト | `RSH rA, rB, rC` | 直接実装 | 1サイクル |

#### A.3 比較演算子

| Z++演算子 | 説明 | 実装方法 | 使用フラグ | 実行サイクル |
|-----------|------|----------|------------|--------------|
| `a == b` | 等しい | `SUB rA, rB, rC` → `BRH Z` | Z | 2サイクル |
| `a != b` | 等しくない | `SUB rA, rB, rC` → `BRH NZ` | Z | 2サイクル |
| `a < b` | 小なり | `SUB rA, rB, rC` → `BRH C` | C | 2サイクル |
| `a >= b` | 大なりイコール | `SUB rA, rB, rC` → `BRH NC` | C | 2サイクル |
| `a > b` | 大なり | 複合実装 | `!(a <= b)` | 4サイクル |
| `a <= b` | 小なりイコール | 複合実装 | `(a < b) \|\| (a == b)` | 4サイクル |

#### A.4 メモリアクセス

| Z++操作 | 説明 | CPU命令 | 実行サイクル |
|---------|------|---------|--------------|
| `var = value` | 変数代入 | `MST rA, apB, offset` | 2サイクル |
| `value = var` | 変数読み込み | `MLD rA, apB, offset` | 2サイクル |
| `array[i] = value` | 配列書き込み | `APD` + `MST` | 3サイクル |
| `value = array[i]` | 配列読み込み | `APD` + `MLD` | 3サイクル |

### 付録B: メモリマップ詳細

#### B.1 RAMメモリマップ (256バイト)

```
アドレス範囲    用途                詳細説明                    推奨使用量
0x00-0x0F      システム予約         割り込みベクタ、スタック     16バイト (固定)
0x10-0x1F      グローバル変数       プログラム全体で共有         ≤16バイト
0x20-0x7F      ローカル変数プール   関数の自動変数              ≤96バイト  
0x80-0xDF      動的スタック         関数呼び出し、一時保存       ≤96バイト
0xE0-0xEF      一時計算バッファ     複雑な式の中間結果          ≤16バイト
0xF0-0xFF      I/Oバッファ         入出力データの一時保存       ≤16バイト
```

#### B.2 ROMメモリマップ (2KiB = 2048バイト)

```
アドレス範囲       用途                  説明
0x0000-0x0007     リセットベクタ         プログラム開始アドレス
0x0008-0x000F     予約領域              将来の拡張用
0x0010-0x07FF     プログラムコード       コンパイル済みZ++コード
0x0800-0x0FFF     定数データ            const定数、文字列リテラル
```

#### B.3 I/Oポートマップ

```
ポート番号  方向    用途                推奨用途例
0-3        出力    汎用デジタル出力     LED、リレー、モーター制御
4-7        出力    PWM出力             サーボ、ブザー、調光
8-11       入力    汎用デジタル入力     スイッチ、センサー
12-15      入力    アナログ入力         温度、電圧、光センサー
```

### 付録C: 最適化ガイド

#### C.1 メモリ使用量最適化

**1. const定数の活用**
```zpp
// 悪い例（RAM消費）
uint8 LED_PINS[4] = {1, 2, 3, 4};  // 4バイト + 初期化コード

// 良い例（RAM節約）
const uint8 LED_PIN_0 = 1;
const uint8 LED_PIN_1 = 2;
const uint8 LED_PIN_2 = 3;
const uint8 LED_PIN_3 = 4;
```

**2. ローカル変数のスコープ制限**
```zpp
// 悪い例（大きなスコープ）
void process_data() {
    uint8 temp_buffer[32];  // 32バイトが関数全体で占有
    uint8 result = 0;
    
    // 長い処理...
    for (uint8 i = 0; i < 100; i++) {
        // temp_bufferを使わない処理
    }
    
    // temp_bufferを実際に使う処理
    for (uint8 j = 0; j < 32; j++) {
        temp_buffer[j] = get_data(j);
    }
}

// 良い例（スコープ制限）
void process_data() {
    uint8 result = 0;
    
    // 長い処理...
    for (uint8 i = 0; i < 100; i++) {
        // メモリを節約
    }
    
    // 必要な時だけバッファを使用
    {
        uint8 temp_buffer[32];  // 限定的なスコープ
        for (uint8 j = 0; j < 32; j++) {
            temp_buffer[j] = get_data(j);
        }
        // ここでtemp_bufferは解放される
    }
}
```

#### C.2 実行速度最適化

**1. レジスタ効率を考慮したループ**
```zpp
// 悪い例（メモリアクセス多）
for (uint8 i = 0; i < count; i++) {
    array[i] = array[i] * 2;  // 2回のメモリアクセス/イテレーション
}

// 良い例（レジスタ最適化）
for (uint8 i = 0; i < count; i++) {
    uint8 temp = array[i];    // 1回読み込み
    temp *= 2;                // レジスタ内で計算
    array[i] = temp;          // 1回書き込み
}
```

**2. 分岐予測を考慮したif文**
```zpp
// 悪い例（予測しにくい分岐）
if (rare_condition) {         // 分岐予測ミス率が高い
    handle_rare_case();
} else {
    handle_common_case();
}

// 良い例（予測しやすい分岐）
if (!rare_condition) {        // よくあるケースを先に
    handle_common_case();
} else {
    handle_rare_case();
}
```

#### C.3 ROM使用量最適化

**1. 関数のインライン化**
```zpp
// 小さな関数は自動的にインライン化される
inline uint8 square(uint8 x) {
    return x * x;
}

// 使用箇所でインライン展開
uint8 area = square(side);  // → uint8 area = side * side;
```

**2. デッドコード除去の活用**
```zpp
// 条件付きコンパイル
const bool FEATURE_ENABLED = false;

void optional_feature() {
    if (FEATURE_ENABLED) {    // 常にfalse
        // この部分は完全に除去される
        complex_processing();
    }
}
```

### 付録D: デバッグ・トラブルシューティング

#### D.1 よくあるコンパイルエラー

**1. 型変換エラー**
```
エラー: Cannot implicitly convert 'uint8' to 'enum DeviceState'
解決: 明示的キャストを使用
DeviceState state = (DeviceState)raw_value;
```

**2. スコープエラー**  
```
エラー: 'variable_name' is not accessible from this scope
解決: アクセス指定子を確認、またはusing宣言を追加
```

**3. メモリ不足エラー**
```
エラー: Insufficient RAM for local variables
解決: ローカル変数のサイズを削減、またはstatic変数に変更
```

#### D.2 実行時問題の診断

**1. Run.Debugの活用**
```zpp
uint8 problematic_function(uint8 input) {
    Run.Debug("Function entry", input);
    
    uint8 intermediate = input * 2;
    Run.Debug("After multiplication", intermediate);
    
    if (intermediate > 200) {
        intermediate = 200;
        Run.Debug("Value clamped", intermediate);
    }
    
    return intermediate;
}
```

**2. ハードウェアI/Oの確認**
```zpp
void test_io_ports() {
    // ポート動作確認
    for (uint8 port = 0; port < 16; port++) {
        Output(port, 0xFF);  // 全ビットセット
        Run.Debug("Port test", port, 0xFF);
        
        Output(port, 0x00);  // 全ビットクリア  
        Run.Debug("Port clear", port, 0x00);
    }
}
```

### 付録E: サンプルプログラム集

#### E.1 温度監視システム

```zpp
#include "system.zpp"

namespace Hardware {
    const uint8 TEMP_SENSOR_PORT = 1;
    const uint8 FAN_CONTROL_PORT = 2;
    const uint8 ALERT_LED_PORT = 3;
}

class TemperatureController {
private:
    uint8 current_temp;
    uint8 target_temp;
    bool alert_active;
    
public:
    TemperatureController(uint8 target) {
        target_temp = target;
        current_temp = 0;
        alert_active = false;
    }
    
    void update() {
        // 温度読み取り
        Input(Hardware::TEMP_SENSOR_PORT, current_temp);
        
        // ファン制御
        if (current_temp > target_temp + 5) {
            Output(Hardware::FAN_CONTROL_PORT, 255);  // 最大風量
            alert_active = true;
        } else if (current_temp > target_temp) {
            uint8 fan_speed = (current_temp - target_temp) * 50;
            Output(Hardware::FAN_CONTROL_PORT, fan_speed);
            alert_active = false;
        } else {
            Output(Hardware::FAN_CONTROL_PORT, 0);    // ファン停止
            alert_active = false;
        }
        
        // アラート表示
        Output(Hardware::ALERT_LED_PORT, alert_active ? 255 : 0);
    }
    
    uint8 get_temperature() {
        return current_temp;
    }
};

uint8 main() {
    TemperatureController controller(75);  // 目標温度75度
    
    // メインループ
    while (true) {
        controller.update();
        
        // 1秒待機（実装依存）
        Run.AsmBlock {
            LDI r1, 100
        delay_loop:
            SBI r1, 1
            BRH NZ, delay_loop
        };
    }
    
    return 0;
}
```

#### E.2 多チャンネルPWM制御

```zpp
const uint8 PWM_CHANNELS = 4;
const uint8 PWM_RESOLUTION = 100;  // 1%刻み

struct PWMChannel {
    uint8 port;
    uint8 duty_cycle;  // 0-100%
    uint8 counter;
};

class PWMController {
private:
    PWMChannel channels[PWM_CHANNELS];
    uint8 master_counter;
    
public:
    PWMController() {
        master_counter = 0;
        
        for (uint8 i = 0; i < PWM_CHANNELS; i++) {
            channels[i].port = i;
            channels[i].duty_cycle = 0;
            channels[i].counter = 0;
        }
    }
    
    void set_duty_cycle(uint8 channel, uint8 duty) {
        if (channel < PWM_CHANNELS && duty <= 100) {
            channels[channel].duty_cycle = duty;
        }
    }
    
    void update() {
        // PWM周期更新
        master_counter++;
        if (master_counter >= PWM_RESOLUTION) {
            master_counter = 0;
        }
        
        // 各チャンネルのPWM出力
        for (uint8 i = 0; i < PWM_CHANNELS; i++) {
            bool output_high = (master_counter < channels[i].duty_cycle);
            Output(channels[i].port, output_high ? 255 : 0);
        }
    }
};

uint8 main() {
    PWMController pwm;
    
    // 初期デューティ比設定
    pwm.set_duty_cycle(0, 25);   // チャンネル0: 25%
    pwm.set_duty_cycle(1, 50);   // チャンネル1: 50%
    pwm.set_duty_cycle(2, 75);   // チャンネル2: 75%
    pwm.set_duty_cycle(3, 100);  // チャンネル3: 100%
    
    // PWM更新ループ
    while (true) {
        pwm.update();
        
        // 高速更新（PWM周波数確保）
        Run.Asm("NOP");
    }
    
    return 0;
}
```

---

## おわりに

本仕様書「Z++詳細言語仕様書 v3.0」は、8ビット組み込みシステム開発のためのプログラミング言語Z++の完全な技術文書です。

### Z++ v3.0の特徴の総括

1. **透明性**: すべての高級言語構造が予測可能なアセンブリコードに変換される
2. **効率性**: 8ビットCPUアーキテクチャを最大限活用する最適化
3. **表現力**: 複雑な低レベル操作を直感的な構文で記述可能  
4. **実用性**: リアルタイムシステム開発に必要な機能を完備

### 技術的成果

- **ゼロコスト抽象化**: 高級言語の機能が実行時オーバーヘッドを発生させない
- **完全なデッドコード除去**: 未使用コードの完全排除によるROM効率化
- **予測可能なパフォーマンス**: すべての操作の実行時間が事前計算可能
- **型安全性**: コンパイル時の厳密な型チェックによる信頼性向上

Z++を使用することで、8ビット組み込みシステムの開発において、アセンブリ言語の効率性とC++の表現力を同時に享受することが可能になります。

本仕様書が、8ビット組み込みシステム開発者の皆様にとって有用な技術資料となることを願っています。

---

**Z++ v3.0 詳細言語仕様書**  
**発行日**: 2024年  
**バージョン**: 3.0  
**文書形式**: Markdown  
**文字コード**: UTF-8

