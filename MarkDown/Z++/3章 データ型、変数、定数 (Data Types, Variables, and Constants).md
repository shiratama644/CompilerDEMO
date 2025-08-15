# 3章 データ型、変数、定数 (Data Types, Variables, and Constants)

## 3.1. データ型 (Data Types)

Z++はタイプセーフな静的型付け言語であり、全ての変数は宣言時に型を指定する必要があります。

### 3.1.1. 基本データ型

| 型名 | サイズ | 値の範囲 | 用途 | アセンブリ対応 |
|------|--------|----------|------|----------------|
| `uint8` | 8ビット | 0 〜 255 | 8ビット符号なし整数 | 1レジスタに直接格納 |
| `bool` | 8ビット | `true` (1) または `false` (0) | 真偽値 | `uint8`と同じ扱い |

#### 型の特徴

**`uint8`型**
- **アセンブリ対応:** CPUの8ビットレジスタ（`r1`〜`r15`）に直接格納
- **メモリ効率:** RAM上では1バイトのみ消費
- **演算効率:** 8ビットCPUの命令セットと完全に一致するため最高効率

**`bool`型**
- **内部表現:** `uint8`型と同じく8ビットで表現
- **値の制約:** `true`（1）または`false`（0）のみ有効
- **型安全性:** `uint8`との暗黙的変換は許可されるが、可読性向上のために独立した型として定義

### 3.1.2. 型変換 (Type Conversion)

#### 暗黙の型変換
```zpp
uint8 value = 100;
bool flag = value;        // OK: uint8 → bool (0でない値はtrue)
uint8 result = flag;      // OK: bool → uint8 (true=1, false=0)
```

#### 明示的な型変換 (キャスト)
```zpp
uint8 data = 200;
bool state = (bool)data;  // 明示的キャスト
```

## 3.2. 変数 (Variables)

プログラム実行中に値を保持し、変更可能なメモリ領域への名前付きアクセス手段です。

### 3.2.1. 変数の宣言と初期化

#### 基本的な宣言
```zpp
uint8 life;              // 宣言のみ
uint8 score = 100;       // 宣言と同時に初期化
bool is_active = true;   // bool型の初期化
```

#### アセンブリレベルでのメモリ配置
- **グローバル変数:** RAM領域の固定アドレスに配置
- **ローカル変数:** スタックフレーム内に配置（アドレスポインタ`ap14`基準）
- **初期化:** コンパイラが`_start`ラベル内で初期化コードを生成

#### スコープ (有効範囲)
- **ブロックスコープ:** `{}` で囲まれたブロック内で宣言された変数は、そのブロック内でのみ有効
- **グローバルスコープ:** いずれのブロックにも属さずに宣言された変数は、プログラム全体からアクセス可能

## 3.3. 定数 (`const`)

一度値を代入すると変更できなくなる変数です。

### 3.3.1. 特徴
- **目的:** 変更されては困る値（ピン番号、設定値など）を安全に扱う
- **メモリ配置:** **ROM領域**に配置されるため、**RAMを消費しません**
- **宣言:** `const uint8 定数名 = 値;` または `const bool 定数名 = 値;`
- **制約:** コンパイル時に値が確定している必要がある

### 3.3.2. アセンブリレベルの動作

`const` で宣言された定数は、以下の段階でアセンブリコードに変換されます：

1. **シンボル置換:** コンパイラが定数名を即値に置換
2. **`.define` ディレクティブ生成:** アセンブラレベルでのマクロ定義
3. **即値埋め込み:** 最終的なマシンコードでは即値として埋め込まれる

#### 例：const定数のアセンブリ変換

**Z++ソースコード:**
```zpp
const uint8 LED_PIN = 3;
const bool DEBUG_MODE = true;
Output(255, LED_PIN);
```

**生成されるアセンブリコード:**
```assembly
.define LED_PIN 3
.define DEBUG_MODE 1

; Output(255, LED_PIN) のコード生成
LDI r1, 255        ; 第1引数：輝度値
LDI r2, LED_PIN    ; 第2引数：ピン番号（即値3に置換）
CAL Output         ; 関数呼び出し
```

### 3.3.3. 使用例
```zpp
const uint8 LED_PIN = 3;
const uint8 SENSOR_PORT = 2;
const bool DEBUG_MODE = true;
const uint8 MAX_RETRY = 5;

Output(255, LED_PIN);        // ポート3のLEDを最大輝度で点灯
uint8 sensor_val = Input(SENSOR_PORT);
```

