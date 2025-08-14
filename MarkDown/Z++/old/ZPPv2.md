# Z++詳細言語仕様書 v2.0

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

---

## 1章 はじめに (Introduction)

### 1.1. Z++とは
Z++は、本ドキュメントで規定される**8ビットCPU向けに設計された、C++ライクな静的型付け高級プログラミング言語**です。C++の強力な表現力と抽象化能力を継承しつつ、リソースが限られた8ビット環境でも効率的に動作するよう、仕様が最適化されています。

Z++で記述されたソースコードの拡張子は **`.zpp`** とします。

### 1.2. 設計思想
Z++は、以下の3つの原則を重視して設計されています。

- **透明性 (Transparency):** Z++のコードが、最終的にどのようなアセンブリコードに変換されるかを予測しやすくします。これにより、開発者はパフォーマンスクリティカルな部分を意識したコーディングが可能です。
- **効率性 (Efficiency):** 生成されるコードは、ターゲットCPUのアーキテクチャを最大限に活用し、メモリ使用量と実行速度の両面で高い効率を目指します。
- **表現力 (Expressiveness):** 低レベルな記述を極力避け、ハードウェアの機能を抽象化された直感的な構文（特にI/O操作）で記述できるようにします。

---

## 2章 字句構造 (Lexical Structure)

### 2.1. コメント (Comments)
ソースコード内に記述できる、プログラムの動作に影響を与えない注釈です。

#### 単一行コメント
`//` から行末までがコメントになります。
```zpp
uint8 led_pin = 3; // LEDを接続するピン番号
```

#### 複数行コメント
`/*` と `*/` で囲まれた範囲がコメントになります。
```zpp
/*
    このブロックは複数行にわたる
    コメントのサンプルです。
*/
```

### 2.2. 識別子 (Identifiers)
変数名、関数名、型名などに使用される名前です。

- **命名規則:** 英字 (`a-z`, `A-Z`) またはアンダースコア (`_`) で始まり、2文字目以降は英数字とアンダースコアが使用できます。
- **大文字・小文字の区別:** 区別されます。`myValue` と `myvalue` は異なる識別子です。
- **例:** `counter`, `_status`, `ADC_Read_Value`

### 2.3. キーワード (Keywords)
言語の文法上、特別な意味を持つ予約語です。識別子として使用することはできません。

```
uint8 bool void const if else while do for return switch case default break 
Output Input Run struct class public private sizeof using namespace true false
```

### 2.4. リテラル (Literals)
ソースコードに直接記述される値です。

- **10進数リテラル:** `123`
- **16進数リテラル:** `0xFF` (接頭辞 `0x` を使用)
- **2進数リテラル:** `0b10101010` (接頭辞 `0b` を使用)
- **ブール値リテラル:** `true`, `false`

---

## 3章 データ型、変数、定数 (Data Types, Variables, and Constants)

### 3.1. データ型
Z++で利用可能な基本的なデータ型は以下の通りです。

| 型名 | 説明 | サイズ | 値の範囲 |
|------|------|--------|----------|
| `uint8` | 符号なし8ビット整数型 | 8ビット | 0 から 255 |
| `bool` | ブール値型 | 8ビット | `true` (1) または `false` (0) |
| `void` | 値が存在しないことを示す特殊な型 | - | - |
| `enum` | 関連する定数群をまとめた独自の型 | 8ビット | 詳細は3.7章参照 |
| `struct` | 複数の変数をまとめた複合データ型 | メンバの合計 | 詳細は3.4章参照 |
| `class` | データとメソッドをまとめた複合データ型 | メンバの合計 | 詳細は3.5章参照 |
| 配列 | 同じ型のデータを連続格納するデータ構造 | 要素数×要素サイズ | 詳細は3.6章参照 |

### 3.2. 変数 (Variables)
値を格納するための名前付きメモリ領域です。

#### 宣言と初期化
```zpp
uint8 life;          // 宣言のみ
uint8 score = 100;   // 宣言と同時に初期化
bool is_running = true; // ブール値の初期化
```

#### スコープ (有効範囲)
- **ブロックスコープ:** `{}` で囲まれたブロック内で宣言された変数は、そのブロック内でのみ有効
- **グローバルスコープ:** いずれのブロックにも属さずに宣言された変数は、プログラム全体からアクセス可能

### 3.3. 定数 (`const`)
一度値を代入すると変更できなくなる変数です。

#### 特徴
- **目的:** 変更されては困る値（ピン番号、設定値など）を安全に扱う
- **メモリ配置:** **ROM領域**に配置されるため、**RAMを消費しません**
- **宣言:** `const uint8 定数名 = 値;` または `const bool 定数名 = 値;`
- **制約:** コンパイル時に値が確定している必要がある

