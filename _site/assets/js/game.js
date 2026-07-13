
/* ============================================================
   Tree Coloring Explorer
   Original design and implementation: Yash Chawda
   Restyled for CAT Lab website: May 2026
   ============================================================ */

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

// Colour palettes: index 0 = uncoloured, 1–4 = player colours.
// Light mode uses pastels; dark mode uses saturated fills for visibility.
const lightColors = ["#f0f0f0", "#ffadad", "#caffbf", "#a0c4ff", "#f9e1a8"];
const darkColors  = ["#555555", "#ff5555", "#44bb66", "#4499ff", "#ffcc33"];

let colorCount = 4; // number of player colours currently active
let activeColors = lightColors; // updated at the start of each draw()

let nodes = {}, edges = [], tree = null;
let currentType = "rand3";

// Builder state
let builderMode = false, selectedNode = null, nextId = 0;
let draggingNode = null;

// View transform (zoom + pan)
let viewScale   = 1.0;
let viewOffsetX = 0;
let viewOffsetY = 0;
let isPanning   = false;
let panStart    = { sx: 0, sy: 0, ox: 0, oy: 0 };

const MIN_SCALE = 0.15;
const MAX_SCALE = 6.0;

function resetView() {
    viewScale = 1.0; viewOffsetX = 0; viewOffsetY = 0;
    draw();
}

// ---------- DARK MODE ----------

function isDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Re-draw when OS colour scheme toggles
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

// ---------- CANVAS SIZING ----------

function resizeCanvas() {
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    if (builderMode) {
        draw(); // keep builder positions as-is; user can use Done to refit
    } else {
        initTree(currentType);
    }
});

// ---------- TREE GENERATORS ----------

function buildRandomTree(maxDepth) {
    let id = 0;
    function make(depth, force = false) {
        let node = { id: id++, children: [] };
        if (depth < maxDepth) {
            let stop = !force && Math.random() < 0.2;
            if (!stop) {
                let r = Math.random(), c;
                if (r < 0.4) c = 2;
                else if (r < 0.7) c = 3;
                else if (r < 0.9) c = 4;
                else c = 5 + Math.floor(Math.random() * 2);
                for (let i = 0; i < c; i++) node.children.push(make(depth + 1));
            }
        }
        return node;
    }
    return make(1, true);
}

function buildBinaryTree(d) {
    let id = 0;
    function make(depth) {
        let n = { id: id++, children: [] };
        if (depth < d) {
            n.children.push(make(depth + 1));
            n.children.push(make(depth + 1));
        }
        return n;
    }
    return make(1);
}

function buildKaryTree(k, d) {
    let id = 0;
    function make(depth) {
        let n = { id: id++, children: [] };
        if (depth < d) {
            for (let i = 0; i < k; i++) n.children.push(make(depth + 1));
        }
        return n;
    }
    return make(1);
}

// ---------- LAYOUT ----------

let levelGap = 90;
let nextX = 0;

function tidyLayout(node, depth = 0) {
    if (depth === 0) nextX = 0;
    let children = node.children || [];
    if (children.length === 0) {
        nodes[node.id].x = nextX;
        nodes[node.id].y = depth * levelGap;
        nextX += 60;
    } else {
        let startX = nextX;
        children.forEach(c => tidyLayout(c, depth + 1));
        let endX = nextX - 60;
        nodes[node.id].x = (startX + endX) / 2;
        nodes[node.id].y = depth * levelGap;
    }
}

function fitTreeToCanvas() {
    let ids = Object.keys(nodes);
    if (ids.length === 1) {
        nodes[ids[0]].x = canvas.width / 2;
        nodes[ids[0]].y = canvas.height / 2;
        return;
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (let id in nodes) {
        let n = nodes[id];
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y);
    }
    let treeWidth  = Math.max(maxX - minX, 1);
    let treeHeight = Math.max(maxY - minY, 1);
    let padding = 40;
    let scaleX = (canvas.width  - 2 * padding) / treeWidth;
    let scaleY = (canvas.height - 2 * padding) / treeHeight;
    let scale = Math.min(scaleX, scaleY); // fills canvas; upscales small trees too
    for (let id in nodes) {
        nodes[id].x = (nodes[id].x - minX) * scale;
        nodes[id].y = (nodes[id].y - minY) * scale;
    }
    let offsetX = (canvas.width  - treeWidth  * scale) / 2;
    let offsetY = (canvas.height - treeHeight * scale) / 2;
    for (let id in nodes) {
        nodes[id].x += offsetX;
        nodes[id].y += offsetY;
    }
}