## 3.4. 構造体 (struct) - データ集約のための型

`struct` は、複数の異なる型の変数を一つのまとまりとして扱うための機能です。

### 3.4.1. 構造体とクラスの基本的な違い

`struct` と `class` の唯一の違いは、**デフォルトのアクセス指定子**です。

- **`struct` のデフォルトは public:** データ集約を主目的とし、外部から自由にアクセスできることを前提
- **`class` のデフォルトは private:** カプセル化を主目的とし、内部状態を隠蔽することを前提

### 3.4.2. 機能的な共通点

`struct` と `class` は、アクセス指定子 (`public`, `private`) を明示的に記述すれば、機能的に全く同じものとして扱えます。

### 3.4.3. 構造体の機能

`struct` は `class` と同様に以下の機能を持つことができます：

- **メンバ変数:** 構造体が保持するデータ
- **メンバ関数 (メソッド):** 構造体のデータを操作する関数
- **コンストラクタ:** インスタンス生成時に自動的に呼び出される初期化用の特殊な関数

### 3.4.4. アセンブリレベルでのメモリレイアウト

構造体のメンバは、宣言順にメモリ上に連続して配置されます：

```zpp
struct Point {
    uint8 x;    // オフセット +0
    uint8 y;    // オフセット +1
};
```

**メモリ配置図:**
```
Point インスタンス (2バイト)
+---+---+
| x | y |
+---+---+
 0   1   (オフセット)
```

### 3.4.5. 使用例

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

## 3.5. クラス (class) - カプセル化のための型

`class` は、データ（メンバ変数）と、そのデータを操作するための一連の手続き（メンバ関数）を一つにまとめたものです。

### 3.5.1. アクセス指定子 `public`/`private`

| アクセス指定子 | 説明 |
|----------------|------|
| `public` | クラスの外部からアクセス可能。クラスのインターフェースを構成 |
| `private` | そのクラスのメンバ関数からのみアクセス可能。内部状態を隠蔽 |

### 3.5.2. メンバ関数の定義
- **クラス内定義:** 簡単な関数は、`class` の定義ブロック内に直接実装を記述
- **クラス外定義:** 実装が長い場合は、クラス内で宣言のみ行い、実装をクラス外に記述。**スコープ解決演算子 `::`** を使用

### 3.5.3. コンストラクタ (Constructor)

インスタンスが生成される際に**自動的に呼び出される**特殊なメンバ関数です。

- **目的:** メンバ変数の初期化
- **名前:** クラス名と同じ名前を持ち、戻り値の型はなし
- **特徴:** 引数を取ることができ、複数のコンストラクタを定義可能（オーバーロード）

#### アセンブリレベルでのコンストラクタ呼び出し

コンストラクタの自動呼び出しは以下の手順で実現されます：

1. **インスタンス生成:** 指定されたサイズのメモリ領域を確保
2. **thisポインタ設定:** インスタンスのアドレスを`r1`レジスタに格納
3. **コンストラクタ呼び出し:** `CAL`命令でコンストラクタ関数を実行
4. **初期化完了:** 初期化されたインスタンスが使用可能状態になる

### 3.5.4. 暗黙の引数 `this`

メンバ関数は、どのインスタンスの変数を操作すればよいかを区別するために、**`this`ポインタ**を使用します。

#### アセンブリレベルでの`this`ポインタ実装

- **レジスタ配置:** Z++の呼び出し規約では、`this`ポインタは**`r1`レジスタ**に格納
- **引数の順序:** メンバ関数の明示的な引数は`r2`, `r3`... と順にレジスタに割り当て
- **アドレス計算:** メンバ変数へのアクセスは`this`ポインタ + オフセットで計算

#### 例：thisポインタのアセンブリ変換

**Z++ソースコード:**
```zpp
class Timer {
    uint8 counter;  // オフセット +0
    uint8 limit;    // オフセット +1
public:
    void set_limit(uint8 new_limit) {
        limit = new_limit;  // this->limit = new_limit;
    }
};
```

**生成されるアセンブリコード:**
```assembly
; Timer::set_limit(uint8 new_limit)
Timer_set_limit:
    ; r1 = this ポインタ (自動的に渡される)
    ; r2 = new_limit 引数
    MST r2, r1, 1    ; this->limit = new_limit (オフセット+1)
    RET
```

