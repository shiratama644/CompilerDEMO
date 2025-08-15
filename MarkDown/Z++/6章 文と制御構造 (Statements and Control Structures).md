# 6章 文と制御構造 (Statements and Control Structures)

## 6.1. if - else if - else 文

条件に基づいて実行フローを分岐させる基本的な制御構造です。

### 6.1.1. 動作原理

1. `if (condition)` の条件式が評価される
2. 条件が真（0でない）なら `if` ブロックを実行
3. 偽（0）なら次の `else if` の条件式を評価
4. 全ての条件が偽なら `else` ブロックを実行（存在する場合）

### 6.1.2. アセンブリレベルでの条件分岐実装

条件分岐は比較命令（`CMP`）と条件付きジャンプ命令（`JNZ`, `JZ`等）の組み合わせで実現されます：

**Z++ソースコード:**
```zpp
uint8 temperature = 75;
if (temperature > 60) {
    Output(128, 1);  // ファン中速
} else {
    Output(0, 1);    // ファン停止
}
```

**生成されるアセンブリコード:**
```assembly
; temperature > 60 の条件評価
MLD r1, ap0, temperature_addr  ; temperature の値をr1にロード
LDI r2, 60                     ; 比較値60をr2にロード
CMP r1, r2                     ; r1とr2を比較、フラグレジスタを更新
JLE else_label                 ; r1 <= r2 ならelse_labelにジャンプ

; if ブロックの実行
LDI r1, 128                    ; 第1引数：128
LDI r2, 1                      ; 第2引数：ポート1
CAL Output                     ; Output(128, 1)
JMP endif_label                ; if文終了後にジャンプ

else_label:
; else ブロックの実行
LDI r1, 0                      ; 第1引数：0
LDI r2, 1                      ; 第2引数：ポート1
CAL Output                     ; Output(0, 1)

endif_label:
; if文終了後の処理
```

### 6.1.3. 複数条件（else if）の最適化

コンパイラは連続するelse if文を効率的なジャンプ構造に変換します：

**Z++ソースコード:**
```zpp
if (temperature > 100) {
    Output(255, 1);  // 危険：ファン最大
} else if (temperature > 60) {
    Output(128, 1);  // 注意：ファン中速
} else {
    Output(0, 1);    // 正常：ファン停止
}
```

**生成されるアセンブリコード:**
```assembly
; 第1条件: temperature > 100
MLD r1, ap0, temperature_addr
LDI r2, 100
CMP r1, r2
JLE check_60                   ; <= 100 なら次の条件をチェック

; temperature > 100 の場合
LDI r1, 255
LDI r2, 1
CAL Output
JMP endif_label

check_60:
; 第2条件: temperature > 60
LDI r2, 60
CMP r1, r2                     ; r1は既にtemperatureの値
JLE else_block                 ; <= 60 なら else ブロックへ

; 60 < temperature <= 100 の場合
LDI r1, 128
LDI r2, 1
CAL Output
JMP endif_label

else_block:
; temperature <= 60 の場合
LDI r1, 0
LDI r2, 1
CAL Output

endif_label:
```

### 6.1.4. 使用例

```zpp
// 温度に応じてファンを制御する例
uint8 temperature = Input(TEMP_SENSOR);

if (temperature > 100) {
    // 危険な状態。ファンを最大でONにする
    Output(255, FAN_PORT);
} else if (temperature > 60) {
    // 注意が必要な状態。ファンを中速で回す
    Output(128, FAN_PORT);
} else {
    // 正常な状態。ファンを停止する
    Output(0, FAN_PORT);
}
```

## 6.2. while ループ

指定された条件が真である間、繰り返し処理を実行する制御構造です。

### 6.2.1. 動作原理

1. ループに入る前に条件式を評価
2. 条件が真なら、ループ内のブロックを実行
3. ブロック完了後、再び条件式を評価
4. 条件が偽になるまで繰り返し

### 6.2.2. アセンブリレベルでのループ実装

whileループは条件チェック用のラベルとループ本体を結ぶジャンプ命令で実現されます：

**Z++ソースコード:**
```zpp
uint8 button_state = 0;
while (button_state == 0) {
    button_state = Input(2);
}
```

**生成されるアセンブリコード:**
```assembly
; ループ変数の初期化
LDI r1, 0
MST r1, ap0, button_state_addr

loop_start:
; 条件評価: button_state == 0
MLD r1, ap0, button_state_addr ; button_state をr1にロード
LDI r2, 0                      ; 比較値0をr2にロード
CMP r1, r2                     ; r1とr2を比較
JNZ loop_end                   ; r1 != 0 ならループ終了

; ループ本体
LDI r1, 2                      ; Input関数の引数：ポート2
CAL Input                      ; Input(2) を呼び出し
MST r15, ap0, button_state_addr ; 戻り値をbutton_stateに格納

JMP loop_start                 ; ループの先頭に戻る

loop_end:
; ループ終了後の処理
```

