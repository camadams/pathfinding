// function windowResized() {
//   resizeCanvas(windowWidth, windowWidth);
// }
//////////// Global Variables ///////////////
var debug = false;

// ******************** PRAMAS TO PLAY WITH ***************
var nodesPerRow = 2;
var nodesPerCol = 2;
var maxWeight = 200; // maxWeight of a red branch -- really makes the algo search long for cheaper paths if this is high
var probabilityCutNeighbourConnection = 20; // sparsity of the graph
var probabilityMakeEdgeMaxWeight = 200; // sparsity of the graph
// ******************************************************

var nodes = []; // 2d array of node objects
var dir = [0, -1, 0, 1, 0];
var edges = []; // 2d array of edge objects
var edgesToRender = [];
var best;
var worst;
var nextFlag = 'start';

////////////// Global variables for A star

var generateShortestPaths = false;
var startNode;
var endNode;
var unvisited = []; // priority queuue of node objects
var visited = []; //Map<Node, vareger>

//////////// setup //////////////
// let button;
function changeBG() {
  isRunning = true;
}
function setGenerateShortestPathsToTrue() {
  generateShortestPaths = true;
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
      var y = r * rowInterval + rowInterval / 2 + random(-rowInterval / 2, rowInterval / 2);
      var x = c * colInterval + colInterval / 2 + random(-colInterval / 2, colInterval / 2);
      var node = new Node(x, y, r, c);
      nodes[r][c] = node;
      unvisited.push(node);
      visited[r * nodesPerRow + c] = Number.MAX_VALUE;
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
            var e = new Edge(nodes[r][c].x, nodes[r][c].y, nodes[rN][cN].x, nodes[rN][cN].y);
            var eLen = sqrt((e.x2 - e.x1) ** 2 + (e.y2 - e.y1) ** 2);
            e.weight = map(eLen, 0, rowInterval * sqrt(2), maxWeight, 0);
            e.col = lerpColor(best, worst, (e.weight / rowInterval) * sqrt(2));

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

function renderNodesEdgesAndFrameRate() {
  background(230);
  for (const e of edgesToRender) {
    e.show();
  }
  for (const nodeRow of nodes) {
    for (const n of nodeRow) {
      n.show();
    }
  }
  frameRateDiv.innerHTML = 'Frame Rate: ' + Math.round(frameRate());
}

function findNextNode() {
  var currentNode;
  var minF = Number.MAX_VALUE;
  var idx;
  for (var i = 0; i < unvisited.length; i++) {
    var nodeInFrontier = unvisited[i];
    if (nodeInFrontier.f < minF) {
      minF = nodeInFrontier.f;
      currentNode = nodeInFrontier;
      idx = i;
    }
  }
  return [currentNode, idx];
}

function handleNoNextNode(currentNode) {
  // Case where there is no path from start to end
  if (currentNode === undefined) {
    console.log('node popped off frontier is undefined.');
    text('NO PATH FROM START TO END \nPRESS RESTART', width / 2, height / 2);
    noLoop();
  }
}

function drawPathToCurrentNode(currentNode) {
  var temp = currentNode;
  while (temp !== undefined && temp != null) {
    if (temp.prev === undefined || temp.prev == null) break;
    strokeWeight(10);
    stroke(0, 100);
    line(temp.x, temp.y, temp.prev.x, temp.prev.y);
    temp = temp.prev;
  }
}

function checkIfAtGoalNode(currentNode) {
  if (currentNode.x == endNode.x && currentNode.y == endNode.y) {
    console.log('Reached the end node, and have the cheapest path! Press refresh to start again.');
    noLoop();
  }
}

function getMin(arr) {
  var result;
  var currentMinCostFromStart = Number.MAX_VALUE;
  var idx;
  for (var i = 0; i < arr.length; i++) {
    var node = arr[i];
    if (node.minCostFromStart < currentMinCostFromStart) {
      currentMinCostFromStart = node.minCostFromStart;
      result = node;
      idx = i;
    }
  }
  arr.splice(idx, 1);
  return result;
}
var iter = 0;
function generate() {
  while (unvisited.length !== 0 && iter++ < 500) {
    if (startNode === undefined) {
      alert('choose a start node');
      return;
    }
    current = getMin(unvisited);

    if (current === undefined) {
      return;
    }

    for (const nei of current.neighbours) {
      var costOfEdge = edges[nei.r * nodesPerRow + nei.c][current.r * nodesPerRow + current.c].weight;
      var costToNeighbourFromCurrent = current.minCostFromStart + costOfEdge;
      if (costToNeighbourFromCurrent < nei.minCostFromStart) {
        nei.minCostFromStart = costToNeighbourFromCurrent;
        nei.prev = current;
      }
    }

    visited.push(current);
  }
}

function draw() {
  if (generateShortestPaths == true) {
    generate();
    console.log('done');
    generateShortestPaths = false;
  }
  renderNodesEdgesAndFrameRate();

  if (endNode !== undefined || endNode != null) {
    console.log('endNode defined');
    console.log(endNode);
    drawPathToCurrentNode(endNode);
  }
  // if (isRunning) {
  //   var currentNode = findNextNode()[0];
  //   var idx = findNextNode()[1];
  //   handleNoNextNode(currentNode);
  //   drawPathToCurrentNode(currentNode);
  //   checkIfAtGoalNode(currentNode);

  //   frontier.splice(idx, 1);
  //   var y = currentNode.y;
  //   var x = currentNode.x;
  //   var r = currentNode.r;
  //   var c = currentNode.c;

  //   fill(225, 225, 10, 150);
  //   ellipse(x, y, 20, 20);

  //   // A star algorithm
  //   if (clsd[r * nodesPerRow + c] > currentNode.g) {
  //     clsd[r * nodesPerRow + c] = currentNode.g;
  //     for (const nei of currentNode.neighbours) {
  //       if (clsd[nei.r * nodesPerRow + nei.c] != Number.MAX_VALUE) {
  //         continue;
  //       }
  //       // nei.h = sqrt(sq(endNode.x - nei.x) + sq(endNode.y - nei.y));
  //       nei.h = 0;
  //       nei.g = currentNode.g + edges[nei.r * nodesPerRow + nei.c][r * nodesPerRow + c].weight;
  //       nei.f = nei.g + nei.h;
  //       nei.prev = currentNode;
  //       nei.state = 'open';
  //       frontier.push(nei);
  //     }
  //   }
  //   currentNode.state = Node.CLOSED;
  // }
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
          nextFlag = 'end';
          startNode.minCostFromStart = 0;
          unvisited.push(startNode);
        } else {
          n.state = 'end';
          nextFlag = 'start';
          endNode = n;
          startNode.h = int(sqrt(sq(endNode.x - startNode.x) + sq(endNode.y - startNode.y)));
          startNode.f = startNode.g + startNode.h;
        }
      }
    }
  }
}
