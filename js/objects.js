var GridForce = window.GridForce || {};

GridForce.Sprite = function (imgName, w, h){
    this.image = imgName;
    this.width = w;
    this.height = h;
    this.seq = [0];
    this.currentFrame = 0;
    this.frameDurationMs = 0;
    var drawTimestamp = 0;
    
    this.drawSprite = function (ctx, p1, p4, ts, optTint) {
      var offsetX = this.seq[this.currentFrame]*this.width;
      var offsetY = 0;
      if (ts - drawTimestamp >= this.frameDurationMs){
        this.currentFrame = (this.currentFrame + 1) % this.seq.length;    
        drawTimestamp = ts;
      }
      if (!optTint){
        ctx.drawImage(GridForce.Utils.imageCache.images[this.image], offsetX, offsetY, this.width, this.height, p1[0], p1[1], p4[0]-p1[0], p4[1]-p1[1]);
      }else{
          var tmpCanvas = document.createElement ("canvas");
          tmpCanvas.setAttribute ("origin-clean", false);
          var tmpCtx = tmpCanvas.getContext ("2d");
          tmpCanvas.width = p4[0]-p1[0];
          tmpCanvas.height = p4[1]-p1[1];
          tmpCtx.drawImage(GridForce.Utils.imageCache.images[this.image], offsetX, offsetY, this.width, this.height, 0, 0, p4[0]-p1[0], p4[1]-p1[1]);
          tmpCtx.globalCompositeOperation = 'source-atop';
          tmpCtx.fillStyle="rgba(224,224,224,"+optTint+")";
          tmpCtx.fillRect(0,0,tmpCanvas.width, tmpCanvas.height);
          ctx.drawImage(tmpCtx.canvas, p1[0], p1[1]);
      }
    }
    this.draw = function(ctx, x, y, z, ts) {
      var p1 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2 , y - GridForce.SCREEN_Y / 2 , z]);
      var p4 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2  + this.width, y + this.height - GridForce.SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.drawTinted = function(ctx, x, y, z, flash, ts) {
      var p1 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2 , y - GridForce.SCREEN_Y / 2 , z]);
      var p4 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2  + this.width, y + this.height - GridForce.SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts, flash);
    }
    this.drawScaled = function(ctx, x, y, z, size_x, size_y, ts) {
      var p1 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2 , y - GridForce.SCREEN_Y / 2 , z]);
      var p4 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2  + size_x, y + size_y - GridForce.SCREEN_Y / 2 , z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.drawCentered = function(ctx, x, y, z, ts) {
      var p1 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2 - this.width/2, y - GridForce.SCREEN_Y / 2 - this.height/2, z]);
      var p4 = GridForce.Utils.project([x - GridForce.SCREEN_X / 2  + this.width/2, y - GridForce.SCREEN_Y / 2 + this.height/2, z]);
      this.drawSprite (ctx, p1, p4, ts);
    }
    this.getMaskPixel = function (x, y) {
      var offsetX = this.seq[this.currentFrame]*this.width;
      var offsetY = 0;
      return GridForce.Utils.imageCache.getMaskPixel (this.image, x, y);
    }
  }

