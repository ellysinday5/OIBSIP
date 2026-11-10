import {
  appendDecimal,
  appendDigit,
  appendOperator,
  calculate,
  clearAll,
  createState,
  deleteLast,
  getExpressionLine,
  getMainLine,
} from './calculator.js';

const DIGIT_PATTERN = /^\d$/;
const OPERATOR_KEYS = ['+', '-', '*', '/'];
const ERROR_CLASS = 'calculator__result--error';
const KEY_ACTIONS = new Map([
  ['Enter', 'equals'],
  ['=', 'equals'],
  ['Backspace', 'backspace'],
  ['Escape', 'clear'],
  ['.', 'decimal'],
]);
const ACTION_HANDLERS = {
  clear: clearAll,
  backspace: deleteLast,
  equals: calculate,
  decimal: appendDecimal,
};

const expressionElement = document.querySelector('.calculator__expression');
const resultElement = document.querySelector('.calculator__result');
const keysElement = document.querySelector('.calculator__keys');

let state = createState();

function scrollToEnd(element) {
  element.scrollLeft = element.scrollWidth;
}

function render() {
  expressionElement.textContent = getExpressionLine(state);
  resultElement.textContent = getMainLine(state);
  resultElement.classList.toggle(ERROR_CLASS, state.error !== '');
  scrollToEnd(expressionElement);
}

function getNextState(command) {
  if (command.digit !== undefined) {
    return appendDigit(state, command.digit);
  }
  if (command.operator !== undefined) {
    return appendOperator(state, command.operator);
  }
  return ACTION_HANDLERS[command.action](state);
}

function execute(command) {
  state = getNextState(command);
  render();
}

function getKeyCommand(key) {
  if (DIGIT_PATTERN.test(key)) {
    return { digit: key };
  }
  if (OPERATOR_KEYS.includes(key)) {
    return { operator: key };
  }
  const action = KEY_ACTIONS.get(key);
  return action === undefined ? null : { action };
}

function handleClick(event) {
  const button = event.target.closest('button');
  if (button !== null) {
    execute(button.dataset);
  }
}

function handleKeydown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  const command = getKeyCommand(event.key);
  if (command !== null) {
    event.preventDefault();
    execute(command);
  }
}

keysElement.addEventListener('click', handleClick);
document.addEventListener('keydown', handleKeydown);
render();