#### アセンブリレベルの動作
`const` で宣言された定数は、アセンブラの `.define` ディレクティブに変換され、コード中のシンボルが即値に置換されます。

#### 使用例
```zpp
const uint8 LED_PIN = 3;
const uint8 SENSOR_PORT = 2;
const bool DEBUG_MODE = true;
Output(255, LED_PIN); // ポート3のLEDを最大輝度で点灯
```

### 3.4. 構造体 (struct) - データ集約のための型

`struct` は、複数の異なる型の変数を一つのまとまりとして扱うための機能です。

#### 3.4.1. 構造体とクラスの基本的な違い
`struct` と `class` の唯一の違いは、**デフォルトのアクセス指定子**です。

- **`struct` のデフォルトは public:** データ集約を主目的とし、外部から自由にアクセスできることを前提
- **`class` のデフォルトは private:** カプセル化を主目的とし、内部状態を隠蔽することを前提

#### 3.4.2. 使用例

```zpp
// 2次元座標を表す 'Point' 構造体
struct Point {
    // デフォルトで public:
    uint8 x;
    uint8 y;

    // デフォルトコンストラクタ (原点(0, 0)で初期化)
    Point() {
        x = 0;
        y = 0;
    }

    // 座標を移動させるメンバ関数
    void move(uint8 dx, uint8 dy) {
        x += dx;
        y += dy;
    }

    // 原点からの距離の2乗を返すメンバ関数
    uint8 distance_sq_from_origin() {
        uint8 x_sq_low = x * x;
        uint8 y_sq_low = y * y;
        return x_sq_low + y_sq_low;
    }
};

// 使用例
uint8 main() {
    struct Point p1;  // デフォルトコンストラクタが呼ばれる
    
    p1.x = 10;        // メンバは public なので直接アクセス可能
    p1.y = 20;
    
    p1.move(5, 10);   // p1 は (15, 30) になる
    
    uint8 dist_sq = p1.distance_sq_from_origin();
    
    return 0;
}
```

### 3.5. クラス (class) - カプセル化のための型

`class` は、データ（メンバ変数）と、そのデータを操作するための一連の手続き（メンバ関数）を一つにまとめたものです。

#### 3.5.1. アクセス指定子 `public`/`private`

| アクセス指定子 | 説明 |
|----------------|------|
| `public` | クラスの外部からアクセス可能。クラスのインターフェースを構成 |
| `private` | そのクラスのメンバ関数からのみアクセス可能。内部状態を隠蔽 |

#### 3.5.2. クラスの使用例

```zpp
// タイマークラスの定義
class Timer {
public:
    Timer();                            // コンストラクタ
    void set_limit(uint8 new_limit);
    void tick();
    bool has_expired();

private:
    uint8 counter;
    uint8 limit;
    bool is_expired;
};

// メンバ関数の実装 (クラス外定義)
Timer::Timer() {
    counter = 0;
    limit = 255;
    is_expired = false;
}

void Timer::set_limit(uint8 new_limit) {
    limit = new_limit;
}

void Timer::tick() {
    counter = counter + 1;
    if (counter >= limit) {
        is_expired = true;
        counter = 0;
    }
}

bool Timer::has_expired() {
    if (is_expired == true) {
        is_expired = false;
        return true;
    }
    return false;
}

// 使用例
uint8 main() {
    class Timer short_timer;
    class Timer long_timer;

    short_timer.set_limit(100);
    long_timer.set_limit(200);

    for (uint8 i = 0; i < 255; i++) {
        short_timer.tick();
        long_timer.tick();

        if (short_timer.has_expired()) {
            Output(0, 1);  // ポート0に1を出力
        }

        if (long_timer.has_expired()) {
            Output(1, 1);  // ポート1に1を出力
        }
    }

    return 0;
}
```

### 3.6. 配列 (array)

同じデータ型の要素を、連続したメモリ領域に複数格納するためのデータ構造です。

#### 宣言と初期化
```zpp
uint8 scores[10];                      // uint8型の要素を10個持つ配列
struct Point path[5];                  // struct Point型の要素を5個持つ配列
bool flags[8];                         // bool型の要素を8個持つ配列

uint8 pins[4] = {2, 3, 4, 5};         // 初期値を指定
uint8 data[5] = {10, 20};              // {10, 20, 0, 0, 0} として初期化
bool settings[3] = {true, false, true}; // ブール値配列の初期化
```

