#include <cstdint>
#include <iostream>
#include <iomanip>
#include <thread>
#include <chrono>

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

class ALU {
public:
    uint8_t result;
    uint8_t flags;

    // ALUの処理遅延（秒単位）
    const double alu_delay_seconds = 0.8;

    ALU() : result(0), flags(0) {}

    void execute(uint8_t A, uint8_t B, Opcode opcode) {
      
        flags = 0;
        result = 0;

        bool is_arith = (static_cast<uint8_t>(opcode) & 0b100) == 0;

        if (is_arith) {
            bool B_invert = (static_cast<uint8_t>(opcode) & 0b010) != 0;
            uint8_t carry_in = 0;
            if (opcode == Opcode::ADC || opcode == Opcode::SUB) {
                carry_in = 1;
            }
            uint8_t B2 = B_invert ? static_cast<uint8_t>(~B) : B;
            uint16_t tmp = static_cast<uint16_t>(A) + static_cast<uint16_t>(B2) + static_cast<uint16_t>(carry_in);
            result = static_cast<uint8_t>(tmp & 0xFF);
            bool carry_out = (tmp & 0x100) != 0;

            if (carry_out) flags |= Flags::C;
            else           flags |= Flags::NC;
            if (result == 0) flags |= Flags::Z;
            else             flags |= Flags::NZ;
            if ((result & 1) == 0) flags |= Flags::E;
            else                   flags |= Flags::O;
        } else {
            flags |= Flags::NC;
            switch (opcode) {
            case Opcode::NOR: result = static_cast<uint8_t>(~(A | B)); break;
            case Opcode::AND: result = static_cast<uint8_t>(A & B); break;
            case Opcode::XOR: result = static_cast<uint8_t>(A ^ B); break;
            case Opcode::RSH: result = static_cast<uint8_t>((static_cast<uint16_t>(A | B) >> 1) & 0xFF); break;
            default: result = 0; break;
            }
            if (result == 0) flags |= Flags::Z;
            else             flags |= Flags::NZ;
            if ((result & 1) == 0) flags |= Flags::E;
            else                   flags |= Flags::O;
        }

        std::this_thread::sleep_for(std::chrono::duration<double>(alu_delay_seconds));
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

// テスト
int main() {
    ALU alu;
    uint8_t A, B;
    Opcode opcode;

    std::cout << "ALU processing delay is set to " << alu.alu_delay_seconds << " seconds for each operation.\n\n";

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

    // ...以降のテストも同様に遅延が発生します...

    return 0;
}