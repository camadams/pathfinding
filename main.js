// function windowResized() {
//   resizeCanvas(windowWidth, windowWidth);
// }
//////////// Global Variables ///////////////
var debug = false;

// ******************** PRAMAS TO PLAY WITH ***************
var nodesPerRow = 15;
var nodesPerCol = 15;
var maxWeight = 200; // maxWeight of a red branch -- really makes the algo search long for cheaper paths if this is high
var probabilityCutNeighbourConnection = 0; // sparsity of the graph
var probabilityMakeEdgeMaxWeight = 100; // sparsity of the graph
// ******************************************************

var nodes = []; // 2d array of node objects
var dir = [0, -1, 0, 1, 0];
var edges = []; // 2d array of edge objects
var edgesToRender = [];
var best;
var worst;
var nextFlag = 'start';

////////////// Global variables for A star

var isRunning = false;
var startNode;
var endNode;
var frontier = []; // priority queuue of node objects
var clsd = []; //Map<Node, vareger>

//////////// setup //////////////
// let button;
function changeBG() {
  isRunning = true;
}
function setup() {
  ////////////////// Working with the DOM (not used for this OpenProcessing project) ///////////////////
  var canvas = createCanvas();
  canvas.parent('project-container');
  resizeCanvas(document.getElementById('project-container').clientWidth, document.getElementById('project-container').clientWidth);
  background(230);
  var rowInterval = width / nodesPerRow; // height divided by rowvarerval = #rows of nodes
  var colInterval = height / nodesPerCol; // width divided by colvarerval = #cols of nodes
  /////////// Generate 2d array of nodes with x,y coords ///////////
  for (var r = 0; r < nodesPerRow; r++) {
    nodes[r] = [];
    for (var c = 0; c < nodesPerCol; c++) {
      var y = r * rowInterval + rowInterval / 2; // + random(-rowInterval / 3, rowInterval / 3);
      var x = c * colInterval + colInterval / 2; //+ random(-colInterval / 3, colInterval / 3);
      nodes[r][c] = new Node(x, y, r, c);
      clsd[r * nodesPerRow + c] = 1000000;
    }
  }
  best = color(0, 255, 0);
  worst = color(255, 0, 0);
  ///////// Generate node neighbours and edges /////////////

  for (var r = 0; r < nodesPerRow * nodesPerCol; r++) {
    edges[r] = [];
  }
  for (var r = 0; r < nodesPerRow; r++) {
    for (var c = 0; c < nodesPerCol; c++) {
      for (var i = 0; i < 4; i++) {
        var rN = r + dir[i]; // rowNeighbourIndex
        var cN = c + dir[i + 1]; // // colNeighbourIndex
        // if new direction is invalid, continue
        if (rN < 0 || rN >= nodesPerRow || cN < 0 || cN >= nodesPerCol) continue;
        // if new directions' neighbours contain me (r,c)
        if (nodes[rN][cN].neighbours.includes(nodes[r][c])) {
          // add new direction to my neighbours and continue
          nodes[r][c].neighbours.push(nodes[rN][cN]);
          continue;
          // if not, see if new direction neighbours cut me off previously
        } else if (nodes[rN][cN].cutOff.includes(nodes[r][c])) {
          nodes[r][c].cutOff.push(nodes[rN][cN]); // just in case
          continue;
        } else {
          if (random(100) < probabilityCutNeighbourConnection) {
            nodes[r][c].cutOff.push(nodes[rN][cN]);
          } else {
            nodes[r][c].neighbours.push(nodes[rN][cN]);
            var e = new Edge(nodes[r][c].x, nodes[r][c].y, nodes[rN][cN].x, nodes[rN][cN].y, random(100) < probabilityMakeEdgeMaxWeight ? 1 : maxWeight);
            edges[r * nodesPerRow + c][rN * nodesPerRow + cN] = e;
            edges[rN * nodesPerRow + cN][r * nodesPerRow + c] = e;
            // NOTE: Optimization1 -- adding an array for rendering edges.
            // Looping through the 'edges' map/array is (R*C)^2
            // Looping through edges to render will be ~ R*C s
            edgesToRender.push(e);
          }
        }
      }
    }
  }
  // frameRate(10);
}

function draw() {
  // HTML dom, not for this project
  background(230);
  frameRateDiv.innerHTML = 'Frame Rate: ' + Math.round(frameRate());
  // Optimization1
  for (const e of edgesToRender) {
    e.show();
  }

  for (const nodeRow of nodes) {
    for (const n of nodeRow) {
      n.show();
    }
  }
  if (isRunning) {
    // Finding the min
    // TODO: implement priority queue for optimization
    var node;
    var minF = 100000;
    var idx;
    for (var i = 0; i < frontier.length; i++) {
      var n = frontier[i];
      if (n.f < minF) {
        minF = n.f;
        node = n;
        idx = i;
      }
    }
    // node = frontier.shift();
    // idx = 0;
    // Case where there is no path from start to end
    if (node === undefined) {
      console.log('node popped off frontier is undefined.');
      text('NO PATH FROM START TO END \nPRESS RESTART', width / 2, height / 2);
      noLoop();
    }
    node.state = 'closed';
    frontier.splice(idx, 1);
    // Draw the current path
    var temp = node;
    while (temp !== undefined && temp != null) {
      if (temp.prev === undefined || temp.prev == null) break;
      strokeWeight(10);
      stroke(0, 100);
      line(temp.x, temp.y, temp.prev.x, temp.prev.y);
      temp = temp.prev;
    }
    var y = node.y;
    var x = node.x;
    var r = node.r;
    var c = node.c;
    fill(225, 225, 10, 150);
    ellipse(x, y, 20, 20);
    // If we reach the end, stop
    if (x == endNode.x && y == endNode.y) {
      console.log('Reached the end node, and have the cheapest path! Press refresh to start again.');
      noLoop();
    }
    // A star algorithm
    if (clsd[r * nodesPerRow + c] > node.g) {
      clsd[r * nodesPerRow + c] = node.g;
      for (const nei of node.neighbours) {
        var nR = nei.r;
        var nC = nei.c;
        if (clsd[nR * nodesPerRow + nC] != 1000000) {
          continue;
        }
        nei.h = sqrt(sq(endNode.x - nei.x) + sq(endNode.y - nei.y));
        //    nei.h = 0;
        nei.g = node.g + edges[nR * nodesPerRow + nC][r * nodesPerRow + c].weight;
        nei.f = nei.g + nei.h;
        nei.prev = node;
        nei.state = 'open';
        frontier.push(nei);
      }
    }
  }
}

function keyPressed() {
  if (key == 'd') {
    debug = !debug;
  } else if (key == 'r') {
    refresh = true;
  } else if (key == 'g') {
    // frameRate(1)
    isRunning = true;
  }
}

function mouseClicked() {
  for (const nodeRow of nodes) {
    for (const n of nodeRow) {
      if (dist(mouseX, mouseY, n.x, n.y) < 10) {
        if (n.state != 'none') {
          n.state = 'none';
        } else if (nextFlag == 'start') {
          n.state = 'start';
          startNode = n;
          startNode.g = 0;
          startNode.prev = null;
          nextFlag = 'end';
        } else {
          n.state = 'end';
          nextFlag = 'start';
          endNode = n;
          startNode.h = int(sqrt(sq(endNode.x - startNode.x) + sq(endNode.y - startNode.y)));
          startNode.f = startNode.g + startNode.h;
          frontier.push(startNode);
        }
      }
    }
  }
}