#### 要素へのアクセス
```zpp
scores[0] = 100;                       // 最初の要素に値を代入
uint8 first_score = scores[0];         // 最初の要素の値を取得
flags[2] = true;                       // ブール値配列への代入
```

#### 多次元配列
```zpp
uint8 matrix[3][4];                    // 3行4列の2次元配列
matrix[1][2] = 1;                      // 2行目3列目の要素にアクセス
```

### 3.7. 列挙型 (enum) - 型安全な定数グループ

`enum`（列挙型）は、関連する定数群を一つのグループとしてまとめ、それに**独自の新しい「型」を与える**機能です。

#### 3.7.1. `enum`の定義と使い方

```zpp
// 信号機の状態を表す、'TrafficSignal'という新しい型を定義
enum TrafficSignal {
    RED,      // 自動的に 0 が割り当てられる
    YELLOW,   // 自動的に 1 が割り当てられる
    BLUE      // 自動的に 2 が割り当てられる
};

// 使用方法
enum TrafficSignal current_signal;
current_signal = TrafficSignal::RED;

if (current_signal == TrafficSignal::YELLOW) {
    // 黄信号の場合の処理
}
```

#### 3.7.2. 基底となる整数値の指定

```zpp
enum DeviceCommand {
    RESET = 0,
    START = 1,
    SET_SPEED = 0x10,     // 16進数で16を指定
    GET_STATUS = 0x20
};
```

#### 3.7.3. 型変換の規則

| 変換の種類 | 例 | 許可 | 結果の型 | 備考 |
|------------|----|----- |----------|------|
| `enum` → `uint8` | `uint8 i = LedState::ON;` | **OK (暗黙的)** | `uint8` | 常に安全 |
| `uint8` → `enum` | `LedState s = 1;` | **エラー** | - | 型安全性を保証 |
| `uint8` → `enum` (キャスト) | `LedState s = (LedState)1;` | **OK (明示的)** | `enum LedState` | プログラマの責任 |

---

## 4章 式と演算子 (Expressions and Operators)

### 4.1. 算術演算子

| 演算子 | 説明 | CPU命令対応 | 備考 |
|--------|------|-------------|------|
| `+` | 加算 | ADD | オーバーフローでラップアラウンド |
| `-` | 減算 | SUB | |
| `*` | 乗算（下位） | MUL | 8ビット結果の下位8ビット |
| `**` | 乗算（上位） | MUH | 8ビット結果の上位8ビット |
| `/` | 除算 | DIV | 商（整数部） |
| `%` | 剰余 | MOD | 余り |
| `++` | インクリメント | - | 前置・後置両対応 |
| `--` | デクリメント | - | 前置・後置両対応 |
| `+=`, `-=`, `*=`, `**=`, `/=`, `%=` | 複合代入演算子 | - | |

#### 乗算の例
```zpp
uint8 a = 10;
uint8 b = 3;
uint8 product_low = a * b;   // product_low は 30
uint8 product_high = a ** b; // product_high は 0
uint8 quotient = a / b;      // quotient は 3
uint8 remainder = a % b;     // remainder は 1
```

### 4.2. 比較演算子

| 演算子 | 説明 | 戻り値型 |
|--------|------|----------|
| `==` | 等しい | `bool` |
| `!=` | 等しくない | `bool` |
| `<` | 小なり | `bool` |
| `>` | 大なり | `bool` |
| `<=` | 小なりイコール | `bool` |
| `>=` | 大なりイコール | `bool` |

### 4.3. 論理演算子

| 演算子 | 説明 | 特徴 |
|--------|------|------|
| `&&` | 論理AND | 短絡評価をサポート |
| `||` | 論理OR | 短絡評価をサポート |
| `!` | 論理NOT | 単項演算子 |

### 4.4. ビット単位演算子

| 演算子 | 説明 | CPU命令対応 |
|--------|------|-------------|
| `&` | ビットAND | AND |
| `|` | ビットOR | - |
| `^` | ビットXOR | XOR |
| `~` | ビットNOT | NOR（`r0`との組み合わせ） |
| `<<` | 左シフト | LSH |
| `>>` | 右シフト | RSH |

### 4.5. その他の演算子

| 演算子 | 説明 | 使用例 |
|--------|------|--------|
| `&` | アドレス演算子 | `&variable` |
| `.` | メンバアクセス | `p.x` |
| `->` | ポインタ経由メンバアクセス | `ptr->x` |
| `::` | スコープ解決 | `Class::member` |
| `sizeof` | サイズ取得 | `sizeof(uint8)` |
| `[]` | 配列アクセス | `arr[0]` |

