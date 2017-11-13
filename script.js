  var SCREEN_X = 640;
  var SCREEN_Y = 480;
  var MAX_DEPTH = 1000;

  var DIM = 25;

  var char_speed = 4;
  var char_size_x = 24;
  var char_size_y = 10;

  var pos_x = SCREEN_X / 2 - char_size_x / 2;
  var pos_y = SCREEN_Y * 0.30;

  var LEFT = 1;
  var UP = 2;
  var RIGHT = 4
  var DOWN = 8;
  var FIRE = 16;

  var bullets = [];
  var bullet_max_depth = 10000;

  var ZS = 500;

  function Grid (){
    this.points = [];
    this.offset = 0;
    this.rot_ang = 0;
    this.rot_sin = 0;
    this.rot_cos = 1;
    this.speed = 8;

    for (var i = -DIM / 2; i < DIM / 2; i++) {
      for (var j = 0; j < DIM; j++) {
        var x = i * 120;
        var y = 100;
        var z = j * 120;
        this.points.push([x, y, z]);
      }
    }
    
    this.rotate = function (p) {
      return [
        p[0] * this.rot_cos - p[1] * this.rot_sin,
        p[0] * this.rot_sin + p[1] * this.rot_cos,
        p[2]
      ];      
    }
    
    this.drawGrid = function (ctx){
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        for (var i = 0; i < DIM; i++) {
          var sp1 = this.points[i * DIM + 1];
          var sp2 = this.points[(i + 1) * DIM - 1];
          var p1 = project(this.rotate([sp1[0], sp1[1], sp1[2] - this.offset]));
          var p2 = project(this.rotate([sp2[0], sp2[1], sp2[2] - this.offset]));
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.stroke();

          sp1 = this.points[i];
          sp2 = this.points[(DIM - 1) * DIM + i];
          p1 = project(sp1);
          p2 = project(sp2);
          var p1 = project(this.rotate([sp1[0], sp1[1], sp1[2] - this.offset]));
          var p2 = project(this.rotate([sp2[0], sp2[1], sp2[2] - this.offset]));

          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.stroke();
        }
    }
    
    this.move = function () {
        this.offset = (this.offset + this.speed) % Math.abs(this.points[1][2] - this.points[2][2]);
    }
  }

  var grid = new Grid ();

  function project(p) {
    var ret = [
      p[0] * ZS / p[2] + SCREEN_X / 2,
      p[1] * ZS / p[2] + SCREEN_Y / 2
    ];
    return ret;
  }

  function drawChar(ctx) {
    var edge = 3;

    ctx.fillStyle = "yellow";
    ctx.fillRect(pos_x, pos_y, char_size_x, char_size_y);
    ctx.fillRect(pos_x - edge, pos_y + (char_size_y - edge) / 2, char_size_x + 2 * edge, edge);

    ctx.fillStyle = "red";
    ctx.fillRect(pos_x + edge, pos_y + edge, char_size_x / 2 - 2 * edge, char_size_y - 2 * edge);
    ctx.fillRect(pos_x + char_size_x / 2 + edge, pos_y + edge, char_size_x / 2 - 2 * edge, char_size_y - 2 * edge);
  }

  function drawHud(ctx) {
    var p1 = project([pos_x - SCREEN_X / 2, pos_y - SCREEN_Y / 2, 1000]);
    var p2 = project([pos_x - SCREEN_X / 2 + char_size_x, pos_y - SCREEN_Y / 2, 1000]);

    var p3 = project([pos_x - SCREEN_X / 2, pos_y + char_size_y - SCREEN_Y / 2, 1000]);
    var p4 = project([pos_x - SCREEN_X / 2 + char_size_x, pos_y + char_size_y - SCREEN_Y / 2, 1000]);

    var hud_size = 3;
    ctx.strokeStyle = "yellow";
    ctx.beginPath();

    ctx.moveTo(p1[0], p1[1] + hud_size);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p1[0] + hud_size, p1[1]);

    ctx.moveTo(p2[0] - hud_size, p2[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.lineTo(p2[0], p2[1] + hud_size);

    ctx.moveTo(p3[0], p3[1] - hud_size);
    ctx.lineTo(p3[0], p3[1]);
    ctx.lineTo(p3[0] + hud_size, p3[1]);

    ctx.moveTo(p4[0], p4[1] - hud_size);
    ctx.lineTo(p4[0], p4[1]);
    ctx.lineTo(p4[0] - hud_size, p4[1]);

    ctx.stroke();
  }

  function drawBullets(ctx) {
    for (var i = 0; i < bullets.length; i++) {
      var bullet = bullets[i];
      var p1 = project([bullet[0] - SCREEN_X / 2, bullet[1] - SCREEN_Y / 2, bullet[2]]);
      var brightness = parseInt(255 * (bullet_max_depth - bullet[2]) / bullet_max_depth, 10);
      ctx.fillStyle = "rgb(" + brightness + ", " + brightness + ", " + brightness + ")";
      ctx.fillRect(p1[0], p1[1], 2, 2);
    }
  }

  function draw() {
    var canvas = document.getElementById("canvas");
    if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, 0, SCREEN_X, SCREEN_Y);
      ctx.drawImage(img, 0, 376 / 2, 640, 376 / 2, -60, 0, SCREEN_X, 376 / 2);
      grid.drawGrid (ctx);
      drawHud(ctx);
      drawBullets(ctx);
      drawChar(ctx);
    }
  }


  function moveBullets() {
    for (var i = 0; i < bullets.length; i++) {
      bullets[i][2] += 50;
    }
    while (bullets.length > 0 && bullets[0][2] > bullet_max_depth) {
      bullets.shift();
    }
  }

  function render() {
    readKeys();
    grid.move ();
    moveBullets();
    draw();
    window.requestAnimationFrame(render);
  }


  function start() {
    window.requestAnimationFrame(render);
  }


  function readKeys() {
    var angle_speed = 0.002;
    if (control.pressed & LEFT) {
      pos_x = Math.max(0, pos_x - char_speed);
      grid.rot_ang = Math.min(grid.rot_ang + angle_speed, Math.PI/2);

    } else if (control.pressed & RIGHT) {
      pos_x = Math.min(SCREEN_X - char_size_x, pos_x + char_speed);
      grid.rot_ang = Math.max(grid.rot_ang - angle_speed, -Math.PI/2);
    } else {
      grid.rot_ang = grid.rot_ang < 0 ? Math.min(grid.rot_ang + angle_speed, 0) :
      grid.rot_ang > 0 ? Math.max(grid.rot_ang - angle_speed, 0) : 0;
    }
    grid.rot_sin = Math.sin(grid.rot_ang);
    grid.rot_cos = Math.cos(grid.rot_ang);
    if (control.pressed & UP) {
      pos_y = Math.max(0, pos_y - char_speed);
    } else if (control.pressed & DOWN) {
      pos_y = Math.min(SCREEN_Y - char_size_y, pos_y + char_speed);
    }
    if (control.pressed & FIRE) {
      bullets.push([pos_x-1, pos_y + char_size_y / 2, ZS]);
      bullets.push([pos_x + char_size_x, pos_y + char_size_y / 2, ZS]);
    }
  }


  var control = {
    pressed: 0,
    onKeyDown: function(event) {
      var dir = this.getDir(event.keyCode);
      var opp = this.getOpposite(dir);
      control.pressed = (control.pressed | dir) & ~opp;
      //console.log(control.pressed);
    },
    onKeyUp: function(event) {
      var dir = this.getDir(event.keyCode);
      control.pressed = control.pressed & ~dir;
      //console.log(control.pressed);
    },
    getDir: function (code) {
      return code == 37 ? LEFT : code == 38 ? UP : code == 39 ? RIGHT : code == 40 ? DOWN : code == 32 ? FIRE : null;
    },
    getOpposite: function (dir) {
      return dir == LEFT ? RIGHT : dir == UP ? DOWN : dir == RIGHT ? LEFT : dir == DOWN ? UP : null;
    }
  }


  window.addEventListener('keyup',
    function(event) {
      control.onKeyUp(event);
    }, false);

  window.addEventListener('keydown',
    function(event) {
      control.onKeyDown(event);
    }, false);

  var img = new Image();
  img.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fsaturn.jpg?1510568809912";

  start();
