var GridForce = window.GridForce || {};

GridForce.ImageCache = function (){
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
    
    var calculateMask = function (name, img){
      var image = img;
      var canvas = GridForce.Utils.convertImageToCanvas (image);
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
      var that = this;
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = function () { 
        that.add (name, img, solid);
      }
    }
    this.add = function (name, image, solid) {
      this.images[name] = image;
      loaded.push(name);
      if (solid) {
        calculateMask(name, image);
      }
    }
    this.done = function () { return (loaded.length == assets.length); }
        
    for (var i=0; i<assets.length; i++) { 
      this.load (assets[i][0], assets[i][1], assets[i][2]);
    }
  };

GridForce.Utils = {
    project: function (p) {
      var ret = [
        p[0] * GridForce.ZS / p[2] + GridForce.SCREEN_X / 2,
        p[1] * GridForce.ZS / p[2] + GridForce.SCREEN_Y / 2
      ];
      return ret;
    },
    addToPaintLinear: function addToPaintLinear (list, item){
      // Deprecated
      var zOrder = 0;
      while (zOrder < list.length && list[zOrder].pos_z>item.pos_z){
        zOrder++;
      }
      list.splice (zOrder, 0, item);  // in-order insert
    },
    addToPaint: function addToPaint (list, item){
      // Tested at http://jsfiddle.net/RMh78/471/
      if (list.length == 0){
      	list.push (item);
        return list;
      }
      var start = 0;
      var end = list.length;
 
      while (end - start > 1){
        var middle = Math.floor ((start + end) / 2);
        if ( list[middle].pos_z > item.pos_z ) {
        	start = middle;
        } else {
        	end = middle;
        }
      }
      var index = list[start].pos_z < item.pos_z? start : start +1; 
      list.splice (index, 0, item);  // in-order insert
      return list;
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
    isCollision: function isCollision (o1, o2) {
      return this.collisionBox3D (
                                    o1.pos_x, o1.pos_y, o1.pos_z, o1.size_x, o1.size_y, o1.size_z, 
                                    o2.pos_x, o2.pos_y, o2.pos_z, o2.size_x, o2.size_y, o2.size_z)
      && this.collisionSprite (
                                    o1.pos_x, o1.pos_y, o1.sprite,
                                    o2.pos_x, o2.pos_y, o2.sprite);
    },
    distance: function distance (x1, y1, x2, y2) { return Math.sqrt (((x2-x1)*(x2-x1))+((y2-y1)*(y2-y1))) },
  
    convertImageToCanvas: function convertImageToCanvas (image) {
      var canvas = document.createElement("canvas");
      canvas.setAttribute ("origin-clean", false);
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
      return canvas;
    },
  
    setSize: function () {
      var ctx = document.getElementById("canvas").getContext("2d");
      
      var ww=window.innerWidth;
      var wh=window.innerHeight;
      
      var pref_w = 800;
      var pref_h = 400;
      
      if (ww / pref_w < wh / pref_h){
        GridForce.SCREEN_X = Math.min (pref_w, window.innerWidth);
        GridForce.SCREEN_Y = GridForce.SCREEN_X / 2;
      } else {
        GridForce.SCREEN_Y = Math.min (pref_h, window.innerHeight);
        GridForce.SCREEN_X = GridForce.SCREEN_Y * 2;
      }
      ctx.canvas.width = GridForce.SCREEN_X
      ctx.canvas.height = GridForce.SCREEN_Y;
    },
    imageCache: new GridForce.ImageCache (),
  }
  