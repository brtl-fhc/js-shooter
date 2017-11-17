  var SCREEN_X = 800;
  var SCREEN_Y = 480;

  var ZS = 500;
  
  function project(p) {
    var ret = [
      p[0] * ZS / p[2] + SCREEN_X / 2,
      p[1] * ZS / p[2] + SCREEN_Y / 2
    ];
    return ret;
  }

  function Grid (){
    this.points = [];
    this.offset = 0;
    this.rot_ang = 0;
    this.rot_sin = 0;
    this.rot_cos = 1;
    this.speed = 8;
    this.DIM = 25;
    this.angle_speed = 0.004;


    for (var i = -this.DIM / 2; i < this.DIM / 2; i++) {
      for (var j = 0; j < this.DIM; j++) {
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
        ctx.strokeStyle = "limegreen";
        ctx.lineWidth = 2;
        for (var i = 0; i < this.DIM; i++) {
          var sp1 = this.points[i * this.DIM + 1];
          var sp2 = this.points[(i + 1) * this.DIM - 1];
          var p1 = project(this.rotate([sp1[0], sp1[1], sp1[2] - this.offset]));
          var p2 = project(this.rotate([sp2[0], sp2[1], sp2[2] - this.offset]));
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.stroke();

          sp1 = this.points[i];
          sp2 = this.points[(this.DIM - 1) * this.DIM + i];
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
    
    this.rotateLeft = function (){ 
      this.rot_ang = Math.min(this.rot_ang + this.angle_speed, Math.PI/4); 
      this.updateTrig ();
    }
    this.rotateRight = function (){ 
      this.rot_ang = Math.max(this.rot_ang - this.angle_speed, -Math.PI/4);
      this.updateTrig ();
    }
    this.undoRotation = function (){
      this.rot_ang = this.rot_ang < 0 ? Math.min(this.rot_ang + this.angle_speed, 0) :
      this.rot_ang > 0 ? Math.max(this.rot_ang - this.angle_speed, 0) : 0;
      this.updateTrig ();
    }
    this.updateTrig = function () {
      this.rot_sin = Math.sin(this.rot_ang);
      this.rot_cos = Math.cos(this.rot_ang);
    }
  }

  function Player (){
    this.char_speed = 6;
    this.char_size_x = 40;
    this.char_size_y = 16;

    this.pos_x = SCREEN_X / 2 - this.char_size_x / 2;
    this.pos_y = SCREEN_Y * 0.30;
    
    this.draw = function (ctx) {
      var edge = 4;
      
      var p1 = project([this.pos_x - SCREEN_X / 2, this.pos_y - SCREEN_Y / 2, ZS]);
      var p4 = project([this.pos_x + this.char_size_x - SCREEN_X / 2, this.pos_y + this.char_size_y - SCREEN_Y / 2, ZS]);
      var p2 = [p4[0], p1[1], ZS];
      var p3 = [p1[0], p4[1], ZS];

      // work with projected points now:
      var pos_x = this.pos_x;
      var pos_y = this.pos_y;
      var char_size_x = p4[0]-p1[0];
      var char_size_y = p4[1]-p1[1];

      ctx.fillStyle = "yellow";
      ctx.fillRect(pos_x, pos_y, char_size_x, char_size_y);
      ctx.fillRect(pos_x - edge, pos_y + (char_size_y - edge) *0.6, char_size_x + 2 * edge, edge);
      
      ctx.fillStyle = "red";
      ctx.fillRect(pos_x + edge, pos_y + edge, char_size_x / 2 - 2 * edge, char_size_y - 2 * edge);
      ctx.fillRect(pos_x + char_size_x / 2 + edge, pos_y + edge, char_size_x / 2 - 2 * edge, char_size_y - 2 * edge);
    }
    
    this.moveLeft = function () { this.pos_x = Math.max(0, this.pos_x - this.char_speed); }
    this.moveRight = function () { this.pos_x = Math.min(SCREEN_X - this.char_size_x, this.pos_x + this.char_speed); }
    this.moveUp = function () { this.pos_y = Math.max(0, this.pos_y - this.char_speed); }
    this.moveDown = function () { this.pos_y = Math.min(SCREEN_Y - this.char_size_y, this.pos_y + this.char_speed); }
  }  

  function Hud (player) {
    var hud_z = 1000;
    
    this.draw = function (ctx) {
      var pos_x = player.pos_x;
      var pos_y = player.pos_y;
      var char_size_x = player.char_size_x;
      var char_size_y = player.char_size_y;
      // p1  p2
      // p3  p4
      // Project just p1-p4 diagonal and deduce p2 and p3
      var p1 = project([pos_x - SCREEN_X / 2, pos_y - SCREEN_Y / 2, hud_z]);
      var p4 = project([pos_x - SCREEN_X / 2 + char_size_x, pos_y + char_size_y - SCREEN_Y / 2, hud_z]);
      var p2 = [p4[0], p1[1], this.hud_z];
      var p3 = [p1[0], p4[1], this.hud_z];

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
  }

  function Bullets (player) {
    var bullet_max_depth = 10000;
    var bullets = [];
    
    this.draw = function draw (ctx) {
      for (var i = 0; i < bullets.length; i++) {
          var bullet = bullets[i];
          var p1 = project([bullet[0] - SCREEN_X / 2, bullet[1] - SCREEN_Y / 2, bullet[2]]);
          var brightness = parseInt(255 * (bullet_max_depth - bullet[2]) / bullet_max_depth, 10);
          ctx.fillStyle = "rgb(" + brightness + ", " + brightness + ", " + brightness + ")";
          ctx.fillRect(p1[0], p1[1], 3, 3);
      }
    }
    this.move =   function move () {
      for (var i = 0; i < bullets.length; i++) {
        bullets[i][2] += 50;
      }
      while (bullets.length > 0 && bullets[0][2] > bullet_max_depth) {
        bullets.shift();
      }
    }
    this.fire = function () {
      bullets.push([player.pos_x-1, player.pos_y + player.char_size_y / 2, ZS]);
      bullets.push([player.pos_x + player.char_size_x, player.pos_y + player.char_size_y / 2, ZS]);
    }
  }

  function Control () {
    var pressed= 0;
    
    var LEFT = 1;
    var UP = 2;
    var RIGHT = 4
    var DOWN = 8;
    var FIRE = 16;
    
    var getDir = function (code) {
      return code == 37 ? LEFT : code == 38 ? UP : code == 39 ? RIGHT : code == 40 ? DOWN : code == 32 ? FIRE : null;
    }
    var getOpposite = function (dir) {
      return dir == LEFT ? RIGHT : dir == UP ? DOWN : dir == RIGHT ? LEFT : dir == DOWN ? UP : null;
    }

    var onKeyDown = function(event) {
      var dir = getDir(event.keyCode);
      var opp = getOpposite(dir);
      pressed = (pressed | dir) & ~opp;
      //console.log(control.pressed);
    }
    var onKeyUp = function(event) {
      var dir = getDir(event.keyCode);
      pressed = pressed & ~dir;
      //console.log(control.pressed);
    }
    this.enable = function () {
      window.addEventListener('keyup', onKeyUp, false);
      window.addEventListener('keydown', onKeyDown, false);
    }
    this.isLeftPressed = function(){ return pressed & LEFT }
    this.isRightPressed = function(){ return pressed & RIGHT }
    this.isUpPressed = function(){ return pressed & UP }
    this.isDownPressed = function(){ return pressed & DOWN }
    this.isFirePressed = function(){ return pressed & FIRE }
    
  }

  function Game () {
    var grid = new Grid ();
    var player = new Player ();
    var hud = new Hud (player);
    var bullets = new Bullets (player);
    var imgBackground = new Image();
    var control = new Control ();

    imgBackground.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fsaturn.jpg?1510568809912";
     
    var draw = function () {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, SCREEN_X, SCREEN_Y);
        ctx.drawImage(imgBackground, 0, 376 / 2, 640, 376 / 2, -60, 0, SCREEN_X, 376 / 2);
        grid.drawGrid (ctx);
        hud.draw (ctx);
        bullets.draw (ctx);
        player.draw (ctx);
      }
    }
    
    var doControl = function() {
      if (control.isLeftPressed ()) {
        player.moveLeft ();
        grid.rotateLeft ();
      } else if (control.isRightPressed ()) {
        player.moveRight ();
        grid.rotateRight ();
      } else {
        grid.undoRotation ();
      }
      if (control.isUpPressed ()) {
        player.moveUp ();
      } else if (control.isDownPressed ()) {
        player.moveDown ();
      }
      if (control.isFirePressed ()) {
        bullets.fire ();
      }
    }
    
    var render = function () {
      doControl();
      grid.move ();
      bullets.move ();
      draw();
      window.requestAnimationFrame(render);
    }
        
    this.start = function () {
      control.enable ();
      window.requestAnimationFrame(render);  
    }
  }

  function start() {
    new Game().start();
  }

  start();
