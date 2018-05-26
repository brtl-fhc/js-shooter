var GridForce = window.GridForce || {};

GridForce.Menu = function() {
    var grid = new GridForce.Grid ();
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
      ctx.fillRect(0, 0, GridForce.SCREEN_X, GridForce.SCREEN_Y);
      grid.drawGrid (ctx, "green", {pos_y: GridForce.SCREEN_Y});
      ctx.font         = '48px LazenbyCompSmooth';
      ctx.strokeStyle = "lime";
      ctx.fillStyle = "lime";
      ctx.textBaseline = 'middle';
      ctx.textAlign = "center";
      ctx.strokeText  ('-= G r i d  F o r c e =-', GridForce.SCREEN_X/2, GridForce.SCREEN_Y/3);
      if ((timestamp-start_ts)%1500 < 750){
        ctx.font         = '24px LazenbyCompSmooth';
        ctx.strokeText  ('F i r e  t o  s t a r t', GridForce.SCREEN_X/2, 2*GridForce.SCREEN_Y/3);
      }
      window.requestAnimationFrame(render);
    }

    var callback = function () { window.alert ("Overload me"); };
  
    var dismiss = function (){
      window.removeEventListener('keydown', handleKey, false);
      window.removeEventListener('touchstart', handleTouch, false);
      // TODO: fade 
      if (callback) {
        callback ();
      }
    }
    
    var handleKey = function (event){
      var code = event.keyCode;
      if (code == 32 || code == 17) {
        dismiss ();
      }
    }
    
    var handleTouch = function (event){
      if (event.touches.length > 1){
        dismiss ();
      }
    }
    
    this.start = function () {
      grid.speed = 4;
      GridForce.Utils.setSize();
      window.addEventListener('orientationchange', GridForce.Utils.setSize, false);

      window.addEventListener('keydown', handleKey, false);
      window.addEventListener('touchstart', handleTouch, false);
      window.requestAnimationFrame(render);
    }
    
    this.setCallback = function (f){
      callback = f;
    }
}