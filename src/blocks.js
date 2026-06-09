/* =====================================================================
   blocks.js — описание блоков редактора:
   генерация id, категории/цвета/подписи, дочерние слоты,
   фабрика блоков, компиляция в форму интерпретатора, готовые примеры.
   ===================================================================== */

/* ----- генератор уникальных id ----- */
let _id = 0;
export const uid = () => 'b' + (++_id);

/* ----- категория блока (для цвета) ----- */
export function catOf(type) {
  if (type === 'varDecl' || type === 'arrayDecl') return 'decl';
  if (type === 'assign' || type === 'arrayAssign') return 'assign';
  if (type === 'if' || type === 'while' || type === 'for') return 'control';
  if (type === 'break' || type === 'continue' || type === 'return') return 'flow';
  if (type === 'funcDef' || type === 'funcCall') return 'func';
  return 'io';
}

export const CAT_COLOR = {
  decl: 'var(--decl)', assign: 'var(--assign)', control: 'var(--control)',
  flow: 'var(--flow)', func: 'var(--func)', io: 'var(--io)',
};

export const BLOCK_LABEL = {
  varDecl: 'переменные', arrayDecl: 'массив', assign: 'присвоить', arrayAssign: 'массив[ ]=',
  if: 'если', while: 'пока', for: 'для', break: 'прервать', continue: 'продолжить',
  return: 'вернуть', funcDef: 'функция', funcCall: 'вызвать', print: 'вывести',
};

/* ----- палитра (группы блоков слева) ----- */
export const PALETTE = [
  { cat: 'decl', title: 'Объявление', items: [
    { type: 'varDecl', label: 'Переменные', glyph: 'int' },
    { type: 'arrayDecl', label: 'Массив', glyph: '[ ]' } ] },
  { cat: 'assign', title: 'Присваивание', items: [
    { type: 'assign', label: 'Присвоить', glyph: '=' },
    { type: 'arrayAssign', label: 'Элемент массива', glyph: '[]=' } ] },
  { cat: 'control', title: 'Управление', items: [
    { type: 'if', label: 'Если … иначе', glyph: '?' },
    { type: 'while', label: 'Пока (while)', glyph: '↺' },
    { type: 'for', label: 'Цикл for', glyph: '∑' } ] },
  { cat: 'flow', title: 'Поток', items: [
    { type: 'break', label: 'Прервать', glyph: '⊘' },
    { type: 'continue', label: 'Продолжить', glyph: '↻' },
    { type: 'return', label: 'Вернуть', glyph: '↩' } ] },
  { cat: 'func', title: 'Функции', items: [
    { type: 'funcDef', label: 'Определить функцию', glyph: 'ƒ' },
    { type: 'funcCall', label: 'Вызвать', glyph: '( )' } ] },
  { cat: 'io', title: 'Ввод-вывод', items: [
    { type: 'print', label: 'Вывести', glyph: '»' } ] },
];

/* ----- дочерние слоты блока-контейнера ----- */
export function childSlots(b) {
  if (b.type === 'if') return [b.body, b.elseBody];
  if (b.type === 'while' || b.type === 'for' || b.type === 'funcDef') return [b.body];
  return [];
}

/* ----- фабрика нового блока со значениями по умолчанию ----- */
export function makeBlock(type) {
  const base = { id: uid(), type };
  switch (type) {
    case 'varDecl':     return { ...base, names: 'i' };
    case 'arrayDecl':   return { ...base, name: 'A', size: '5' };
    case 'assign':      return { ...base, target: 'i', expr: '0' };
    case 'arrayAssign': return { ...base, name: 'A', index: 'i', expr: '0' };
    case 'if':          return { ...base, cond: 'i < 10', hasElse: false, body: [], elseBody: [] };
    case 'while':       return { ...base, cond: 'i < 10', body: [] };
    case 'for':         return { ...base, initTarget: 'i', initExpr: '0', cond: 'i < 10', stepTarget: 'i', stepExpr: 'i + 1', body: [] };
    case 'print':       return { ...base, expr: 'i' };
    case 'funcDef':     return { ...base, name: 'f', params: 'x', body: [] };
    case 'funcCall':    return { ...base, name: 'f', args: '0' };
    case 'return':      return { ...base, expr: '0' };
    case 'break':       return { ...base };
    case 'continue':    return { ...base };
    default:            return base;
  }
}

