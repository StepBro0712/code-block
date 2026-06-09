/* ============================================================================
   CODEBLOCK — собственный интерпретатор (без eval, без сторонних парсеров)
   ----------------------------------------------------------------------------
   Состоит из:
     1. Tokenizer  — разбивает строку выражения на токены
     2. Parser     — рекурсивный спуск -> AST выражения (приоритеты, скобки)
     3. Evaluator  — обход AST выражения -> значение
     4. Interpreter— обход дерева блоков (генератор для пошаговой отладки)
   Логика интерпретации полностью реализована вручную.
   ========================================================================== */

/* ----------------------------- Ошибки ----------------------------------- */
class CodeError extends Error {
  constructor(message, blockId = null) {
    super(message);
    this.name = 'CodeError';
    this.blockId = blockId;     // на каком блоке произошла ошибка (подсветка)
  }
}

/* --------------------------- 1. ТОКЕНАЙЗЕР ------------------------------- */
// Типы токенов: NUM, STR, ID, OP, LPAREN, RPAREN, LBRACK, RBRACK, COMMA
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  const isDigit = (c) => c >= '0' && c <= '9';
  const isAlpha = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  const isAlnum = (c) => isAlpha(c) || isDigit(c);

  while (i < n) {
    const c = src[i];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }

    // строковый литерал "..." или '...'
    if (c === '"' || c === "'") {
      const quote = c; i++;
      let s = '';
      while (i < n && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < n) { // экранирование
          const nx = src[i + 1];
          s += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx;
          i += 2;
        } else { s += src[i]; i++; }
      }
      if (i >= n) throw new CodeError('Незакрытая строка (нет закрывающей кавычки)');
      i++; // закрывающая кавычка
      tokens.push({ type: 'STR', value: s });
      continue;
    }

    // число (целое или вещественное)
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let num = '';
      let dot = false;
      while (i < n && (isDigit(src[i]) || (src[i] === '.' && !dot))) {
        if (src[i] === '.') dot = true;
        num += src[i]; i++;
      }
      tokens.push({ type: 'NUM', value: parseFloat(num), isFloat: dot });
      continue;
    }

    // идентификатор / ключевое слово / текстовые операторы
    if (isAlpha(c)) {
      let id = '';
      while (i < n && isAlnum(src[i])) { id += src[i]; i++; }
      const up = id.toUpperCase();
      if (up === 'AND') tokens.push({ type: 'OP', value: '&&' });
      else if (up === 'OR') tokens.push({ type: 'OP', value: '||' });
      else if (up === 'NOT') tokens.push({ type: 'OP', value: '!' });
      else if (up === 'TRUE') tokens.push({ type: 'NUM', value: 1, isFloat: false });
      else if (up === 'FALSE') tokens.push({ type: 'NUM', value: 0, isFloat: false });
      else tokens.push({ type: 'ID', value: id });
      continue;
    }

    // двухсимвольные операторы
    const two = src.substr(i, 2);
    if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) {
      tokens.push({ type: 'OP', value: two }); i += 2; continue;
    }

    // односимвольные
    if ('+-*/%<>!'.includes(c)) { tokens.push({ type: 'OP', value: c }); i++; continue; }
    if (c === '=') { tokens.push({ type: 'OP', value: '==' }); i++; continue; } // одиночное = трактуем как сравнение
    if (c === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    if (c === '[') { tokens.push({ type: 'LBRACK' }); i++; continue; }
    if (c === ']') { tokens.push({ type: 'RBRACK' }); i++; continue; }
    if (c === ',') { tokens.push({ type: 'COMMA' }); i++; continue; }

    throw new CodeError(`Недопустимый символ: «${c}»`);
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

/* ----------------------------- 2. ПАРСЕР -------------------------------- */
// Грамматика (по убыванию приоритета связывания снизу вверх):
//   expr      := or
//   or        := and ('||' and)*
//   and       := cmp ('&&' cmp)*
//   cmp       := add (('=='|'!='|'<'|'>'|'<='|'>=') add)*
//   add       := mul (('+'|'-') mul)*
//   mul       := unary (('*'|'/'|'%') unary)*
//   unary     := ('-'|'!') unary | primary
//   primary   := NUM | STR | ID | ID '[' expr ']' | ID '(' args ')' | '(' expr ')'
class Parser {
  constructor(tokens) { this.toks = tokens; this.pos = 0; }
  peek() { return this.toks[this.pos]; }
  next() { return this.toks[this.pos++]; }
  expect(type) {
    const t = this.next();
    if (t.type !== type) throw new CodeError(`Ожидалось «${type}», но найдено «${t.value ?? t.type}»`);
    return t;
  }
  parse() {
    if (this.peek().type === 'EOF') throw new CodeError('Пустое выражение');
    const node = this.parseOr();
    if (this.peek().type !== 'EOF') {
      const t = this.peek();
      throw new CodeError(`Лишний символ в выражении: «${t.value ?? t.type}»`);
    }
    return node;
  }
  parseOr() {
    let left = this.parseAnd();
    while (this.peek().type === 'OP' && this.peek().value === '||') {
      this.next(); left = { kind: 'logic', op: '||', left, right: this.parseAnd() };
    }
    return left;
  }
  parseAnd() {
    let left = this.parseCmp();
    while (this.peek().type === 'OP' && this.peek().value === '&&') {
      this.next(); left = { kind: 'logic', op: '&&', left, right: this.parseCmp() };
    }
    return left;
  }
  parseCmp() {
    let left = this.parseAdd();
    while (this.peek().type === 'OP' && ['==', '!=', '<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.next().value;
      left = { kind: 'cmp', op, left, right: this.parseAdd() };
    }
    return left;
  }
  parseAdd() {
    let left = this.parseMul();
    while (this.peek().type === 'OP' && ['+', '-'].includes(this.peek().value)) {
      const op = this.next().value;
      left = { kind: 'bin', op, left, right: this.parseMul() };
    }
    return left;
  }
  parseMul() {
    let left = this.parseUnary();
    while (this.peek().type === 'OP' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.next().value;
      left = { kind: 'bin', op, left, right: this.parseUnary() };
    }
    return left;
  }
  parseUnary() {
    if (this.peek().type === 'OP' && (this.peek().value === '-' || this.peek().value === '!')) {
      const op = this.next().value;
      return { kind: 'unary', op, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    const t = this.peek();
    if (t.type === 'NUM') { this.next(); return { kind: 'num', value: t.value, isFloat: t.isFloat }; }
    if (t.type === 'STR') { this.next(); return { kind: 'str', value: t.value }; }
    if (t.type === 'LPAREN') {
      this.next();
      const e = this.parseOr();
      this.expect('RPAREN');
      return e;
    }
    if (t.type === 'ID') {
      this.next();
      // вызов функции f(...)
      if (this.peek().type === 'LPAREN') {
        this.next();
        const args = [];
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseOr());
          while (this.peek().type === 'COMMA') { this.next(); args.push(this.parseOr()); }
        }
        this.expect('RPAREN');
        return { kind: 'call', name: t.value, args };
      }
      // индекс массива a[expr]
      if (this.peek().type === 'LBRACK') {
        this.next();
        const idx = this.parseOr();
        this.expect('RBRACK');
        return { kind: 'index', name: t.value, index: idx };
      }
      return { kind: 'var', name: t.value };
    }
    throw new CodeError(`Не получилось разобрать выражение возле «${t.value ?? t.type}»`);
  }
}

// Кэшируем разбор строки в AST
const _astCache = new Map();
function parseExpr(src) {
  if (_astCache.has(src)) return _astCache.get(src);
  const ast = new Parser(tokenize(src)).parse();
  _astCache.set(src, ast);
  return ast;
}

// Разбор списка имён "a, b, c" -> ['a','b','c'] (для объявления переменных)
function parseNameList(src) {
  const names = src.split(',').map((s) => s.trim()).filter((s) => s.length);
  for (const nm of names) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nm)) throw new CodeError(`Недопустимое имя переменной: «${nm}»`);
  }
  if (!names.length) throw new CodeError('Не указано ни одного имени переменной');
  return names;
}

