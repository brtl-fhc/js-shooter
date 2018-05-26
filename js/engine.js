var GridForce = window.GridForce || {};

GridForce.Levels = function () {
    var imgSaturn = new Image();
    imgSaturn.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2Fsaturn.jpg?1510568809912";
    var imgSun = new Image ();
    imgSun.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F9103296900_0d383feabf_z.jpg?1511356896867";
    var imgEclipse = new Image();
    imgEclipse.src = "https://cdn.glitch.com/20479d99-08a6-4766-8f07-0a219aee615a%2F36326775510_eda3cf9402_z.jpg?1511358509011";
    
    this.levels = [
      {drawBackground: function (ctx){ ctx.drawImage(imgSaturn, 0, 376 / 2, 640, 376 / 2, -60, 0, GridForce.SCREEN_X, 376 / 2); }, gridColor: "limegreen"},
      {drawBackground: function (ctx){ ctx.drawImage(imgEclipse, 0, 434/2, 640, 434/2, 60, 0, GridForce.SCREEN_X, 434/2); }, gridColor: "violet"},
      {drawBackground: function (ctx){ ctx.drawImage(imgSun, 0, 320, 640, 320, 0, -100, GridForce.SCREEN_X, 320); }, gridColor: "orange"}
    ];
    this.level = null;
  }

GridForce.Patrol = {
   StaticPatrol: function (px, py, z){
      this.positionAt = function (){
        return [Math.round(GridForce.SCREEN_X*px), Math.round(GridForce.SCREEN_Y*py), z];
      }
    },
    
    LateralPatrol: function (px, py, z, size_x, start_ts, periodMs) { // x and y relative to viewport size
      this.positionAt = function (timestamp) {
        var corrected_z = Math.round (z);
        if (timestamp < start_ts + (periodMs/2)) {
          var percent = (timestamp - start_ts)/(periodMs/2);
          corrected_z = Math.round (z+((5000-z)*(1-Math.sin(Math.PI/2*percent))));
        }
        var length = GridForce.SCREEN_X - size_x;
        var offset = ((px*GridForce.SCREEN_X)/length/2);
        var progress = ((timestamp + (offset*periodMs)) % periodMs)/periodMs;
        if (progress < 0.5) { // rightbound (0, 0.5) => (0, length)
          return [Math.round(length*progress*2), Math.round(GridForce.SCREEN_Y*py), corrected_z];
        } else {  // leftbound (0.5, 1) => (length, 0)
          return [Math.round(length * (1-((progress-0.5)*2))), Math.round(GridForce.SCREEN_Y*py), corrected_z];
        }
      }
    },
    
    ParabolicPatrol: function (py, dy, z, start_ts, reverse) {
      var duration = 6000;
      var length_x = GridForce.SCREEN_X+100;
      this.positionAt = function (timestamp){
        var elapsed = timestamp - start_ts;
        if (elapsed > duration) {return null;}
        var progress = elapsed/duration;
        var x = reverse? GridForce.SCREEN_X+50-(length_x * progress) : -50+(length_x * progress);
        var y = GridForce.SCREEN_Y*(py+(progress*dy));
        return [x, y, z - 0.004*((x-(GridForce.SCREEN_X/2))*(x-(GridForce.SCREEN_X/2)))];
    }
  }
}

GridForce.Enemies = function () {
    this.enemies = [];  // reverse z-sorted for painting. Rebuilt for each frame.    
    
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
            GridForce.Utils.addToPaint (enemies.enemies, wave[i]);
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
        var enemy = new GridForce.Enemy ("enemy_fly", [0], 64, 64);
        enemy.hp = 5;
        enemy.path = new GridForce.Patrol.ParabolicPatrol (Math.random ()*0.8, dy, 1000, timestamp+(i*500), (Math.round(timestamp)%2)>0); //new LateralPatrol (0, 0.5, 1200, enemy.size_x);
        wave.add (enemy);        
      }
      return wave;
    }
    this.createStaticWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      for (var i=0; i<(1); i++) {
        var enemy = new GridForce.Enemy ("enemy_plane", [0], 450, 256);
        enemy.hp = 2500;
        enemy.path = new GridForce.Patrol.StaticPatrol (0.4, 0.6, 1200); //new LateralPatrol (0, 0.5, 1200, enemy.size_x);
        wave.add (enemy);        
      }
      return wave;
    }
    this.createLateralWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      var enemy = new GridForce.Enemy ("enemy_tron", [0,1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1], 64, 64);
      enemy.hp = 25 + (level * 15);
      enemy.path = new GridForce.Patrol.LateralPatrol (Math.random (), Math.random ()*0.9, 1500 - (Math.random()*500), enemy.size_x, timestamp, 12000);
      wave.add (enemy);
      return wave;
    }
    this.createBossWave = function (level, timestamp) {
      var wave = new Wave (timestamp);
      var enemy = new GridForce.Enemy ("boss", [0,1], 1800, 240);
      enemy.hp = 200 + (level * 30);
      enemy.path = new GridForce.Patrol.LateralPatrol (Math.random (), Math.random ()*0.9, 1500 - (Math.random()*500), enemy.size_x, timestamp, 24000);
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