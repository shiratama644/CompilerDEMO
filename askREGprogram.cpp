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
    bool is_setup = false;

    // アドレス範囲チェック
    void check_address(uint8_t addr) const {
        if (addr >= regs.size()) {
            std::cerr << "Erro: Invalid address r" << +addr << ". Terminate." << std::endl;
            exit(1);
        }
    }

    // 初期化済みチェック
    void ensure_setup() const {
        if (!is_setup) {
            std::cerr << "Error: Registers is not set up. Call reg_setup(). Terminate." << std::endl;
            exit(1);
        }
    }

public:
    double read_delay;   // 読み出し遅延
    double write_delay;  // 書き込み遅延

    Register() = default;

    // レジスタ生成（一度のみ呼び出せる）
    void reg_setup(uint8_t count, bool use_zero_register, double new_read_delay, double new_write_delay) {
        if (is_setup) {
            std::cerr << "Error: reg_setup() already called. Terminate." << std::endl;
            exit(1);
        }
        regs.assign(count, 0);
        has_zero_reg = use_zero_register;
        this->read_delay = new_read_delay;
        this->write_delay = new_write_delay;
        is_setup = true;
        std::cout << "Registers set up: " << +count
                  << ", ZeroReg: " << (use_zero_register ? "Yes" : "No")
                  << std::endl
                  << "ReadDelay: " << this->read_delay << "s"
                  << ", Write delay: " << this->write_delay << "s"
                  << std::endl;
    }

    // 全レジスタをクリア
    void reg_clear() {
        ensure_setup();
        for (size_t i = 0; i < regs.size(); ++i) {
            if (!(has_zero_reg && i == 0)) {
                regs[i] = 0;
            }
        }
        std::cout << "Registers cleared." << std::endl;
    }

    // 書き込み
    void reg_write(uint8_t addr, uint8_t data) {
        ensure_setup();
        check_address(addr);
        if (has_zero_reg && addr == 0) {
            std::cout << "Write ignored: Zero Register (r0)" << std::endl;
        } else {
            regs[addr] = data;
        }
        std::this_thread::sleep_for(std::chrono::duration<double>(write_delay));
    }

    // 読み出し（2つ同時）
    std::tuple<uint8_t, uint8_t> reg_read(uint8_t addr_a, uint8_t addr_b) {
        ensure_setup();
        check_address(addr_a);
        check_address(addr_b);
        std::this_thread::sleep_for(std::chrono::duration<double>(read_delay));
        return {regs[addr_a], regs[addr_b]};
    }
    
    // 読み出し（単一）
    uint8_t reg_read(uint8_t addr) {
        ensure_setup();
        check_address(addr);
        std::this_thread::sleep_for(std::chrono::duration<double>(read_delay));
        return regs[addr];
    }

    // レジスタ一覧を表示
    void print_all_regs() const {
        std::cout << "--- Register Dump ---" << std::endl;
        for (size_t i = 0; i < regs.size(); ++i) {
            std::cout << "r" << i << ": " << std::setw(3) << std::setfill(' ') << +regs[i]
            << " (0x" << std::hex << std::setw(2)
            << std::setfill('0') << +regs[i] << std::dec << std::setfill(' ') << ")"
            << std::endl;
        }
        std::cout << "---------------------" << std::endl;
    }
    
    // オペコードで実行（２つ同時読み出し）
    std::tuple<uint8_t, uint8_t> execute(uint8_t opcode, uint8_t addr_a, uint8_t data_addr_b) {
        ensure_setup();
        check_address(addr_a);
        if (opcode == 0) {
            if (has_zero_reg && addr_a == 0) {
                std::cout << "Write ignored: Zero Register (r0)" << std::endl;
            } else {
                regs[addr_a] = data_addr_b;
            }
        } else if (opcode == 1) {
            check_address(data_addr_b);
            std::this_thread::sleep_for(std::chrono::duration<double>(read_delay));
            return {regs[addr_a], regs[data_addr_b]};
        }
    }
};

namespace CPUConfig {                      // デフォルト数値の名前空間
    constexpr uint8_t RegCount = 8;        // レジスタ数
    constexpr bool UseZeroReg = true;      // ゼロレジスタを使うか
    constexpr double RegReadDelay = 0.1;   // 読み出し遅延
    constexpr double RegWriteDelay = 0.1;  // 書き込み遅延
}

// 動作確認
int main() {
    Register regs;

    regs.reg_setup(CPUConfig::RegCount, CPUConfig::UseZeroReg, CPUConfig::RegReadDelay, CPUConfig::RegWriteDelay); // 8個作成、R0はゼロレジスタ
    std::cout << std::endl;
    
    regs.reg_clear();
    
    regs.execute(0, 1, 100);
    
    auto[r1, r2] = regs.execute(1, 1, 2);
    
    std::cout << +r1 << ", " << +r2 << std::endl;
    
    regs.print_all_regs();
    

}