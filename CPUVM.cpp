/*
ALU 実装（8bit 結果 + フラグ）
- 命令 (3bit):
  000 ADD, 001 ADC, 010 SUB, 011 SBC,
  100 NOR, 101 AND, 110 XOR, 111 RSH ((A | B) >> 1)
- フラグビット（flags uint8_t）:
  bit0: C   (Carry)
  bit1: NC  (Not Carry)
  bit2: Z   (Zero)
  bit3: NZ  (Not Zero)
  bit4: E   (Even)
  bit5: O   (Odd)
  bit6-7: 予備
  
レジスタ実装
- 機能:
  任意の数の8bitレジスタを生成
  ゼロレジスタ（r0）の有効/無効化
  レジスタへの書き込み（遅延あり）
  レジスタからの読み出し（2つ同時、または単一、遅延あり）
  全レジスタのクリア
  全レジスタ内容のダンプ表示
*/

#include <chrono>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <stdexcept> // exit()で異常終了させる場合に使用
#include <thread>
#include <tuple>
#include <vector>

// CPUの設定
namespace CPUConfig {
  constexpr double ALUDelay = 0.8;
  constexpr uint8_t RegCount = 8;
  constexpr bool UseZeroReg = true;
  constexpr double RegReadDelay = 0.3;
  constexpr double RegWriteDelay = 0.4;
}

// オペコードの定義
enum class Opcode : uint8_t {
  ADD = 0b0000,
  ADC = 0b0001,
  SUB = 0b0010,
  SBC = 0b0011,
  NOR = 0b0100,
  AND = 0b0101,
  XOR = 0b0110,
  RSH = 0b0111
};

// フラグビットのマスク定義
namespace Flags {
constexpr uint8_t C = 1 << 0;  // Carry
constexpr uint8_t NC = 1 << 1; // Not Carry
constexpr uint8_t Z = 1 << 2;  // Zero
constexpr uint8_t NZ = 1 << 3; // Not Zero
constexpr uint8_t E = 1 << 4;  // Even
constexpr uint8_t O = 1 << 5;  // Odd
}

// ALUクラス
class ALU {
private:
  bool is_setup = false;

  // 初期化済みチェック
  void ensure_setup() const {
    if (!is_setup) {
      std::cerr << "Error: ALU is not set up. Call alu_setup(). Terminate."  << std::endl;
      exit(1);
    }
  }

public:
  uint8_t result;
  uint8_t flags;

  // ALUの処理遅延
  double alu_delay;

  ALU() : result(0), flags(0) {}

  void alu_setup(double new_alu_delay) {
    if (is_setup) {
      std::cerr << "Error: alu_setup() already called. Terminate." << std::endl;
      exit(1);
    }
    this->alu_delay = new_alu_delay;
    is_setup = true;
    std::cout << "ALU set up: "
              << "ALU Delay: " << this->alu_delay << "s" << std::endl;
  }