### 3.5.5. サポートされないC++の機能

8ビットCPUでの効率的な実装を優先するため、以下の機能はサポートしません：

#### 継承 (Inheritance)
- **理由:** 仮想関数テーブルによるメモリオーバーヘッドと実行時間コストが8ビット環境では過大
- **代替案:** コンポジション（メンバ変数として他のクラスを含める）を推奨

#### 仮想関数 (Virtual Functions)
- **理由:** 関数ポインタテーブルのメモリ消費とアドレス解決のオーバーヘッド
- **代替案:** 関数ポインタを明示的に使用する設計パターン

#### デストラクタ (Destructor)
- **理由:** 8ビット環境では動的メモリ管理を避けることが一般的
- **代替案:** RAIIパターンを使用し、スコープによる自動的なリソース管理

### 3.5.6. クラスの使用例

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
            Output(1, 0);  // ポート0に1を出力
        }

        if (long_timer.has_expired()) {
            Output(1, 1);  // ポート1に1を出力
        }
    }

    return 0;
}
```

## 3.6. 配列 (Arrays)

同じ型の複数の要素を連続したメモリ領域に格納するデータ構造です。

### 3.6.1. 配列の宣言と初期化

#### 基本的な宣言
```zpp
uint8 scores[10];                     // uint8型の要素を10個持つ配列
bool flags[8];                        // bool型の要素を8個持つ配列
struct Point path[5];                 // struct Point型の要素を5個持つ配列

uint8 pins[4] = {2, 3, 4, 5};        // 初期値を指定
uint8 data[5] = {10, 20};             // {10, 20, 0, 0, 0} として初期化
```

### 3.6.2. アセンブリレベルでの配列アクセス

配列の要素アクセスは、基底アドレス + インデックス * 要素サイズの計算で実現されます：

**Z++ソースコード:**
```zpp
uint8 scores[10];
scores[3] = 100;
```

**生成されるアセンブリコード:**
```assembly
; scores[3] = 100 のアセンブリ変換
LDI r1, 100        ; 代入値をr1に格納
API ap1, scores    ; 配列の基底アドレスをap1に設定
MST r1, ap1, 3     ; scores + 3番目の要素に値を格納
```

### 3.6.3. 要素へのアクセス

```zpp
scores[0] = 100;                      // 最初の要素に値を代入
uint8 first_score = scores[0];        // 最初の要素の値を取得
```

> **注意:** 範囲外アクセスのチェックは行われないため、プログラマが注意する必要があります。

### 3.6.4. 多次元配列

```zpp
uint8 matrix[3][4];                   // 3行4列の2次元配列
matrix[1][2] = 1;                     // 2行目3列目の要素にアクセス
```

### 3.6.5. `sizeof` 演算子

```zpp
uint8 scores[10];
uint8 total_size = sizeof(scores);    // 10 が返る (要素数)
```

### 3.6.6. 関数への引き渡し（参照渡しの特殊ケース）

配列を関数に渡す際は、**先頭要素へのアドレス（ポインタ）**が渡されます。これは参照渡しの特殊なケースです。

#### アドレス演算子`&`による参照渡しの実装原理

Z++では明示的なポインタ型は存在しませんが、参照渡しは以下の原理で実装されます：

1. **アドレス取得:** `&`演算子で変数のRAMアドレスを取得
2. **アドレス渡し:** 関数の引数として8ビットアドレス値を渡す
3. **間接アクセス:** 関数内でアドレスを使用してメモリに間接的にアクセス

#### アセンブリレベルでの配列引き渡し

**Z++ソースコード:**
```zpp
void process_data(uint8 arr[]);
uint8 my_scores[10];
process_data(&my_scores);
```

**生成されるアセンブリコード:**
```assembly
; process_data(&my_scores) の呼び出し
API r1, my_scores    ; 配列の先頭アドレスをr1に格納
CAL process_data     ; 関数呼び出し（r1にアドレスが渡される）
```

**関数内での配列要素アクセス:**
```assembly
; process_data内での arr[i] アクセス
process_data:
    ; r1 = 配列の先頭アドレス
    ; r2 = インデックス i
    MLD r3, r1, r2     ; arr[i] の値をr3にロード
    ; ...処理...
    RET