---

## 5章 演算子の優先順位

優先順位が高いものほど先に評価されます。

| 優先順位 | 演算子 | 結合方向 | 説明 |
|----------|--------|----------|------|
| 1 (最高) | `()`, `[]`, `.`, `->` | 左→右 | 関数呼び出し、配列添字、メンバアクセス |
| 2 | `++`, `--` (後置) | 左→右 | 後置インクリメント・デクリメント |
| 3 | `**` | 左→右 | 乗算（上位） |
| 4 | `++`, `--`, `!`, `~`, `&`, `sizeof` (単項) | **右→左** | 単項演算子 |
| 5 | `*`, `/`, `%` | 左→右 | 乗除算 |
| 6 | `+`, `-` | 左→右 | 加減算 |
| 7 | `<<`, `>>` | 左→右 | ビットシフト |
| 8 | `<`, `>`, `<=`, `>=` | 左→右 | 関係演算子 |
| 9 | `==`, `!=` | 左→右 | 等価演算子 |
| 10 | `&` | 左→右 | ビットAND |
| 11 | `^` | 左→右 | ビットXOR |
| 12 | `|` | 左→右 | ビットOR |
| 13 | `&&` | 左→右 | 論理AND |
| 14 | `||` | 左→右 | 論理OR |
| 15 (最低) | `=`, `+=`, `-=`, `*=`, `**=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=` | **右→左** | 代入演算子 |

---

## 6章 文と制御構造 (Statements and Control Structures)

### 6.1. if - else if - else 文

条件に基づいて実行フローを分岐させる基本的な制御構造です。

#### 使用例
```zpp
// 温度に応じてファンを制御する例
if (temperature > 100) {
    // 危険な状態。ファンを最大でONにする
    Output(FAN_PORT, 255);
} else if (temperature > 60) {
    // 注意が必要な状態。ファンを中速で回す
    Output(FAN_PORT, 128);
} else {
    // 正常な状態。ファンを停止する
    Output(FAN_PORT, 0);
}
```

### 6.2. while ループ

指定された条件が真である間、繰り返し処理を実行する制御構造です。

#### 使用例
```zpp
// ポート2のボタンが押されるまで待機する
bool button_pressed = false;
Input(2, button_pressed);
while (!button_pressed) {
    Input(2, button_pressed);
}
// ボタンが押された後の処理
```

### 6.3. do-while ループ

最初に必ず一度ブロック内の処理を実行してから、条件式を評価する制御構造です。

#### 使用例
```zpp
// センサーの初期化処理
uint8 sensor_status;
do {
    // センサーからステータスを読み込む
    Input(SENSOR_PORT, sensor_status);
} while (sensor_status != 1);
```

### 6.4. for ループ

カウンタ変数を使った繰り返し処理を簡潔に記述する制御構造です。

#### 使用例
```zpp
// ポート1のLEDを0から255まで徐々に明るくする
for (uint8 brightness = 0; brightness <= 255; brightness++) {
    Output(1, brightness);
}
```

### 6.5. switch 文

一つの変数の値に応じて、複数の分岐先から一つを選択する多方向分岐の制御構造です。

#### 使用例
```zpp
enum OperationMode { STANDBY, RUNNING, ERROR_STATE };
enum OperationMode current_mode = OperationMode::STANDBY;

switch (current_mode) {
    case OperationMode::STANDBY:
        // スタンバイモードの処理
        Output(STATUS_LED, 0);
        break;
    case OperationMode::RUNNING:
        // 実行モードの処理
        Output(STATUS_LED, 255);
        break;
    case OperationMode::ERROR_STATE:
    default:
        // エラーまたは未定義状態の処理
        Output(STATUS_LED, 128);
        break;
}
```

### 6.6. break 文と return 文

#### break 文
最も近い外側のループまたは `switch` 文を強制終了します。

#### return 文
現在の関数の実行を終了し、呼び出し元に制御を戻します。

```zpp
// 配列内から特定の値を検索する関数
bool find_value(uint8 arr[], uint8 size, uint8 target) {
    for (uint8 i = 0; i < size; i++) {
        if (arr[i] == target) {
            return true; // 見つかったら即座に関数を終了
        }
    }
    return false; // 見つからなかった場合
}
```

---

## 7章 関数 (Functions)

### 7.1. 関数の定義と呼び出し

一連の処理をまとめて名前を付け、再利用できるようにした機能です。

