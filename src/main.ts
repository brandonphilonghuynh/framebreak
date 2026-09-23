import Phaser from 'phaser';
import { Arena } from './scenes/Arena';
import { MOVES, canUse, chooseCpu, cost, newMatch, resolveTurn, type Action } from './game/combat';
import './style.css';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
<header><a class="brand" href="#">FRAME<span>BREAK</span><sup>®</sup></a><div class="header-right"><span class="status-dot"></span> LOCAL COMBAT LAB <span class="version">V.01</span><button id="help" class="small">HOW TO PLAY ↗</button></div></header>
<main>
<div class="intro"><div><div class="eyebrow">SIMULTANEOUS TACTICAL COMBAT</div><h1>Read. Commit. <em>Counter.</em></h1></div><p>Six moves. Two minds. One moment.<br>Win the read before you throw the punch.</p></div>
<section id="combat" aria-label="Combat arena">
<div class="arena-top"><span><i class="status-dot"></i> THE TRAINING FLOOR</span><span>01 / EXHIBITION <b id="turn">TURN 01</b></span></div>
<div class="fighters-hud">${['VECTOR','ROOK'].map((name,i)=>`<div class="fighter-hud ${i?'enemy':''}"><div class="fighter-name"><span><small>${i?'CPU / BALANCED':'YOU / CHALLENGER'}</small>${name}</span><strong id="hp${i}">100<small> / 100</small></strong></div><div class="bar health"><div id="health${i}"></div></div><div class="stamina-line"><span>STAMINA</span><span id="sp${i}">100 / 100</span></div><div class="bar stamina"><div id="stamina${i}"></div></div></div>`).join('')}</div>
<div id="arena"><div class="distance"><span>RANGE</span> <b>CLOSE</b> <span>● — ○ — ○</span></div><div id="reveal" class="reveal" aria-live="polite"></div></div>
<div class="arena-footer"><span>VECTOR <b>01</b></span><span>ONE ROUND · NO TIMER · NO SECOND GUESSES</span><span><b>02</b> ROOK</span></div>
</section>
<section class="decision"><div class="section-heading"><h2 id="phase">Choose your next move</h2><span id="cpu-status">OPPONENT HAS COMMITTED <i class="status-dot"></i></span></div><div class="action-grid">${(Object.keys(MOVES) as Action[]).map((a,i)=>`<button class="action ${a}" data-action="${a}"><div class="action-top"><kbd>${i+1}</kbd><span class="cost" id="cost-${a}">${MOVES[a].cost ? '−'+MOVES[a].cost : a==='recover'?'+30':'ON HIT'} ST</span></div><div class="move-name">${MOVES[a].name}<span>${['↗','✦','◈','↝','⌁','＋'][i]}</span></div><p>${MOVES[a].description}</p></button>`).join('')}</div></section>
<section class="intel"><div class="read-panel"><span class="eyebrow">THE READ</span><p id="read">Rook learns your habits. Keep your next move uncertain.</p><div class="history" id="history">YOUR LAST FIVE <span>— — — — —</span></div></div><div class="log-panel"><div class="section-heading"><span class="eyebrow">COMBAT LOG</span><span id="log-tag">AWAITING FIRST EXCHANGE</span></div><div id="log" role="log" aria-live="polite"><p>Both fighters are ready. Make your opening read.</p></div></div></section>
<footer><span>FRAMEBREAK / PROTOTYPE 0.1</span><span>1–6 SELECT MOVE <b>·</b> H HELP <b>·</b> R RESTART</span><button id="restart" class="small">RESTART ↻</button></footer>
</main>
<dialog id="menu"><div class="eyebrow">FRAMEBREAK / TACTICAL FIGHTING</div><h2 id="menu-title">Every move<br>is a <em>mind game.</em></h2><p id="menu-copy">You and Rook choose in secret. Then both moves resolve together. Read the habit. Break the pattern.</p><div class="menu-stats"><span>06<small>ACTIONS</small></span><span>01<small>ROUND</small></span><span>∞<small>READS</small></span></div><button id="start" class="primary">ENTER THE ARENA <span>↗</span></button><button id="menu-help" class="text-button">Learn the rules →</button></dialog>
<dialog id="instructions"><div class="eyebrow">FIELD MANUAL / 01</div><h2>Win the <em>read.</em></h2><p>Rook locks a secret action before you choose. Both actions reveal and resolve together; faster attacks interrupt slower ones. Equal speeds trade.</p><ul><li><b>1 · Light:</b> 12 damage / 15 stamina. Beats heavy and grab.</li><li><b>2 · Heavy:</b> 25 damage / 35 stamina. Deals 8 chip through block and drains 25 guard stamina.</li><li><b>3 · Block:</b> Stops light for 10 stamina. If you cannot pay guard cost, take full damage. Grabs ignore guard.</li><li><b>4 · Dodge:</b> Evades strikes for 25 stamina. Consecutive uses cost 35, then 45. Grabs catch it.</li><li><b>5 · Grab:</b> 15 damage / 20 stamina. Catches defense, interrupts heavy, loses to light. Close range only.</li><li><b>6 · Recover:</b> Restore 30 stamina, but incoming damage increases by 40%.</li></ul><p>V0.1 fights stay at close range. Health and stamina cap at 100. Zero health ends the match; simultaneous knockouts draw. There is no passive stamina regeneration.</p><p><b>Mouse or 1–6</b> to commit · <b>H</b> help · <b>R</b> restart · <b>Esc</b> close help. Your last five moves inform Rook’s next choice.</p><button id="close-help" class="primary">GOT IT ↗</button></dialog>`;
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'arena', width: 1100, height: 410, backgroundColor: '#101a20', scene: Arena, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true }, audio: { noAudio: true } });
let state = newMatch();
let cpuAction: Action = chooseCpu(state);
let locked = true;
let generation = 0;
let timers: number[] = [];
const menu = document.querySelector<HTMLDialogElement>('#menu')!;
const help = document.querySelector<HTMLDialogElement>('#instructions')!;
const el = (id: string) => document.getElementById(id)!;
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-action]')];
function update() {
  [state.player, state.cpu].forEach((f,i)=> { el(`hp${i}`).innerHTML = `${f.health}<small> / 100</small>`; el(`sp${i}`).textContent = `${f.stamina} / 100`; el(`health${i}`).style.width = `${f.health}%`; el(`stamina${i}`).style.width = `${f.stamina}%`; });
  el('turn').textContent = `TURN ${String(state.turn).padStart(2,'0')}`;
  buttons.forEach(button => { const a = button.dataset.action as Action; button.disabled = locked || !canUse(a,state.player); el(`cost-${a}`).textContent = a==='recover'?'+30 ST':a==='block'?'ON HIT':`−${cost(a,state.player)} ST`; button.title = canUse(a,state.player) ? MOVES[a].description : 'Not enough stamina — block or recover.'; });
  el('history').textContent = `YOUR LAST FIVE   ${state.player.history.map(a=>MOVES[a].name).join(' / ') || '— — — — —'}`;
}
function reset() {
  generation++; timers.forEach(clearTimeout); timers=[];
  state = newMatch(); cpuAction = chooseCpu(state); locked = false;
  if (menu.open) menu.close(); if (help.open) help.close();
  el('reveal').textContent=''; el('phase').textContent='Choose your next move'; el('cpu-status').textContent='OPPONENT HAS COMMITTED ●'; el('log').innerHTML='<p>Both fighters are ready. Make your opening read.</p>'; el('log-tag').textContent='AWAITING FIRST EXCHANGE'; el('read').textContent='Rook learns your habits. Keep your next move uncertain.';
  buttons.forEach(b=>b.classList.remove('selected')); update();
}
function delay(callback: ()=>void, ms: number) { const token = generation; timers.push(window.setTimeout(()=> { if (token===generation) callback(); },ms)); }
function commit(action: Action) {
  if (locked || menu.open || help.open || !canUse(action,state.player)) return;
  locked=true; update();
  buttons.find(b=>b.dataset.action===action)?.classList.add('selected');
  el('phase').textContent='Choices locked. No turning back.'; el('cpu-status').textContent='REVEALING';
  el('reveal').innerHTML=`<span>YOU COMMITTED</span><strong>${MOVES[action].name}</strong>`;
  const result=resolveTurn(state,action,cpuAction);
  delay(()=> { el('reveal').innerHTML=`<strong>${MOVES[action].name}</strong><span>VS</span><strong class="orange">${MOVES[cpuAction].name}</strong>`; },450);
  delay(()=> { game.events.emit('resolve',result); state=result.state; update(); el('log-tag').textContent=`EXCHANGE ${state.turn-1}`;
    const entry=document.createElement('div'); entry.className='log-entry'; const title=document.createElement('b'); title.textContent=`${String(state.turn-1).padStart(2,'0')} / ${MOVES[action].name} × ${MOVES[cpuAction].name}`; entry.append(title);
    result.messages.forEach(message=> { const p=document.createElement('p'); p.textContent=message; entry.append(p); });
    const stamina=document.createElement('p'); stamina.className='stamina-summary'; stamina.textContent=`STAMINA  You ${result.staminaDelta[0]>=0?'+':''}${result.staminaDelta[0]} · Rook ${result.staminaDelta[1]>=0?'+':''}${result.staminaDelta[1]}`; entry.append(stamina);
    el('log').prepend(entry); while(el('log').children.length>5) el('log').lastElementChild?.remove();
  },950);
  delay(()=> {
    buttons.forEach(b=>b.classList.remove('selected')); el('reveal').textContent='';
    if(state.outcome) { el('menu-title').textContent=state.outcome==='victory'?'You broke the pattern.':state.outcome==='defeat'?'Rook read you.':'A perfect trade.'; el('menu-copy').textContent=`${state.outcome.toUpperCase()} · ${state.turn-1} exchanges. ${state.outcome==='defeat'?'Change your rhythm and try a new read.':'Every rematch starts with a clean slate.'}`; el('start').textContent='REMATCH ↗'; if(help.open)help.close(); menu.showModal(); el('phase').textContent='Match complete'; }
    else { cpuAction=chooseCpu(state); locked=false; el('phase').textContent='Choose your next move'; el('cpu-status').textContent='OPPONENT HAS COMMITTED ●'; el('read').textContent=state.player.stamina<25?'Low stamina. A free block can buy time, but a broken guard takes full damage.':state.player.history.slice(-2).every(a=>a===action)&&state.player.history.length>1?'You’re showing a pattern. Rook may be ready for it.':'The last exchange is information. What does Rook expect next?'; } update();
  },2200);
}
buttons.forEach(b=>b.addEventListener('click',()=>commit(b.dataset.action as Action)));
el('start').addEventListener('click',reset); el('restart').addEventListener('click',reset);
function openHelp() { if(!help.open) help.showModal(); }
el('help').addEventListener('click',openHelp); el('menu-help').addEventListener('click',openHelp); el('close-help').addEventListener('click',()=>help.close());
menu.addEventListener('cancel',e=>e.preventDefault());
document.querySelector('.brand')!.addEventListener('click',e=> { e.preventDefault(); if(!locked && !menu.open) { el('menu-title').innerHTML='Every move<br>is a <em>mind game.</em>'; el('menu-copy').textContent='Start a new match and break the pattern.'; el('start').textContent='ENTER THE ARENA ↗'; menu.showModal(); } });
window.addEventListener('keydown',e=> { if(e.repeat || e.ctrlKey || e.metaKey || e.altKey)return; if(e.key.toLowerCase()==='h') { e.preventDefault(); help.open?help.close():openHelp(); } else if(e.key.toLowerCase()==='r' && !help.open)reset(); else if(/^[1-6]$/.test(e.key)) { e.preventDefault(); commit((Object.keys(MOVES) as Action[])[Number(e.key)-1]); } });
update(); menu.showModal();
