# 7章 関数 (Functions)

## 7.1. 関数の定義と呼び出し

一連の処理をまとめて名前を付け、再利用できるようにした機能です。

### 7.1.1. 基本例

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

### 7.1.2. アセンブリレベルでの関数構造

関数は以下の構造で実現されます：

1. **プロローグ（関数開始）:** レジスタ退避、スタックフレーム設定
2. **関数本体:** 実際の処理
3. **エピローグ（関数終了）:** レジスタ復元、戻り値設定
4. **復帰:** `RET`命令で呼び出し元に戻る

#### 基本的な関数のアセンブリ例

**Z++ソースコード:**
```zpp
uint8 add(uint8 a, uint8 b) {
    uint8 result = a + b;
    return result;
}
```

**生成されるアセンブリコード:**
```assembly
add:
    ; プロローグ（この関数では不要）
    ; r1 = a, r2 = b (引数)
    
    ; 関数本体: result = a + b
    ADD r1, r2, r3             ; r3 = a + b
    
    ; return result
    MOV r3, r15                ; 戻り値をr15レジスタに格納
    
    ; エピローグ（この関数では不要）
    RET                        ; 呼び出し元に復帰
```

### 7.1.3. デフォルト引数

関数の宣言時に、引数にデフォルト値を指定できます。

```zpp
void set_led(uint8 pin, uint8 brightness = 255, bool blink = false);

// 呼び出し例
set_led(3);              // pin=3, brightness=255, blink=false
set_led(3, 128);         // pin=3, brightness=128, blink=false
set_led(3, 128, true);   // pin=3, brightness=128, blink=true
```

#### 制約
- デフォルト引数は引数リストの**右側**にまとめる必要がある
- `void func(uint8 a = 10, uint8 b);` のような宣言はエラー

#### アセンブリレベルの動作

コンパイラが省略された引数を補って関数呼び出しコードを生成します：

**Z++ソースコード:**
```zpp
set_led(3);  // brightness=255, blink=false がコンパイラによって補完
```

**生成されるアセンブリコード:**
```assembly
; set_led(3, 255, false) として展開される
LDI r1, 3                      ; pin
LDI r2, 255                    ; brightness（デフォルト値）
LDI r3, 0                      ; blink = false（デフォルト値）
CAL set_led
```

## 7.2. 呼び出し規約 (Calling Convention)

関数を呼び出す側と呼び出される側での、引数や戻り値の受け渡しに関するルールです。Z++の呼び出し規約は8ビットCPUの効率性を最大化するよう設計されています。

### 7.2.1. 引数の渡し方

#### 値渡し (デフォルト)

`uint8`, `bool`, `struct`, `class` などの引数は、**値がコピーされて**渡されます。関数内で引数の値を変更しても、呼び出し元の変数は影響を受けません。

**Z++ソースコード:**
```zpp
void process_value(uint8 val) {
    val = val + 10;  // 呼び出し元の変数には影響しない
}

uint8 my_value = 50;
process_value(my_value);  // my_value は変更されず 50 のまま
```

#### 参照渡し (`&`)

型名の後に `&` を付けると、変数の**メモリアドレス（8ビット）**が渡されます。関数内での変更は呼び出し元の変数に直接反映されます。

**Z++ソースコード:**
```zpp
void modify_value(uint8& val) {
    val = val + 10;  // 呼び出し元の変数を直接変更
}

uint8 my_value = 50;
modify_value(my_value);  // my_value は 60 になる
```

**アセンブリレベルでの参照渡し実装:**
```assembly
; modify_value(&my_value) の呼び出し
API r1, my_value_addr          ; my_value のアドレスをr1に格納
CAL modify_value

; modify_value 関数内
modify_value:
    ; r1 = my_value のアドレス
    MLD r2, r1, 0              ; *val（現在の値）をr2にロード
    LDI r3, 10                 ; 10をr3にロード
    ADD r2, r3, r2             ; r2 = r2 + 10
    MST r2, r1, 0              ; 新しい値を*valに格納
    RET
```

#### 配列の引き渡し (特殊ケース)

- 配列は**常に先頭要素へのアドレスが渡される**
- 関数定義では `uint8 arr[]` と記述
- 呼び出し時には配列名の前に `&` を明示的に付ける

```zpp
void process_scores(uint8 arr[], uint8 size);

uint8 my_scores[10];
process_scores(&my_scores, 10);
```