```

### 3.6.7. 使用例

```zpp
void process_scores(uint8 arr[], uint8 size) {
    for (uint8 i = 0; i < size; i++) {
        if (arr[i] > 80) {
            Output(1, i);  // 80点以上の場合、該当ポートに出力
        }
    }
}

uint8 main() {
    uint8 student_scores[5] = {85, 72, 91, 68, 95};
    process_scores(&student_scores, 5);
    return 0;
}
```

## 3.7. 列挙型 (enum) - 型安全な定数グループ

`enum`（列挙型）は、関連する定数群を一つのグループとしてまとめ、それに**独自の新しい「型」を与える**機能です。

### 3.7.1. `enum`の必要性

`const uint8 RED = 0;` のような定数の集まりでは、互いの関連性がなく、`uint8`型の変数には無関係な値も代入できてしまいます。`enum`は、コンパイラに厳格なルールを理解させ、不正な値の代入をコンパイル時に検出できるようにします。

### 3.7.2. `enum`の定義と使い方

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

### 3.7.3. `enum`の利点

- **型安全性 (Type Safety):** `enum`型の変数には、その`enum`で定義された列挙子しか代入できない
- **可読性 (Readability):** `case TrafficSignal::RED:` は `case 0:` より意図が明確
- **ゼロコスト抽象化:** コンパイル時に解決され、実行時のパフォーマンスペナルティなし

### 3.7.4. 基底となる整数値の指定

```zpp
enum DeviceCommand {
    RESET = 0,
    START = 1,
    SET_SPEED = 0x10,     // 16進数で16を指定
    GET_STATUS = 0x20
};
```

### 3.7.5. アセンブリレベルでの型安全性

`enum`の型安全性は、コンパイル時のチェックで実現され、実行時にはオーバーヘッドがありません：

**Z++ソースコード:**
```zpp
enum LedState { OFF = 0, ON = 1 };
enum LedState led_status = LedState::ON;
```

**生成されるアセンブリコード:**
```assembly
; LedState led_status = LedState::ON;
LDI r1, 1          ; ON の値（1）を直接埋め込み
MST r1, ap0, led_status_addr  ; 変数に格納
```

### 3.7.6. 型変換の規則と安全性の背景

| 変換の種類 | 例 | 許可 | 結果の型 | 背景理由 |
|------------|----|----- |----------|----------|
| `enum` → `uint8` | `uint8 i = LedState::ON;` | **OK (暗黙的)** | `uint8` | 列挙値は必ず有効な整数値なので安全 |
| `uint8` → `enum` | `LedState s = 1;` | **エラー** | - | 整数値が列挙値として有効か不明なため危険 |
| `uint8` → `enum` (キャスト) | `LedState s = (LedState)1;` | **OK (明示的)** | `enum LedState` | プログラマが安全性を保証 |
| `enum` → `enum` | `LedState s = PowerState::ON;` | **エラー** | - | 異なる意味域の列挙型混在を防止 |
| `enum`との演算 | `uint8 i = LedState::ON + 1;` | **OK** | `uint8` | 演算結果は列挙値の意味を失うため`uint8`に |

#### 型安全性のコンパイル時実装

1. **シンボルテーブル管理:** コンパイラが各`enum`型の有効な値域を記録
2. **型チェック:** 代入や比較時に左辺と右辺の型適合性を検証
3. **エラー生成:** 不適切な型変換に対してコンパイルエラーを出力
4. **最適化:** 型チェック後は通常の整数として扱い、実行時オーバーヘッドなし

### 3.7.7. 使用例

```zpp
enum OperationMode { 
    STANDBY = 0, 
    RUNNING = 1, 
    ERROR_STATE = 255 
};

enum OperationMode current_mode = OperationMode::STANDBY;

void update_status_led() {
    switch (current_mode) {
        case OperationMode::STANDBY:
            Output(64, 0);    // 低輝度で点灯
            break;
        case OperationMode::RUNNING:
            Output(255, 0);   // 最大輝度で点灯
            break;
        case OperationMode::ERROR_STATE:
            Output(128, 0);   // 中輝度で点灯
            break;
    }
}
```

---

**注記:** 本章で説明したアセンブリレベルの詳細は、Z++の「透明性」原則に基づき、開発者がコードの最終的な動作を予測できるようにするために記載されています。実際の最適化により、生成されるアセンブリコードは一部異なる場合がありますが、基本的な原理は同様です。