# 9章 名前空間とモジュール (Namespaces and Modules)

Z++は、コードの再利用性を高め、大規模なプロジェクトを整理して管理するための強力なモジュールシステムを提供します。

## 9.1. Z++におけるモジュールの考え方

プログラムが大きくなるにつれて、全てのコードを一つのファイルに記述するのは非効率的になり、名前の衝突のリスクも増大します。

Z++のモジュールシステムは以下の方法でこの問題を解決します：

1. 関連する機能を意味のある単位の**ファイル（モジュール）**に分割
2. **`namespace`**を使って、モジュール内の機能を論理的なグループに分け、名前の衝突を防止
3. **`#include`**と**`using`**を使って、必要な機能だけを安全にインポートして利用

## 9.2. プリプロセッサ命令

プリプロセッサ命令は、コンパイラが本格的なコード解析を始める前に実行される、テキストベースの処理です。`#`で始まります。

### 9.2.1. インクルードガード (`#ifndef`, `#define`, `#endif`)

`#include`が単純なテキスト展開であるため、同じファイルが複数回インクルードされると、同じ関数やクラスが二重に定義されてしまいます。これを防ぐため、再利用を目的としたファイルは、**必ずインクルードガードで囲む**必要があります。

#### インクルードガードの実装メカニズム

インクルードガードは、プリプロセッサの条件分岐機能を使用した二重定義防止システムです：

**ライブラリファイル例 (`sensor_lib.zpp`):**
```zpp
// センサーライブラリのインクルードガード
#ifndef SENSOR_LIB_ZPP    // 'SENSOR_LIB_ZPP'が未定義なら...
#define SENSOR_LIB_ZPP    // 'SENSOR_LIB_ZPP'を定義済みにする

// --- ここにモジュールの内容を記述 ---
namespace SensorLib {
    uint8 read_temperature() {
        return Input(0);
    }
    
    uint8 read_humidity() {
        return Input(1);
    }
}

#endif // SENSOR_LIB_ZPP の終わり
```

#### プリプロセッサ展開の動作原理

**複数インクルードのケース:**
```zpp
// main.zpp
#include "sensor_lib.zpp"  // 1回目のインクルード
#include "sensor_lib.zpp"  // 2回目のインクルード
```

**プリプロセッサの処理手順:**

1. **1回目のインクルード処理:**
   ```cpp
   // SENSOR_LIB_ZPPは未定義 → #ifndef条件が真
   #define SENSOR_LIB_ZPP  // シンボルを定義
   // ライブラリ内容が展開される
   namespace SensorLib { ... }
   ```

2. **2回目のインクルード処理:**
   ```cpp
   // SENSOR_LIB_ZPPは既に定義済み → #ifndef条件が偽
   // ライブラリ内容はスキップされる
   ```

これにより、同じファイルが何回インクルードされても、その内容は最初の1回しかコンパイル対象になりません。

### 9.2.2. ファイルのインクルード (`#include`)

指定されたファイルの内容を、その場にテキストとして挿入します。

**書式:**
```zpp
#include "ファイルパス"
```

#### アセンブリレベルでのインクルード実装

インクルードは完全にコンパイル時処理であり、最終的なアセンブリコードには影響しません：

**インクルード前 (`main.zpp`):**
```zpp
#include "math_lib.zpp"
using Math::add;

uint8 main() {
    return add(5, 3);
}
```

**インクルード後（プリプロセッサ処理後）:**
```zpp
// math_lib.zpp の内容がここに展開される
namespace Math {
    uint8 add(uint8 a, uint8 b) { 
        return a + b; 
    }
}

using Math::add;

uint8 main() {
    return add(5, 3);
}
```

**生成されるアセンブリコード:**
```assembly
; Math::add 関数の実装
Math_add:
    ; r1 = a, r2 = b
    ADD r1, r2, r15        ; 戻り値 = a + b
    RET

; main 関数の実装
main:
    LDI r1, 5              ; 第1引数
    LDI r2, 3              ; 第2引数
    CAL Math_add           ; add(5, 3)を呼び出し
    ; r15に戻り値が格納される
    RET
```

## 9.3. 名前空間 (`namespace`)

`namespace`は、プログラム内の識別子が所属する「空間」を定義し、名前の衝突を防ぎます。

### 9.3.1. 名前空間の定義

```zpp
// sensor_utils.zpp
namespace SensorUtils {
    uint8 calibrate_sensor(uint8 port) { 
        return Input(port) * 2; 
    }
}

namespace DisplayUtils {
    void show_value(uint8 value, uint8 port) { 
        Output(value, port); 
    }
}
```

### 9.3.2. アセンブリレベルでの名前空間実装

名前空間は、コンパイル時に関数名のマングリング（名前修飾）によって実現されます：

