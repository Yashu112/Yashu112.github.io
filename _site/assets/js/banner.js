const bgCanvas = document.getElementById("graphCanvas");
const bgCtx = bgCanvas.getContext("2d");

bgCanvas.width = window.innerWidth;
bgCanvas.height = document.querySelector("header").offsetHeight;

let bgNodes = [];
const NODE_COUNT = 60;
const MAX_DIST = 130;

for(let i=0;i<NODE_COUNT;i++){
bgNodes.push({
 x:Math.random()*bgCanvas.width,
 y:Math.random()*bgCanvas.height,
 vx:(Math.random()-0.5)*0.6,
 vy:(Math.random()-0.5)*0.6
});
}

function drawBG(){
bgCtx.clearRect(0,0,bgCanvas.width,bgCanvas.height);

for(let i=0;i<bgNodes.length;i++){
let n1 = bgNodes[i];

n1.x += n1.vx;
n1.y += n1.vy;

if(n1.x<0||n1.x>bgCanvas.width) n1.vx*=-1;
if(n1.y<0||n1.y>bgCanvas.height) n1.vy*=-1;

for(let j=i+1;j<bgNodes.length;j++){
let n2 = bgNodes[j];

let dx = n1.x-n2.x;
let dy = n1.y-n2.y;
let dist = Math.sqrt(dx*dx+dy*dy);

if(dist<MAX_DIST){
bgCtx.strokeStyle = "rgba(22,163,74,"+(1-dist/MAX_DIST)*0.4+")";
bgCtx.lineWidth=1;
bgCtx.beginPath();
bgCtx.moveTo(n1.x,n1.y);
bgCtx.lineTo(n2.x,n2.y);
bgCtx.stroke();
}
}

bgCtx.fillStyle="#16a34a";
bgCtx.beginPath();
bgCtx.arc(n1.x,n1.y,2,0,Math.PI*2);
bgCtx.fill();
}

requestAnimationFrame(drawBG);
}

drawBG();

window.addEventListener("resize",()=>{
bgCanvas.width = window.innerWidth;
bgCanvas.height = document.querySelector("header").offsetHeight;
});