/* ----------------------------- 3. EVALUATOR ----------------------------- */
// Окружение (scope) с поддержкой вложенности для функций
class Scope {
  constructor(parent = null) { this.vars = new Map(); this.parent = parent; }
  has(name) { return this.vars.has(name) || (this.parent ? this.parent.has(name) : false); }
  get(name) {
    if (this.vars.has(name)) return this.vars.get(name);
    if (this.parent) return this.parent.get(name);
    throw new CodeError(`Переменная «${name}» не объявлена`);
  }
  setExisting(name, val) {
    if (this.vars.has(name)) { this.vars.set(name, val); return true; }
    if (this.parent) return this.parent.setExisting(name, val);
    return false;
  }
  declare(name, val) { this.vars.set(name, val); }
}

// Значение: { t:'int'|'float'|'string'|'array', v: ... }
const VInt = (v) => ({ t: 'int', v: Math.trunc(v) });
const VFloat = (v) => ({ t: 'float', v });
const VStr = (v) => ({ t: 'string', v });

function toNum(val, blockId) {
  if (val.t === 'int' || val.t === 'float') return val.v;
  if (val.t === 'string') throw new CodeError('Нельзя использовать строку в арифметике', blockId);
  throw new CodeError('Ожидалось число', blockId);
}
function truthy(val) { return val.t === 'string' ? val.v.length > 0 : val.v !== 0; }