**Z++ソースコード:**
```zpp
namespace Math {
    uint8 add(uint8 a, uint8 b) { return a + b; }
}

namespace StringUtils {
    uint8 add(uint8 str[], uint8 len) { return len; }  // 同じ名前だが別の機能
}
```

**生成されるアセンブリコード:**
```assembly
; Math::add のアセンブリ実装
Math_add:
    ADD r1, r2, r15
    RET

; StringUtils::add のアセンブリ実装
StringUtils_add:
    MOV r2, r15            ; len を戻り値に設定
    RET
```

コンパイラは各関数に一意の内部名を割り当てることで、同じ関数名の衝突を防いでいます。

### 9.3.3. 無名名前空間（Anonymous Namespace）

**書式:**
```zpp
namespace {
    // ファイル内限定のシンボル
}
```

#### ファイル限定スコープの実装原理

無名名前空間は、**ファイル内でのみ使用可能**なプライベートなシンボルを作成します：

**ライブラリファイル (`crypto_lib.zpp`):**
```zpp
#ifndef CRYPTO_LIB_ZPP
#define CRYPTO_LIB_ZPP

namespace {
    // ファイル内限定のヘルパー関数
    uint8 internal_hash(uint8 value) {
        return (value * 17) % 256;
    }
}

namespace Crypto {
    uint8 encrypt(uint8 data) {
        // internal_hashはこのファイル内でのみ使用可能
        return internal_hash(data) ^ 0xAA;
    }
}

#endif
```

**アセンブリレベルでの実装:**
```assembly
; 無名名前空間の関数は特殊な内部名を持つ
__anonymous_crypto_lib_internal_hash:
    LDI r2, 17
    MUL r1, r2, r1         ; value * 17
    ; 256での剰余（8ビットオーバーフローで自動実現）
    RET

; パブリックな関数
Crypto_encrypt:
    CAL __anonymous_crypto_lib_internal_hash  ; 内部関数を呼び出し
    LDI r2, 0xAA
    XOR r15, r2, r15       ; 結果をXOR
    RET
```

#### 無名名前空間の利点

1. **内部実装の隠蔽:** 外部からアクセスできないヘルパー関数
2. **名前衝突の回避:** 複数のファイルで同じ内部関数名を使用可能
3. **コード整理:** ファイル内の構造を明確化

## 9.4. シンボルのインポートとアクセス

`#include`したファイル内のシンボルを利用するには、以下の3つの方法があります。

### 9.4.1. スコープ解決演算子 (`::`)

`名前空間::シンボル名`の形式で、どの名前空間に属するシンボルかを明示的に指定します。

```zpp
#include "math_lib.zpp"

uint8 result = Math::add(10, 20); // Math名前空間のaddを呼び出す
```

グローバル名前空間のシンボルを明示的に指定する場合は`::シンボル名`と記述します。

### 9.4.2. `using`宣言 (特定シンボルのインポート)

特定のシンボルだけを現在のスコープに持ち込み、接頭辞なしで使えるようにします。**推奨されるインポート方法**です。

#### 書式
```zpp
using 名前空間::シンボル名;
using シンボル名;  // グローバル名前空間からのインポート
```

#### コンパイラレベルでのusingの実装

`using`宣言は、コンパイラのシンボルテーブルにエイリアス（別名）を作成します：

**Z++ソースコード:**
```zpp
#include "math_lib.zpp"
#include "global_utils.zpp"

using Math::add;        // Math名前空間のaddだけをインポート
using global_func;      // グローバル名前空間のglobal_funcをインポート

uint8 result = add(5, 3); // 実際は Math::add を呼び出し
```

**コンパイラのシンボルテーブル:**
```
シンボル名    → 実際の関数
add          → Math::add
global_func  → ::global_func
```

**生成されるアセンブリコード:**
```assembly
; using宣言により、add は Math_add にリダイレクトされる
LDI r1, 5
LDI r2, 3
CAL Math_add           ; Math::add の実際の実装を呼び出し
```

### 9.4.3. `using namespace`宣言 (名前空間全体のインポート)

指定した名前空間に含まれる**全てのシンボル**を現在のスコープに持ち込みます。

```zpp
#include "math_lib.zpp"
using namespace Math; // Math名前空間の全てを使用可能にする

uint8 result = add(5, 3); // OK
uint8 result2 = multiply(4, 6); // OK（Math名前空間の他の関数も使用可能）
```

## 9.5. 名前の衝突と曖昧さの解決

異なる名前空間から同じ名前のシンボルを`using`でインクルードした場合、その名前をそのまま使おうとすると**コンパイルエラー**となります。

### 9.5.1. 曖昧な呼び出し（エラーになる例）