  void execute(uint8_t A, uint8_t B, Opcode opcode) {
    flags = 0;
    result = 0;

    std::this_thread::sleep_for(std::chrono::duration<double>(alu_delay));

    bool is_arith = (static_cast<uint8_t>(opcode) & 0b100) == 0;

    if (is_arith) {
      bool B_invert = (static_cast<uint8_t>(opcode) & 0b010) != 0;
      uint8_t carry_in = 0;
      if (opcode == Opcode::ADC || opcode == Opcode::SUB) {
        carry_in = 1;
      }

      // 加減算器の動作を再現
      uint8_t B2 = B_invert ? static_cast<uint8_t>(~B) : B;
      uint16_t tmp = static_cast<uint16_t>(A) + static_cast<uint16_t>(B2) + static_cast<uint16_t>(carry_in);
      result = static_cast<uint8_t>(tmp & 0xFF);
      bool carry_out = (tmp & 0x100) != 0;

      // Carry or Not Carry
      if (carry_out) {
        flags |= Flags::C;
      } else {
        flags |= Flags::NC;
      }

      // Zero or Not Zero
      if (result == 0) {
        flags |= Flags::Z;
      } else {
        flags |= Flags::NZ;
      }

      // Even or Odd
      if ((result & 1) == 0) {
        flags |= Flags::E;
      } else {
        flags |= Flags::O;
      }

    } else {
      flags |= Flags::NC;
      switch (opcode) {
      case Opcode::NOR:
        result = static_cast<uint8_t>(~(A | B));
        break;

      case Opcode::AND:
        result = static_cast<uint8_t>(A & B);
        break;

      case Opcode::XOR:
        result = static_cast<uint8_t>(A ^ B);
        break;

      case Opcode::RSH:
        result =
            static_cast<uint8_t>((static_cast<uint16_t>(A | B) >> 1) & 0xFF);
        break;

      default:
        result = 0;
        break;
      }

      // Zero or Not Zero
      if (result == 0) {
        flags |= Flags::Z;
      } else {
        flags |= Flags::NZ;
      }

      // Even or Odd
      if ((result & 1) == 0) {
        flags |= Flags::E;
      } else {
        flags |= Flags::O;
      }
    }
  }

  void print_flags() const {
    std::cout << "C: " << ((flags & Flags::C) != 0)
              << ", NC: " << ((flags & Flags::NC) != 0)
              << ", Z: " << ((flags & Flags::Z) != 0)
              << ", NZ: " << ((flags & Flags::NZ) != 0)
              << ", E: " << ((flags & Flags::E) != 0)
              << ", O: " << ((flags & Flags::O) != 0) << "\n";
  }
};

// Registerクラス
class Register {
private:
  std::vector<uint8_t> regs;
  bool has_zero_reg = false;
  bool is_created = false;

  // アドレス範囲チェック
  void check_address(uint8_t addr) const {
    if (addr >= regs.size()) {
      std::cerr << "Error: Invalid address r" << +addr << ". Terminate."  << std::endl;
      exit(1);
    }
  }

  // 初期化済みチェック
  void ensure_created() const {
    if (!is_created) {
      std::cerr << "Error: Registers not created. Call reg_create(). Terminate."  << std::endl;
      exit(1);
    }
  }

public:
  double read_delay;  // 読み出し遅延
  double write_delay; // 書き込み遅延

  Register() = default;