/* ----- компиляция UI-блока в форму, понятную интерпретатору ----- */
export function compile(b) {
  switch (b.type) {
    case 'for': return {
      id: b.id, type: 'for',
      init: { type: 'assign', target: b.initTarget, expr: b.initExpr },
      cond: b.cond,
      step: { type: 'assign', target: b.stepTarget, expr: b.stepExpr },
      body: b.body.map(compile),
    };
    case 'if': return { id: b.id, type: 'if', cond: b.cond, hasElse: b.hasElse, body: b.body.map(compile), elseBody: b.elseBody.map(compile) };
    case 'while': return { id: b.id, type: 'while', cond: b.cond, body: b.body.map(compile) };
    case 'funcDef': return { id: b.id, type: 'funcDef', name: b.name, params: b.params, body: b.body.map(compile) };
    default: return { ...b };
  }
}

/* ----- перегенерировать id (после загрузки файла / примера) ----- */
export function regenIds(blocks) {
  for (const b of blocks) { b.id = uid(); for (const s of childSlots(b)) regenIds(s); }
  return blocks;
}

/* =====================================================================
   Готовые примеры программ (меню «Примеры…»)
   ===================================================================== */
const mk = (type, fields) => Object.assign(makeBlock(type), fields || {});

export const EXAMPLES = {
  bubble() {
    const fill = [5, 2, 9, 1, 5, 6].map((x, k) => mk('arrayAssign', { name: 'A', index: String(k), expr: String(x) }));
    return [
      mk('varDecl', { names: 'i, j, tmp, n' }),
      mk('assign', { target: 'n', expr: '6' }),
      mk('arrayDecl', { name: 'A', size: 'n' }),
      ...fill,
      mk('print', { expr: 'A' }),
      mk('for', { initTarget: 'i', initExpr: '0', cond: 'i < n - 1', stepTarget: 'i', stepExpr: 'i + 1', body: [
        mk('for', { initTarget: 'j', initExpr: '0', cond: 'j < n - 1 - i', stepTarget: 'j', stepExpr: 'j + 1', body: [
          mk('if', { cond: 'A[j] > A[j + 1]', hasElse: false, body: [
            mk('assign', { target: 'tmp', expr: 'A[j]' }),
            mk('arrayAssign', { name: 'A', index: 'j', expr: 'A[j + 1]' }),
            mk('arrayAssign', { name: 'A', index: 'j + 1', expr: 'tmp' }),
          ], elseBody: [] }),
        ] }),
      ] }),
      mk('print', { expr: 'A' }),
    ];
  },
  factorial() {
    return [
      mk('funcDef', { name: 'fact', params: 'n', body: [
        mk('if', { cond: 'n <= 1', hasElse: true,
          body: [ mk('return', { expr: '1' }) ],
          elseBody: [ mk('return', { expr: 'n * fact(n - 1)' }) ] }),
      ] }),
      mk('varDecl', { names: 'r' }),
      mk('assign', { target: 'r', expr: 'fact(5)' }),
      mk('print', { expr: '"5! = " + r' }),
    ];
  },
  fizzbuzz() {
    return [
      mk('varDecl', { names: 'i' }),
      mk('for', { initTarget: 'i', initExpr: '1', cond: 'i <= 15', stepTarget: 'i', stepExpr: 'i + 1', body: [
        mk('if', { cond: 'i % 15 == 0', hasElse: true,
          body: [ mk('print', { expr: '"FizzBuzz"' }) ],
          elseBody: [
            mk('if', { cond: 'i % 3 == 0', hasElse: true,
              body: [ mk('print', { expr: '"Fizz"' }) ],
              elseBody: [
                mk('if', { cond: 'i % 5 == 0', hasElse: true,
                  body: [ mk('print', { expr: '"Buzz"' }) ],
                  elseBody: [ mk('print', { expr: 'i' }) ] }),
              ] }),
          ] }),
      ] }),
    ];
  },
};