```zpp
#include "file_a.zpp"  // ::calculate を含む
#include "file_b.zpp"  // Math::calculate を含む

using calculate;
using Math::calculate;

uint8 result = calculate(10); // エラー！どちらを指すか曖昧
```

### 9.5.2. コンパイラによる曖昧性検出

コンパイラは以下の手順で曖昧性をチェックします：

1. **シンボルテーブル構築:** 各`using`宣言でエイリアスを登録
2. **重複検出:** 同じ名前のエイリアスが複数登録された場合にマーク
3. **使用時チェック:** 曖昧なシンボルが使用された時点でエラー生成

### 9.5.3. 曖昧さの解決

スコープ解決演算子`::`を使い、どちらのバージョンを呼び出すかを明示的に指定します。

```zpp
uint8 result1 = ::calculate(10);      // グローバル名前空間のバージョン
uint8 result2 = Math::calculate(10);  // Math名前空間のバージョン
```

## 9.6. 実践的なモジュール設計例

### 9.6.1. ライブラリファイル (`sensor_library.zpp`)

```zpp
#ifndef SENSOR_LIBRARY_ZPP
#define SENSOR_LIBRARY_ZPP

namespace {
    // 内部実装のヘルパー関数
    uint8 apply_calibration(uint8 raw_value) {
        // 簡単なキャリブレーション処理
        if (raw_value < 10) return 0;
        if (raw_value > 245) return 255;
        return raw_value;
    }
}

namespace SensorLib {
    const uint8 VERSION = 2;
    
    // 温度センサー読み取り
    uint8 read_temperature(uint8 sensor_port) {
        uint8 raw = Input(sensor_port);
        return apply_calibration(raw);
    }
    
    // 湿度センサー読み取り
    uint8 read_humidity(uint8 sensor_port) {
        uint8 raw = Input(sensor_port);
        return apply_calibration(raw);
    }
    
    // 複数センサーの平均値取得
    uint8 get_average(uint8 ports[], uint8 count) {
        uint8 sum = 0;
        for (uint8 i = 0; i < count; i++) {
            sum += Input(ports[i]);
        }
        return sum / count;
    }
}

// グローバルなユーティリティ関数
void global_delay(uint8 cycles) {
    for (uint8 i = 0; i < cycles; i++) {
        // 簡単な遅延ループ
    }
}

#endif
```

### 9.6.2. アプリケーションファイル (`main.zpp`)

```zpp
#include "sensor_library.zpp"

// SensorLib名前空間から特定の関数をインポート
using SensorLib::read_temperature;
using SensorLib::read_humidity;
// グローバル名前空間からユーティリティ関数をインポート
using global_delay;

uint8 main() {
    const uint8 TEMP_SENSOR = 0;
    const uint8 HUMIDITY_SENSOR = 1;
    const uint8 STATUS_LED = 2;
    
    // インポートされた関数を直接使用
    uint8 temp = read_temperature(TEMP_SENSOR);
    uint8 humidity = read_humidity(HUMIDITY_SENSOR);
    
    // バージョン情報は完全修飾名でアクセス
    if (SensorLib::VERSION >= 2) {
        // v2.0以上の新機能を使用
        uint8 sensor_ports[2] = {TEMP_SENSOR, HUMIDITY_SENSOR};
        uint8 average = SensorLib::get_average(sensor_ports, 2);
        Output(average, STATUS_LED);
    }
    
    // グローバル関数を使用
    global_delay(100);
    
    return 0;
}
```

## 9.7. デッドコード除去とROM効率

Z++コンパイラは、最終的なプログラムのROMサイズを最小限に抑えるため、**デッドコード除去**の最適化を実装します。

### 9.7.1. 生存コード分析アルゴリズム

#### 動作原理

1. **テキスト展開:** `#include`でファイルの内容をテキスト挿入（第一段階）
2. **エントリーポイント特定:** `main`関数を起点として設定
3. **依存関数の連鎖解析:** 実際に呼び出される可能性のある全ての関数を連鎖的に解析
4. **生存/死亡判定:** 「生存している」と判断された関数のみをマーク
5. **コード生成:** マークされた関数のみを最終的なアセンブリコードとして生成
6. **死亡コード破棄:** 「死んでいる」コードは完全に破棄され、ROM領域を消費しない

#### 生存コード分析の詳細手順

**フェーズ1: 関数呼び出しグラフの構築**
```
1. 全ての関数とその呼び出し関係を解析
2. 有向グラフ（呼び出しグラフ）を構築
   - ノード: 関数
   - エッジ: 関数呼び出し関係
```

**フェーズ2: 生存性マーキング**
```
1. main関数を「生存」としてマーク
2. 生存関数から呼び出される全ての関数を再帰的に「生存」マーク
3. マークされていない関数は「死亡」として分類
```