### 7.2.2. レジスタ割り当て

#### 引数レジスタ

`uint8`型の引数（および参照渡しの`&`）は以下の順でレジスタに割り当てられます：

| 引数 | レジスタ | 備考 |
|------|----------|------|
| 第1引数 | `r1` | クラスのメンバ関数では`this`ポインタが使用 |
| 第2引数 | `r2` | |
| 第3引数 | `r3` | |
| 第4引数 | `r4` | |

#### スタック渡し

以下の場合はスタック経由で引数を渡します：

- **引数が5個以上の場合**
- **大きな型（値渡しの`struct`や`class`）の場合**
- 呼び出し側が確保したRAM上の領域（スタックフレーム）経由で受け渡し

**例：5個以上の引数を持つ関数**

**Z++ソースコード:**
```zpp
uint8 complex_calc(uint8 a, uint8 b, uint8 c, uint8 d, uint8 e, uint8 f) {
    return a + b + c + d + e + f;
}
```

**アセンブリコード例:**
```assembly
; complex_calc(1, 2, 3, 4, 5, 6) の呼び出し
LDI r1, 1                      ; 第1引数 → r1
LDI r2, 2                      ; 第2引数 → r2
LDI r3, 3                      ; 第3引数 → r3
LDI r4, 4                      ; 第4引数 → r4
LDI r5, 5                      ; 第5引数 → スタックに退避
PSH r5
LDI r5, 6                      ; 第6引数 → スタックに退避
PSH r5
CAL complex_calc
```

### 7.2.3. 戻り値の扱い

#### uint8/bool型の戻り値

- **`uint8`型の戻り値:** `r15`レジスタに格納して返す
- **`bool`型の戻り値:** `uint8`と同様に`r15`レジスタを使用

**例:**
```zpp
uint8 get_max(uint8 a, uint8 b) {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}
```

**アセンブリコード:**
```assembly
get_max:
    ; r1 = a, r2 = b
    CMP r1, r2                 ; a と b を比較
    JLE else_branch            ; a <= b なら else_branch へ
    
    ; return a
    MOV r1, r15                ; a を戻り値レジスタr15に格納
    JMP function_end
    
else_branch:
    ; return b
    MOV r2, r15                ; b を戻り値レジスタr15に格納
    
function_end:
    RET
```

#### 大きな型（struct/class）の戻り値

大きな型の戻り値は、戻り値用領域のアドレスを引数として渡します：

**Z++ソースコード:**
```zpp
struct Point create_point(uint8 x, uint8 y) {
    struct Point p;
    p.x = x;
    p.y = y;
    return p;
}
```

**実際のアセンブリコード（構造体戻り値）:**
```assembly
; コンパイラが自動的に変換：
; void create_point(Point* result, uint8 x, uint8 y)
create_point:
    ; r1 = result のアドレス（戻り値格納領域）
    ; r2 = x, r3 = y
    MST r2, r1, 0              ; result->x = x
    MST r3, r1, 1              ; result->y = y
    RET
```

### 7.2.4. レジスタの退避ルール

Z++の呼び出し規約では、レジスタを2つのカテゴリに分類し、退避責任を明確化しています：

| 分類 | レジスタ | 責任 | 説明 |
|------|----------|------|------|
| **Caller-Saved** | `r1-r4`, `r15` | 呼び出し側 | 必要に応じて呼び出し側が退避 |
| **Callee-Saved** | `r5-r14` | 呼び出される側 | 使用する場合は関数が退避・復元 |

#### Caller-Savedレジスタの動作

呼び出し側が必要に応じて退避するレジスタです。関数呼び出し後は内容が破壊される可能性があります。

**例：Caller-Savedレジスタの退避**

**Z++ソースコード:**
```zpp
uint8 important_value = 42;
uint8 result = some_function(10);
// important_value を後で使いたい場合
```

**アセンブリコード（コンパイラが自動生成）:**
```assembly
LDI r1, 42                     ; important_value を r1 に格納
; r1を後で使用する場合、呼び出し前に退避が必要
PSH r1                         ; r1 をスタックに退避
LDI r1, 10                     ; 関数の引数を設定
CAL some_function              ; 関数呼び出し（r1-r4,r15が破壊される可能性）
POP r2                         ; 退避していた値をr2に復元
```

#### Callee-Savedレジスタの動作

呼び出される側（関数）が使用する場合に退避・復元する責任があるレジスタです。

