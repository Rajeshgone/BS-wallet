let user;

const TOKENS = [
  {
    symbol:"ETH",
    address:"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals:18,
    icon:"https://cryptologos.cc/logos/ethereum-eth-logo.png"
  },
  {
    symbol:"USDC",
    address:"0xd9aaec86b65d86f6a7b5c1c42ffa531710b6cae9",
    decimals:6,
    icon:"https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
  }
];

let fromToken = TOKENS[0];
let toToken = TOKENS[1];
let selecting = "from";
let quoteData = null;

document.getElementById("fromIcon").src = fromToken.icon;
document.getElementById("toIcon").src = toToken.icon;

/* CONNECT */
async function connect(){
  const acc = await ethereum.request({method:"eth_requestAccounts"});
  user = acc[0];
  document.getElementById("wallet").innerText = user;
  loadBalances();
}

/* BALANCES */
async function loadBalances(){
  const eth = await ethereum.request({
    method:"eth_getBalance",
    params:[user,"latest"]
  });
  document.getElementById("eth").innerText = (parseInt(eth,16)/1e18).toFixed(4);
}

/* TOKEN MODAL */
function openTokenModal(type){
  selecting = type;
  document.getElementById("tokenModal").style.display="block";
  renderTokens(TOKENS);
}

function renderTokens(list){
  const el = document.getElementById("tokenList");
  el.innerHTML="";
  list.forEach(t=>{
    const div=document.createElement("div");
    div.className="token";
    div.innerHTML=`<img src="${t.icon}" width="20"> ${t.symbol}`;
    div.onclick=()=>selectToken(t);
    el.appendChild(div);
  });
}

function filterTokens(q){
  renderTokens(TOKENS.filter(t=>t.symbol.toLowerCase().includes(q.toLowerCase())));
}

function selectToken(t){
  if(selecting==="from"){
    fromToken=t;
    document.getElementById("fromTokenLabel").innerText=t.symbol;
    document.getElementById("fromIcon").src=t.icon;
  } else {
    toToken=t;
    document.getElementById("toTokenLabel").innerText=t.symbol;
    document.getElementById("toIcon").src=t.icon;
  }
  document.getElementById("tokenModal").style.display="none";
}

/* SWITCH */
function switchTokens(){
  [fromToken,toToken] = [toToken,fromToken];
  document.getElementById("fromTokenLabel").innerText=fromToken.symbol;
  document.getElementById("toTokenLabel").innerText=toToken.symbol;
  getQuote();
}

/* QUOTE */
async function getQuote(){
  if(!user) return;

  const amt=document.getElementById("fromAmount").value;
  if(!amt) return;

  const sellAmount = Math.floor(amt * (10 ** fromToken.decimals));

  const url=`https://api.0x.org/swap/v1/quote?sellToken=${fromToken.address}&buyToken=${toToken.address}&sellAmount=${sellAmount}&takerAddress=${user}&chainId=8453`;

  const res=await fetch(url);
  const data=await res.json();
  quoteData=data;

  const receive = data.buyAmount / (10 ** toToken.decimals);
  document.getElementById("toAmount").value = receive.toFixed(6);

  document.getElementById("rate").innerText =
    `1 ${fromToken.symbol} ≈ ${(receive/amt).toFixed(4)} ${toToken.symbol}`;

  updateMin(receive);

  estimateGas({
    from:user,
    to:data.to,
    data:data.data,
    value:data.value || "0x0"
  });
}

/* SLIPPAGE */
function updateMin(receive){
  const slip=document.getElementById("slippage").value/100;
  document.getElementById("minReceived").innerText =
    "Min received: "+(receive*(1-slip)).toFixed(6);
}

/* GAS */
async function estimateGas(tx){
  const gas = await ethereum.request({
    method:"eth_estimateGas",
    params:[tx]
  });

  const price = await ethereum.request({method:"eth_gasPrice"});

  const cost = (parseInt(gas)*parseInt(price))/1e18;
  document.getElementById("gas").innerText =
    "Gas: "+cost.toFixed(6)+" ETH";
}

/* SWAP */
async function executeSwap(){
  await ethereum.request({
    method:"eth_sendTransaction",
    params:[{
      from:user,
      to:quoteData.to,
      data:quoteData.data,
      value:quoteData.value || "0x0"
    }]
  });

  addTx("Swap done");
}

/* ACTIVITY */
function addTx(t){
  const div=document.createElement("div");
  div.innerText=t;
  document.getElementById("txs").prepend(div);
}

/* NAV */
function show(id){
  document.querySelectorAll(".section").forEach(e=>e.style.display="none");
  document.getElementById(id).style.display="block";
}
show("swap");