// runtime: { scope, arrays(in scope as values), funcs, blockId }
function evalNode(node, ctx) {
  switch (node.kind) {
    case 'num': return node.isFloat ? VFloat(node.value) : VInt(node.value);
    case 'str': return VStr(node.value);
    case 'var': return ctx.scope.get(node.name);
    case 'index': {
      const arr = ctx.scope.get(node.name);
      if (!arr || arr.t !== 'array') throw new CodeError(`«${node.name}» не является массивом`, ctx.blockId);
      const idx = toNum(evalNode(node.index, ctx), ctx.blockId);
      const k = Math.trunc(idx);
      if (k < 0 || k >= arr.v.length) throw new CodeError(`Индекс ${k} вне границ массива «${node.name}» (размер ${arr.v.length})`, ctx.blockId);
      return arr.v[k];
    }
    case 'call': return callFunction(node.name, node.args.map((a) => evalNode(a, ctx)), ctx);
    case 'unary': {
      if (node.op === '!') return VInt(truthy(evalNode(node.operand, ctx)) ? 0 : 1);
      const v = evalNode(node.operand, ctx);
      return v.t === 'float' ? VFloat(-v.v) : VInt(-toNum(v, ctx.blockId));
    }
    case 'logic': {
      const l = truthy(evalNode(node.left, ctx));
      if (node.op === '&&') return VInt(l && truthy(evalNode(node.right, ctx)) ? 1 : 0);
      return VInt(l || truthy(evalNode(node.right, ctx)) ? 1 : 0);
    }
    case 'cmp': {
      const l = evalNode(node.left, ctx), r = evalNode(node.right, ctx);
      const a = l.t === 'string' ? l.v : toNum(l, ctx.blockId);
      const b = r.t === 'string' ? r.v : toNum(r, ctx.blockId);
      let res;
      switch (node.op) {
        case '==': res = a === b; break;
        case '!=': res = a !== b; break;
        case '<': res = a < b; break;
        case '>': res = a > b; break;
        case '<=': res = a <= b; break;
        case '>=': res = a >= b; break;
      }
      return VInt(res ? 1 : 0);
    }
    case 'bin': {
      const l = evalNode(node.left, ctx), r = evalNode(node.right, ctx);
      // конкатенация строк через +
      if (node.op === '+' && (l.t === 'string' || r.t === 'string')) {
        return VStr(String(l.v) + String(r.v));
      }
      const a = toNum(l, ctx.blockId), b = toNum(r, ctx.blockId);
      const isFloat = l.t === 'float' || r.t === 'float';
      switch (node.op) {
        case '+': return isFloat ? VFloat(a + b) : VInt(a + b);
        case '-': return isFloat ? VFloat(a - b) : VInt(a - b);
        case '*': return isFloat ? VFloat(a * b) : VInt(a * b);
        case '/':
          if (b === 0) throw new CodeError('Деление на ноль', ctx.blockId);
          return isFloat ? VFloat(a / b) : VInt(Math.trunc(a / b));
        case '%':
          if (b === 0) throw new CodeError('Деление на ноль (остаток)', ctx.blockId);
          return VInt(Math.trunc(a) % Math.trunc(b));
      }
    }
  }
  throw new CodeError('Неизвестный узел выражения', ctx.blockId);
}

