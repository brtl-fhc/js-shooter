  var SCREEN_X = 800;
  var SCREEN_Y = 400;

  var ZS = 500;
  
  var Utils = {
    project: function (p) {
      var ret = [
        p[0] * ZS / p[2] + SCREEN_X / 2,
        p[1] * ZS / p[2] + SCREEN_Y / 2
      ];
      return ret;
    },
    addToPaint: function addToPaint (list, item){
      var zOrder = 0;
      while (zOrder < list.length && list[zOrder].pos_z>item.pos_z){
        zOrder++;
      }
      list.splice (zOrder, 0, item);  // in-order insert
    },
    collisionBox3D: function collisionBox3D (x1, y1, z1, w1, h1, d1, x2, y2, z2, w2, h2, d2) {
        // improved with http://jsfiddle.net/h5qba8v9/3/
      return  (x1 < x2 + w2 && x2 < x1 + w1 &&
        y1 < y2 + h2 && y2 < h1 + y1 &&
        z1 < z2 + d2 && z2 < z1 + d1);
    },
    collisionBox2D: function collisionBox2D (x1, y1, w1, h1, x2, y2, w2, h2) {
      return  (x1 < x2 + w2 && x2 < x1 + w1 &&
        y1 < y2 + h2 && y2 < h1 + y1);
    },
    // Intersection diagonal: [[x1,y1][x4,y4]]
    overlapRect: function overlapRect (r1x1, r1y1, r1x2, r1y2, r2x1, r2y1, r2x2, r2y2) {
      var overlap = [[Math.max(r1x1, r2x1), Math.max(r1y1, r2y1)],
             [Math.min(r1x2, r2x2), Math.min(r1y2, r2y2)]];
      if (overlap[0][0]<overlap[1][0] && overlap[0][1]<overlap[1][1]){
        return overlap;
      } else {
        return null;
      }
    },
    collisionSprite: function collisionSprite (x1, y1, sprite1, x2, y2, sprite2) {
      var overlap = this.overlapRect (x1, y1, x1 + sprite1.width, y1 + sprite1.height,
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
      // 5 points (corners + center) enough for 3x3 bullets. Use a 9-point grid for larger objects?
      var checkpoints = [[0,0],[overlap_w-1, 0], [half_w, half_h], [0, overlap_h-1], [overlap_w-1, overlap_h-1]];
      for (var i = 0; i < checkpoints.length; i++) {
        if (sprite1.getMaskPixel(base1_x + checkpoints[i][0], base1_y + checkpoints[i][1]) != 0 
            && sprite2.getMaskPixel(base2_x + checkpoints[i][0], base2_y + checkpoints[i][1]) != 0){ return true; }
      }      
      return false;
    },
    distance: function distance (x1, y1, x2, y2) { return Math.sqrt (((x2-x1)*(x2-x1))+((y2-y1)*(y2-y1))) },
    setSize: function () {
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
    },
    imageCache: new ImageCache (),
  }
  
  function ImageCache (){
    this.images = {};
    var loaded = [];
    var canvases = {};
    var masks = {};
    
    var assets = [
      ["player", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fnave%20amiga(1).png?1513962232531", true],
      ["hud", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fhud.png?1512578906463", false],
      ["bullet", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fbullet.png?1512510809435", true],
      ["enemy_tron", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fenemy.png?1512390585535", true],
      ["enemy_fly", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Ffly.png?1513691921972", true],
      ["enemy_plane", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fbiplano-01.png?1517072922356", true],
      ["enemy_bullet", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fenemy_bullet.png?1512727629879", true],
      ["boss", "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fboss-01(3).png?1516476725558", true],
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
  
  function Sprite (imgName, w, h){
    this.image = imgName;
    this.width = w;
    this.height = h;
    this.seq = [0];
    this.state = 0;
    this.animMs = 0;
    var anim_timestamp = 0;
    
    this.drawSprite = function (ctx, p1, p4, ts, optTint) {
      var offsetX = this.seq[this.state]*this.width;
      var offsetY = 0;
      if (ts - anim_timestamp >= this.animMs){
        this.state = (this.state + 1) % this.seq.length;    
        anim_timestamp = ts;
      }
      if (!optTint){
        ctx.drawImage(Utils.imageCache.images[this.image], offsetX, offsetY, this.width, this.height, p1[0], p1[1], p4[0]-p1[0], p4[1]-p1[1]);
      }else{
          var tmpCanvas = document.createElement ("canvas");
          tmpCanvas.setAttribute ("origin-clean", false);
          var tmpCtx = tmpCanvas.getContext ("2d");
          tmpCanvas.width = p4[0]-p1[0];
          tmpCanvas.height = p4[1]-p1[1];
          tmpCtx.drawImage(Utils.imageCache.images[this.image], offsetX, offsetY, this.width, this.height, 0, 0, p4[0]-p1[0], p4[1]-p1[1]);
          tmpCtx.globalCompositeOperation = 'source-atop';
          tmpCtx.fillStyle="rgba(224,224,224,"+optTint+")";
          tmpCtx.fillRect(0,0,tmpCanvas.width, tmpCanvas.height);
          ctx.drawImage(tmpCtx.canvas, p1[0], p1[1]);
      }
    }
    this.draw = function(ctx, x, y, z, ts) {
      var p1 = Utils.project([x - SCREEN_X / 2 , y - SCREEN_Y / 2 , z]);
      var p4 = Utils.project([x - SCREEN_X / 2  + this.width, y + this.height - SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.drawTinted = function(ctx, x, y, z, flash, ts) {
      var p1 = Utils.project([x - SCREEN_X / 2 , y - SCREEN_Y / 2 , z]);
      var p4 = Utils.project([x - SCREEN_X / 2  + this.width, y + this.height - SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts, flash);
    }
    this.drawScaled = function(ctx, x, y, z, size_x, size_y, ts) {
      var p1 = Utils.project([x - SCREEN_X / 2 , y - SCREEN_Y / 2 , z]);
      var p4 = Utils.project([x - SCREEN_X / 2  + size_x, y + size_y - SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.drawCentered = function(ctx, x, y, z, ts) {
      var p1 = Utils.project([x - SCREEN_X / 2 - this.width/2, y - SCREEN_Y / 2 - this.height/2, z]);
      var p4 = Utils.project([x - SCREEN_X / 2  + this.width/2, y - SCREEN_Y / 2 + this.height/2, z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.getMaskPixel = function (x, y) {
      var offsetX = this.seq[this.state]*this.width;
      var offsetY = 0;
      return Utils.imageCache.getMaskPixel (this.image, x, y);
    }
  }

  function Grid (){
    this.points = [];
    this.offset = 0;
    this.rot_ang = 0;
    this.rot_sin = 0;
    this.rot_cos = 1;
    this.speed = 10;
    this.DIM = 25;
    this.angle_speed = 0.005;

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
    
    this.drawGrid = function (ctx, style, player){
        ctx.strokeStyle = style;
        ctx.lineWidth = 2;
        ctx.beginPath();
        var height = 80 * ((SCREEN_Y - player.pos_y)/SCREEN_Y);
        for (var i = 0; i < this.DIM; i++) {
          var sp1 = this.points[i * this.DIM + 1];
          var sp2 = this.points[(i + 1) * this.DIM - 1];
          var p1 = Utils.project(this.rotate([sp1[0], sp1[1]+height, sp1[2] - this.offset]));
          var p2 = Utils.project(this.rotate([sp2[0], sp2[1]+height, sp2[2] - this.offset]));
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);

          sp1 = this.points[i];
          sp2 = this.points[(this.DIM - 1) * this.DIM + i];
          var p1 = Utils.project(this.rotate([sp1[0], sp1[1]+height, sp1[2] - this.offset]));
          var p2 = Utils.project(this.rotate([sp2[0], sp2[1]+height, sp2[2] - this.offset]));

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
    this.size_x = 48;
    this.size_y = 16;
    this.size_z = 16;

    this.pos_x = SCREEN_X / 2 - this.size_x / 2;
    this.pos_y = SCREEN_Y * 0.30;
    this.pos_z = ZS - intro_z;
    
    this.sprite = new Sprite ("player", this.size_x, this.size_y);
    this.sprite.seq = [1];//[1,1,2,2];
    this.sprite.animMs = 50;
    this.statuses = {STATUS_ALIVE: 1, STATUS_DEAD: 2, STATUS_INTRO: 3, STATUS_GHOST: 4};
    this.status = this.statuses.STATUS_INTRO;
    
    this.status_timestamp = 0;
    var startingMs = 1000;
    var deadMs = 2000;
    
    var intro_z = 400;
    this.setStatus = function (status, timestamp) {
      this.status = status;
      this.status_timestamp = timestamp;
    }
    this.moveAuto = function (timestamp) {
      var elapsed = timestamp - this.status_timestamp;
      if (this.status == this.statuses.STATUS_INTRO) {
        if (elapsed < startingMs){         
          var progress = elapsed / startingMs
          this.pos_z = Math.round (ZS - ((1-progress) * intro_z));
        } else {
          this.pos_z = ZS;
          this.ghost (timestamp);
        }
      }
      this.gunHeatDown ();
    }
    this.ghost = function (timestamp) {
      this.setStatus (this.statuses.STATUS_GHOST, timestamp);
      this.sprite.seq = [0,1];//[0,1,0,2];
      var ts = timestamp;
      var player = this;
      setTimeout (function () {player.alive(ts+1000);}, 1000);
    }
    this.alive = function (timestamp) {
      this.setStatus (this.statuses.STATUS_ALIVE, timestamp);
      this.sprite.seq = [1];//[1,1,2,2];
    }
    this.reset = function (timestamp) {
      this.setStatus (this.statuses.STATUS_INTRO, timestamp);
      this.pos_z = intro_z;
    }
    this.kill = function (timestamp) {
      this.setStatus (this.statuses.STATUS_DEAD, timestamp);
      this.status_timestamp = timestamp;
      var player = this;
      var ts = timestamp;
      setTimeout (function () {player.reset(ts+deadMs);}, deadMs);
    }
    this.draw = function (ctx, ts) {
      if (this.status == this.statuses.STATUS_DEAD) {
        return;
      }
      this.sprite.draw (ctx, this.pos_x, this.pos_y, this.pos_z, ts);
    }
    
    var calcSpeed = function (speed) {
      return !speed? char_speed : Math.floor(Math.min (speed, char_speed));
    }
    this.moveLeft = function (speed) { this.pos_x = Math.max(0, this.pos_x - calcSpeed(speed)); }
    this.moveRight = function (speed) { this.pos_x = Math.min(SCREEN_X - this.size_x, this.pos_x + calcSpeed(speed)); }
    this.moveUp = function (speed) { this.pos_y = Math.max(0, this.pos_y - calcSpeed(speed)); }
    this.moveDown = function (speed) { this.pos_y = Math.min(SCREEN_Y - this.size_y, this.pos_y + calcSpeed(speed)); }
    
    this.gunHeat = 0;
    var gunHeatUpDelta = 0.01;
    var gunHeatDownDelta = 0.01;
    var gunCoolThreshold = 0.75;
    var gunOverheated = false;
    this.isGunOverheated = function () { return gunOverheated; }
    this.gunHeatUp = function () { 
      this.gunHeat = Math.min (1, this.gunHeat + gunHeatUpDelta);
      gunOverheated = (this.gunHeat == 1);
      //if (gunOverheated) { console.log ("OVERHEAT!"); }
    }
    this.gunHeatDown = function () {
      this.gunHeat = Math.max (0, this.gunHeat - (gunOverheated? (gunHeatDownDelta/2) : gunHeatDownDelta));
      if (gunOverheated && this.gunHeat < gunCoolThreshold) {
        gunOverheated = false;
        //console.log ("Cool!");
      }
    }
  }

  function Hud (player) {
    this.pos_z = 1000;
    
    var size_x = 32;
    var size_y = 16;
    
    this.sprite = new Sprite ("hud", size_x, size_y);
    this.sprite.seq = [0];
    
    this.setLocked = function (locked) { this.sprite.seq = locked? [1] : [0]; }
    this.draw = function (ctx, ts) {
      if (player.status == player.statuses.STATUS_ALIVE || player.status == player.statuses.STATUS_GHOST){
        var pos_x = player.pos_x;
        var pos_y = player.pos_y;

        this.sprite.drawScaled (ctx, pos_x, pos_y, this.pos_z, player.size_x, player.size_y, ts);
      }
    }
  }

  function PlayerBullets () {
    var bullet_max_depth = 10000;
    this.bullet_speed = 50;
    this.bullet_size = 3;
    this.bullets = [];  // reverse sorted by Z
    
    this.sprite = new Sprite ("bullet", this.bullet_size, this.bullet_size);
    
    this.draw = function draw (ctx, i) {
      var bullet = this.bullets[i];
      var p1 = Utils.project([bullet[0] - SCREEN_X / 2, bullet[1] - SCREEN_Y / 2, bullet[2]]);
      var brightness = parseInt(255 * (bullet_max_depth - bullet[2]) / bullet_max_depth, 10);
      ctx.fillStyle = "rgb(" + brightness + ", " + brightness + ", " + brightness + ")";
      ctx.fillRect(p1[0], p1[1], this.bullet_size, this.bullet_size);
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
    this.fire = function (player) {
      this.bullets.push([player.pos_x + player.size_x / 2, player.pos_y + player.size_y / 2, player.pos_z])
      /*this.bullets.push([player.pos_x-1, player.pos_y + player.size_y / 2, player.pos_z]);
      this.bullets.push([player.pos_x + player.size_x, player.pos_y + player.size_y / 2, player.pos_z]);*/
    }
  }
  
  function EnemyBullets () {
    this.size_x = 16;
    this.size_y = 16;
    this.size_z = 16;
    var EnemyBullet = function (x, y, z, speed_x, speed_y, speed_z, size_x, size_y, size_z) {
      this.pos_x = x;
      this.pos_y = y;
      this.pos_z = z;
      this.speed_x = speed_x;
      this.speed_y = speed_y;
      this.speed_z = speed_z;

      this.size_x = size_x;
      this.size_y = size_y;
      this.size_z = size_z;
      this.sprite = new Sprite ("enemy_bullet", this.size_x, this.size_y);

      this.draw = function (ctx, ts) { this.sprite.draw (ctx, this.pos_x, this.pos_y, this.pos_z, ts); }
    }
    
    this.bullets = [];
    this.fire = function (x, y, z, speed_x, speed_y, speed_z) {
      Utils.addToPaint (this.bullets, new EnemyBullet (x, y, z, speed_x, speed_y, speed_z, this.size_x, this.size_y, this.size_z));
    }
    this.move = function () {
      var z_limit = 50;
      var z = null;
      var bullet = null;
      for (var i=0; i<this.bullets.length; i++){
        bullet = this.bullets[i];
        if (bullet != null){
          z = bullet.pos_z - bullet.speed_z; 
          if (z < z_limit) {
            this.bullets[i] = null;
          } else {
            bullet.pos_z = z;
            bullet.pos_x = bullet.pos_x + bullet.speed_x;
            bullet.pos_y = bullet.pos_y + bullet.speed_y;
          }
        }
      }
      while (this.bullets.length > 0 && (this.bullets[this.bullets.length-1] == null || this.bullets[this.bullets.length-1]< z_limit )) {
        this.bullets.pop();
      }
    }
  }

  function Enemies () {
    this.enemies = [];  // reverse z-sorted for painting. Rebuilt for each frame.
    
    function StaticPatrol (px, py, z){
      this.positionAt = function (){
        return [Math.round(SCREEN_X*px), Math.round(SCREEN_Y*py), z];
      }
    }
    
    function LateralPatrol (px, py, z, size_x, start_ts, periodMs) { // x and y relative to viewport size
      this.positionAt = function (timestamp) {
        var corrected_z = Math.round (z);
        if (timestamp < start_ts + (periodMs/2)) {
          corrected_z = Math.round (10000 - (((timestamp - start_ts)/(periodMs/2))*(10000-z)));
        }
        var length = SCREEN_X - size_x;
        var offset = ((px*SCREEN_X)/length/2);
        var progress = ((timestamp + (offset*periodMs)) % periodMs)/periodMs;
        if (progress < 0.5) { // rightbound (0, 0.5) => (0, length)
          return [Math.round(length*progress*2), Math.round(SCREEN_Y*py), corrected_z];
        } else {  // leftbound (0.5, 1) => (length, 0)
          return [Math.round(length * (1-((progress-0.5)*2))), Math.round(SCREEN_Y*py), corrected_z];
        }
      }
    }
    
    function ParabolicPatrol (py, dy, z, start_ts, reverse) {
      var duration = 8000;
      var length_x = SCREEN_X+100;
      this.positionAt = function (timestamp){
        var elapsed = timestamp - start_ts;
        if (elapsed > duration) {return null;}
        var progress = elapsed/duration;
        var x = reverse? SCREEN_X+50-(length_x * progress) : -50+(length_x * progress);
        var y = SCREEN_Y*(py+(progress*dy));
        return [x, y, z - 0.004*((x-(SCREEN_X/2))*(x-(SCREEN_X/2)))];
      }
    }
    function Enemy (imgName, spriteSeq, size_x, size_y) {
      this.size_x = size_x;
      this.size_y = size_y;
      this.size_z = 64;

      this.pos_x = 0;
      this.pos_y = 0;
      this.pos_z = 0;
      this.hitTimestamp = 0;

      this.path = null;//new LateralPatrol (x, y, z, this.size_x);
      
      this.sprite = new Sprite (imgName, this.size_x, this.size_y);
      this.sprite.seq = spriteSeq;
      this.sprite.animMs = 100;
      var timestamp=0;

      this.draw = function (ctx, ts) { 
        var msSinceHit = ts - this.hitTimestamp;
        var delay = 300;
        if (msSinceHit < delay) {
          this.sprite.drawTinted (ctx, this.pos_x, this.pos_y, this.pos_z, (delay - msSinceHit)/delay*0.85, ts);
        } else {
          this.sprite.draw (ctx, this.pos_x, this.pos_y, this.pos_z, ts);
        }
      }

      var last_shot = 0;
      var time_to_fire = 3000;
      var bullet_speed_z = 4;

      this.statuses = { ALIVE: 1, DEAD: 2, GONE: 3 };
      this.status = this.statuses.ALIVE;
      this.hp = 10;
      this.hit = function (ts){
        this.hitTimestamp = ts;
        this.hp--; 
        if (this.hp<=0) {
          this.status = this.statuses.DEAD;
          this.onKill ();
        }
      };
      this.move = function (player, enemyBullets, timestamp) {
        var position = this.path.positionAt (timestamp);
        if (position == null) { this.status = this.statuses.GONE; return false;}
        this.pos_x = position[0];
        this.pos_y = position[1];
        this.pos_z = position[2];
        if (this.pos_z > player.pos_z && timestamp-last_shot > time_to_fire){
          this.fireAtPlayer (player, enemyBullets);
          last_shot = timestamp;
        }
        return true;
      }
      this.onKill = function () { /* Overload */ };
      this.fireAtPlayer = function (player, enemyBullets) {
        var source_x = this.pos_x+this.size_x/2 - enemyBullets.size_x/2;
        var source_y = this.pos_y+this.size_y/8 - enemyBullets.size_y/2;
        var target_x = player.pos_x + player.size_x/2 - enemyBullets.size_x/2;
        var target_y = player.pos_y + player.size_y/2 - enemyBullets.size_y/2;
        var bullet_speed_x = (target_x - source_x) / (this.pos_z - player.pos_z)*bullet_speed_z;
        var bullet_speed_y = (target_y - source_y) / (this.pos_z - player.pos_z)*bullet_speed_z;
        if (bullet_speed_x > 0) { bullet_speed_x = Math.min (bullet_speed_x, bullet_speed_z); }
        else if (bullet_speed_x < 0) { bullet_speed_x = Math.max (bullet_speed_x, - bullet_speed_z); }
        if (bullet_speed_y > 0) { bullet_speed_y = Math.min (bullet_speed_y, bullet_speed_z); }
        else if (bullet_speed_y < 0) { bullet_speed_y = Math.max (bullet_speed_y, - bullet_speed_z); }

        enemyBullets.fire (source_x, source_y, this.pos_z-1, bullet_speed_x, bullet_speed_y, bullet_speed_z);
      }
    }
    
    function Wave (timestamp) {
      var wave = [];
      this.add = function (enemy) {
        wave.push (enemy);
      }
      this.finished = false;
      this.move = function (player, enemies, enemyBullets, timestamp) {
        this.finished = true;
        for (var i=0;i<wave.length;i++){
          if (wave[i].status == wave[i].statuses.ALIVE && wave[i].move (player, enemyBullets, timestamp)) {
            Utils.addToPaint (enemies.enemies, wave[i]);
            this.finished = false;
          }
        }        
      }
      this.onFinish = null; /* overload */
    }
    var waves = [];
    
    this.createParabolicWave = function (level, timestamp) {
      var dy = Math.random ()-0.5;
      var wave = new Wave (timestamp);
      for (var i=0; i<(4+level); i++) {
        var enemy = new Enemy ("enemy_fly", [0], 64, 64);
        enemy.hp = 5;
        enemy.path = new ParabolicPatrol (Math.random ()*0.8, dy, 1000, timestamp+(i*500), (Math.round(timestamp)%2)>0); //new LateralPatrol (0, 0.5, 1200, enemy.size_x);
        wave.add (enemy);        
      }
      return wave;
    }
    this.createStaticWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      for (var i=0; i<(1); i++) {
        var enemy = new Enemy ("enemy_plane", [0], 450, 256);
        enemy.hp = 2500;
        enemy.path = new StaticPatrol (0.4, 0.6, 1200); //new LateralPatrol (0, 0.5, 1200, enemy.size_x);
        wave.add (enemy);        
      }
      return wave;
    }
    this.createLateralWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      var enemy = new Enemy ("enemy_tron", [0,1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1], 64, 64);
      enemy.hp = 25 + (level * 15);
      enemy.path = new LateralPatrol (Math.random (), Math.random ()*0.9, 1500 - (Math.random()*500), enemy.size_x, timestamp, 12000);
      wave.add (enemy);
      return wave;
    }
    this.createBossWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      var enemy = new Enemy ("boss", [0,1], 1800, 240);
      enemy.hp = 200 + (level * 30);
      enemy.path = new LateralPatrol (Math.random (), Math.random ()*0.9, 1500 - (Math.random()*500), enemy.size_x, timestamp, 24000);
      wave.add (enemy);
      return wave;
    }
    this.move = function (player, enemyBullets, timestamp) {
      this.enemies = [];
      for (var i=0;i<waves.length;i++){
        var wave = waves[i];
        wave.move (player, this, enemyBullets, timestamp);
        if (wave.finished) {
          waves.splice (i,1);
          if (wave.onFinish) {
            console.log ("finished wave");
            wave.onFinish (timestamp);
          };
        }
      }
    }
    this.startLevel = function (level, timestamp) {
      for (var i=0; i<waves.length; i++) { waves[i].onFinish = null; };
      var that = this;
      var waveLateral = this.createLateralWave (level, timestamp);
      waveLateral.onFinish = function respawn (ts) {
        var wave = that.createLateralWave (level, ts);
        wave.onFinish = respawn;
        waves.push (wave);
      }; // null to not respawn
      var waveParabolic = this.createParabolicWave (level, timestamp);
      waveParabolic.onFinish = function respawnParabolic (ts) {
        var wave = that.createParabolicWave (level, ts);
        wave.onFinish = respawnParabolic;
        waves.push (wave);
      }
      waves.push (waveLateral);
      waves.push (waveParabolic);
      //var waveBoss = that.createBossWave (level, timestamp);
      //waves.push (waveBoss);
    }  
  }

  function FX () {
    this.fx = [];
    
    function Effect (x, y, z, timestamp, durationMs) {
      this.pos_x = x;
      this.pos_y = y;
      this.pos_z = z;

      this.sprite = null;

      this.isFinished = function (ts) { return (ts-timestamp > durationMs); }
      this.draw = function (ctx, ts){
        this.sprite.drawCentered(ctx, this.pos_x, this.pos_y, this.pos_z, ts);
      }
    }
    
    this.addFX = function (newFX){
      Utils.addToPaint(this.fx, newFX);
    }
    this.smallExplosion = function (x, y, z, ts) {
      var newFX = new Effect (x, y, z, ts, 100);
      newFX.sprite = new Sprite ("explosion", 128, 128);
      newFX.sprite.seq = [2, 1, 1, 1, 0];
      newFX.sprite.animMs = 100 / (newFX.sprite.seq.length-1);
      this.addFX (newFX);
    }
    this.bigExplosion = function (x, y, z, ts, durationMs){
      var newFX = new Effect (x, y, z, ts, durationMs);
      newFX.sprite = new Sprite ("explosion", 128, 128);
      newFX.sprite.seq = [2,2,3,4,5,6,7,8,9];
      newFX.sprite.animMs = durationMs / (newFX.sprite.seq.length-1);
      this.addFX (newFX);
    }
    
    this.move = function (ts) {
      for (var i =0 ; i<this.fx.length; i++){
        if (this.fx[i].isFinished (ts)){
          this.fx.splice(i,1);
        }
      }
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
      return code == 37 ? LEFT : code == 38 ? UP : code == 39 ? RIGHT : code == 40 ? DOWN : (code == 32 || code == 17) ? FIRE : null;
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
      pressed = pressed | (event.touches.length > 1? FIRE : 0);
      event.preventDefault ();
    }
    var onTouchEnd = function (event) {
      pressed = 0;
      touchSpeed = [0,0];
      event.preventDefault ();
    }    
    var onTouchMove = function (event) {
      var touch = null;
      if (event.changedTouches.length == 1) {
        touch = event.changedTouches[0];
      } else {
        var maxDistance = 0;
        for (var i=0; i<event.changedTouches.length; i++){
          var current = event.changedTouches[i];
          var dist = Utils.distance (current.clientX, clientX, current.clientY, clientY);
          if (dist > maxDistance) { maxDistance = dist; touch = current; }
        }
      }
      pressed = event.touches.length > 1? FIRE : 0;
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
    this.disable = function () {
      var canvas = document.getElementById("canvas");
      window.removeEventListener('keyup', onKeyUp, false);
      window.removeEventListener('keydown', onKeyDown, false);
      canvas.removeEventListener('touchstart', onTouchStart, false);
      //canvas.addEventListener('mousedown', onTouchStart, false);
      canvas.removeEventListener('touchmove', onTouchMove, false);
      canvas.removeEventListener('touchend', onTouchEnd, false);
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

  function Levels () {
    var imgSaturn = new Image();
    imgSaturn.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fsaturn.jpg?1510568809912";
    var imgSun = new Image ();
    imgSun.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F9103296900_0d383feabf_z.jpg?1511356896867";
    var imgEclipse = new Image();
    imgEclipse.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F36326775510_eda3cf9402_z.jpg?1511358509011";
    
    this.levels = [
      {drawBackground: function (ctx){ ctx.drawImage(imgSaturn, 0, 376 / 2, 640, 376 / 2, -60, 0, SCREEN_X, 376 / 2); }, gridColor: "limegreen"},
      {drawBackground: function (ctx){ ctx.drawImage(imgEclipse, 0, 434/2, 640, 434/2, 60, 0, SCREEN_X, 434/2); }, gridColor: "violet"},
      {drawBackground: function (ctx){ ctx.drawImage(imgSun, 0, 320, 640, 320, 0, -100, SCREEN_X, 320); }, gridColor: "orange"}
    ];
    this.level = null;
  }

  function Game () {
    var grid = new Grid ();
    var player = new Player ();
    var hud = new Hud (player);
    var playerBullets = new PlayerBullets ();
    var enemyBullets = new EnemyBullets ();
    var enemies = new Enemies ();
    var control = new Control ();
    var sound = new Sound ();
    var fx = new FX ();
    var levels = new Levels ();

    var score = {
      current: 0,
      hit: function (timestamp) {
        var hitsToAdvance = 250;
        this.current++;
        if (this.current==hitsToAdvance){
          startLevel (timestamp, (levels.level+1));
          this.current =  0;        
        }
      },
    }

    var startLevel = function (timestamp, level) {
      if (!level) { level = 0; };
      levels.level = level;
      enemies.startLevel (level, timestamp);
    }
    
    var draw = function (timestamp) {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var level = levels.levels [levels.level % levels.levels.length];
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, SCREEN_X, SCREEN_Y);
        level.drawBackground (ctx);
        grid.drawGrid (ctx, level.gridColor, player);
        drawObjects (ctx, timestamp);
        drawInfo (ctx, timestamp);
      }
    }
    
    var drawObjects = function (ctx, timestamp) {
      var curr_bullet = 0;
      var curr_enemy_bullet = 0;
      var curr_enemy = 0;
      var curr_player = 0;
      var curr_fx = 0;
       
      var obj_player = [hud, player];
      
      var z = 10000; // bullet_max_depth
      var z_limit = 0;
       
      while (true){
        var z_bullet = ((curr_bullet < playerBullets.bullets.length) && playerBullets.bullets[curr_bullet]!=null) ? playerBullets.bullets[curr_bullet][2]:z_limit;
        var z_enemy_bullet = curr_enemy_bullet < enemyBullets.bullets.length ? enemyBullets.bullets[curr_enemy_bullet].pos_z:z_limit;
        var z_player = curr_player < obj_player.length? obj_player [curr_player].pos_z : z_limit;
        var z_enemy = curr_enemy < enemies.enemies.length? enemies.enemies [curr_enemy].pos_z : z_limit;
        var z_fx = curr_fx < fx.fx.length? fx.fx [curr_fx].pos_z : z_limit;

        z = z_limit; 
        var list = [z_fx, z_bullet, z_enemy_bullet, z_player, z_enemy];
        for (var i = 0; i<list.length; i++) { if (! isNaN (list[i])) { z = Math.max (list[i], z); }}

        if (z <= z_limit){
          break;
        }
        if (z_bullet == z) {
          playerBullets.draw (ctx, curr_bullet, timestamp);
          do {
            curr_bullet++
          }while (curr_bullet<playerBullets.bullets.length && playerBullets.bullets[curr_bullet]==null);
        }
        if (z_enemy_bullet == z) {
          enemyBullets.bullets [curr_enemy_bullet].draw (ctx, timestamp);
          do {
            curr_enemy_bullet++
          }while (curr_enemy_bullet<enemyBullets.bullets.length && enemyBullets.bullets[curr_enemy_bullet]==null);
        }

        if (z_player == z) {
          obj_player[curr_player++].draw (ctx, timestamp);
        }
        if (z_enemy == z) {
          enemies.enemies [curr_enemy++].draw (ctx, timestamp);
        }
        if (z_fx == z) {
          fx.fx[curr_fx++].draw (ctx, timestamp);
        }
      }
    }
    
    var drawInfo = function (ctx, timestamp) {
      var level = levels.levels [levels.level % levels.levels.length];
      ctx.font         = '32px LazenbyCompSmooth';
      ctx.fillStyle = level.gridColor;
      ctx.textBaseline = 'top';
      ctx.fillText  ('000000', 0, 0);
      
      var heatCenter = [SCREEN_X-32,32]
      ctx.beginPath ();
      ctx.lineWidth = 3;
      ctx.strokeStyle = player.isGunOverheated()? "red" : "lime";
      ctx.arc(heatCenter[0], heatCenter[1], 16, -0.5*Math.PI, -0.5*Math.PI+(player.gunHeat)*2*Math.PI);
      ctx.stroke();
      if (player.gunHeat > 0.75){
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.arc(heatCenter[0], heatCenter[1], 16, Math.PI, Math.PI + (Math.PI/2*(player.gunHeat-0.75)/0.25))
        ctx.stroke();
        if (player.isGunOverheated()){
          ctx.fillStyle = "red";
          ctx.textBaseLine = "middle";
          ctx.font         = '16px LazenbyCompSmooth';
          ctx.fillText ("H", heatCenter[0]-5, heatCenter[1]-8);
        }
      }
    }
    
    var controlPlayer = function() {
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
        if (! player.isGunOverheated ()){
          sound.shot (0.5);
          playerBullets.fire (player);
          player.gunHeatUp ();
        } else {
          player.gunHeatDown ();
        }
      } else {
        player.gunHeatDown ();
      }
    }
    
    var movePlayer = function (timestamp) {
      if (player.status == player.statuses.STATUS_ALIVE || player.status == player.statuses.STATUS_GHOST) {
        controlPlayer ();
      } else {
        player.moveAuto (timestamp);
        //grid.undoRotation ();
      }
    }
    
    var killPlayer = function (timestamp) {
      fx.bigExplosion (player.pos_x+player.size_x/2,player.pos_y+player.size_y/2, player.pos_z-1, timestamp, 1000);
      sound.hit (0.5);
      player.kill (timestamp);
    }
    
    var doCollisions = function (timestamp){
      if (player.status != player.statuses.STATUS_ALIVE) { return; }
      for (var i=0; i < enemyBullets.bullets.length; i++){
        var bullet = enemyBullets.bullets[i];
        if (Utils.collisionBox3D (bullet.pos_x, bullet.pos_y, bullet.pos_z-bullet.speed_z, bullet.size_x, bullet.size_y, bullet.size_z,//bullet.speed_z,
            player.pos_x, player.pos_y, player.pos_z, player.size_x, player.size_y, player.size_z)){
          if (Utils.collisionSprite (bullet.pos_x, bullet.pos_y, bullet.sprite, player.pos_x, player.pos_y, player.sprite)){
            killPlayer(timestamp);
            return;
          }
        }
      }
      for (var i=0; i< playerBullets.bullets.length; i++){
        var bullet = playerBullets.bullets[i];
        for (var j=0; j<enemies.enemies.length; j++) {
          var enemy = enemies.enemies[j];
          if (bullet != null && enemy.status == enemy.statuses.ALIVE) {
            if (Utils.collisionBox3D (bullet[0], bullet[1], bullet[2], playerBullets.bullet_size, playerBullets.bullet_size, playerBullets.bullet_size,//bullet_speed, 
                          enemy.pos_x, enemy.pos_y, enemy.pos_z, enemy.size_x, enemy.size_y, enemy.size_z)){
              if (Utils.collisionSprite (bullet[0], bullet[1], playerBullets.sprite, enemy.pos_x, enemy.pos_y, enemy.sprite)){
                playerBullets.bullets[i] = null;
                enemy.hit (timestamp);
                if (enemy.status == enemy.statuses.ALIVE) {
                  fx.smallExplosion (bullet[0]+playerBullets.bullet_size/2, bullet[1]+playerBullets.bullet_size/2, enemy.pos_z, timestamp);
                } else {
                  sound.hit (1 - (Math.min (enemy.pos_z, 3000) / 3000)); // TODO: move to var
                  fx.bigExplosion (enemy.pos_x+(enemy.size_x/2), enemy.pos_y+(enemy.size_y/2), bullet[2], timestamp, 500);
                }
                score.hit (timestamp);
              }
            }
          }          
        }
      }
      var enemy = null;
      var locked = false;
      for (var i=0; i<enemies.enemies.length; i++) {
        enemy = enemies.enemies[i];
        if (enemy.status == enemy.statuses.ALIVE && 
            Utils.collisionBox2D (player.pos_x, player.pos_y, player.size_x, player.size_y,
                           enemy.pos_x, enemy.pos_y, enemy.size_x, enemy.size_y)){
          locked = true;
          break;
        }
      }
      hud.setLocked (locked);
    }

    var render = function (timestamp) {
      movePlayer (timestamp);
      grid.move ();
      enemies.move (player, enemyBullets, timestamp);
      playerBullets.move (timestamp);
      enemyBullets.move ();
      doCollisions (timestamp);
      fx.move (timestamp);
      draw(timestamp);
      window.requestAnimationFrame(render);
    }
    
    this.start = function () {
      control.enable ();
      Utils.setSize ();
      //window.addEventListener('resize', setSize, false);
      //window.addEventListener('orientationchange', setSize, false);
      //window.addEventListener ("touchstart", function init_audio() {sound.shot ();window.removeEventListener (init_audio);}, false);
      window.addEventListener('orientationchange', Utils.setSize, false);
      startLevel (window.performance.now());
      window.requestAnimationFrame(render);
    }
  }

  function Menu () {
    var grid = new Grid ();
    var start_ts = 0;
    var render = function (timestamp) {
      if (!start_ts) { start_ts = timestamp; }
      grid.move ();
      var canvas = document.getElementById("canvas");
      if (!canvas.getContext) {
        return;
      }
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(0, 0, SCREEN_X, SCREEN_Y);
      grid.drawGrid (ctx, "green", {pos_y: SCREEN_Y});
      ctx.font         = '48px LazenbyCompSmooth';
      ctx.strokeStyle = "lime";
      ctx.fillStyle = "lime";
      ctx.textBaseline = 'middle';
      ctx.textAlign = "center";
      ctx.strokeText  ('-= G r i d  F o r c e =-', SCREEN_X/2, SCREEN_Y/3);
      if ((timestamp-start_ts)%1500 < 750){
        ctx.font         = '24px LazenbyCompSmooth';
        ctx.strokeText  ('F i r e  t o  s t a r t', SCREEN_X/2, 2*SCREEN_Y/3);
      }
      window.requestAnimationFrame(render);
    }
    
    this.start = function () {
      grid.speed = 4;
      Utils.setSize();
      window.addEventListener('orientationchange', Utils.setSize, false);
      window.requestAnimationFrame(render);
    }
  }

  (function start() {
    new Game().start ();
    //new Menu().start ();
  })()