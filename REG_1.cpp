#include <cstdint>
#include <iostream>
#include <iomanip>
#include <vector>
#include <tuple>
#include <thread>
#include <chrono>
#include <stdexcept> // exit()で異常終了させる場合に使用

// registerキーワードと衝突しないように Register と命名
class Register {
private:
    std::vector<uint8_t> regs;
    bool has_zero_reg = false;
    bool is_created = false;

    // アドレス範囲チェック
    void check_address(uint8_t addr) const {
        if (addr >= regs.size()) {
            std::cerr << "Error: Invalid address R" << +addr << ". Terminate." << std::endl;
            exit(1);
        }
    }

    // 初期化済みチェック
    void ensure_created() const {
        if (!is_created) {
            std::cerr << "Error: Registers not created. Call reg_create(). Terminate." << std::endl;
            exit(1);
        }
    }

public:
    inline static constexpr double reg_read_delay = 0.1;   // 読み出し遅延
    inline static constexpr double reg_write_delay = 0.1;  // 書き込み遅延

    Register() = default;

    // レジスタ生成（一度のみ呼び出せる）
    void reg_create(uint8_t count, bool use_zero_register) {
        if (is_created) {
            std::cerr << "Error: reg_create() already called. Terminate." << std::endl;
            exit(1);
        }
        regs.assign(count, 0);
        has_zero_reg = use_zero_register;
        is_created = true;
        std::cout << "Registers created: " << +count
                  << ", ZeroReg: " << (use_zero_register ? "Yes" : "No") << std::endl;
    }

    // 全レジスタをクリア
    void reg_clear() {
        ensure_created();
        for (size_t i = 0; i < regs.size(); ++i) {
            if (!(has_zero_reg && i == 0)) {
                regs[i] = 0;
            }
        }
        std::cout << "Registers cleared." << std::endl;
    }

    // 書き込み
    void reg_write(uint8_t data, uint8_t addr) {
        ensure_created();
        check_address(addr);
        if (has_zero_reg && addr == 0) {
            std::cout << "Write ignored: Zero Register (R0)" << std::endl;
        } else {
            regs[addr] = data;
        }
        std::this_thread::sleep_for(std::chrono::duration<double>(reg_write_delay));
    }

    // 読み出し（2つ同時）
    std::tuple<uint8_t, uint8_t> reg_read(uint8_t addr_a, uint8_t addr_b) {
        ensure_created();
        check_address(addr_a);
        check_address(addr_b);
        std::this_thread::sleep_for(std::chrono::duration<double>(reg_read_delay));
        return {regs[addr_a], regs[addr_b]};
    }
    
    // 読み出し（単一）
    uint8_t reg_read(uint8_t addr) {
        ensure_created();
        check_address(addr);
        std::this_thread::sleep_for(std::chrono::duration<double>(reg_read_delay));
        return regs[addr];
    }

    // レジスタ一覧を表示
    void print_all_regs() const {
        std::cout << "--- Register Dump ---" << std::endl;
        for (size_t i = 0; i < regs.size(); ++i) {
            std::cout << "R" << i << ": " << std::setw(3) << std::setfill(' ') << +regs[i]
            << " (0x" << std::hex << std::setw(2)
            << std::setfill('0') << +regs[i] << std::dec << std::setfill(' ') << ")"
            << std::endl;
        }
        std::cout << "---------------------" << std::endl;
    }
};

namespace CPUConfig { // デフォルト数値の名前空間
    constexpr uint8_t RegCount = 8; // レジスタ数
    constexpr bool UseZeroReg = true; // ゼロレジスタを使うか
}

// 動作確認
int main() {
    Register regs;

    regs.reg_create(CPUConfig::RegCount, CPUConfig::UseZeroReg); // 8個作成、R0はゼロレジスタ
    std::cout << std::endl;
    
    regs.reg_write(100, 1);   // R1 = 100
    regs.reg_write(200, 2);   // R2 = 200
    regs.reg_write(50, 0);    // R0に書き込み → 無視
    std::cout << std::endl;

    regs.print_all_regs();

    auto [v1, v2] = regs.reg_read(1, 2); // R1, R2 読み出し
    std::cout << "Read: R1=" << +v1 << ", R2=" << +v2 << std::endl << std::endl;

    auto [zr, r3] = regs.reg_read(0, 3); // R0, R3 読み出し
    std::cout << "Read: R0=" << +zr << ", R3=" << +r3 << std::endl << std::endl;

    regs.reg_clear();
    regs.print_all_regs();

    auto [c1, c2] = regs.reg_read(1, 2); // クリア後確認
    std::cout << "After clear: R1=" << +c1 << ", R2=" << +c2 << std::endl;
}