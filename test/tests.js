var GridForce = window.GridForce;
var QUnit = window.QUnit;

var addToPaint = GridForce.Utils.addToPaint;

QUnit.test("insert into empty", function (assert) {
	var l = [];
	var expected = [{pos_z: 1}];  
  assert.deepEqual (addToPaint(l, {pos_z: 1}), expected);
});

QUnit.test("insert into end (1 element)", function (assert) {
	var l = [{pos_z: 1}];
	var expected = [{pos_z: 1}, {pos_z: 0}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 0}), expected);
});

QUnit.test("insert into start (1 element)", function (assert) {
	var l = [{pos_z: 1}];
	var expected = [{pos_z: 2}, {pos_z: 1}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 2}), expected);
});

QUnit.test("insert into start (2 elements)", function (assert) {
	var l = [{pos_z: 1}, {pos_z: 0}];
	var expected = [{pos_z: 2}, {pos_z: 1}, {pos_z: 0}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 2}), expected);
});

QUnit.test("insert into middle (2 elements)", function (assert) {
	var l = [{pos_z: 2}, {pos_z: 0}];
	var expected = [{pos_z: 2}, {pos_z: 1}, {pos_z: 0}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 1}), expected);
});

QUnit.test("insert into end (2 elements)", function (assert) {
	var l = [{pos_z: 2}, {pos_z: 1}];
	var expected = [{pos_z: 2}, {pos_z: 1}, {pos_z: 0}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 0}), expected);
});

QUnit.test("insert into middle (3 elements)", function (assert) {
	var l = [{pos_z: 2}, {pos_z: 1}, {pos_z: 0}];
	var expected = [{pos_z: 2}, {pos_z: 1}, {pos_z: 1}, {pos_z: 0}];;  
  assert.deepEqual (addToPaint(l, {pos_z: 1}), expected);
});

// Collisions:

var img1 = new Image (4,4);
var img2 = new Image (4,4);
var canvas1 = GridForce.Utils.convertImageToCanvas(img1);
var canvas2 = GridForce.Utils.convertImageToCanvas(img2);

var ctx1 = canvas1.getContext("2d");
var ctx2 = canvas2.getContext("2d");
ctx1.fillStyle = "black";
ctx2.fillStyle = "black";
ctx1.fillRect (1,1,2,2);  // black square with transparent border
ctx2.fillRect (1,1,2,2);


function collision (c1, x1, y1, c2, x2, y2, w, h){
	var data1=c1.getImageData (x1,y1,w,h).data;
	var data2=c2.getImageData (x2,y2,w,h).data;
  var half_w = Math.floor (w/2);
  var half_h = Math.floor (h/2);
  var points = [0, w-1, 
  	half_h*w+half_w, 
    (h-1)*w, h*w-1];
  for (var i=0; i<points.length; i++){
  	var base = points[i]*4;
    if (data1[base+3]!=0 && data2[base+3] != 0){  // both non-transparent
    	return true;
    }
  }
  return false;
}

QUnit.test("collisions", function (assert) {
	assert.equal(collision(ctx1,0,0,ctx2,0,0,4,4), true);
  assert.equal(collision(ctx1,0,0,ctx2,0,0,1,1), false);
  assert.equal(collision(ctx1,3,3,ctx2,3,3,1,1), false);
  assert.equal(collision(ctx1,2,2,ctx2,1,1,1,1), true);
});