#### 基本例
```zpp
// 2つのuint8を加算して返す関数
uint8 add(uint8 a, uint8 b) {
    return a + b;
}

// ブール値を返す関数
bool is_even(uint8 value) {
    return (value % 2) == 0;
}

// 関数の呼び出し
uint8 result = add(10, 20);         // result に 30 が代入される
bool check = is_even(result);       // check に false が代入される
```

#### 7.1.1. デフォルト引数

関数の宣言時に、引数にデフォルト値を指定できます。

```zpp
void set_led(uint8 pin, uint8 brightness = 255, bool blink = false);

// 呼び出し例
set_led(3);              // pin=3, brightness=255, blink=false
set_led(3, 128);         // pin=3, brightness=128, blink=false
set_led(3, 128, true);   // pin=3, brightness=128, blink=true
```

### 7.2. 呼び出し規約 (Calling Convention)

#### 引数の渡し方

##### 値渡し (デフォルト)
`uint8`, `bool`, `struct`, `class` などの引数は、値がコピーされて渡されます。

##### 参照渡し (`&`)
型名の後に `&` を付けると、変数のメモリアドレスが渡されます。

```zpp
// 値渡し: 値のコピーが渡される
void process_value(uint8 val);

// 参照渡し: 変数のアドレスが渡される
void modify_value(uint8& val);

uint8 my_value = 10;
process_value(my_value);  // my_value は変更されない
modify_value(my_value);   // my_value が変更される可能性
```

#### レジスタ割り当て

| 引数 | レジスタ | 備考 |
|------|----------|------|
| 第1引数 | `r1` | クラスのメンバ関数では`this`ポインタが使用 |
| 第2引数 | `r2` | |
| 第3引数 | `r3` | |
| 第4引数 | `r4` | |
| 戻り値 | `r15` | `uint8`または`bool`の戻り値 |

---

## 8章 組み込み機能 (Built-in Features)

### 8.1. I/O操作関数

Z++では、ハードウェアとの通信を行うための専用の組み込み関数を提供します。

#### 8.1.1. 基本I/O関数

##### `Output(Port, Value)`
指定したポートに値を出力します。

```zpp
Output(Port, Value);
```

**パラメータ:**
- `Port`: `uint8`型変数、数式、数値、配列要素（出力ポート番号）
- `Value`: `uint8`型変数、`bool`型変数、数式、数値、配列要素

**使用例:**
```zpp
const uint8 LED_PORT = 3;
uint8 brightness = 128;
bool led_state = true;
uint8 ports[4] = {0, 1, 2, 3};
uint8 values[4] = {255, 128, 64, 32};
uint8 matrix[2][3] = {{10, 20, 30}, {40, 50, 60}};

Output(LED_PORT, brightness);           // ポート3に128を出力
Output(0, 255);                         // ポート0に255を出力
Output(LED_PORT + 1, led_state);        // ポート4にtrue(1)を出力
Output(ports[1], values[2]);            // ポート1に64を出力
Output(ports[0], matrix[1][2]);         // ポート0に60を出力
```

##### `Input(Port, Var)`
指定したポートから値を読み込み、変数に格納します。

```zpp
Input(Port, Var);
```

**パラメータ:**
- `Port`: `uint8`型変数、数式、数値、配列要素（入力ポート番号）
- `Var`: `uint8`型変数、`bool`型変数、配列要素（読み込み先の変数）

**使用例:**
```zpp
const uint8 SENSOR_PORT = 2;
uint8 sensor_value;
bool button_pressed;
uint8 ports[4] = {0, 1, 2, 3};
uint8 sensor_data[8];
bool switches[4];

Input(SENSOR_PORT, sensor_value);       // ポート2から値を読み込み
Input(0, button_pressed);               // ポート0からブール値を読み込み
Input(ports[2], sensor_data[0]);        // ポート2から値をsensor_data[0]に読み込み
Input(SENSOR_PORT + 1, switches[1]);    // ポート3から値をswitches[1]に読み込み
```

#### 8.1.2. 配列I/O関数

##### `Output(Port, Array, Length)`
配列の内容を指定したポートに連続して出力します。

```zpp
Output(Port, Array, Length);
```

**パラメータ:**
- `Port`: `uint8`型変数、数式、数値、配列要素（出力開始ポート番号）
- `Array`: 配列の開始要素（`array[start_idx]`の形式で開始位置を指定）
- `Length`: `uint8`型変数、数式、数値（出力する要素数）

**動作:**
指定されたポートから、配列の指定された開始位置から指定された長さ分の要素を**同一ポートに連続して**出力します。