GridForce.Player = function (){
    var char_speed = 8;
    this.size_x = 48;
    this.size_y = 16;
    this.size_z = 16;
  
    this.lives = 2;

    this.pos_x = GridForce.SCREEN_X / 2 - this.size_x / 2;
    this.pos_y = GridForce.SCREEN_Y * 0.30;
    this.pos_z = GridForce.ZS - intro_z;
    
    this.sprite = new GridForce.Sprite ("player", this.size_x, this.size_y);
    this.sprite.seq = [1];//[1,1,2,2];
    this.sprite.frameDurationMs = 50;
    this.statuses = {STATUS_ALIVE: 1, STATUS_DEAD: 2, STATUS_INTRO: 3, STATUS_GHOST: 4};
    this.status = this.statuses.STATUS_INTRO;
    
    this.status_timestamp = 0;
    var startingMs = 1000;
    
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
          this.pos_z = Math.round (GridForce.ZS - ((1-progress) * intro_z));
        } else {
          this.pos_z = GridForce.ZS;
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
    this.moveRight = function (speed) { this.pos_x = Math.min(GridForce.SCREEN_X - this.size_x, this.pos_x + calcSpeed(speed)); }
    this.moveUp = function (speed) { this.pos_y = Math.max(0, this.pos_y - calcSpeed(speed)); }
    this.moveDown = function (speed) { this.pos_y = Math.min(GridForce.SCREEN_Y - this.size_y, this.pos_y + calcSpeed(speed)); }
    
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

GridForce.Hud = function (player) {
    this.pos_z = 1000;
    
    var size_x = 32;
    var size_y = 16;
    
    this.sprite = new GridForce.Sprite ("hud", size_x, size_y);
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

GridForce.PlayerBullets = function () {
    var bullet_max_depth = 10000;
    this.bullet_speed = 50;

    var bullet_size = 3;
    var sprite = new GridForce.Sprite ("bullet", bullet_size, bullet_size); 

    var PlayerBullet = function (x, y, z) {
      this.pos_x = x;
      this.pos_y = y;
      this.pos_z = z;
      this.size_x = bullet_size;
      this.size_y = bullet_size;
      this.size_z = bullet_size;
      this.sprite = sprite;
      
      this.draw = function draw (ctx) {
        var p1 = GridForce.Utils.project([this.pos_x - GridForce.SCREEN_X / 2, this.pos_y - GridForce.SCREEN_Y / 2, this.pos_z]);
        var brightness = parseInt(255 * (bullet_max_depth - this.pos_z) / bullet_max_depth, 10);
        ctx.fillStyle = "rgb(" + brightness + ", " + brightness + ", " + brightness + ")";
        ctx.fillRect(p1[0], p1[1], this.size_x, this.size_y);
      }
    }
    
    this.bullets = [];  // reverse sorted by Z

    this.move = function move () {
      for (var i = 0; i < this.bullets.length; i++) {
        if (this.bullets[i]!=null){
          this.bullets[i].pos_z += this.bullet_speed;
        }
      }
      while (this.bullets.length > 0 && (this.bullets[0] == null || this.bullets[0].pos_z > bullet_max_depth)) {
        this.bullets.shift();
      }
    }
    this.fire = function (player) {
      this.bullets.push(new PlayerBullet (player.pos_x + player.size_x / 2, player.pos_y + player.size_y / 2, player.pos_z));
      /*this.bullets.push([player.pos_x-1, player.pos_y + player.size_y / 2, player.pos_z]);
      this.bullets.push([player.pos_x + player.size_x, player.pos_y + player.size_y / 2, player.pos_z]);*/
    }
  }
  
GridForce.EnemyBullets = function () {
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
      this.sprite = new GridForce.Sprite ("enemy_bullet", this.size_x, this.size_y);

      this.draw = function (ctx, ts) { this.sprite.draw (ctx, this.pos_x, this.pos_y, this.pos_z, ts); }
    }
    
    this.bullets = [];
    this.fire = function (x, y, z, speed_x, speed_y, speed_z) {
      GridForce.Utils.addToPaint (this.bullets, new EnemyBullet (x, y, z, speed_x, speed_y, speed_z, this.size_x, this.size_y, this.size_z));
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

GridForce.Enemy = function (imgName, spriteSeq, size_x, size_y) {
      this.size_x = size_x;
      this.size_y = size_y;
      this.size_z = 64;

      this.pos_x = 0;
      this.pos_y = 0;
      this.pos_z = 0;
      this.hitTimestamp = 0;

      this.path = null;//new LateralPatrol (x, y, z, this.size_x);
      
      this.sprite = new GridForce.Sprite (imgName, this.size_x, this.size_y);
      this.sprite.seq = spriteSeq;
      this.sprite.frameDurationMs = 100;
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

GridForce.FX = function () {
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
      GridForce.Utils.addToPaint(this.fx, newFX);
    }
    this.smallExplosion = function (x, y, z, ts) {
      var newFX = new Effect (x, y, z, ts, 100);
      newFX.sprite = new GridForce.Sprite ("explosion", 128, 128);
      newFX.sprite.seq = [2, 1, 1, 1, 0];
      newFX.sprite.frameDurationMs = 100 / (newFX.sprite.seq.length-1);
      this.addFX (newFX);
    }
    this.bigExplosion = function (x, y, z, ts, durationMs){
      var newFX = new Effect (x, y, z, ts, durationMs);
      newFX.sprite = new GridForce.Sprite ("explosion", 128, 128);
      newFX.sprite.seq = [2,2,3,4,5,6,7,8,9];
      newFX.sprite.frameDurationMs = durationMs / (newFX.sprite.seq.length-1);
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