function callFunction(name, argVals, ctx) {
  const fn = ctx.funcs.get(name);
  if (!fn) throw new CodeError(`Функция «${name}» не определена`, ctx.blockId);
  if (fn.params.length !== argVals.length)
    throw new CodeError(`Функция «${name}» ожидает ${fn.params.length} аргум., передано ${argVals.length}`, ctx.blockId);
  const local = new Scope(null); // функции имеют собственную область видимости
  fn.params.forEach((p, i) => local.declare(p, argVals[i]));
  const subCtx = { ...ctx, scope: local };
  try {
    runBlocksSync(fn.body, subCtx);
  } catch (e) {
    if (e.__return !== undefined) return e.__return;
    throw e;
  }
  return VInt(0); // функция без return
}

// Синхронный прогон тела (для вызова функций внутри выражений)
function runBlocksSync(blocks, ctx) {
  const gen = execBlocks(blocks, ctx);
  let r = gen.next();
  while (!r.done) r = gen.next();
}

/* --------------------------- 4. ИНТЕРПРЕТАТОР --------------------------- */
// Генератор: yield-ит id текущего блока (для пошаговой отладки/подсветки).
// Управляющие исключения: { __break }, { __continue }, { __return }
function* execBlocks(blocks, ctx) {
  for (const b of blocks) yield* execBlock(b, ctx);
}

