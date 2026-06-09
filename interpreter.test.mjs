// ESM-версия тестов ядра интерпретатора. Запуск: node interpreter.test.mjs
import { parseExpr, evalNode, createRun, formatVal, Scope, VInt } from './src/interpreter.js';


let pass = 0, fail = 0;
function check(name, got, exp) {
  const g = JSON.stringify(got), e = JSON.stringify(exp);
  if (g === e) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, '\n     получено:', g, '\n     ожидалось:', e); }
}

// helper to eval a bare expression
function ev(src) {
  const ctx = { scope: new Scope(null), funcs: new Map(), output: [], blockId: null, steps: { count: 0, limit: 1e6 } };
  return evalNode(parseExpr(src), ctx).v;
}

console.log('\n== Арифметика и приоритеты ==');
check('2+3*4', ev('2+3*4'), 14);
check('(2+3)*4', ev('(2+3)*4'), 20);
check('10/3 (целое)', ev('10/3'), 3);
check('10%3', ev('10%3'), 1);
check('-5+2', ev('-5+2'), -3);
check('2*(3+(4-1))', ev('2*(3+(4-1))'), 12);
check('вещественное 7/2.0', ev('7/2.0'), 3.5);

console.log('\n== Логика и сравнения ==');
check('3>2 AND 1<2', ev('3>2 AND 1<2'), 1);
check('3>2 AND 1>2', ev('3>2 AND 1>2'), 0);
check('NOT (1==1)', ev('NOT (1==1)'), 0);
check('5>=5 OR 0', ev('5>=5 || 0'), 1);
check('(1 AND 0) OR (1 AND 1)', ev('(1 && 0) || (1 && 1)'), 1);

console.log('\n== Программа: переменные, if/else, while ==');
{
  const program = [
    { id: 'b1', type: 'varDecl', names: 'a, b, max' },
    { id: 'b2', type: 'assign', target: 'a', expr: '7' },
    { id: 'b3', type: 'assign', target: 'b', expr: '12' },
    { id: 'b4', type: 'if', cond: 'a > b', hasElse: true,
      body: [{ id: 'b5', type: 'assign', target: 'max', expr: 'a' }],
      elseBody: [{ id: 'b6', type: 'assign', target: 'max', expr: 'b' }] },
    { id: 'b7', type: 'print', expr: 'max' },
  ];
  const { ctx, gen } = createRun(program);
  let r = gen.next(); while (!r.done) r = gen.next();
  check('max(7,12) через if/else', ctx.output, ['12']);
}

console.log('\n== Цикл while: сумма 1..5 ==');
{
  const program = [
    { id: 'd', type: 'varDecl', names: 'i, s' },
    { id: 'a1', type: 'assign', target: 'i', expr: '1' },
    { id: 'w', type: 'while', cond: 'i <= 5', body: [
      { id: 'a2', type: 'assign', target: 's', expr: 's + i' },
      { id: 'a3', type: 'assign', target: 'i', expr: 'i + 1' },
    ] },
    { id: 'p', type: 'print', expr: 's' },
  ];
  const { ctx, gen } = createRun(program);
  let r = gen.next(); while (!r.done) r = gen.next();
  check('сумма 1..5 = 15', ctx.output, ['15']);
}

