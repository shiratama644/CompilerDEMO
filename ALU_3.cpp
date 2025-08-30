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

想定入力例（期待出力）:
- A=1, B=200, opcode=0b010 (SUB) -> result=57, C=0, Z=0, E=0, O=1
- A=1, B=200, opcode=0b011 (SBC) -> result=56, C=0, Z=0, E=1, O=0
- A=200, B=100, opcode=0b000 (ADD) -> result=44, C=1
- A=200, B=100, opcode=0b001 (ADC) -> result=45, C=1
- A=0b10101010, B=0b01010101, opcode=0b100 (NOR) -> result=0x00, Z=1, E=1
*/

#include <cstdint>
#include <iostream>
#include <iomanip>
#include <thread>
#include <chrono>
#include <stdexcept> // exit()で異常終了させる場合に使用

// オペコードの定義
enum class Opcode : uint8_t {
    ADD = 0b000,
    ADC = 0b001,
    SUB = 0b010,
    SBC = 0b011,
    NOR = 0b100,
    AND = 0b101,
    XOR = 0b110,
    RSH = 0b111
};

// フラグビットのマスク定義
namespace Flags {
    constexpr uint8_t C  = 1 << 0; // Carry
    constexpr uint8_t NC = 1 << 1; // Not Carry
    constexpr uint8_t Z  = 1 << 2; // Zero
    constexpr uint8_t NZ = 1 << 3; // Not Zero
    constexpr uint8_t E  = 1 << 4; // Even
    constexpr uint8_t O  = 1 << 5; // Odd
}

// -------- ALUクラス --------
class ALU {
private:
    bool is_setup = false;
    
    // 初期化済みチェック
    void ensure_setup() const {
        if (!is_setup) {
            std::cerr << "Error: ALU is not set up. Call alu_setup(). Terminate." << std::endl;
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
                  << "ALU Delay: " << this->alu_delay << "s"
                  << std::endl;
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
                result = static_cast<uint8_t>((static_cast<uint16_t>(A | B) >> 1) & 0xFF);
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
        std::cout << "C: "  << ((flags & Flags::C) != 0)
                  << ", NC: " << ((flags & Flags::NC) != 0)
                  << ", Z: "  << ((flags & Flags::Z) != 0)
                  << ", NZ: " << ((flags & Flags::NZ) != 0)
                  << ", E: "  << ((flags & Flags::E) != 0)
                  << ", O: "  << ((flags & Flags::O) != 0)
                  << "\n";
    }
};

// -------- Registerクラス --------

// テスト
int main() {
    ALU alu;
    uint8_t A, B;
    Opcode opcode;
    
    alu.alu_setup(0.8);
    std::cout << std::endl;

    // 例1: SUB 1 - 200
    A = 1;
    B = 200;
    opcode = Opcode::SUB;
    std::cout << "Executing SUB (1 - 200)..." << std::flush; // flushでメッセージを即時表示
    alu.execute(A, B, opcode);
    std::cout << " Done.\n";
    std::cout << "  -> result: " << +alu.result << " (0x" << std::hex << std::setw(2) << std::setfill('0') << +alu.result << std::dec << ")\n";
    std::cout << "  -> flags: ";
    alu.print_flags();
    std::cout << "\n";

    // 例2: SBC 1 - 200 - 1
    opcode = Opcode::SBC;
    std::cout << "Executing SBC (1 - 200 - 1)..." << std::flush;
    alu.execute(A, B, opcode);
    std::cout << " Done.\n";
    std::cout << "  -> result: " << +alu.result << "\n";
    std::cout << "  -> flags: ";
    alu.print_flags();
    std::cout << "\n";

    // 例3: ADD 200 + 100
    A = 200;
    B = 100;
    opcode = Opcode::ADD;
    std::cout << "Executing ADD (200 + 100)..." << std::flush;
    alu.execute(A, B, opcode);
    std::cout << " Done.\n";
    std::cout << "  -> result: " << +alu.result << "\n";
    std::cout << "  -> flags: ";
    alu.print_flags();
    std::cout << "\n";

    return 0;
}