**例：Callee-Savedレジスタを使用する関数**

**Z++ソースコード:**
```zpp
uint8 complex_function(uint8 input) {
    uint8 temp1 = input * 2;
    uint8 temp2 = temp1 + 5;
    uint8 temp3 = temp2 * 3;  // 複数のローカル変数でレジスタを多用
    return temp3;
}
```

**アセンブリコード:**
```assembly
complex_function:
    ; プロローグ：使用するCallee-Savedレジスタを退避
    PSH r5                     ; r5を退避
    PSH r6                     ; r6を退避
    
    ; 関数本体
    ; r1 = input (引数)
    LDI r2, 2
    MUL r1, r2, r5             ; temp1 = input * 2 → r5
    LDI r2, 5
    ADD r5, r2, r6             ; temp2 = temp1 + 5 → r6
    LDI r2, 3
    MUL r6, r2, r15            ; temp3 = temp2 * 3 → r15 (戻り値)
    
    ; エピローグ：退避したレジスタを逆順で復元
    POP r6                     ; r6を復元
    POP r5                     ; r5を復元
    
    RET
```

### 7.2.5. スタックフレームの管理

複雑な関数では、ローカル変数やレジスタ退避のためにスタックフレームを使用します。

#### スタックポインタの管理

- **汎用スタックポインタ:** `ap14`をスタックポインタとして使用
- **フレーム構築:** 関数開始時に現在のスタックポインタを退避
- **フレーム破棄:** 関数終了時にスタックポインタを復元

**スタックフレームの構造例:**
```
高位アドレス
    ┌─────────────┐
    │ 戻りアドレス │ ← CAL命令により自動設定
    ├─────────────┤
    │ 退避r14     │
    ├─────────────┤
    │ 退避r13     │
    ├─────────────┤
    │ ...         │
    ├─────────────┤
    │ ローカル変数1│
    ├─────────────┤
    │ ローカル変数2│ ← ap14 (現在のスタックポインタ)
    └─────────────┘
低位アドレス
```

### 7.2.6. 実践的な例

**完全な関数呼び出し例:**

**Z++ソースコード:**
```zpp
uint8 calculate_average(uint8 arr[], uint8 size) {
    uint8 sum = 0;
    for (uint8 i = 0; i < size; i++) {
        sum += arr[i];
    }
    return sum / size;
}

uint8 main() {
    uint8 scores[5] = {85, 90, 78, 92, 88};
    uint8 average = calculate_average(&scores, 5);
    return average;
}
```

**アセンブリコード例:**
```assembly
calculate_average:
    ; プロローグ
    PSH r5                     ; sum用レジスタを退避
    PSH r6                     ; i用レジスタを退避
    
    ; r1 = arr (配列アドレス), r2 = size
    LDI r5, 0                  ; sum = 0
    LDI r6, 0                  ; i = 0
    
for_loop:
    ; for (i < size)
    CMP r6, r2                 ; i と size を比較
    JGE loop_end               ; i >= size なら終了
    
    ; sum += arr[i]
    MLD r3, r1, r6             ; arr[i] を r3 にロード
    ADD r5, r3, r5             ; sum += arr[i]
    
    ; i++
    INC r6
    JMP for_loop
    
loop_end:
    ; return sum / size
    DIV r5, r2, r15            ; sum / size → r15
    
    ; エピローグ
    POP r6
    POP r5
    RET

main:
    ; 配列の初期化（簡略化）
    ; ...配列初期化コード...
    
    ; calculate_average(&scores, 5)
    API r1, scores_array       ; 配列アドレスをr1に設定
    LDI r2, 5                  ; サイズをr2に設定
    CAL calculate_average      ; 関数呼び出し
    ; r15に戻り値が格納される
    
    ; return average
    ; r15は既に戻り値なのでそのまま
    RET
```

### 7.2.7. 呼び出し規約のパフォーマンス考慮点

1. **レジスタ使用の最適化:** 引数が4個以下の場合、スタックを使わずにレジスタのみで高速処理
2. **レジスタ退避の最小化:** 実際に使用するレジスタのみ退避し、オーバーヘッドを削減
3. **戻り値最適化:** 単純な型は専用レジスタ`r15`で高速返却

---

**注記:** 本章で説明したアセンブリレベルの詳細は、Z++の「透明性」原則に基づいています。実際のコンパイラは最適化により異なるコードを生成する場合がありますが、呼び出し規約の基本原理は保持されます。