/* =====================================================================
   useEditor.js — общий стор редактора (один на приложение).
   Хранит программу, состояние drag-and-drop, движок запуска/отладки,
   проверку ошибок и операции с файлами. Компоненты вызывают useEditor().
   ===================================================================== */
import { reactive } from 'vue';
import { parseExpr, parseNameList, createRun, formatVal } from '../interpreter.js';
import { makeBlock, compile, childSlots, regenIds, EXAMPLES } from '../blocks.js';

/* реактивное состояние — единый источник правды */
const state = reactive({
  program: [],
  drag: { active: false, kind: null, type: null, blockId: null, forbidden: [], overKey: null },
  exec: {
    mode: null, run: null, running: false, finished: false, playing: false, timer: null,
    activeId: null, errorId: null, errorMsg: '', vars: [], output: [], steps: 0, delay: 120,
  },
});

/* ---------- drag-and-drop ---------- */
function dragNewStart(type, ev) {
  Object.assign(state.drag, { active: true, kind: 'new', type, blockId: null, forbidden: [] });
  ev.dataTransfer.effectAllowed = 'copy';
  try { ev.dataTransfer.setData('text/plain', 'new:' + type); } catch (_) { /* noop */ }
}
function dragBlockStart(block, ev) {
  Object.assign(state.drag, { active: true, kind: 'move', type: null, blockId: block.id, forbidden: collectSlots(block) });
  ev.dataTransfer.effectAllowed = 'move';
  try { ev.dataTransfer.setData('text/plain', 'move:' + block.id); } catch (_) { /* noop */ }
  ev.stopPropagation();
}
function dragEnd() {
  setTimeout(() => {
    Object.assign(state.drag, { active: false, kind: null, blockId: null, forbidden: [], overKey: null });
  }, 0);
}
function over(k) { state.drag.overKey = k; }
function out(k) { if (state.drag.overKey === k) state.drag.overKey = null; }

function collectSlots(block) {
  const out = [];
  const visit = (b) => { for (const s of childSlots(b)) { out.push(s); for (const c of s) visit(c); } };
  visit(block);
  return out;
}
function removeBlock(id) {
  const search = (list) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return list.splice(i, 1)[0];
      for (const s of childSlots(list[i])) { const f = search(s); if (f) return f; }
    }
    return null;
  };
  return search(state.program);
}
function dropInto(list, beforeId, ev) {
  const ds = state.drag;
  if (ev) { ev.preventDefault(); ev.stopPropagation(); }
  if (!ds.kind) { dragEnd(); return; }
  let obj = null;
  if (ds.kind === 'new') {
    obj = makeBlock(ds.type);
  } else if (ds.kind === 'move') {
    if (beforeId === ds.blockId) { dragEnd(); return; }       // на то же место
    if (ds.forbidden.includes(list)) { dragEnd(); return; }   // внутрь самого себя нельзя
    obj = removeBlock(ds.blockId);
  }
  if (!obj) { dragEnd(); return; }
  const idx = beforeId ? list.findIndex((b) => b.id === beforeId) : -1;
  if (idx < 0) list.push(obj); else list.splice(idx, 0, obj);
  dragEnd();
}
function appendToRoot(type) { state.program.push(makeBlock(type)); }
function deleteBlock(id) {
  removeBlock(id);
  if (state.exec.activeId === id) state.exec.activeId = null;
  if (state.exec.errorId === id) { state.exec.errorId = null; state.exec.errorMsg = ''; }
}
function addElse(b) { b.hasElse = true; }
function removeElse(b) { b.hasElse = false; }

/* ---------- живая проверка синтаксиса (подсветка ошибок) ---------- */
const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
function blockError(b) {
  try {
    switch (b.type) {
      case 'varDecl': parseNameList(b.names || ''); break;
      case 'arrayDecl':
        if (!NAME_RE.test((b.name || '').trim())) return 'некорректное имя массива';
        parseExpr(b.size || '0'); break;
      case 'assign':
        if (!NAME_RE.test((b.target || '').trim())) return 'некорректное имя переменной';
        parseExpr(b.expr || '0'); break;
      case 'arrayAssign':
        if (!NAME_RE.test((b.name || '').trim())) return 'некорректное имя массива';
        parseExpr(b.index || '0'); parseExpr(b.expr || '0'); break;
      case 'if': case 'while': parseExpr(b.cond || '0'); break;
      case 'for':
        parseExpr(b.initExpr || '0'); parseExpr(b.cond || '1'); parseExpr(b.stepExpr || '0'); break;
      case 'print': parseExpr(b.expr || '0'); break;
      case 'return': if ((b.expr || '').trim()) parseExpr(b.expr); break;
      case 'funcCall':
        if (!NAME_RE.test((b.name || '').trim())) return 'некорректное имя функции';
        if ((b.args || '').trim()) b.args.split(',').forEach((a) => { if (a.trim()) parseExpr(a); }); break;
      case 'funcDef':
        if (!NAME_RE.test((b.name || '').trim())) return 'некорректное имя функции'; break;
    }
  } catch (e) { return e.message; }
  return null;
}