**使用例:**
```zpp
uint8 led_values[8] = {255, 128, 64, 32, 16, 8, 4, 2};
uint8 matrix[3][4] = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
uint8 ports[4] = {0, 1, 2, 3};

// ポート0にled_values[0]から4要素を連続出力 (255, 128, 64, 32)
Output(0, led_values[0], 4);

// ポート2にled_values[2]から3要素を連続出力 (64, 32, 16)
Output(2, led_values[2], 3);

// ポート1にmatrix[1][1]から3要素を連続出力 (6, 7, 8)
Output(1, matrix[1][1], 3);

// ポート配列を使用してports[1]に連続出力
Output(ports[1], led_values[4], 2);  // ポート1に16, 8を連続出力

// 全配列を出力
Output(0, led_values[0], 8);         // ポート0に全8要素を連続出力
```

##### `Input(Port, Array, Length)`
指定したポートから連続して値を読み込み、配列に格納します。

```zpp
Input(Port, Array, Length);
```

**パラメータ:**
- `Port`: `uint8`型変数、数式、数値、配列要素（入力開始ポート番号）
- `Array`: 配列の開始要素（`array[start_idx]`の形式で開始位置を指定）
- `Length`: `uint8`型変数、数式、数値（入力する要素数）

**動作:**
指定されたポートから、配列の指定された開始位置から指定された長さ分の要素に**同一ポートから連続して**入力します。

**使用例:**
```zpp
uint8 sensor_data[10];
bool switch_states[8];
uint8 adc_readings[4][6];
uint8 ports[4] = {0, 1, 2, 3};

// ポート0からsensor_data[0]に5要素を連続入力
Input(0, sensor_data[0], 5);

// ポート2からsensor_data[3]に4要素を連続入力
Input(2, sensor_data[3], 4);

// ポート1からadc_readings[2][1]に3要素を連続入力
Input(1, adc_readings[2][1], 3);

// ポート配列を使用してports[3]から連続入力
Input(ports[3], switch_states[2], 6);  // ポート3から6要素を連続入力

// 配列全体を入力
Input(0, sensor_data[0], 10);          // ポート0から全10要素を連続入力
```

#### 8.1.3. 配列I/O関数の詳細動作

##### 多次元配列の扱い
多次元配列の場合、メモリ上の連続した配置に従って処理されます。

```zpp
uint8 matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};

// matrix[0][1]から4要素を出力する場合:
// matrix[0][1] = 2, matrix[0][2] = 3, matrix[1][0] = 4, matrix[1][1] = 5
Output(0, matrix[0][1], 4);  // ポート0に 2, 3, 4, 5 を連続出力
```

##### 境界チェック
配列の境界を越えた指定を行った場合の動作は未定義です。プログラマが配列の範囲内で操作することを保証する必要があります。

```zpp
uint8 data[5] = {1, 2, 3, 4, 5};

// 正しい例
Output(0, data[2], 3);  // data[2], data[3], data[4] を出力 (OK)

// 危険な例（境界越え）
Output(0, data[3], 5);  // data[3], data[4], そして配列外の3要素 (未定義動作)
```

##### 実用的な使用例

```zpp
// センサーデータ収集システム
uint8 main() {
    const uint8 SENSOR_COUNT = 8;
    const uint8 DATA_PORT = 0;
    const uint8 STATUS_PORT = 1;
    
    uint8 sensor_readings[SENSOR_COUNT];
    uint8 processed_data[SENSOR_COUNT];
    
    // センサーデータを一括取得
    Input(DATA_PORT, sensor_readings[0], SENSOR_COUNT);
    
    // データ処理
    for (uint8 i = 0; i < SENSOR_COUNT; i++) {
        processed_data[i] = sensor_readings[i] * 2;  // 例: 2倍にスケーリング
    }
    
    // 処理済みデータを一括出力
    Output(STATUS_PORT, processed_data[0], SENSOR_COUNT);
    
    // 部分的なデータ出力（最初の4つのセンサーのみ）
    Output(STATUS_PORT + 1, processed_data[0], 4);
    
    // 後半のデータ出力（後ろ4つのセンサー）
    Output(STATUS_PORT + 2, processed_data[4], 4);
    
    return 0;
}
```

### 8.2. アセンブリ埋め込み関数

Z++コード内に直接アセンブリコードを埋め込む機能です。

#### 8.2.1. `Run.Asm(ASM)`
単一行のアセンブリコードを埋め込みます。

```zpp
Run.Asm(ASM);
```

**パラメータ:**
- `ASM`: アセンブリコードを表す文字列リテラル

