class Edge {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    //this.col = lerpColor(best, worst, sqrt( sq(x1-x2)+sq(y1-y2) ) / sqrt( sq(rowInterval)+sq(colInterval)) );
  }
  show() {
    //strokeWeight(map(weight, 0,maxWeight, 0,5));
    stroke(this.col);
    strokeWeight(2);
    line(this.x1, this.y1, this.x2, this.y2);
  }
}