// ---------- INIT ----------

function initTree(type) {
    currentType = type;
    builderMode = false;
    selectedNode = null;

    if (type === "rand3") tree = buildRandomTree(4);
    else if (type === "rand4") tree = buildRandomTree(5);
    else if (type === "binary4") tree = buildBinaryTree(4);
    else if (type === "ternary4") tree = buildKaryTree(3, 4);
    else return;

    nodes = {};
    edges = [];

    function init(n) {
        nodes[n.id] = { x: 0, y: 0, color: 0 };
        (n.children || []).forEach(c => {
            edges.push([n.id, c.id]);
            init(c);
        });
    }

    init(tree);
    tidyLayout(tree);
    fitTreeToCanvas();
    viewScale = 1.0; viewOffsetX = 0; viewOffsetY = 0;
    draw();
    toggleRandomBtn();
}

// ---------- DRAW ----------

function draw() {
    let dark = isDark();
    activeColors = (dark ? darkColors : lightColors).slice(0, colorCount + 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(viewScale, 0, 0, viewScale, viewOffsetX, viewOffsetY);

    // Edges
    ctx.strokeStyle = dark ? "rgba(180, 180, 200, 0.55)" : "rgba(80, 80, 100, 0.7)";
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    edges.forEach(([u, v]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[u].x, nodes[u].y);
        ctx.lineTo(nodes[v].x, nodes[v].y);
        ctx.stroke();
    });

    // Nodes
    for (let id in nodes) {
        let n = nodes[id];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 12, 0, 2 * Math.PI);
        ctx.fillStyle = activeColors[n.color % activeColors.length];
        ctx.fill();
        ctx.strokeStyle = (id == selectedNode)
            ? (dark ? "#eeeeee" : "#111111")
            : (dark ? "rgba(200, 200, 220, 0.85)" : "rgba(50, 50, 70, 0.9)");
        ctx.lineWidth = (id == selectedNode) ? 3 : 1.5;
        ctx.stroke();

        // Label: dark text on pastels (light mode), white on saturated fills (dark mode)
        ctx.fillStyle = dark ? "#eeeeee" : "#1a1a1a";
        ctx.font = "11px 'Roboto Mono', monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(+id + 1, n.x, n.y);
    }

    ctx.restore();
}

// ---------- INTERACTION ----------

canvas.onmousedown = function (e) {
    let { x, y } = getMouse(e);
    for (let id in nodes) {
        let n = nodes[id];
        if (dist(n, x, y) < 14) {
            if (builderMode) {
                selectedNode = parseInt(id);
                draggingNode = id;
            } else {
                n.color = (n.color + 1) % activeColors.length;
            }
            draw();
            return;
        }
    }
    // Clicked empty canvas: start pan
    let r = canvas.getBoundingClientRect();
    isPanning = true;
    panStart = { sx: e.clientX - r.left, sy: e.clientY - r.top, ox: viewOffsetX, oy: viewOffsetY };
    canvas.style.cursor = 'grabbing';
};

canvas.onmousemove = function (e) {
    if (builderMode && draggingNode !== null) {
        let { x, y } = getMouse(e);
        nodes[draggingNode].x = x;
        nodes[draggingNode].y = y;
        draw();
        return;
    }
    if (isPanning) {
        let r = canvas.getBoundingClientRect();
        viewOffsetX = panStart.ox + (e.clientX - r.left - panStart.sx);
        viewOffsetY = panStart.oy + (e.clientY - r.top  - panStart.sy);
        draw();
        return;
    }
    // Update cursor to hint that vertices are clickable
    let { x, y } = getMouse(e);
    let overNode = Object.keys(nodes).some(id => dist(nodes[id], x, y) < 14);
    canvas.style.cursor = overNode ? 'pointer' : 'grab';
};