**フェーズ3: コード生成フィルタリング**
```
1. 「生存」マークされた関数のみアセンブリコード生成
2. 「死亡」関数は完全に無視
```

### 9.7.2. デッドコード除去の実例

#### ライブラリファイル (`math_library.zpp`)

```zpp
#ifndef MATH_LIBRARY_ZPP
#define MATH_LIBRARY_ZPP

namespace MathLib {
    // この関数は main から呼び出される → 生存
    uint8 add(uint8 a, uint8 b) { 
        return a + b; 
    }
    
    // この関数は呼び出されない → 死亡
    uint8 subtract(uint8 a, uint8 b) { 
        return a - b; 
    }
    
    // この関数も呼び出されない → 死亡
    uint8 multiply(uint8 a, uint8 b) {
        uint8 result = 0;
        for (uint8 i = 0; i < b; i++) {
            result = add(result, a);  // addを呼び出すが、multiply自体が死亡のため無関係
        }
        return result;
    }
    
    // この関数は add から呼び出される → 生存
    uint8 helper_function(uint8 x) {
        return x * 2;
    }
}

// 修正：addからhelper_functionを呼び出すように変更
namespace MathLib {
    uint8 add(uint8 a, uint8 b) { 
        uint8 sum = a + b;
        return helper_function(sum);  // helper_functionを呼び出し
    }
}

#endif
```

#### メインファイル (`main.zpp`)

```zpp
#include "math_library.zpp"
using namespace MathLib;

uint8 main() {
    // add関数のみが呼び出される
    return add(10, 5);
}
```

#### コンパイラの分析結果

**生存コード分析:**
```
1. main関数 → 生存（エントリーポイント）
2. MathLib::add → 生存（mainから呼び出される）
3. MathLib::helper_function → 生存（addから呼び出される）
4. MathLib::subtract → 死亡（どこからも呼び出されない）
5. MathLib::multiply → 死亡（どこからも呼び出されない）
```

#### 生成されるアセンブリコード

```assembly
; 生存関数のみがアセンブリコードに含まれる

MathLib_helper_function:
    LDI r2, 2
    MUL r1, r2, r15        ; x * 2
    RET

MathLib_add:
    ADD r1, r2, r1         ; a + b
    CAL MathLib_helper_function  ; helper_function(sum)
    RET

main:
    LDI r1, 10
    LDI r2, 5
    CAL MathLib_add        ; add(10, 5)
    RET

; subtract と multiply の関数は生成されない（ROM節約）
```

### 9.7.3. ROM最適化の効果

#### 最適化前後の比較

**最適化前（全関数をコンパイルする場合）:**
```
- MathLib::add:             8 bytes
- MathLib::subtract:        6 bytes  ← 不要だが含まれる
- MathLib::multiply:        24 bytes ← 不要だが含まれる
- MathLib::helper_function: 6 bytes
- main:                     8 bytes
合計:                       52 bytes
```

**デッドコード除去後:**
```
- MathLib::add:             8 bytes
- MathLib::helper_function: 6 bytes
- main:                     8 bytes
合計:                       22 bytes（42%のROM節約！）
```

### 9.7.4. 大規模ライブラリでの効果

大きなライブラリをインクルードした場合の効果はさらに顕著です：

**例：100関数を含むライブラリを使用**
```zpp
#include "huge_library.zpp"  // 100個の関数を含む大型ライブラリ
using HugeLib::specific_function;

uint8 main() {
    return specific_function(42);  // 1つの関数のみ使用
}
```

この場合、`specific_function`とその依存関数のみがコンパイルされ、残りの95+関数は完全に除外されるため、大幅なROM節約が実現されます。

### 9.7.5. デッドコード除去の限界と注意点

#### 関数ポインタによる間接呼び出し

```zpp
namespace MathLib {
    uint8 add(uint8 a, uint8 b) { return a + b; }
    uint8 subtract(uint8 a, uint8 b) { return a - b; }
}

uint8 main() {
    // 関数ポインタを使用した間接呼び出し
    // この場合、静的解析では subtract の使用を検出できない可能性
    void (*operation)(uint8, uint8) = MathLib::subtract;
    return operation(10, 5);
}
```

このような場合、コンパイラの保守的な判断により、使用されない可能性があっても関数が保持される場合があります。

---

**注記:** 本章で説明した名前空間とモジュールシステムは、Z++の「表現力」原則に基づく設計です。コンパイル時の名前空間解決、インクルードガードによる安全性確保、デッドコード除去によるROM効率化により、8ビット環境でも大規模なプロジェクト開発が可能になります。これらの機能により、開発者は保守性と効率性の両立を実現できます。