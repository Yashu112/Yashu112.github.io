const logoCanvas = document.getElementById("logoCanvas");
const logoctx = logoCanvas.getContext("2d");

const size = 60;
logoCanvas.width = size;
logoCanvas.height = size;

const cx = size / 2;
const cy = size / 2;
const R = 22;  // outer radius
const r = 10;  // inner radius

let outer = [];
let inner = [];

// compute pentagon + inner star
for(let i=0;i<5;i++){
  let angle = -Math.PI/2 + i * 2*Math.PI/5;

  outer.push({
    x: cx + R * Math.cos(angle),
    y: cy + R * Math.sin(angle)
  });

  inner.push({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle)
  });
}

// draw
function drawLogo(){
  logoctx.clearRect(0,0,size,size);

  logoctx.strokeStyle = "#16a34a";
  logoctx.fillStyle = "#16a34a";
  logoctx.lineWidth = 1.5;

  // outer pentagon
  for(let i=0;i<5;i++){
    let j = (i+1)%5;
    drawEdge(outer[i], outer[j]);
  }

  // inner star (skip one)
  for(let i=0;i<5;i++){
    let j = (i+2)%5;
    drawEdge(inner[i], inner[j]);
  }

  // spokes
  for(let i=0;i<5;i++){
    drawEdge(outer[i], inner[i]);
  }

  // nodes
  [...outer, ...inner].forEach(p=>{
    logoctx.beginPath();
    logoctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
    logoctx.fill();
  });
}

function drawEdge(a,b){
  logoctx.beginPath();
  logoctx.moveTo(a.x,a.y);
  logoctx.lineTo(b.x,b.y);
  logoctx.stroke();
}

drawLogo();
