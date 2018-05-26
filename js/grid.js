var GridForce = window.GridForce || {};

GridForce.Grid = function (){
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
        var height = 80 * ((GridForce.SCREEN_Y - player.pos_y)/GridForce.SCREEN_Y);
        for (var i = 0; i < this.DIM; i++) {
          var sp1 = this.points[i * this.DIM + 1];
          var sp2 = this.points[(i + 1) * this.DIM - 1];
          var p1 = GridForce.Utils.project(this.rotate([sp1[0], sp1[1]+height, sp1[2] - this.offset]));
          var p2 = GridForce.Utils.project(this.rotate([sp2[0], sp2[1]+height, sp2[2] - this.offset]));
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);

          sp1 = this.points[i];
          sp2 = this.points[(this.DIM - 1) * this.DIM + i];
          var p1 = GridForce.Utils.project(this.rotate([sp1[0], sp1[1]+height, sp1[2] - this.offset]));
          var p2 = GridForce.Utils.project(this.rotate([sp2[0], sp2[1]+height, sp2[2] - this.offset]));

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
  };