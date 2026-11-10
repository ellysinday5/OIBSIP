const MAX_DIGITS = 15;
const RESULT_PRECISION = 10;
const MAX_RESULT = 1e15;
const OPERATORS = ['+', '-', '*', '/'];
const HIGH_PRECEDENCE = ['*', '/'];
const LOW_PRECEDENCE = ['+', '-'];
const DISPLAY_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const CURRENT_NUMBER_PATTERN = /\d*\.?\d*$/;
const COMPLETE_PATTERN = /\d\.?$/;
const TRAILING_DECIMAL_PATTERN = /\.$/;
const TRAILING_ZEROS_PATTERN = /\.?0+$/;
const NEGATIVE_SIGN = '-';
const DECIMAL_POINT = '.';
const LEADING_DECIMAL = '0.';
const EMPTY_VALUE = '0';
const TOKEN_SEPARATOR = ' ';
const RESULT_SUFFIX = ' =';
const DIVIDE_BY_ZERO_MESSAGE = 'Cannot divide by 0';
const OVERFLOW_MESSAGE = 'Number too large';

const OPERATIONS = {
  '+': (left, right) => left + right,
  '-': (left, right) => left - right,
  '*': (left, right) => left * right,
  '/': divide,
};

function divide(left, right) {
  if (right === 0) {
    throw new Error(DIVIDE_BY_ZERO_MESSAGE);
  }
  return left / right;
}

export function createState(expression = '') {
  return { expression, previous: '', error: '', isResult: false };
}

function createErrorState(message) {
  return { ...createState(), error: message };
}

function stripTrailingDecimal(expression) {
  return expression.replace(TRAILING_DECIMAL_PATTERN, '');
}

function createResultState(expression) {
  const cleaned = stripTrailingDecimal(expression);
  const value = evaluate(tokenize(cleaned));
  return {
    ...createState(formatNumber(value)),
    previous: cleaned,
    isResult: true,
  };
}

function getEditableState(state) {
  return state.error !== '' || state.isResult ? createState() : state;
}

function getCurrentNumber(expression) {
  return expression.match(CURRENT_NUMBER_PATTERN)[0];
}

function countDigits(number) {
  return number.replace(DECIMAL_POINT, '').length;
}

function endsWithOperator(expression) {
  return OPERATORS.includes(expression.slice(-1));
}

function isOperatorAllowed(expression, operator) {
  if (expression === '') {
    return operator === NEGATIVE_SIGN;
  }
  return expression !== NEGATIVE_SIGN;
}

export function appendDigit(state, digit) {
  const { expression } = getEditableState(state);
  const current = getCurrentNumber(expression);
  if (countDigits(current) >= MAX_DIGITS) {
    return state;
  }
  const base = current === EMPTY_VALUE ? expression.slice(0, -1) : expression;
  return createState(base + digit);
}

export function appendDecimal(state) {
  const { expression } = getEditableState(state);
  const current = getCurrentNumber(expression);
  if (current.includes(DECIMAL_POINT)) {
    return state;
  }
  const suffix = current === '' ? LEADING_DECIMAL : DECIMAL_POINT;
  return createState(expression + suffix);
}

export function appendOperator(state, operator) {
  const { expression, error } = state;
  if (error !== '' || !isOperatorAllowed(expression, operator)) {
    return state;
  }
  const base = endsWithOperator(expression)
    ? expression.slice(0, -1)
    : stripTrailingDecimal(expression);
  return createState(base + operator);
}

export function deleteLast(state) {
  if (state.error !== '' || state.isResult) {
    return clearAll();
  }
  return createState(state.expression.slice(0, -1));
}

export function clearAll() {
  return createState();
}

export function calculate(state) {
  if (state.isResult || !COMPLETE_PATTERN.test(state.expression)) {
    return state;
  }
  try {
    return createResultState(state.expression);
  } catch (error) {
    return createErrorState(error.message);
  }
}

export function tokenize(expression) {
  const tokens = [];
  let buffer = '';
  for (const char of expression) {
    if (OPERATORS.includes(char) && buffer !== '') {
      tokens.push(buffer, char);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  if (buffer !== '') {
    tokens.push(buffer);
  }
  return tokens;
}

function applyOperator(left, operator, right) {
  return OPERATIONS[operator](left, right);
}

function resolvePass(tokens, operators) {
  const resolved = [tokens[0]];
  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index];
    const right = tokens[index + 1];
    if (operators.includes(operator)) {
      resolved.push(applyOperator(resolved.pop(), operator, right));
    } else {
      resolved.push(operator, right);
    }
  }
  return resolved;
}

export function evaluate(tokens) {
  const parsed = tokens.map((token) =>
    OPERATORS.includes(token) ? token : Number(token),
  );
  // Two passes so multiplication and division bind tighter than + and -
  const afterHigh = resolvePass(parsed, HIGH_PRECEDENCE);
  return resolvePass(afterHigh, LOW_PRECEDENCE)[0];
}

export function formatNumber(value) {
  if (!Number.isFinite(value) || Math.abs(value) >= MAX_RESULT) {
    throw new Error(OVERFLOW_MESSAGE);
  }
  // Rounding hides binary floating point noise such as 0.1 + 0.2
  const rounded = value.toFixed(RESULT_PRECISION);
  const trimmed = rounded.replace(TRAILING_ZEROS_PATTERN, '');
  return Number(trimmed) === 0 ? EMPTY_VALUE : trimmed;
}

function formatToken(token) {
  return DISPLAY_SYMBOLS[token] ?? token;
}

function formatExpression(expression) {
  return tokenize(expression).map(formatToken).join(TOKEN_SEPARATOR);
}

export function getExpressionLine(state) {
  if (state.error !== '') {
    return '';
  }
  if (state.isResult) {
    return formatExpression(state.previous) + RESULT_SUFFIX;
  }
  return formatExpression(state.expression);
}

export function getMainLine(state) {
  if (state.error !== '') {
    return state.error;
  }
  if (state.isResult) {
    return state.expression;
  }
  const tokens = tokenize(state.expression);
  return tokens.length === 0 ? EMPTY_VALUE : formatToken(tokens.at(-1));
}

