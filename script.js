  var SCREEN_X = 800;
  var SCREEN_Y = 400;

  var ZS = 500;
  
  
  function project(p) {
    var ret = [
      p[0] * ZS / p[2] + SCREEN_X / 2,
      p[1] * ZS / p[2] + SCREEN_Y / 2
    ];
    return ret;
  }

  function ImageCache (){
    this.images = {};
    var loaded = [];
    var canvases = {};
    var masks = {};
    
    var assets = [
      ["player", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fneon.png?1511798071897", true],
      ["hud", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fhud.png?1512578906463", false],
      ["bullet", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fbullet.png?1512510809435", true],
      ["enemy", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fenemy.png?1512390585535", true],
      ["explosion", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fexplosion_spritesheet_for_games_by_gintasdx-d5r28q5.png?1511453650577", false],
    ]
    
    var convertImageToCanvas = function (image) {
      var canvas = document.createElement("canvas");
      canvas.setAttribute ("origin-clean", false);
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return canvas;
    }

    var calculateMask = function (name, img){
      var image = img;
      var canvas = convertImageToCanvas (image);
      var data = canvas.getContext ("2d").getImageData (0,0,canvas.width, canvas.height).data;
      var mask = []
      for (var i=0; i<data.length/4; i++){
        mask.push(data[i*4+3]);
      }
      masks[name]=mask;
    }
    this.getMaskPixel = function (name, abs_x, abs_y){
      var image = this.images[name];
      return masks[name][(image.width*abs_y)+abs_x];
    }
    this.load = function (name, url, solid){
      var img = new Image ();
      img.crossOrigin = "Anonymous";
      this.images[name] = img;
      img.src = url;
      img.onload = function () { 
        loaded.push(name);
        if (solid) {
          calculateMask(name, img);
        }
      }
    }
    
    this.done = function () { return (loaded.length == assets.length); }
        
    for (var i=0; i<assets.length; i++) { 
      this.load (assets[i][0], assets[i][1], assets[i][2], assets[i][3]);
    }
  }
  
  var imageCache = new ImageCache ();

  function Sprite (imgName, w, h){
    this.image = imgName;
    this.width = w;
    this.height = h;
    this.canvas = null;
    this.seq = [0];
    this.state = 0;
    
    this.next = function () {
      this.state = (this.state + 1) % this.seq.length;    
    }
    this.draw = function(ctx, x, y, z) {
      var offsetX = this.seq[this.state]*this.width;
      var offsetY = 0;
      
      var p1 = project([x - SCREEN_X / 2 , y - SCREEN_Y / 2 , z]);
      var p4 = project([x - SCREEN_X / 2  + this.width, y + this.height - SCREEN_Y / 2 , z]);

      ctx.drawImage(imageCache.images[this.image], offsetX, offsetY, this.width, this.height, p1[0], p1[1], p4[0]-p1[0], p4[1]-p1[1]);
    }
    this.drawCentered = function(ctx, x, y, z) {
      var offsetX = this.seq[this.state]*this.width;
      var offsetY = 0;
      
      var p1 = project([x - SCREEN_X / 2 - this.width/2, y - SCREEN_Y / 2 - this.height/2, z]);
      var p4 = project([x - SCREEN_X / 2  + this.width/2, y - SCREEN_Y / 2 + this.height/2, z]);

      ctx.drawImage(imageCache.images[this.image], offsetX, offsetY, this.width, this.height, p1[0], p1[1], p4[0]-p1[0], p4[1]-p1[1]);
    }
    this.getMaskPixel = function (x, y) {
      var offsetX = this.seq[this.state]*this.width;
      var offsetY = 0;
      return imageCache.getMaskPixel (this.image, x, y);
    }
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
    
    this.drawGrid = function (ctx, style){
        ctx.strokeStyle = style;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var i = 0; i < this.DIM; i++) {
          var sp1 = this.points[i * this.DIM + 1];
          var sp2 = this.points[(i + 1) * this.DIM - 1];
          var p1 = project(this.rotate([sp1[0], sp1[1], sp1[2] - this.offset]));
          var p2 = project(this.rotate([sp2[0], sp2[1], sp2[2] - this.offset]));
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);

          sp1 = this.points[i];
          sp2 = this.points[(this.DIM - 1) * this.DIM + i];
          var p1 = project(this.rotate([sp1[0], sp1[1], sp1[2] - this.offset]));
          var p2 = project(this.rotate([sp2[0], sp2[1], sp2[2] - this.offset]));

          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
        }
        ctx.stroke();
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
    var char_speed = 8;
    this.char_size_x = 32;
    this.char_size_y = 16;

    this.pos_x = SCREEN_X / 2 - this.char_size_x / 2;
    this.pos_y = SCREEN_Y * 0.30;
    this.pos_z = ZS;
    
    var spritePlayer = new Sprite ("player", this.char_size_x, this.char_size_y);
    spritePlayer.seq = [0,1];
    
    var timestamp=0;
    var animMs = 250;
    
    this.draw = function (ctx, ts) {
      if (ts - timestamp >= animMs){
        spritePlayer.next(); 
        timestamp = ts;
      }
      spritePlayer.draw (ctx, this.pos_x, this.pos_y, this.pos_z);
    }
    
    var calcSpeed = function (speed) {
      return !speed? char_speed : Math.floor(Math.min (speed, char_speed));
    }
    this.moveLeft = function (speed) { this.pos_x = Math.max(0, this.pos_x - calcSpeed(speed)); }
    this.moveRight = function (speed) { this.pos_x = Math.min(SCREEN_X - this.char_size_x, this.pos_x + calcSpeed(speed)); }
    this.moveUp = function (speed) { this.pos_y = Math.max(0, this.pos_y - calcSpeed(speed)); }
    this.moveDown = function (speed) { this.pos_y = Math.min(SCREEN_Y - this.char_size_y, this.pos_y + calcSpeed(speed)); }
  }  

  function Hud (player) {
    this.pos_z = 1000;
    
    var char_size_x = player.char_size_x;
    var char_size_y = player.char_size_y;
    
    this.sprite = new Sprite ("hud", char_size_x, char_size_y);
    this.sprite.seq = [0,1];
    
    this.setLocked = function (locked) { this.sprite.state = locked? 1 : 0; }
    this.draw = function (ctx) {
      var pos_x = player.pos_x;
      var pos_y = player.pos_y;
      
      this.sprite.draw (ctx, pos_x, pos_y, this.pos_z);
    }
  }

  function Bullets (player) {
    var bullet_max_depth = 10000;
    this.bullet_speed = 50;
    this.bullet_size = 3;
    this.bullets = [];  // reverse sorted by Z
    
    this.sprite = new Sprite ("bullet", this.bullet_size, this.bullet_size);
    
    this.draw = function draw (ctx, i) {
      var bullet = this.bullets[i];
      var p1 = project([bullet[0] - SCREEN_X / 2, bullet[1] - SCREEN_Y / 2, bullet[2]]);
      var brightness = parseInt(255 * (bullet_max_depth - bullet[2]) / bullet_max_depth, 10);
      ctx.fillStyle = "rgb(" + brightness + ", " + brightness + ", " + brightness + ")";
      ctx.fillRect(p1[0], p1[1], this.bullet_size, this.bullet_size);
      //imgSprite.draw(ctx,bullet[0], bullet[1], bullet[2])
    }
    this.move = function move () {
      for (var i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i]!=null){
          this.bullets[i][2] += this.bullet_speed;
        }
      }
      while (this.bullets.length > 0 && (this.bullets[0] == null || this.bullets[0][2] > bullet_max_depth)) {
        this.bullets.shift();
      }
    }
    this.fire = function () {
      this.bullets.push([player.pos_x-1, player.pos_y + player.char_size_y / 2, ZS]);
      this.bullets.push([player.pos_x + player.char_size_x, player.pos_y + player.char_size_y / 2, ZS]);
    }
  }
  
  function Enemy (x, y, z) {
    this.size_x = 64;
    this.size_y = 64;
    this.pos_x = x;
    this.pos_y = y;
    this.pos_z = z;
    this.hit = 0;
    
    var speed = 2;

    this.sprite = new Sprite ("enemy", this.size_x, this.size_y);
    this.sprite.seq = [0,1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1];

    var timestamp=0;
    var animMs = 100;
    var state = 0;
    
    this.draw = function (ctx, ts) { 
/*      var msSinceHit = ts - this.hit;
      var delay = 500;
      ctx.fillStyle = msSinceHit < delay ? "rgb(255,"+(255*(1-msSinceHit/delay))+","+(255*(1-msSinceHit/delay))+")" : "red";
      ctx.fillRect(p1[0], p1[1], p4[0]-p1[0], p4[1]-p1[1]);*/
      if (ts - timestamp >= animMs){
        this.sprite.next();    
        timestamp = ts;
      }
      this.sprite.draw (ctx, this.pos_x, this.pos_y, this.pos_z);
    }
    
    var moves = [[speed, 0, 0], [-speed, 0, 0]]
    var curr_move = 0;
    
    this.move = function () {
      this.pos_x += moves[curr_move][0];
      this.pos_y += moves[curr_move][1];
      this.pos_z += moves[curr_move][2];
      if (this.pos_x <= 0){
        curr_move = 0;
      } else if (this.pos_x >= SCREEN_X-this.size_x){
        curr_move = 1;
      }
    }
  }

  function SmallExplosion (x, y, z, ts) {
    this.pos_x = x;
    this.pos_y = y;
    this.pos_z = z;
    this.state = 0;
    
    var timestamp = ts;
    
    var spriteExplosion = new Sprite ("explosion", 128, 128);
    spriteExplosion.seq = [2, 3, 3, 2, 1, 0];
    
    var durationMs = 250;
       
    this.update = function (now){
      var elapsed = now - timestamp; 
      spriteExplosion.state = elapsed <= durationMs ? Math.floor(elapsed / durationMs * spriteExplosion.seq.length)  : -1;
    }
    this.isFinished = function () { return (spriteExplosion.state == -1); }
    this.draw = function (ctx){
      spriteExplosion.drawCentered(ctx, this.pos_x, this.pos_y, this.pos_z);
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
    }
    var onKeyUp = function(event) {
      var dir = getDir(event.keyCode);
      pressed = pressed & ~dir;
    }
    var clientX = 0;
    var clientY = 0;
    var touchSpeed = [0, 0];
    
    var onTouchStart = function (event) {
      pressed = pressed | FIRE;
      event.preventDefault ();
    }
    var onTouchEnd = function (event) {
      pressed = 0;
      touchSpeed = [0,0];
      event.preventDefault ();
    }    
    var onTouchMove = function (event) {
      var touch = event.touches[0];
      pressed = FIRE;
      touchSpeed[0] = touch.clientX - clientX;
      if (touchSpeed[0] < 0) { pressed = (pressed | LEFT) & ~RIGHT; }
      else if (touchSpeed[0] > 0) { pressed = (pressed | RIGHT) & ~LEFT; }
      touchSpeed[1] = touch.clientY - clientY;
      if (touchSpeed[1]< 0) { pressed = (pressed | UP) & ~DOWN; }
      else if (touchSpeed[1] > 0) { pressed = (pressed | DOWN) & ~UP; }
      clientX = touch.clientX;
      clientY = touch.clientY;
    }
    this.enable = function () {
      var canvas = document.getElementById("canvas");
      window.addEventListener('keyup', onKeyUp, false);
      window.addEventListener('keydown', onKeyDown, false);
      canvas.addEventListener('touchstart', onTouchStart, false);
      //canvas.addEventListener('mousedown', onTouchStart, false);
      canvas.addEventListener('touchmove', onTouchMove, false);
      canvas.addEventListener('touchend', onTouchEnd, false);
      //canvas.addEventListener('mouseup', onTouchEnd, false);
    }
    this.isLeftPressed = function(){ return pressed & LEFT }
    this.isRightPressed = function(){ return pressed & RIGHT }
    this.isUpPressed = function(){ return pressed & UP }
    this.isDownPressed = function(){ return pressed & DOWN }
    this.isFirePressed = function(){ return pressed & FIRE }
    this.getXSpeed = function() {return touchSpeed[0]; }
    this.getYSpeed = function() {return touchSpeed[1]; }
  }

  function Sound () {
    var audio_shot = new Audio ("https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F317136__bird-man__sci-fi-gun-shot.wav?1511349312785");
    var audio_hit = new Audio ("https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F398283__flashtrauma__explosion.wav?1511353919083");
    var enabled = 1;
    
    var play = function (audio, vol){
      if (!enabled){
        return;
      }
      if (audio.currentTime > 0.04){
        audio.currentTime = 0
      }
      if (vol !== undefined){
        audio.volume = vol;
      }
      audio.play ();
    }
    this.shot = function (vol) { play (audio_shot, vol); }
    this.hit = function (vol) { play (audio_hit, vol); }
  }

  function Game () {
    var grid = new Grid ();
    var player = new Player ();
    var hud = new Hud (player);
    var bullets = new Bullets (player);
    var control = new Control ();
    var sound = new Sound ();
    var fx = [];
    var enemies = [];

    var imgSaturn = new Image();
    imgSaturn.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fsaturn.jpg?1510568809912";
    
    var imgSun = new Image ();
    imgSun.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F9103296900_0d383feabf_z.jpg?1511356896867";
    
    var imgEclipse = new Image();
    imgEclipse.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F36326775510_eda3cf9402_z.jpg?1511358509011";

    var levels = [
      {drawBackground: function (ctx){ ctx.drawImage(imgSaturn, 0, 376 / 2, 640, 376 / 2, -60, 0, SCREEN_X, 376 / 2); }, gridColor: "limegreen"},
      {drawBackground: function (ctx){ ctx.drawImage(imgEclipse, 0, 434/2, 640, 434/2, 60, 0, SCREEN_X, 434/2); }, gridColor: "violet"},
      {drawBackground: function (ctx){ ctx.drawImage(imgSun, 0, 320, 640, 320, 0, -100, SCREEN_X, 320); }, gridColor: "orange"}
    ];
    var level = 0;

    var score = {
      current: 0,
      hit: function () {
        var hitsToAdvance = 250;
        
        this.current++;
        if (this.current==hitsToAdvance){
          this.advance ();
        }
      },
      advance: function () {
        level = (level+1) % levels.length;
        this.current =  0;
      }
    }
    
    var draw = function (timestamp) {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, SCREEN_X, SCREEN_Y);
        levels[level].drawBackground (ctx);
        grid.drawGrid (ctx, levels[level].gridColor);
        drawObjects (ctx, timestamp);
      }
    }
    
    var drawObjects = function (ctx, timestamp) {
      var curr_bullet = 0;
      var curr_enemy = 0;
      var curr_player = 0;
      var curr_fx = 0;
      
      var obj_player = [hud, player];
      
      var z = 10000; // bullet_max_depth
      
      while (true){
        var z_bullet = curr_bullet < bullets.bullets.length ? bullets.bullets[curr_bullet][2]:0;
        var z_player = curr_player < obj_player.length? obj_player [curr_player].pos_z : 0;
        var z_enemy = curr_enemy < enemies.length? enemies [curr_enemy].pos_z : 0;
        var z_fx = curr_fx < fx.length? fx [curr_fx].pos_z : 0;

        z = Math.max (z_bullet, Math.max (z_player, z_enemy));
        if (z < ZS){
          break;
        }
        if (z_bullet == z) {
          bullets.draw (ctx, curr_bullet);
          do {
            curr_bullet++
          }while (curr_bullet<bullets.bullets.length && bullets.bullets[curr_bullet]==null);
        }
        if (z_player == z) {
          obj_player[curr_player++].draw (ctx, timestamp);
        }
        if (z_enemy == z) {
          enemies[curr_enemy++].draw (ctx, timestamp);
        }
        if (z_fx == z) {
          fx[curr_fx++].draw (ctx, timestamp);
        }
      }
    }
    
    var doControl = function() {
      if (control.isLeftPressed ()) {
        player.moveLeft (- control.getXSpeed ());
        grid.rotateLeft ();
      } else if (control.isRightPressed ()) {
        player.moveRight (control.getXSpeed ());
        grid.rotateRight ();
      } else {
        grid.undoRotation ();
      }
      if (control.isUpPressed ()) {
        player.moveUp (-control.getYSpeed ());
      } else if (control.isDownPressed ()) {
        player.moveDown (control.getYSpeed ());
      }
      if (control.isFirePressed ()) {
        sound.shot (0.5);
        bullets.fire ();
      }
    }
    
    var addFX = function (newFX){
      var zOrder = 0;
      while (zOrder < fx.length && fx[zOrder].pos_z>newFX.pos_z){
        zOrder++;
      }
      fx.splice (zOrder, 0, newFX);  // TODO: in-order insert
    }
    
    
    // improved with http://jsfiddle.net/h5qba8v9/3/
    function collisionBox3D (x1, y1, z1, w1, h1, d1, x2, y2, z2, w2, h2, d2) {
      return  (x1 < x2 + w2 && x2 < x1 + w1 &&
        y1 < y2 + h2 && y2 < h1 + y1 &&
        z1 < z2 + d2 && z2 < z1 + d1);
    }
    
    function collisionBox2D (x1, y1, w1, h1, x2, y2, w2, h2) {
      return  (x1 < x2 + w2 && x2 < x1 + w1 &&
        y1 < y2 + h2 && y2 < h1 + y1);
    }

    // Intersection diagonal: [[x1,y1][x4,y4]]
    function overlapRect (r1x1, r1y1, r1x2, r1y2, r2x1, r2y1, r2x2, r2y2) {
      var overlap = [[Math.max(r1x1, r2x1), Math.max(r1y1, r2y1)],
             [Math.min(r1x2, r2x2), Math.min(r1y2, r2y2)]];
      if (overlap[0][0]<overlap[1][0] && overlap[0][1]<overlap[1][1]){
        return overlap;
      } else {
        return null;
      }
    }

    function collisionSprite (x1, y1, sprite1, x2, y2, sprite2) {
      //alert ("collisionSprite: "+x1+", "+y1+" vs "+x2+","+y2);

      var overlap = overlapRect (x1, y1, x1 + sprite1.width, y1 + sprite1.height,
                                x2, y2, x2 + sprite2.width, y2 + sprite2.height);
      if (overlap == null) {return false;}
      var overlap_w = overlap[1][0]-overlap[0][0];
      var overlap_h = overlap[1][1]-overlap[0][1];

      var half_w = Math.floor (overlap_w/2);
      var half_h = Math.floor (overlap_h/2);
      var base1_x = overlap[0][0]-x1;
      var base1_y = overlap[0][1]-y1;
      var base2_x = overlap[0][0]-x2;
      var base2_y = overlap[0][1]-y2;
      // 5 points (corners + center) enough for 3x3 bullets. Use a 9-point one for larger objects. 
      if (sprite1.getMaskPixel(base1_x, base1_y) != 0 
          && sprite2.getMaskPixel(base2_x, base2_y) != 0){ return true; }
      if (sprite1.getMaskPixel(base1_x + overlap_w-1, base1_y) != 0 
          && sprite2.getMaskPixel(base2_x + overlap_w-1, base2_y) != 0){ return true; }
      if (sprite1.getMaskPixel(base1_x + half_w, base1_y + half_h) != 0 
          && sprite2.getMaskPixel(base2_x + half_w, base2_y + half_h) != 0){ return true; }
      if (sprite1.getMaskPixel(base1_x, base1_y + overlap_h - 1) != 0 
          && sprite2.getMaskPixel(base2_x, base2_y + overlap_h -1) != 0){ return true; }
      if (sprite1.getMaskPixel(base1_x + overlap_w-1, base1_y + overlap_h - 1) != 0 
          && sprite2.getMaskPixel(base2_x + overlap_w-1, base2_y + overlap_h -1) != 0){ return true; }
      return false;
    }
    
    var doCollisions = function (timestamp) {
      for (var i=0; i< bullets.bullets.length; i++){
        var bullet = bullets.bullets[i];
        for (var j=0; j<enemies.length; j++) {
          var enemy = enemies[j];
          if (bullet != null) {
            if (collisionBox3D (bullet[0], bullet[1], bullet[2], bullets.bullet_size, bullets.bullet_size, bullets.bullet_speed,
                          enemy.pos_x, enemy.pos_y, enemy.pos_z, enemy.size_x, enemy.size_y, 1)){
              if (collisionSprite (bullet[0], bullet[1], bullets.sprite, enemy.pos_x, enemy.pos_y, enemy.sprite)){
                sound.hit (1 - enemy.pos_z / 3000); // TODO: move to var
                bullets.bullets[i] = null;
                enemy.hit = timestamp;
                addFX (new SmallExplosion (bullet[0]+bullets.bullet_size/2, bullet[1]+bullets.bullet_size/2, bullet[2], timestamp));
                score.hit ();
              }
            }
          }          
        }
      }
      var enemy = null;
      var locked = false;
      for (var i=0; i<enemies.length; i++) {
        enemy = enemies[i];
        if (collisionBox2D (player.pos_x, player.pos_y, player.char_size_x, player.char_size_y,
                           enemy.pos_x, enemy.pos_y, enemy.size_x, enemy.size_y)){
          locked = true;
          break;
        }
      }
      hud.setLocked (locked);
    }

    var moveFX = function (timestamp) {
      for (var i =0 ; i<fx.length; i++){
        fx[i].update(timestamp);
        if (fx[i].isFinished ()){
          fx.splice(i,1);
        }
      }
    }
    var render = function (timestamp) {
      doControl();
      grid.move ();
      for (var i=0;i<enemies.length;i++){
        enemies[i].move(timestamp);
      }
      doCollisions (timestamp);
      moveFX (timestamp);
      bullets.move (timestamp);
      draw(timestamp);
      window.requestAnimationFrame(render);
    }
    
    
    var setSize = function () {
      var ctx = document.getElementById("canvas").getContext("2d");
      
      var ww=window.innerWidth;
      var wh=window.innerHeight;
      
      var pref_w = 800;
      var pref_h = 400;
      
      if (ww / pref_w < wh / pref_h){
        SCREEN_X = Math.min (pref_w, window.innerWidth);
        SCREEN_Y = SCREEN_X / 2;
      } else {
        SCREEN_Y = Math.min (pref_h, window.innerHeight);
        SCREEN_X = SCREEN_Y * 2;
      }
      ctx.canvas.width = SCREEN_X
      ctx.canvas.height = SCREEN_Y;
    }
    this.start = function () {
      control.enable ();
      setSize ();
      enemies = [new Enemy (0, SCREEN_Y * 0.1, 1600), new Enemy (SCREEN_X / 2, SCREEN_Y * 0.50, 1200), new Enemy (SCREEN_X, SCREEN_Y * 0.80, 800)];
      //window.addEventListener('resize', setSize, false);
      //window.addEventListener('orientationchange', setSize, false);
      //window.addEventListener ("touchstart", function init_audio() {sound.shot ();window.removeEventListener (init_audio);}, false);
      window.addEventListener('orientationchange', setSize, false);
      window.requestAnimationFrame(render);  
    }
    
  }


  function start() {
    new Game().start ();
  }

  start();