  // レジスタ生成（一度のみ呼び出せる）
  void reg_create(uint8_t count, bool use_zero_register, double new_read_delay,    double new_write_delay) {
    if (is_created) {
      std::cerr << "Error: reg_setup() already called. Terminate." << std::endl;
      exit(1);
    }
    regs.assign(count, 0);
    has_zero_reg = use_zero_register;
    this->read_delay = new_read_delay;
    this->write_delay = new_write_delay;
    is_created = true;
    std::cout << "Registers created: " << +count
              << ", ZeroReg: " << (use_zero_register ? "Yes" : "No")
              << std::endl
              << "ReadDelay: " << this->read_delay << "s"
              << ", Write delay: " << this->write_delay << "s" << std::endl;
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
  void reg_write(uint8_t addr, uint8_t data) {
    ensure_created();
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
    ensure_created();
    check_address(addr_a);
    check_address(addr_b);
    std::this_thread::sleep_for(std::chrono::duration<double>(read_delay));
    return {regs[addr_a], regs[addr_b]};
  }

  // 読み出し（単一）
  uint8_t reg_read(uint8_t addr) {
    ensure_created();
    check_address(addr);
    std::this_thread::sleep_for(std::chrono::duration<double>(read_delay));
    return regs[addr];
  }

  // レジスタ一覧を表示
  void print_all_regs() const {
    std::cout << "--- Register Dump ---" << std::endl;
    for (size_t i = 0; i < regs.size(); ++i) {
      std::cout << "r" << i << ": " << std::setw(3) << std::setfill(' ')  << +regs[i] << " (0x" << std::hex << std::setw(2)  << std::setfill('0') << +regs[i] << std::dec  << std::setfill(' ') << ")" << std::endl;
    }
    std::cout << "---------------------" << std::endl;
  }
};

void run_alu_test(ALU &alu, uint8_t A, uint8_t B, Opcode opcode,    const std::string &operation_name) {
  std::cout << "Executing " << operation_name << "..." << std::flush;
  alu.execute(A, B, opcode);
  std::cout << " Done.\n";
  std::cout << "  -> result: " << +alu.result << " (0x" << std::hex
            << std::setw(2) << std::setfill('0') << +alu.result << std::dec
            << ")\n";
  std::cout << "  -> flags: ";
  alu.print_flags();
  std::cout << "\n";
}

void run_reg_write_test(Register &reg, uint8_t addr, uint8_t data, const std::string &operation_name) {
    std::cout << "Executing " << operation_name << "..." << std::flush;
    reg.reg_write(addr, data);
    std::cout << " Done.\n";
}

void run_reg_read_test(Register &reg, uint8_t addr_a, uint8_t addr_b, const std::string &operation_name) {
    std::cout << "Executing " << operation_name << "..." << std::flush;
    auto [value_a, value_b] = reg.reg_read(addr_a, addr_b);
    std::cout << " Done.\n";
    std::cout << "  -> read: r" << +addr_a << " = " << +value_a << ", "
              << "r" << +addr_b << " = " << +value_b << "\n";
}

void run_combined_test(ALU &alu, Register &reg, uint8_t addr_a, uint8_t addr_b, uint8_t result_addr, Opcode opcode, const std::string &operation_name) {
    std::cout << "Executing " << operation_name << "..." << std::flush;
    
    // レジスタから値を読み出し
    auto [val_a, val_b] = reg.reg_read(addr_a, addr_b);
    
    // ALU演算を実行
    alu.execute(val_a, val_b, opcode);
    
    // 結果をレジスタに書き込み
    reg.reg_write(result_addr, alu.result);
    
    std::cout << " Done.\n";
    std::cout << "  -> operands: r" << +addr_a << "=" << +val_a << ", r" << +addr_b << "=" << +val_b << "\n";
    std::cout << "  -> result: " << +alu.result << " (0x" << std::hex << std::setw(2) 
              << std::setfill('0') << +alu.result << std::dec << ") -> r" << +result_addr << "\n";
    std::cout << "  -> flags: ";
    alu.print_flags();
    std::cout << "\n";
}

void Halt(double time_sec) {
  std::this_thread::sleep_for(std::chrono::duration<double>(time_sec));
}

void ALU_TESTS() {
  ALU alu;
  alu.alu_setup(CPUConfig::ALUDelay);
  std::cout << std::endl;
  /*
  100 + 200 = 44, Flags: C=1, NC=0, Z=0, NZ=1, E=1, O=0
  100 + 200 + 1 = 45, Flags: C=1, NC=0, Z=0, NZ=1, E=0, O=1
  1 - 200 = 57, Flags: C=0, NC=1, Z=0, NZ=1, E=0, O=1
  1 - 200 - 1 = 56, Flags: C=0, NC=1, Z=0, NZ=1, E=1, O=0
  
  ~(0b01110111 | 0b00001111) = 0b10000000 (128), Flags: C=0, NC=1, Z=0, NZ=1, E=1, O=0
  0b10010010 & 0b01111011 = 0b00010010 (18), Flags: C=0, NC=1, Z=1, NZ=0, E=1, O=0
  0b01100111 ^ 0b00110011 = 0b01010100 (84), Flags: C=0, NC=1, Z=0, NZ=1, E=1, O=0
  (0b10101010 | 0b01010101) >> 1 = 0b01111111 (127), Flags: C=0, NC=1, Z=0, NZ=1, E=0, O=1
  */
  
  // 算術演算テスト
  run_alu_test(alu, 100, 200, Opcode::ADD, "ADD (100 + 200)");
  run_alu_test(alu, 100, 200, Opcode::ADC, "ADC (100 + 200 + 1)");
  run_alu_test(alu, 1, 200, Opcode::SUB, "SUB (1 - 200)");
  run_alu_test(alu, 1, 200, Opcode::SBC, "SBC (1 - 200 - 1)");
  // 論理演算テスト
  run_alu_test(alu, 0b01110111, 0b00001111, Opcode::NOR, "NOR (~(0b01110111 | 0b00001111))");
  run_alu_test(alu, 0b10010010, 0b01111011, Opcode::AND, "AND (0b10010010 & 0b01001001)");
  run_alu_test(alu, 0b01100111, 0b00110011, Opcode::XOR, "XOR (0b01100111 ^ 0b00110011)");
  run_alu_test(alu, 0b10101010, 0b01010101, Opcode::RSH, "RSH ((0b10101010 | 0b01010101) >> 1)");
  std::cout << "ALU tests completed." << std::endl;
}

void REG_TESTS(){
  Register reg;
  reg.reg_create(CPUConfig::RegCount, CPUConfig::UseZeroReg, CPUConfig::RegReadDelay, CPUConfig::RegWriteDelay);
  std::cout << std::endl;

  run_reg_write_test(reg, 1, 100, "reg_write(r1, 100)");
  run_reg_write_test(reg, 2, 200, "reg_write(r2, 200)");
  run_reg_write_test(reg, 0, 255, "reg_write(r0, 255)");
  reg.print_all_regs();
  
  run_reg_read_test(reg, 1, 2, "reg_read(r1, r2)");
  run_reg_read_test(reg, 0, 0, "reg_read(r0, r0)");
  run_reg_read_test(reg, 0, 1, "reg_read(r0, r1)");
  reg.reg_clear();
  reg.print_all_regs();
  
  std::cout << "Register tests completed." << std::endl;
}

void COMBINED_TESTS() {
  ALU alu;
  Register reg;
  
  alu.alu_setup(CPUConfig::ALUDelay);
  reg.reg_create(CPUConfig::RegCount, CPUConfig::UseZeroReg, CPUConfig::RegReadDelay, CPUConfig::RegWriteDelay);
  std::cout << std::endl;

  // テスト用の初期値をレジスタに設定
  reg.reg_write(1, 150);  // r1 = 150
  reg.reg_write(2, 100);  // r2 = 100
  reg.reg_write(3, 50);   // r3 = 50
  reg.reg_write(4, 255);  // r4 = 255
  std::cout << "\nInitial register state:" << std::endl;
  reg.print_all_regs();

  // 組み合わせテストの実行
  run_combined_test(alu, reg, 1, 2, 5, Opcode::ADD, "ADD r1+r2 -> r5 (150+100)");
  run_combined_test(alu, reg, 1, 3, 6, Opcode::SUB, "SUB r1-r3 -> r6 (150-50)");
  run_combined_test(alu, reg, 2, 4, 7, Opcode::AND, "AND r2&r4 -> r7 (100&255)");
  run_combined_test(alu, reg, 5, 6, 1, Opcode::XOR, "XOR r5^r6 -> r1 (result^result)");

  std::cout << "\nFinal register state:" << std::endl;
  reg.print_all_regs();
  
  std::cout << "Combined ALU+Register tests completed." << std::endl;
}

// テスト
int main() {
  ALU_TESTS();
  std::cout << std::endl;
  Halt(1.0);
    
  REG_TESTS();
  std::cout << std::endl;
  Halt(1.0);
  
  COMBINED_TESTS();
  std::cout << std::endl;
  Halt(1.0);
  
  std::cout << "All tests completed." << std::endl;
  
  return 0;
}