function* execBlock(b, ctx) {
  ctx.blockId = b.id;
  ctx.steps.count++;
  if (ctx.steps.count > ctx.steps.limit)
    throw new CodeError('Превышен лимit шагов — возможно, бесконечный цикл', b.id);
  yield b.id; // точка останова перед исполнением блока

  switch (b.type) {
    case 'varDecl': {
      const names = parseNameList(b.names || '');
      for (const nm of names) ctx.scope.declare(nm, VInt(0));
      break;
    }
    case 'arrayDecl': {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test((b.name || '').trim()))
        throw new CodeError('Некорректное имя массива', b.id);
      const size = Math.trunc(toNum(evalNode(parseExpr(b.size || '0'), ctx), b.id));
      if (size < 0 || size > 100000) throw new CodeError('Недопустимый размер массива', b.id);
      ctx.scope.declare(b.name.trim(), { t: 'array', v: Array.from({ length: size }, () => VInt(0)) });
      break;
    }
    case 'assign': {
      const val = evalNode(parseExpr(b.expr || '0'), ctx);
      const tgt = (b.target || '').trim();
      if (!ctx.scope.has(tgt)) throw new CodeError(`Переменная «${tgt}» не объявлена`, b.id);
      if (!ctx.scope.setExisting(tgt, val)) throw new CodeError(`Не удалось присвоить «${tgt}»`, b.id);
      break;
    }
    case 'arrayAssign': {
      const arr = ctx.scope.has(b.name) ? ctx.scope.get(b.name) : null;
      if (!arr || arr.t !== 'array') throw new CodeError(`«${b.name}» не является массивом`, b.id);
      const idx = Math.trunc(toNum(evalNode(parseExpr(b.index || '0'), ctx), b.id));
      if (idx < 0 || idx >= arr.v.length)
        throw new CodeError(`Индекс ${idx} вне границ массива «${b.name}» (размер ${arr.v.length})`, b.id);
      arr.v[idx] = evalNode(parseExpr(b.expr || '0'), ctx);
      break;
    }
    case 'if': {
      const cond = truthy(evalNode(parseExpr(b.cond || '0'), ctx));
      if (cond) yield* execBlocks(b.body || [], ctx);
      else if (b.hasElse) yield* execBlocks(b.elseBody || [], ctx);
      break;
    }
    case 'while': {
      while (truthy(evalNode(parseExpr(b.cond || '0'), ctx))) {
        try { yield* execBlocks(b.body || [], ctx); }
        catch (e) { if (e.__break) break; if (e.__continue) continue; throw e; }
        ctx.steps.count++;
        if (ctx.steps.count > ctx.steps.limit) throw new CodeError('Превышен лимит шагов (цикл while)', b.id);
      }
      break;
    }
    case 'for': {
      if (b.init) { ctx.blockId = b.id; yield* execBlock({ ...b.init, id: b.id + ':init' }, ctx); }
      while (b.cond ? truthy(evalNode(parseExpr(b.cond), ctx)) : true) {
        try { yield* execBlocks(b.body || [], ctx); }
        catch (e) { if (e.__break) break; if (!e.__continue) throw e; }
        if (b.step) yield* execBlock({ ...b.step, id: b.id + ':step' }, ctx);
        ctx.steps.count++;
        if (ctx.steps.count > ctx.steps.limit) throw new CodeError('Превышен лимит шагов (цикл for)', b.id);
      }
      break;
    }
    case 'break': throw { __break: true };
    case 'continue': throw { __continue: true };
    case 'return': {
      const v = b.expr && b.expr.trim() ? evalNode(parseExpr(b.expr), ctx) : VInt(0);
      throw { __return: v };
    }
    case 'funcDef': break; // регистрируется заранее
    case 'funcCall': {
      callFunction(b.name, (b.args || '').trim()
        ? splitArgs(b.args).map((a) => evalNode(parseExpr(a), ctx)) : [], ctx);
      break;
    }
    case 'print': {
      const v = evalNode(parseExpr(b.expr || '0'), ctx);
      ctx.output.push(formatVal(v));
      break;
    }
    default: throw new CodeError(`Неизвестный блок: ${b.type}`, b.id);
  }
}

function splitArgs(src) {
  // разбивает "a, f(1,2), b" по запятым верхнего уровня
  const out = []; let depth = 0, cur = '';
  for (const ch of src) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function formatVal(v) {
  if (v.t === 'array') return '[' + v.v.map(formatVal).join(', ') + ']';
  if (v.t === 'float') return String(v.v);
  return String(v.v);
}

/* --------- Верхнеуровневый запуск: подготовка контекста --------------- */
function createRun(program, { stepLimit = 2000000 } = {}) {
  const funcs = new Map();
  // регистрируем функции верхнего уровня
  for (const b of program) {
    if (b.type === 'funcDef') {
      funcs.set(b.name, { params: (b.params || '').split(',').map((s) => s.trim()).filter(Boolean), body: b.body || [] });
    }
  }
  const ctx = {
    scope: new Scope(null),
    funcs,
    output: [],
    blockId: null,
    steps: { count: 0, limit: stepLimit },
  };
  // исполняем только не-функции на верхнем уровне
  const main = program.filter((b) => b.type !== 'funcDef');
  return { ctx, gen: execBlocks(main, ctx) };
}

/* ----------------------------- Экспорт ---------------------------------- */
/* ----------------------------- Экспорт (ES-модуль) ---------------------- */
export { tokenize, parseExpr, parseNameList, evalNode, createRun, formatVal, CodeError, Scope, VInt };