### 6.2.3. 無限ループの最適化

`while(1)` や `while(true)` のような無限ループは特別に最適化されます：

**Z++ソースコード:**
```zpp
while (true) {
    uint8 sensor_val = Input(0);
    Output(sensor_val, 1);
}
```

**生成されるアセンブリコード:**
```assembly
infinite_loop:
    LDI r1, 0                  ; Input引数：ポート0
    CAL Input                  ; Input(0)
    MOV r15, r1                ; 戻り値をr1にコピー
    LDI r2, 1                  ; Output引数：ポート1
    CAL Output                 ; Output(sensor_val, 1)
    JMP infinite_loop          ; 条件チェックなしで直接ジャンプ
```

### 6.2.4. 使用例

```zpp
// ポート2のボタンが押されるまで待機する
uint8 button_state = Input(2);
while (button_state == 0) {
    button_state = Input(2);
}
// ボタンが押された後の処理
```

## 6.3. do-while ループ

最初に必ず一度ブロック内の処理を実行してから、条件式を評価する制御構造です。

### 6.3.1. アセンブリレベルでの実装

do-whileループは先にループ本体を実行してから条件をチェックする構造になります：

**Z++ソースコード:**
```zpp
uint8 sensor_status;
do {
    sensor_status = Input(SENSOR_PORT);
} while (sensor_status != 1);
```

**生成されるアセンブリコード:**
```assembly
do_loop_start:
    ; ループ本体を先に実行
    LDI r1, SENSOR_PORT            ; Input引数：センサーポート
    CAL Input                      ; Input(SENSOR_PORT)
    MST r15, ap0, sensor_status_addr ; 戻り値を変数に格納
    
    ; 条件評価: sensor_status != 1
    MLD r1, ap0, sensor_status_addr ; sensor_status をr1にロード
    LDI r2, 1                       ; 比較値1をr2にロード
    CMP r1, r2                      ; r1とr2を比較
    JNZ do_loop_start               ; r1 != 1 ならループ継続

; ループ終了後の処理
```

### 6.3.2. while vs do-while の違い

- **whileループ:** 条件を先にチェック→0回以上実行
- **do-whileループ:** 本体を先に実行→1回以上実行

### 6.3.3. 使用例

```zpp
// センサーの初期化処理（必ず1回は実行される）
uint8 sensor_status;
do {
    sensor_status = Input(SENSOR_PORT);
} while (sensor_status != 1);
```

## 6.4. for ループ

カウンタ変数を使った繰り返し処理を簡潔に記述する制御構造です。

### 6.4.1. 書式と動作原理

```zpp
for (初期化式; 条件式; 後処理式) {
    // ループ処理
}
```

1. **初期化式:** ループ開始前に一度だけ実行
2. **条件式:** ループ実行前に毎回評価
3. **ループ本体:** 条件が真の間実行
4. **後処理式:** ループ本体実行後に毎回実行

### 6.4.2. アセンブリレベルでのfor ループ実装

forループは初期化、条件チェック、インクリメント、ジャンプの組み合わせで実現されます：

**Z++ソースコード:**
```zpp
for (uint8 brightness = 0; brightness <= 255; brightness++) {
    Output(brightness, 1);
}
```

**生成されるアセンブリコード:**
```assembly
; 初期化式: brightness = 0
LDI r1, 0
MST r1, ap0, brightness_addr

for_condition:
; 条件式: brightness <= 255
MLD r1, ap0, brightness_addr   ; brightness をr1にロード
LDI r2, 255                    ; 比較値255をr2にロード
CMP r1, r2                     ; r1とr2を比較
JGT for_end                    ; r1 > 255 ならループ終了

; ループ本体: Output(brightness, 1)
MLD r1, ap0, brightness_addr   ; brightness の値をr1に再ロード
LDI r2, 1                      ; ポート1
CAL Output                     ; Output(brightness, 1)

; 後処理式: brightness++
MLD r1, ap0, brightness_addr   ; brightness をr1にロード
INC r1                         ; r1をインクリメント
MST r1, ap0, brightness_addr   ; 新しい値を変数に格納

JMP for_condition              ; 条件評価に戻る

for_end:
; ループ終了後の処理
```

### 6.4.3. ループ制御の最適化

コンパイラは単純なforループを効率的に最適化します：

**最適化前のナイーブな実装:**
- 毎回メモリからカウンタ変数をロード
- 条件評価のたびにメモリアクセス

**最適化後の実装:**
- カウンタ変数をレジスタに保持
- メモリアクセスの回数を最小化

