"use client";

import { useState } from "react";
import {
  Calculator as CalculatorIcon,
  X,
  Delete,
  RotateCcw,
} from "lucide-react";

type Operator = "+" | "-" | "×" | "÷";

interface Token {
  type: "number" | "operator";
  value: string;
}

export default function Calculator() {
  const [open, setOpen] = useState(false);

  // Current number being typed
  const [currentNumber, setCurrentNumber] = useState("0");

  // Complete expression
  const [expression, setExpression] = useState("");

  // Tokens used for calculation
  const [tokens, setTokens] = useState<Token[]>([]);

  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "Error";
    }

    if (Number.isInteger(value)) {
      return String(value);
    }

    return value
      .toFixed(10)
      .replace(/\.?0+$/, "");
  };

  // ============================================================
  // PRECEDENCE
  // ============================================================

  const precedence = (operator: string) => {
    if (operator === "×" || operator === "÷") {
      return 2;
    }

    if (operator === "+" || operator === "-") {
      return 1;
    }

    return 0;
  };

  // ============================================================
  // CALCULATE TOKENS
  // ============================================================

  const calculateTokens = (inputTokens: Token[]) => {
    if (inputTokens.length === 0) {
      return 0;
    }

    const values: (number | string)[] = inputTokens.map((token) =>
      token.type === "number"
        ? parseFloat(token.value)
        : token.value
    );

    // ----------------------------------------------------------
    // First × and ÷
    // ----------------------------------------------------------

    const firstPass: (number | string)[] = [];

    let i = 0;

    while (i < values.length) {
      const value = values[i];

      if (
        typeof value === "string" &&
        (value === "×" || value === "÷")
      ) {
        const left = firstPass.pop();

        const right = values[i + 1];

        if (
          typeof left !== "number" ||
          typeof right !== "number"
        ) {
          return NaN;
        }

        let result = 0;

        if (value === "×") {
          result = left * right;
        }

        if (value === "÷") {
          if (right === 0) {
            return NaN;
          }

          result = left / right;
        }

        firstPass.push(result);

        i += 2;
        continue;
      }

      firstPass.push(value);

      i++;
    }

    // ----------------------------------------------------------
    // Then + and -
    // ----------------------------------------------------------

    if (firstPass.length === 0) {
      return 0;
    }

    let result =
      typeof firstPass[0] === "number"
        ? firstPass[0]
        : 0;

    let j = 1;

    while (j < firstPass.length) {
      const op = firstPass[j];
      const next = firstPass[j + 1];

      if (
        typeof op !== "string" ||
        typeof next !== "number"
      ) {
        return NaN;
      }

      if (op === "+") {
        result += next;
      }

      if (op === "-") {
        result -= next;
      }

      j += 2;
    }

    return result;
  };

  // ============================================================
  // BUILD EXPRESSION
  // ============================================================

  const buildExpression = (
    tokenList: Token[],
    activeNumber?: string
  ) => {
    let result = tokenList
      .map((token) => token.value)
      .join(" ");

    if (activeNumber !== undefined) {
      if (result) {
        result += ` ${activeNumber}`;
      } else {
        result = activeNumber;
      }
    }

    return result;
  };

  // ============================================================
  // NUMBER INPUT
  // ============================================================

  const inputNumber = (num: string) => {
    // If error, start fresh
    if (currentNumber === "Error") {
      setCurrentNumber(num);
      setExpression(num);
      setTokens([
        {
          type: "number",
          value: num,
        },
      ]);
      return;
    }

    let newNumber = currentNumber;

    if (currentNumber === "0") {
      newNumber = num;
    } else {
      newNumber = currentNumber + num;
    }

    setCurrentNumber(newNumber);

    // ----------------------------------------------------------
    // Update expression
    // ----------------------------------------------------------

    let newTokens = [...tokens];

    // If last token is number, update it
    if (
      newTokens.length > 0 &&
      newTokens[newTokens.length - 1].type === "number"
    ) {
      newTokens[newTokens.length - 1] = {
        type: "number",
        value: newNumber,
      };
    } else {
      newTokens.push({
        type: "number",
        value: newNumber,
      });
    }

    setTokens(newTokens);

    const newExpression = buildExpression(newTokens);

    setExpression(newExpression);

    // ----------------------------------------------------------
    // AUTO CALCULATE
    // ----------------------------------------------------------

    if (newTokens.length >= 3) {
      const result = calculateTokens(newTokens);

      if (Number.isFinite(result)) {
        // Result is shown separately through currentNumber
        // while expression remains visible.
      }
    }
  };

  // ============================================================
  // DECIMAL
  // ============================================================

  const inputDecimal = () => {
    if (currentNumber === "Error") {
      setCurrentNumber("0.");
      setExpression("0.");

      setTokens([
        {
          type: "number",
          value: "0.",
        },
      ]);

      return;
    }

    if (!currentNumber.includes(".")) {
      const newNumber = `${currentNumber}.`;

      setCurrentNumber(newNumber);

      const newTokens = [...tokens];

      if (
        newTokens.length > 0 &&
        newTokens[newTokens.length - 1].type === "number"
      ) {
        newTokens[newTokens.length - 1] = {
          type: "number",
          value: newNumber,
        };
      } else {
        newTokens.push({
          type: "number",
          value: newNumber,
        });
      }

      setTokens(newTokens);
      setExpression(buildExpression(newTokens));
    }
  };

  // ============================================================
  // OPERATOR
  // ============================================================

  const chooseOperator = (op: Operator) => {
    if (currentNumber === "Error") {
      return;
    }

    let newTokens = [...tokens];

    // ----------------------------------------------------------
    // If expression is empty
    // ----------------------------------------------------------

    if (newTokens.length === 0) {
      newTokens.push({
        type: "number",
        value: currentNumber,
      });
    }

    // ----------------------------------------------------------
    // If last token is already operator
    // Replace it
    // ----------------------------------------------------------

    if (
      newTokens.length > 0 &&
      newTokens[newTokens.length - 1].type === "operator"
    ) {
      newTokens[newTokens.length - 1] = {
        type: "operator",
        value: op,
      };
    } else {
      newTokens.push({
        type: "operator",
        value: op,
      });
    }

    setTokens(newTokens);

    setExpression(buildExpression(newTokens));

    setCurrentNumber("0");
  };

  // ============================================================
  // GET LIVE RESULT
  // ============================================================

  const getLiveResult = () => {
    if (tokens.length === 0) {
      return "0";
    }

    let calculationTokens = [...tokens];

    // If expression ends with operator,
    // don't calculate incomplete expression
    if (
      calculationTokens.length > 0 &&
      calculationTokens[calculationTokens.length - 1].type ===
        "operator"
    ) {
      return "";
    }

    const result = calculateTokens(calculationTokens);

    if (!Number.isFinite(result)) {
      return "Error";
    }

    return formatNumber(result);
  };

  // ============================================================
  // EQUALS
  // ============================================================

  const equals = () => {
    if (tokens.length === 0) {
      return;
    }

    const lastToken = tokens[tokens.length - 1];

    // Don't calculate incomplete expression
    if (lastToken.type === "operator") {
      return;
    }

    const result = calculateTokens(tokens);

    if (!Number.isFinite(result)) {
      setCurrentNumber("Error");
      return;
    }

    const formatted = formatNumber(result);

    setCurrentNumber(formatted);

    // Keep result as expression
    setExpression(`${expression} = ${formatted}`);

    // Start next calculation from result
    setTokens([
      {
        type: "number",
        value: formatted,
      },
    ]);
  };

  // ============================================================
  // CLEAR
  // ============================================================

  const clear = () => {
    setCurrentNumber("0");
    setExpression("");
    setTokens([]);
  };

  // ============================================================
  // BACKSPACE
  // ============================================================

  const backspace = () => {
    if (currentNumber === "Error") {
      clear();
      return;
    }

    // ----------------------------------------------------------
    // If current token is number
    // ----------------------------------------------------------

    if (
      tokens.length > 0 &&
      tokens[tokens.length - 1].type === "number"
    ) {
      let newNumber = currentNumber.slice(0, -1);

      if (newNumber === "" || newNumber === "-") {
        newNumber = "0";
      }

      const newTokens = [...tokens];

      newTokens[newTokens.length - 1] = {
        type: "number",
        value: newNumber,
      };

      setTokens(newTokens);
      setCurrentNumber(newNumber);
      setExpression(buildExpression(newTokens));

      return;
    }

    // ----------------------------------------------------------
    // If last token is operator
    // ----------------------------------------------------------

    if (
      tokens.length > 0 &&
      tokens[tokens.length - 1].type === "operator"
    ) {
      const newTokens = tokens.slice(0, -1);

      setTokens(newTokens);

      setExpression(buildExpression(newTokens));

      if (
        newTokens.length > 0 &&
        newTokens[newTokens.length - 1].type === "number"
      ) {
        setCurrentNumber(
          newTokens[newTokens.length - 1].value
        );
      } else {
        setCurrentNumber("0");
      }
    }
  };

  // ============================================================
  // RESULT
  // ============================================================

  const liveResult = getLiveResult();

  return (
    <>
      {/* ========================================================
          FLOATING CALCULATOR BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Calculator"
        className="
          fixed bottom-6 right-6 z-[90]
          flex h-16 w-16 items-center justify-center
          rounded-full
          bg-gradient-to-br from-blue-600 to-indigo-600
          text-white
          shadow-[0_10px_35px_rgba(37,99,235,0.45)]
          transition-all duration-300
          hover:scale-110
          hover:shadow-[0_15px_45px_rgba(37,99,235,0.55)]
          active:scale-95
        "
      >
        <CalculatorIcon size={29} strokeWidth={2.2} />

        <span
          className="
            absolute right-1 top-1
            h-3.5 w-3.5
            rounded-full
            border-2 border-white
            bg-green-500
          "
        />
      </button>

      {/* ========================================================
          OVERLAY
      ======================================================== */}

      {open && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-black/40
            px-4
            backdrop-blur-sm
          "
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
            }
          }}
        >
          {/* ====================================================
              CALCULATOR
          ==================================================== */}

          <div
            className="
              w-full max-w-[370px]
              overflow-hidden
              rounded-[28px]
              border border-white/20
              bg-white
              shadow-[0_25px_80px_rgba(0,0,0,0.25)]
            "
          >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              className="
                bg-gradient-to-br
                from-blue-600
                via-blue-600
                to-indigo-700
                px-6
                pb-6
                pt-5
                text-white
              "
            >
              {/* Header */}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-11 w-11
                      items-center justify-center
                      rounded-2xl
                      bg-white/15
                      backdrop-blur
                    "
                  >
                    <CalculatorIcon size={23} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      Calculator
                    </h2>

                    <p className="text-xs text-blue-100">
                      Quick calculation
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    bg-white/10
                    transition
                    hover:bg-white/20
                  "
                >
                  <X size={20} />
                </button>
              </div>

              {/* =================================================
                  DISPLAY
              ================================================= */}

              <div className="mt-6">
                {/* Expression */}

                <div
                  className="
                    min-h-[28px]
                    overflow-x-auto
                    whitespace-nowrap
                    text-right
                    text-sm
                    font-medium
                    text-blue-100
                  "
                >
                  {expression || "0"}
                </div>

                {/* Result */}

                <div
                  className="
                    mt-1
                    min-h-[52px]
                    overflow-x-auto
                    whitespace-nowrap
                    text-right
                    text-4xl
                    font-bold
                    tracking-tight
                  "
                >
                  {liveResult || currentNumber}
                </div>
              </div>
            </div>

            {/* ==================================================
                BODY
            ================================================== */}

            <div className="bg-slate-50 p-5">
              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div className="mb-3 grid grid-cols-2 gap-3">
                {/* Clear */}

                <button
                  type="button"
                  onClick={clear}
                  className="
                    flex h-12 items-center
                    justify-center gap-2
                    rounded-2xl
                    bg-red-50
                    font-semibold
                    text-red-600
                    transition
                    hover:bg-red-100
                    active:scale-95
                  "
                >
                  <RotateCcw size={17} />
                  Clear
                </button>

                {/* Delete */}

                <button
                  type="button"
                  onClick={backspace}
                  className="
                    flex h-12 items-center
                    justify-center gap-2
                    rounded-2xl
                    bg-slate-200
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-300
                    active:scale-95
                  "
                >
                  <Delete size={18} />
                  Delete
                </button>
              </div>

              {/* =================================================
                  KEYPAD
              ================================================= */}

              <div className="grid grid-cols-4 gap-3">
                {/* Row 1 */}

                {["7", "8", "9"].map((num) => (
                  <NumberButton
                    key={num}
                    value={num}
                    onClick={() => inputNumber(num)}
                  />
                ))}

                <OperatorButton
                  value="÷"
                  onClick={() => chooseOperator("÷")}
                />

                {/* Row 2 */}

                {["4", "5", "6"].map((num) => (
                  <NumberButton
                    key={num}
                    value={num}
                    onClick={() => inputNumber(num)}
                  />
                ))}

                <OperatorButton
                  value="×"
                  onClick={() => chooseOperator("×")}
                />

                {/* Row 3 */}

                {["1", "2", "3"].map((num) => (
                  <NumberButton
                    key={num}
                    value={num}
                    onClick={() => inputNumber(num)}
                  />
                ))}

                <OperatorButton
                  value="-"
                  onClick={() => chooseOperator("-")}
                />

                {/* Row 4 */}

                <NumberButton
                  value="0"
                  onClick={() => inputNumber("0")}
                />

                <NumberButton
                  value="."
                  onClick={inputDecimal}
                />

                <button
                  type="button"
                  onClick={equals}
                  className="
                    h-14
                    rounded-2xl
                    bg-gradient-to-br
                    from-green-500
                    to-emerald-600
                    text-xl
                    font-bold
                    text-white
                    shadow-md
                    shadow-green-200
                    transition
                    hover:from-green-600
                    hover:to-emerald-700
                    active:scale-95
                  "
                >
                  =
                </button>

                <OperatorButton
                  value="+"
                  onClick={() => chooseOperator("+")}
                />
              </div>

              {/* Footer */}

              <p className="mt-4 text-center text-[11px] text-slate-400">
                Bismillah Iron Store • Quick Calculator
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================
   NUMBER BUTTON
================================================================ */

function NumberButton({
  value,
  onClick,
}: {
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        h-14
        rounded-2xl
        bg-white
        text-lg
        font-bold
        text-slate-800
        shadow-sm
        ring-1 ring-slate-200
        transition
        hover:bg-slate-100
        active:scale-95
      "
    >
      {value}
    </button>
  );
}

/* ================================================================
   OPERATOR BUTTON
================================================================ */

function OperatorButton({
  value,
  onClick,
}: {
  value: Operator;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        h-14
        rounded-2xl
        bg-blue-600
        text-xl
        font-bold
        text-white
        shadow-md
        shadow-blue-200
        transition
        hover:bg-blue-700
        active:scale-95
      "
    >
      {value}
    </button>
  );
}