**使用例:**
```zpp
Run.Asm("NOP");              // 1クロック待機
Run.Asm("LDI r5, 100");      // r5レジスタに100をロード
Run.Asm("ADD r1, r2, r3");   // r3 = r1 + r2
```

#### 8.2.2. `Run.AsmBlock { ASM }`
複数行のアセンブリコードをブロックとして埋め込みます。

```zpp
Run.AsmBlock {
    ASM行1
    ASM行2
    ...
};
```

**使用例:**
```zpp
Run.AsmBlock {
    LDI r5, 10
    LDI r6, 20
    ADD r5, r6, r7
    PST r7, ap0, 0
};
```

> **注意:** Z++の変数やレジスタ割り当てを破壊しないよう、CPUの仕様を熟知した上で使用してください。

### 8.3. デバッグ出力関数

#### 8.3.1. `Run.Debug(TEXT, Value...)`
プログラムの実行を妨げることなく、開発中のデバッグ情報をホストPC（IDE）に送信します。

```zpp
Run.Debug(TEXT, Value1, Value2, ...);
```

**パラメータ:**
- `TEXT`: Rustのような構文のフォーマット文字列（`{}`でプレースホルダーを指定）
- `Value`: `uint8`型変数、`bool`型変数、数式、数値、配列要素

#### 動作の仕組み

##### コンパイル時
Z++コンパイラは、`Run.Debug`文を**完全に無視**し、製品版のコードサイズや実行速度に影響を与えません。

##### デバッグ実行時
IDEがソースコードを解析し、`Run.Debug`文の行に到達すると、`Value`部分を評価してフォーマット文字列の`{}`に埋め込み、デバッグコンソールに表示します。

#### 使用例
```zpp
struct Point p;
p.x = 50;
p.y = 100;
uint8 temperature = 25;
bool is_running = true;
uint8 sensor_array[4] = {10, 20, 30, 40};
uint8 matrix[2][2] = {{1, 2}, {3, 4}};

// 基本的な使用
Run.Debug("Temperature: {}", temperature);
// -> "Temperature: 25"

// 複数の値
Run.Debug("Position: ({}, {})", p.x, p.y);
// -> "Position: (50, 100)"

// ブール値
Run.Debug("System running: {}", is_running);
// -> "System running: true"

// 配列要素
Run.Debug("Sensor 0: {}, Sensor 2: {}", sensor_array[0], sensor_array[2]);
// -> "Sensor 0: 10, Sensor 2: 30"

// 多次元配列要素
Run.Debug("Matrix[0][1]: {}, Matrix[1][0]: {}", matrix[0][1], matrix[1][0]);
// -> "Matrix[0][1]: 2, Matrix[1][0]: 3"

// 数式
Run.Debug("Sum: {}, Product: {}", p.x + p.y, p.x * p.y);
// -> "Sum: 150, Product: 5000"

// 配列要素を使った数式
Run.Debug("Array sum: {}", sensor_array[0] + sensor_array[3]);
// -> "Array sum: 50"

// テキストのみ
Run.Debug("Initialization complete.");
// -> "Initialization complete."
```

#### 重要な注意点
- この機能は**デバッグビルド時にのみ有効**
- 実際のデバイスで実行されるバイナリには含まれない
- `Value`部分に**副作用のある式**（`i++`など）を記述しても、実行時には無視されない(Portにi++を書き、Value部分にi++を書くと未定義エラーになる)。
- 配列要素も通常の変数と同様に使用可能
---

## 9章 名前空間とモジュール (Namespaces and Modules)

### 9.1. Z++におけるモジュールの考え方

プログラムが大きくなるにつれて、全てのコードを一つのファイルに記述するのは非効率的になり、名前の衝突のリスクも増大します。

Z++のモジュールシステムは以下の方法でこの問題を解決します：

1. 関連する機能を意味のある単位の**ファイル（モジュール）**に分割
2. **`namespace`**を使って、モジュール内の機能を論理的なグループに分け、名前の衝突を防止
3. **`#include`**と**`using`**を使って、必要な機能だけを安全にインポートして利用

### 9.2. プリプロセッサ命令

#### 9.2.1. インクルードガード
```zpp
// my_module.zpp
#ifndef MY_MODULE_ZPP
#define MY_MODULE_ZPP

namespace MyModule {
    // モジュールの内容
}

#endif
```

#### 9.2.2. ファイルのインクルード
```zpp
#include "my_module.zpp"
```

### 9.3. 名前空間 (`namespace`)

#### 9.3.1. 名前空間の定義
```zpp
namespace Math {
    uint8 add(uint8 a, uint8 b) { return a + b; }
    bool is_even(uint8 value) { return (value % 2) == 0; }
}

namespace IO {
    void print_value(uint8 val) {
        Output(0, val);
    }
}
```