/* ---------- движок запуска / отладки ---------- */
function resetExecState(keepOutput) {
  const e = state.exec;
  if (e.timer) { clearTimeout(e.timer); e.timer = null; }
  Object.assign(e, { run: null, running: false, finished: false, playing: false,
    activeId: null, errorId: null, errorMsg: '', steps: 0, vars: [] });
  if (!keepOutput) e.output = [];
}
function prepare() {
  const { ctx, gen } = createRun(state.program.map(compile));
  state.exec.run = { ctx, gen };
}
function snapshot() {
  const ctx = state.exec.run.ctx;
  state.exec.steps = ctx.steps.count;
  state.exec.vars = [...ctx.scope.vars].map(([name, val]) => ({ name, type: val.t, value: formatVal(val) }));
  state.exec.output = ctx.output.slice();
}
function snapshotSafe() { try { snapshot(); } catch (_) { /* noop */ } }
function handleErr(err) {
  const e = state.exec;
  e.errorId = err.blockId || null;
  e.errorMsg = err.message || String(err);
  e.running = false; e.finished = true; e.playing = false;
  if (e.timer) { clearTimeout(e.timer); e.timer = null; }
}
function runInstant() {
  resetExecState(false);
  state.exec.mode = 'instant'; state.exec.running = true;
  try {
    prepare();
    const gen = state.exec.run.gen;
    let r = gen.next();
    while (!r.done) r = gen.next();
    state.exec.finished = true;
    snapshot();
  } catch (e) { snapshotSafe(); handleErr(e); }
  state.exec.activeId = null; state.exec.running = false;
}
function startDebug() {
  resetExecState(false);
  state.exec.mode = 'debug';
  try {
    prepare();
    const r = state.exec.run.gen.next();
    if (r.done) { state.exec.finished = true; state.exec.activeId = null; }
    else state.exec.activeId = r.value;
    snapshot();
  } catch (e) { handleErr(e); }
}
function step() {
  const e = state.exec;
  if (!e.run || e.finished) return;
  try {
    const r = e.run.gen.next();
    if (r.done) { e.finished = true; e.activeId = null; }
    else e.activeId = r.value;
    snapshot();
  } catch (err) { snapshotSafe(); handleErr(err); }
}
function play() {
  const e = state.exec;
  if (!e.run || e.finished) return;
  e.playing = true;
  const tick = () => {
    if (!e.run || e.finished || !e.playing) { e.playing = false; return; }
    step();
    if (e.errorId || e.finished) { e.playing = false; return; }
    e.timer = setTimeout(tick, e.delay);
  };
  tick();
}
function stopExec() {
  const e = state.exec;
  if (e.timer) { clearTimeout(e.timer); e.timer = null; }
  Object.assign(e, { run: null, running: false, finished: false, playing: false, activeId: null, mode: null });
}

/* ---------- статус (для инспектора) ---------- */
function statusClass() {
  const e = state.exec;
  if (e.errorId || e.errorMsg) return 'err';
  if (e.mode === 'debug' && e.run && !e.finished) return 'run';
  if (e.running) return 'run';
  if (e.finished) return 'ok';
  return 'idle';
}
function statusText() {
  const e = state.exec;
  if (e.errorId || e.errorMsg) return 'Ошибка: ' + e.errorMsg;
  if (e.mode === 'debug' && e.run && !e.finished) return 'Отладка — нажмите «Шаг» или «Авто»';
  if (e.running) return 'Выполнение…';
  if (e.finished) return 'Готово';
  return 'Ожидание запуска';
}

/* ---------- файлы / примеры / очистка ---------- */
function saveFile() {
  const data = JSON.stringify(state.program, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'codeblock-program.json';
  a.click(); URL.revokeObjectURL(url);
}
function loadFile(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('Ожидался массив блоков');
      resetExecState(false);
      state.program = regenIds(parsed);
    } catch (e) { alert('Не удалось загрузить файл: ' + e.message); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}
function loadExample(name) {
  if (!name || !EXAMPLES[name]) return;
  resetExecState(false);
  state.program = regenIds(EXAMPLES[name]());
}
function clearAll() { resetExecState(false); state.program = []; }

/* единый объект-API стора */
const editor = {
  state,
  // drag-and-drop
  dragNewStart, dragBlockStart, dragEnd, over, out, dropInto, appendToRoot, deleteBlock, addElse, removeElse,
  // проверка
  blockError,
  // движок
  runInstant, startDebug, step, play, stopExec, statusClass, statusText,
  // файлы
  saveFile, loadFile, loadExample, clearAll,
};

export function useEditor() { return editor; }
