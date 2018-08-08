var GridForce = window.GridForce || {};

GridForce.SCREEN_X = 800;
GridForce.SCREEN_Y = 400;

GridForce.ZS = 500;
  
GridForce.Control = function () {
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
          var dist = GridForce.Utils.distance (current.clientX, clientX, current.clientY, clientY);
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

GridForce.Sound = function () {
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

GridForce.Game = function () {
    var grid = new GridForce.Grid ();
    var player = new GridForce.Player ();
    var hud = new GridForce.Hud (player);
    var playerBullets = new GridForce.PlayerBullets ();
    var enemyBullets = new GridForce.EnemyBullets ();
    var enemies = new GridForce.Enemies ();
    var control = new GridForce.Control ();
    var sound = new GridForce.Sound ();
    var fx = new GridForce.FX ();
    var levels = new GridForce.Levels ();

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
      infoText.show ("Level "+(level+1), 1000);
    }
    
    var draw = function (timestamp) {
      var canvas = document.getElementById("canvas");
      if (canvas.getContext) {
        var level = levels.levels [levels.level % levels.levels.length];
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, GridForce.SCREEN_X, GridForce.SCREEN_Y);
        level.drawBackground (ctx);
        grid.drawGrid (ctx, level.gridColor, player);
        //drawObjects (ctx, timestamp);
        drawScene ([[hud, player], playerBullets.bullets, enemyBullets.bullets, enemies.enemies, fx.fx], ctx, timestamp);
        drawInfo (ctx, timestamp);
      }
    }
    
    var drawScene = function (objectLists, ctx, timestamp) {
      var cursors = [];
      for (var i=0; i<objectLists.length; i++) { cursors[i] = 0; }
      
      var done = false;

      while (!done) {
        var furthest_z = 0;
        for (var i=0; i< objectLists.length; i++) {
          var object = objectLists[i][cursors[i]];
          while (!object && cursors[i] < objectLists[i].length) {
            cursors[i]++;
            object = objectLists[i][cursors[i]];
          }
          if (object) {
            furthest_z = Math.max (furthest_z, object.pos_z);
          }
        }
        for (var i=0; i< objectLists.length; i++) {
          var object = objectLists[i][cursors[i]];
          if (object && object.pos_z == furthest_z) {
            object.draw (ctx, timestamp);
            cursors[i]++;
          }
        }
        done = (furthest_z == 0);
      }
    }

    var infoText = {
      active: 0,
      font: "32px LazenbyCompSmooth",
      text: "",
      show: function (text, timeMs) { 
        this.text=text; 
        this.active=1;
        var that = this;
        var timeOut = timeMs;
        setTimeout (function (){ that.active = 0; }, timeOut);
      },
    }
    
    var drawInfo = function (ctx, timestamp) {
      var level = levels.levels [levels.level % levels.levels.length];
      ctx.font         = '32px LazenbyCompSmooth';
      ctx.fillStyle = level.gridColor;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText  ('000000', 0, 0);
      
      ctx.font         = '24px LazenbyCompSmooth';
      ctx.fillStyle = level.gridColor;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'left';
      ctx.fillText  (player.lives, 0, GridForce.SCREEN_Y);
      
      var heatCenter = [GridForce.SCREEN_X-32,32]
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
          ctx.textBaseLine = "top";
          ctx.textAlign = 'center';
          ctx.font         = '16px LazenbyCompSmooth';
          ctx.fillText ("H", heatCenter[0], heatCenter[1]+8);
        }
      }
      
      if (infoText.active){
        ctx.textBaseLine= "middle";
        ctx.strokeStyle = "white";
        ctx.textAlign= 'center';
        ctx.font = infoText.font;
        ctx.strokeText (infoText.text, GridForce.SCREEN_X/2, GridForce.SCREEN_Y/2);
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
      var ts = timestamp;
      if (player.lives > 0){
        var deadMs = 2000;
        player.lives--;
        setTimeout (function () {player.reset(ts+deadMs);}, deadMs);
      } else {
        // TODO: game over
        var deadMs = 3000;
        infoText.show ("Game Over", deadMs);
        setTimeout (function () {location.reload();}, deadMs);
      }
    }
    
    var doCollisions = function (timestamp){
      if (player.status != player.statuses.STATUS_ALIVE) { return; }
      for (var i=0; i < enemyBullets.bullets.length; i++){
        var bullet = enemyBullets.bullets[i];
        if (GridForce.Utils.isCollision (bullet, player)){
            killPlayer(timestamp);
            return;
          
        }
      }
      for (var i=0; i< playerBullets.bullets.length; i++){
        var bullet = playerBullets.bullets[i];
        for (var j=0; j<enemies.enemies.length; j++) {
          var enemy = enemies.enemies[j];
          if (bullet != null && enemy.status == enemy.statuses.ALIVE) {
            if (GridForce.Utils.isCollision (bullet, enemy)){
                playerBullets.bullets[i] = null;
                enemy.hit (timestamp);
                if (enemy.status == enemy.statuses.ALIVE) {
                  fx.smallExplosion (bullet.pos_x+playerBullets.bullet_size/2, bullet.pos_y+playerBullets.bullet_size/2, enemy.pos_z, timestamp);
                } else {
                  sound.hit (1 - (Math.min (enemy.pos_z, 3000) / 3000)); // TODO: move to var
                  fx.bigExplosion (enemy.pos_x+(enemy.size_x/2), enemy.pos_y+(enemy.size_y/2), bullet.pos_z, timestamp, 500);
                }
                score.hit (timestamp);
            }
          }          
        }
      }
      var enemy = null;
      var locked = false;
      for (var i=0; i<enemies.enemies.length; i++) {
        enemy = enemies.enemies[i];
        if (enemy.status == enemy.statuses.ALIVE && 
            GridForce.Utils.collisionBox2D (player.pos_x, player.pos_y, player.size_x, player.size_y,
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
      GridForce.Utils.setSize ();
      //window.addEventListener('resize', GridForce.GridForce.Utils.setSize, false);
      //window.addEventListener('orientationchange', setSize, false);
      //window.addEventListener ("touchstart", function init_audio() {sound.shot ();window.removeEventListener (init_audio);}, false);
      window.addEventListener('orientationchange', GridForce.Utils.setSize, false);
      startLevel (window.performance.now());
      window.requestAnimationFrame(render);
    }
  }


//new GridForce.Game().start ();
var menu = new GridForce.Menu();
menu.setCallback (function (){ new GridForce.Game().start (); });
menu.start();