### 9.4. シンボルのインポートとアクセス

#### 9.4.1. スコープ解決演算子 (`::`)
```zpp
#include "my_math.zpp"

uint8 result = Math::add(10, 20);     // Math名前空間のaddを呼び出す
bool check = Math::is_even(result);   // Math名前空間のis_evenを呼び出す
```

#### 9.4.2. `using`宣言
```zpp
#include "my_math.zpp"

using Math::add;        // Math名前空間のaddだけをインポート
using Math::is_even;    // Math名前空間のis_evenをインポート

uint8 result = add(5, 3);      // OK: Math::addのこと
bool check = is_even(result);  // OK: Math::is_evenのこと
```

#### 9.4.3. `using namespace`宣言
```zpp
#include "my_math.zpp"
using namespace Math;

uint8 result = add(5, 3);      // OK
bool check = is_even(result);  // OK
```

### 9.5. 総合的な使用例

#### ライブラリファイル (`sensor_lib.zpp`)
```zpp
#ifndef SENSOR_LIB_ZPP
#define SENSOR_LIB_ZPP

namespace Sensor {
    const uint8 TEMP_PORT = 0;
    const uint8 PRESSURE_PORT = 1;
    
    uint8 read_temperature() {
        uint8 temp;
        Input(TEMP_PORT, temp);
        return temp;
    }
    
    uint8 read_pressure() {
        uint8 pressure;
        Input(PRESSURE_PORT, pressure);
        return pressure;
    }
    
    bool is_overheating(uint8 temperature) {
        return temperature > 80;
    }
}

#endif
```

#### アプリケーションファイル (`main.zpp`)
```zpp
#include "sensor_lib.zpp"

using Sensor::read_temperature;
using Sensor::is_overheating;

uint8 main() {
    uint8 temp = read_temperature();
    
    Run.Debug("Current temperature: {}", temp);
    
    if (is_overheating(temp)) {
        Output(2, 255);  // 警告LEDを点灯
        Run.Debug("Warning: Overheating detected!");
    } else {
        Output(2, 0);    // 警告LEDを消灯
    }
    
    return 0;
}
```

---

## 付録

### A. キーワード一覧
```
uint8 bool void const if else while do for return switch case default break 
Output Input Run struct class public private sizeof using namespace true false
```

### B. 演算子一覧
```
+ - * ** / % ++ -- += -= *= **= /= %= 
== != < > <= >= && || ! & | ^ ~ << >> 
= &= |= ^= <<= >>= . -> :: [] () sizeof
```

### C. 組み込み関数一覧

| 関数 | 説明 | 使用例 |
|------|------|--------|
| `Output(Port, Value)` | ポートに値を出力 | `Output(3, 255)` |
| `Input(Port, Var)` | ポートから値を入力 | `Input(2, sensor_val)` |
| `Output.array(Port, ArrayVar)` | 配列をポートに連続出力 | `Output.array(0, led_array)` |
| `Input.array(Port, ArrayVar)` | ポートから配列に連続入力 | `Input.array(8, sensor_array)` |
| `Run.Asm(ASM)` | 単一行アセンブリ埋め込み | `Run.Asm("NOP")` |
| `Run.AsmBlock { ASM }` | 複数行アセンブリ埋め込み | `Run.AsmBlock { LDI r5, 10 };` |
| `Run.Debug(TEXT, Value...)` | デバッグ出力 | `Run.Debug("Value: {}", x)` |

### D. データ型とサイズ

| 型名 | サイズ | 値の範囲 | 用途 |
|------|--------|----------|------|
| `uint8` | 8ビット | 0-255 | 基本的な数値 |
| `bool` | 8ビット | `true`/`false` | 論理値 |
| `enum` | 8ビット | 列挙子による | 定数グループ |
| 配列 | 要素数×要素サイズ | - | データ集合 |
| `struct`/`class` | メンバの合計 | - | 複合データ |

### E. CPU命令との対応表

| Z++演算子 | CPU命令 | 説明 |
|-----------|---------|------|
| `+` | ADD | 加算 |
| `-` | SUB | 減算 |
| `*` | MUL | 乗算（下位） |
| `**` | MUH | 乗算（上位） |
| `/` | DIV | 除算 |
| `%` | MOD | 剰余 |
| `&` | AND | ビットAND |
| `^` | XOR | ビットXOR |
| `~` | NOR | ビットNOR |
| `<<` | LSH | 左シフト |
| `>>` | RSH | 右シフト |