### 6.4.4. 使用例

```zpp
// ポート1のLEDを0から255まで徐々に明るくする
for (uint8 brightness = 0; brightness <= 255; brightness++) {
    Output(brightness, 1);
}

// 配列の全要素を処理
uint8 data[10];
for (uint8 i = 0; i < 10; i++) {
    data[i] = i * 2;
}
```

## 6.5. switch 文

一つの変数の値に応じて、複数の分岐先から一つを選択する多方向分岐の制御構造です。

### 6.5.1. 動作原理

1. `switch (expression)` の式を評価
2. `case constant:` の定数と値を比較
3. 一致する `case` から処理開始
4. `break` 文まで連続実行（フォールスルー）
5. どの `case` にも一致しない場合は `default` を実行

### 6.5.2. アセンブリレベルの最適化：ジャンプテーブル

コンパイラは効率的な実装のため、**ジャンプテーブル**を利用する場合があります。これにより、複数の比較分岐よりも高速な処理が可能です。

#### ジャンプテーブル実装の原理

1. **テーブル生成:** 各case値に対応するジャンプ先アドレスをテーブルに格納
2. **インデックス計算:** switch式の値を使ってテーブルのインデックスを計算
3. **間接ジャンプ:** テーブルから取得したアドレスに直接ジャンプ

#### 例：連続する値のswitch文

**Z++ソースコード:**
```zpp
enum OperationMode { STANDBY = 0, RUNNING = 1, ERROR_STATE = 2 };
enum OperationMode current_mode = STANDBY;

switch (current_mode) {
    case OperationMode::STANDBY:
        Output(64, 0);    // 低輝度
        break;
    case OperationMode::RUNNING:
        Output(255, 0);   // 最大輝度
        break;
    case OperationMode::ERROR_STATE:
        Output(128, 0);   // 中輝度
        break;
    default:
        Output(0, 0);     // 消灯
        break;
}
```

**生成されるアセンブリコード（ジャンプテーブル使用）:**
```assembly
; switch式の評価
MLD r1, ap0, current_mode_addr ; current_mode をr1にロード

; 範囲チェック（0-2の有効範囲）
LDI r2, 2
CMP r1, r2
JGT switch_default             ; 2より大きければdefault

; ジャンプテーブルによる分岐
API ap1, jump_table            ; ジャンプテーブルのアドレス
MLD r2, ap1, r1                ; jump_table[current_mode] をr2にロード
JMP r2                         ; 取得したアドレスにジャンプ

; ジャンプテーブル（ROM領域に配置）
jump_table:
    .word case_standby         ; インデックス0
    .word case_running         ; インデックス1
    .word case_error           ; インデックス2

case_standby:
    LDI r1, 64
    LDI r2, 0
    CAL Output
    JMP switch_end

case_running:
    LDI r1, 255
    LDI r2, 0
    CAL Output
    JMP switch_end

case_error:
    LDI r1, 128
    LDI r2, 0
    CAL Output
    JMP switch_end

switch_default:
    LDI r1, 0
    LDI r2, 0
    CAL Output

switch_end:
; switch文終了後の処理
```

### 6.5.3. 疎な値のswitch文（比較分岐実装）

case値が連続していない場合、ジャンプテーブルよりも比較分岐が効率的です：

**Z++ソースコード:**
```zpp
switch (error_code) {
    case 10:
        Output(1, 0);
        break;
    case 50:
        Output(2, 0);
        break;
    case 200:
        Output(3, 0);
        break;
}
```

**生成されるアセンブリコード（比較分岐実装）:**
```assembly
MLD r1, ap0, error_code_addr

; case 10:
LDI r2, 10
CMP r1, r2
JZ case_10

; case 50:
LDI r2, 50
CMP r1, r2
JZ case_50

; case 200:
LDI r2, 200
CMP r1, r2
JZ case_200

; どのcaseにも一致しない
JMP switch_end

case_10:
    LDI r1, 1
    LDI r2, 0
    CAL Output
    JMP switch_end

case_50:
    LDI r1, 2
    LDI r2, 0
    CAL Output
    JMP switch_end

case_200:
    LDI r1, 3
    LDI r2, 0
    CAL Output

switch_end:
```

### 6.5.4. フォールスルー動作

`break`文がない場合、次の`case`に処理が継続します：

**Z++ソースコード:**
```zpp
switch (level) {
    case 3:
        Output(1, LED3);  // LED3点灯
    case 2:
        Output(1, LED2);  // LED2点灯
    case 1:
        Output(1, LED1);  // LED1点灯
        break;
}
```

このコードでは、`level == 3`の場合、LED3、LED2、LED1が全て点灯します。

### 6.5.5. 使用例

