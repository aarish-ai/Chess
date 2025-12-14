document.addEventListener('DOMContentLoaded', () => {
  // ---------- DOM ELEMENTS ----------
  const boardDiv    = document.getElementById('board');
  const statusDiv   = document.getElementById('status');
  const turnNoSpan  = document.getElementById('turnNo');
  const lastDiv     = document.getElementById('lastMove');
  const resetBtn    = document.getElementById('resetBtn');
  const promoOver   = document.getElementById('promo');
  const modeOverlay = document.getElementById('modeOverlay');
  const twoBtn      = document.getElementById('twoBtn');
  const aiBtn       = document.getElementById('aiBtn');

  // ---------- GAME STATE ----------
  let selectedSq = null;
  let legalSquares = [];
  let currentTurn = 'w';
  let turnCounter = 1;

  const pieces = {
    'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙',
    'k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'
  };

  // ---------- BOARD SETUP ----------
  function buildBoard() {
    boardDiv.innerHTML = '';
    for(let r=0; r<8; r++){
      for(let c=0; c<8; c++){
        const sq = document.createElement('div');
        sq.className = 'square ' + ((r+c)%2 ? 'dark':'light');
        sq.dataset.r = r;
        sq.dataset.c = c;
        boardDiv.appendChild(sq);
      }
    }
  }
  buildBoard();

  // ---------- DRAW & STATE ----------
  async function loadState(){
    try{
      const res = await fetch('/state');
      const st  = await res.json();
      currentTurn = st.turn;
      drawPosition(st.fen);

      if(st.is_checkmate)
        statusDiv.textContent = 'Checkmate – '+ (currentTurn==='b'?'White':'Black') +' wins';
      else if(st.is_stalemate)
        statusDiv.textContent = 'Stalemate – draw';
      else if(st.is_check)
        statusDiv.textContent = 'Check – '+ (currentTurn==='w'?'White':'Black') +' to move';
      else
        statusDiv.textContent = (currentTurn==='w'?'White':'Black') +' to move';
    } catch(e){
      console.error('loadState error:', e);
    }
  }

  function drawPosition(fen){
    const rows = fen.split(' ')[0].split('/');
    let r=0, c=0;
    boardDiv.querySelectorAll('.square').forEach(sq => {
      sq.textContent = '';
      sq.classList.remove('white-piece','black-piece','legal-move','selected');
    });

    for(const ch of rows.join('')){
      if(/\d/.test(ch)){ c += parseInt(ch,10); }
      else{
        const sq = boardDiv.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        sq.textContent = pieces[ch] || '';
        if(ch === ch.toUpperCase()) sq.classList.add('white-piece');
        else sq.classList.add('black-piece');
        c++;
      }
      if(c===8){ c=0; r++; }
    }
  }

  // ---------- HELPERS ----------
  function uciToPos(uci){ return { c: uci.charCodeAt(0)-97, r: 8-parseInt(uci[1]) }; }
  function posToUci(p){ return String.fromCharCode(97+p.c) + (8-p.r); }
  function pieceColour(ch){ return ch===ch.toUpperCase()?'w':'b'; }
  function fenPieceAt(fen,r,c){
    const rows = fen.split(' ')[0].split('/');
    let rr=0, cc=0;
    for(const row of rows){
      for(const ch of row){
        if(/\d/.test(ch)){ cc+=parseInt(ch,10); }
        else{ if(rr===r && cc===c) return ch; cc++; }
      }
      rr++; cc=0;
    }
    return null;
  }
  async function fetchLegal(){ return (await fetch('/legal')).json(); }
  async function sendMove(uci){
    return (await (await fetch('/move',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({move:uci})
    })).json()).success;
  }
  function highlightSquare(sq,on){ sq.classList.toggle('selected',on); }
  function clearSelection(){
    selectedSq = null;
    boardDiv.querySelectorAll('.selected,.legal-move').forEach(s => s.classList.remove('selected','legal-move'));
  }

  // ---------- BOARD CLICK HANDLING ----------
  boardDiv.addEventListener('click', async e => {
    const sq = e.target.closest('.square');
    if(!sq) return;
    const r = +sq.dataset.r, c = +sq.dataset.c;

    if(selectedSq){
      const uci = posToUci(selectedSq) + posToUci({r,c});
      const promo = await needsPromotion(uci);
      const ok = await sendMove(uci + promo);
      clearSelection();
      if(ok){
        turnCounter++;
        turnNoSpan.textContent = turnCounter;
        lastDiv.textContent = uci + promo;
        await loadState();
      }
    } else {
      const st = await (await fetch('/state')).json();
      const piece = fenPieceAt(st.fen,r,c);
      if(piece && pieceColour(piece) === st.turn){
        selectedSq = {r,c};
        highlightSquare(sq,true);
        const legal = await fetchLegal();
        legalSquares = legal.moves
          .filter(m => m.startsWith(posToUci({r,c})))
          .map(m => { const p=uciToPos(m.slice(2,4)); return boardDiv.querySelector(`[data-r="${p.r}"][data-c="${p.c}"]`); });
        legalSquares.forEach(s => s.classList.add('legal-move'));
      }
    }
  });

  // ---------- PROMOTION ----------
  async function needsPromotion(uci){
    const st = await (await fetch('/state')).json();
    const from = uciToPos(uci.slice(0,2));
    const toRank = uci[3];
    const piece = fenPieceAt(st.fen,from.r,from.c);
    if(piece && piece.toLowerCase()==='p' && (toRank==='8'||toRank==='1')){
      return new Promise(res => {
        promoOver.classList.remove('hidden');
        ['q','r','b','n'].forEach(ch => {
          const sp = promoOver.querySelector(`[data-piece="${ch}"]`);
          sp.textContent = st.turn==='w'?pieces[ch]:pieces[ch.toLowerCase()];
          sp.onclick = () => { promoOver.classList.add('hidden'); res(ch); };
        });
      });
    }
    return '';
  }

  // ---------- RESET ----------
  resetBtn.addEventListener('click', async () => {
    await fetch('/reset',{method:'POST'});
    turnCounter = 1; lastDiv.textContent = '—';
    clearSelection();
    await loadState();
  });

  // ---------- MODE SELECTION ----------
  async function setMode(mode){
    try{
      await fetch('/set_mode',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({mode})
      });
      // Directly hide overlay
      if(modeOverlay) modeOverlay.style.display = 'none';
      await loadState();
    } catch(err){
      console.error('setMode error', err);
    }
  }

  twoBtn.addEventListener('click', ()=>setMode('two'));
  aiBtn.addEventListener('click', ()=>setMode('ai'));

  // ---------- START ----------
  loadState();
});