canvas.onmouseup = function () {
    draggingNode = null;
    if (isPanning) { isPanning = false; canvas.style.cursor = 'grab'; }
};

// ---------- HELPERS ----------

function getMouse(e) {
    let r = canvas.getBoundingClientRect();
    let sx = e.clientX - r.left, sy = e.clientY - r.top;
    // Convert from screen space to world space
    return { x: (sx - viewOffsetX) / viewScale, y: (sy - viewOffsetY) / viewScale };
}

function dist(n, x, y) {
    let dx = n.x - x, dy = n.y - y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ---------- BUILDER ----------

function startBuilder() {
    builderMode = true;
    nodes = { 0: { x: Math.round(canvas.width / 2), y: 60, color: 0 } };
    edges = [];
    selectedNode = 0;
    nextId = 1;
    document.getElementById("editBtn").style.display = "none";
    draw();
}

function addChild() {
    if (selectedNode == null) return;
    let id = nextId++;
    nodes[id] = { x: nodes[selectedNode].x + 60, y: nodes[selectedNode].y + 80, color: 0 };
    edges.push([selectedNode, id]);
    draw();
}

function deleteNode() {
    if (selectedNode === 0 || selectedNode == null) return;
    function remove(id) {
        // Collect children before edges are filtered
        let children = edges
            .filter(([u, v]) => u == id)
            .map(([u, v]) => v);
        edges = edges.filter(([u, v]) => u !== id && v !== id);
        delete nodes[id];
        children.forEach(childId => remove(childId));
    }
    remove(selectedNode);
    selectedNode = null;
    draw();
}

function finishBuilder() {
    builderMode = false;
    selectedNode = null;
    fitTreeToCanvas();
    draw();
    document.getElementById("builderControls").style.display = "none";
    document.getElementById("editBtn").style.display = "inline-block";
}

function resumeBuilder() {
    builderMode = true;
    selectedNode = null;
    document.getElementById("builderControls").style.display = "flex";
    document.getElementById("editBtn").style.display = "none";
    draw();
}

// ---------- ZOOM ----------

canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    let r  = canvas.getBoundingClientRect();
    let sx = e.clientX - r.left, sy = e.clientY - r.top;
    // World point under the cursor stays fixed after zoom
    let wx = (sx - viewOffsetX) / viewScale;
    let wy = (sy - viewOffsetY) / viewScale;
    let factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
    viewOffsetX = sx - wx * viewScale;
    viewOffsetY = sy - wy * viewScale;
    draw();
}, { passive: false });

function zoomBy(factor) {
    let cx = canvas.width / 2, cy = canvas.height / 2;
    let wx = (cx - viewOffsetX) / viewScale;
    let wy = (cy - viewOffsetY) / viewScale;
    viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
    viewOffsetX = cx - wx * viewScale;
    viewOffsetY = cy - wy * viewScale;
    draw();
}

// ---------- UI BINDINGS ----------

document.getElementById("builderControls").style.display = "none";
document.getElementById("editBtn").style.display = "none";
document.getElementById("editBtn").onclick = resumeBuilder;

document.getElementById("graphSelect").onchange = function () {
    let val = this.value;
    let builderUI = document.getElementById("builderControls");
    if (val === "custom") {
        builderUI.style.display = "flex";
        document.getElementById("randomBtn").style.display = "none";
        startBuilder();
    } else {
        builderUI.style.display = "none";
        document.getElementById("editBtn").style.display = "none";
        initTree(val);
    }
};

document.getElementById("colorSelect").onchange = function () {
    colorCount = parseInt(this.value);
    draw();
};

function toggleRandomBtn() {
    let btn = document.getElementById("randomBtn");
    btn.style.display = (currentType === "rand3" || currentType === "rand4") ? "inline-block" : "none";
}

function clearAllColors() {
    for (let id in nodes) nodes[id].color = 0;
    draw();
}

document.getElementById("clearColorsBtn").onclick = clearAllColors;

document.getElementById("randomBtn").onclick = function () {
    initTree(currentType);
};

// ---------- START ----------

resizeCanvas();
initTree("rand3");