```zpp
enum OperationMode { STANDBY, RUNNING, ERROR_STATE };
enum OperationMode current_mode = OperationMode::STANDBY;

switch (current_mode) {
    case OperationMode::STANDBY:
        // スタンバイモードの処理
        Output(64, STATUS_LED);   // 低輝度で待機表示
        break;
    case OperationMode::RUNNING:
        // 実行モードの処理
        Output(255, STATUS_LED);  // 最大輝度で動作表示
        break;
    case OperationMode::ERROR_STATE:
    default:
        // エラーまたは未定義状態の処理
        Output(128, STATUS_LED);  // 中輝度でエラー表示
        break;
}
```

## 6.6. break 文と continue 文

### 6.6.1. break 文

最も近い外側のループまたは `switch` 文を強制終了します。

#### アセンブリレベルでのbreak実装

**Z++ソースコード:**
```zpp
uint8 input_value;
while (true) {
    input_value = Input(0);
    if (input_value == 100) {
        break;  // ループを抜ける
    }
    Output(input_value, 1);
}
```

**生成されるアセンブリコード:**
```assembly
loop_start:
    LDI r1, 0
    CAL Input                      ; Input(0)
    MST r15, ap0, input_value_addr ; 戻り値を変数に格納
    
    ; if (input_value == 100) のチェック
    MLD r1, ap0, input_value_addr
    LDI r2, 100
    CMP r1, r2
    JZ loop_break                  ; 100なら break (ループ終了)
    
    ; Output(input_value, 1)
    MLD r1, ap0, input_value_addr
    LDI r2, 1
    CAL Output
    
    JMP loop_start                 ; ループ継続

loop_break:
; ループ終了後の処理
```

#### 使用例

```zpp
uint8 input_value;
while (true) {  // 無限ループ
    input_value = Input(0);
    if (input_value == 100) {
        break; // ループを抜ける
    }
    Output(input_value, 1);
}
// ループ終了後の処理
```

## 6.7. return 文

現在の関数の実行を終了し、呼び出し元に制御を戻します。

### 6.7.1. 形式
- `return;` - `void`型関数で使用
- `return expression;` - 戻り値を持つ関数で使用

### 6.7.2. アセンブリレベルの動作

return文の実行は以下の手順で行われます：

1. **戻り値設定:** 式を評価して結果を`r15`レジスタに格納
2. **レジスタ復元:** 関数内で変更したCallee-Savedレジスタ（`r5`〜`r14`）を復元
3. **復帰:** `RET`命令で呼び出し元に復帰

#### 例：戻り値ありの関数

**Z++ソースコード:**
```zpp
uint8 calculate_sum(uint8 a, uint8 b) {
    uint8 result = a + b;
    return result;
}
```

**生成されるアセンブリコード:**
```assembly
calculate_sum:
    ; プロローグ（必要に応じてレジスタ退避）
    ; r1 = a, r2 = b (引数)
    
    ; result = a + b
    ADD r1, r2, r3             ; r3 = r1 + r2
    MST r3, ap14, -1           ; result をローカル変数領域に保存
    
    ; return result
    MLD r15, ap14, -1          ; result の値をr15（戻り値レジスタ）に格納
    
    ; エピローグ（退避したレジスタを復元）
    RET                        ; 呼び出し元に復帰
```

#### 例：戻り値なしの関数

**Z++ソースコード:**
```zpp
void blink_led(uint8 port) {
    Output(255, port);
    Output(0, port);
    return;  // 省略可能
}
```

**生成されるアセンブリコード:**
```assembly
blink_led:
    ; r1 = port (引数)
    
    ; Output(255, port)
    LDI r2, 255
    MOV r1, r3                 ; portをr3に保存
    MOV r2, r1                 ; 255をr1に移動
    MOV r3, r2                 ; portをr2に移動
    CAL Output
    
    ; Output(0, port)
    LDI r1, 0
    MOV r3, r2                 ; portをr2に復元
    CAL Output
    
    ; return（暗黙的）
    RET
```

### 6.7.3. 使用例

```zpp
// 戻り値を持つ関数
uint8 get_sensor_value(uint8 port) {
    uint8 value = Input(port);
    if (value > 200) {
        return 200;  // 最大値制限
    }
    return value;
}

// 戻り値を持たない関数
void initialize_system() {
    Output(0, 0);    // 全ポート初期化
    Output(0, 1);
    Output(0, 2);
    return;          // 省略可能
}
```

---

**注記:** 本章で説明したアセンブリレベルの詳細は、Z++の「透明性」原則に基づき、開発者がコードの最終的な動作を予測できるようにするために記載されています。実際のコンパイラ最適化により、生成されるアセンブリコードは一部異なる場合がありますが、基本的な制御フロー原理は同様です。