console.log('\n== Массивы + сортировка пузырьком (главная демонстрация) ==');
{
  // arr = [5,2,9,1,5,6]; bubble sort -> [1,2,5,5,6,9]
  const init = [5, 2, 9, 1, 5, 6];
  const program = [
    { id: 'v', type: 'varDecl', names: 'i, j, tmp, n' },
    { id: 'n', type: 'assign', target: 'n', expr: String(init.length) },
    { id: 'arr', type: 'arrayDecl', name: 'A', size: 'n' },
    // заполнение массива
    ...init.map((x, k) => ({ id: 'fill' + k, type: 'arrayAssign', name: 'A', index: String(k), expr: String(x) })),
    // for i = 0; i < n-1; i++
    { id: 'fo', type: 'for',
      init: { type: 'assign', target: 'i', expr: '0' },
      cond: 'i < n - 1',
      step: { type: 'assign', target: 'i', expr: 'i + 1' },
      body: [
        { id: 'fo2', type: 'for',
          init: { type: 'assign', target: 'j', expr: '0' },
          cond: 'j < n - 1 - i',
          step: { type: 'assign', target: 'j', expr: 'j + 1' },
          body: [
            { id: 'iff', type: 'if', cond: 'A[j] > A[j + 1]', hasElse: false, body: [
              { id: 's1', type: 'assign', target: 'tmp', expr: 'A[j]' },
              { id: 's2', type: 'arrayAssign', name: 'A', index: 'j', expr: 'A[j + 1]' },
              { id: 's3', type: 'arrayAssign', name: 'A', index: 'j + 1', expr: 'tmp' },
            ] },
          ] },
      ] },
    { id: 'pr', type: 'print', expr: 'A' },
  ];
  const { ctx, gen } = createRun(program);
  let r = gen.next(); while (!r.done) r = gen.next();
  check('bubble sort', ctx.output, ['[1, 2, 5, 5, 6, 9]']);
}

console.log('\n== Функции (HARD) ==');
{
  const program = [
    { id: 'fd', type: 'funcDef', name: 'sum', params: 'x, y', body: [
      { id: 'ret', type: 'return', expr: 'x + y' },
    ] },
    { id: 'v', type: 'varDecl', names: 'r' },
    { id: 'as', type: 'assign', target: 'r', expr: 'sum(10, 32) + sum(1, 2)' },
    { id: 'p', type: 'print', expr: 'r' },
  ];
  const { ctx, gen } = createRun(program);
  let r = gen.next(); while (!r.done) r = gen.next();
  check('sum(10,32)+sum(1,2) = 45', ctx.output, ['45']);
}

console.log('\n== Строки (HARD) ==');
{
  const program = [
    { id: 'v', type: 'varDecl', names: 'x' },
    { id: 'a', type: 'assign', target: 'x', expr: '"Hello, " + "world"' },
    { id: 'p', type: 'print', expr: 'x' },
  ];
  const { ctx, gen } = createRun(program);
  let r = gen.next(); while (!r.done) r = gen.next();
  check('конкатенация строк', ctx.output, ['Hello, world']);
}

console.log('\n== Ошибки (подсветка блока) ==');
function expectError(name, program, expectBlockId) {
  try {
    const { gen } = createRun(program);
    let r = gen.next(); while (!r.done) r = gen.next();
    fail++; console.log('  ✗', name, '— ошибка не возникла');
  } catch (e) {
    if (e.blockId === expectBlockId) { pass++; console.log('  ✓', name, '→', e.message, `(блок ${e.blockId})`); }
    else { fail++; console.log('  ✗', name, '— blockId', e.blockId, 'ожидался', expectBlockId, '|', e.message); }
  }
}
expectError('деление на ноль', [
  { id: 'v', type: 'varDecl', names: 'a' },
  { id: 'bad', type: 'assign', target: 'a', expr: '5 / 0' },
], 'bad');
expectError('необъявленная переменная', [
  { id: 'bad', type: 'assign', target: 'a', expr: '1' },
], 'bad');
expectError('индекс вне границ', [
  { id: 'ad', type: 'arrayDecl', name: 'A', size: '3' },
  { id: 'bad', type: 'arrayAssign', name: 'A', index: '5', expr: '1' },
], 'bad');

console.log('\n== Шаговое исполнение (Debug) ==');
{
  const program = [
    { id: 's1', type: 'varDecl', names: 'a' },
    { id: 's2', type: 'assign', target: 'a', expr: '1' },
    { id: 's3', type: 'assign', target: 'a', expr: 'a + 1' },
  ];
  const { gen } = createRun(program);
  const visited = [];
  let r = gen.next();
  while (!r.done) { visited.push(r.value); r = gen.next(); }
  check('последовательность блоков', visited, ['s1', 's2', 's3']);
}

console.log(`\n==== Итог: ${pass} прошло, ${fail} упало ====\n`);
process.exit(fail ? 1 : 0);
