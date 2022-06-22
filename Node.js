class Node {
  // float x;
  // float y;
  // int r;
  // int c;
  // ArrayList<Node> neighbours;
  // ArrayList<Node> cutOff;
  // String state;
  // float h;
  // int g; // g(node) is the cost of the path from the start node to node
  // float f; // f(node) = g(node) + h(node)
  // Node prev;
  // //String col = "";
  static CLOSED = 0;
  constructor(x, y, r, c) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
    this.neighbours = [];
    this.cutOff = [];
    this.state = 'none';
    this.prev = null;
    this.minCostFromStart = Number.MAX_VALUE;
  }

  show() {
    if (this.state == 'start') {
      fill(0, 255, 0);
    } else if (this.state == 'rearrived') {
      fill(255, 140, 0);
    } else if (this.state == 'end') {
      fill(255, 0, 0);
    } else if (this.state == 'closed') {
      if (debug) {
        line(this.x - 10, this.y - 10, this.x + 10, this.y + 10);
        line(this.x - 10, this.y + 10, this.x + 10, this.y - 10);
      }
      fill(0, 0, 255);
    } else if (this.state == 'open') {
      noFill();
      ellipse(this.x, this.y, 20, 20);
      fill(128);
    } else {
      fill(255);
    }
    stroke(40);
    //strokeWeight(0.9);
    ellipse(this.x, this.y, 7);

    if (debug) {
      fill(0);
      textSize(10);
      text('g:' + this.g + ' h:' + int(this.h) + ' f:' + int(this.f), this.x + 10, this.y);
    }
  }

  toString() {
    return 'x:' + this.x + ' y:' + this.y + ' this.f:' + this.f;
  }
}
