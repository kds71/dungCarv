/* 
  ===========================================================================

  dungCarv

  ===========================================================================

  Copyright 2009 Łukasz Jasiński
 
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
 
  http://www.apache.org/licenses/LICENSE-2.0
 
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  ===========================================================================

  For minified version check dungCarv.min.js file.

  ===========================================================================
*/ 

function trace(msg) {
  if (!console) return;
  if (!console.log) return;

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      msg = msg.replace('%'+i, arguments[i]);
    }
  }

  console.log(msg);
}

// Extending array prototype by function which returns random array cell,
// removing it from array.

Array.prototype.rnd = function() {
  if (this.length == 0) return null;
  var r = Math.floor(Math.random() * this.length);
  return this.splice(r, 1).pop();
}

// Extending Math namespace by function which returns random value
// within [A, B] range (including A and B).

Math.rnd = function(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function dungCarv(options) {
  // Set default values for some options (if they are undefined).
  if (!options.padding) options.padding = 1;
  if (!options.randomness) options.randomness = 0.0;
  if (!options.twistness) options.twistness = 0.0;

  // Some options have to be set.
  if (!options.mapWidth || !options.mapHeight) {
    return {
      success: false
    };
  }

  var carver = {
    /* Constants */
    
    // It is impossible to use const keyword, because it doesn't work in IE.
    // Only thing to do is use normal variables and pretend they are constants.

    MAP_WIDTH:       options.mapWidth,
    MAP_HEIGHT:      options.mapHeight,

    TILE_WALL:       0,
    TILE_CORRIDOR:   1,
    TILE_ROOM:       2,
    TILE_DOOR:       3,
    TILE_ENTRANCE:   4,
    TILE_EXIT:       5,
    TILE_WALL_LOOP:  6,

    BOUND_TOP:       options.padding,
    BOUND_RIGHT:     options.mapWidth - options.padding - 1,
    BOUND_BOTTOM:    options.mapHeight - options.padding - 1,
    BOUND_LEFT:      options.padding,

    DIR_NONE:        0,
    DIR_UP:          1,
    DIR_RIGHT:       2,
    DIR_DOWN:        3,
    DIR_LEFT:        4,

    /* Variables */

    map:             [],
    queue:           [],
    success:         false,
    finished:        false,
    started:         false,
    dir:             this.DIR_NONE,
    elem:            null,
    depth:           0,

    /* Functions */

    create: function() {
      this.fill(this.TILE_WALL);
      this.generate();
      return this.returnValue();
    },

    generate: function() {
      while (!this.finished) {
        this.step();
      }
    },

    step: function() {
      if (!this.started) {
        var x;
        var y;
        if (!options.entrance || !options.entrance.x || !options.entrance.y) {
          x = Math.rnd(this.BOUND_LEFT, this.BOUND_RIGHT);
          y = Math.rnd(this.BOUND_TOP, this.BOUND_BOTTOM);
        } else {
          x = options.entrance.x;
          y = options.entrance.y;
        }

        this.started = true;
        this.queue.push({x:x,y:y});

        this.set(x, y, this.TILE_ENTRANCE);
        return;
      }

      if (this.elem && this.queue.length > 0 && Math.random() < options.randomness) {
        var x = this.elem.x;
        var y = this.elem.y;
        this.elem = this.queue.rnd();
        this.queue.push({x:x,y:y});
      }

      if (!this.elem) {
        if (this.queue.length == 0) {
          this.finished = true;
          return;
        } else {
          this.elem = this.queue.rnd();
        }
      }

      var dirs = this.avaibleDir(this.elem.x, this.elem.y);
      if (dirs.length == 0) {
        this.elem = null;
        return;
      }

      if (dirs.indexOf(this.dir) == -1 || Math.random() < options.twistness)
        this.dir = dirs.rnd();

      switch (this.dir) {
      case this.DIR_UP:
        this.elem.y--;
        break;
      case this.DIR_RIGHT:
        this.elem.x++;
        break;
      case this.DIR_DOWN:
        this.elem.y++;
        break;
      case this.DIR_LEFT:
        this.elem.x--;
        break;
      }

      this.queue.push({x:this.elem.x,y:this.elem.y});
      this.set(this.elem.x, this.elem.y, this.TILE_CORRIDOR);
    },

    set: function(x, y, tile) {
      // trace('setting %1 %2 to %3', x, y, tile);
      this.map[this.xy(x, y)] = tile;
    },

    avaibleDir: function(x, y) {
      var d = [];
      if (this.testMove(x, y - 1, this.DIR_UP)) d.push(this.DIR_UP);
      if (this.testMove(x + 1, y, this.DIR_RIGHT)) d.push(this.DIR_RIGHT);
      if (this.testMove(x, y + 1, this.DIR_DOWN)) d.push(this.DIR_DOWN);
      if (this.testMove(x - 1, y, this.DIR_LEFT)) d.push(this.DIR_LEFT);
      return d;
    },

    testMove: function(x, y, dir) {
      var bound = {};
      switch (dir) {
      case this.DIR_UP:
        bound = { l: x - 1, t: y - 1, r: x + 1, d: y };
        break;
      case this.DIR_RIGHT:
        bound = { l: x, t: y - 1, r: x + 1, d: y + 1 };
        break;
      case this.DIR_DOWN:
        bound = { l: x - 1, t: y, r: x + 1, d: y + 1 };
        break;
      case this.DIR_LEFT:
        bound = { l: x - 1, t: y - 1, r: x, d: y + 1 };
        break;
      }
      for (var x = bound.l; x <= bound.r; x++) {
        for (var y = bound.t; y <= bound.d; y++) {
          if (!this.testTile(x, y, [this.TILE_WALL])) return false;
        }
      }
      return true;
    },

    testTile: function(x, y, tiles) {
      if (x < this.BOUND_LEFT-1 || x > this.BOUND_RIGHT+1) return false;
      if (y < this.BOUND_TOP-1 || y > this.BOUND_BOTTOM+1) return false;
      return tiles.indexOf(this.map[this.xy(x, y)]) != -1;
    },

    returnValue: function() {
      this.success = true;
      var rv = {
        success: this.success
      };

      if (this.success) {
        rv.map = this.map;

        if (options.returnRoomData)
          rv.roomData = this.generateRoomData();

        if (options.returnDoorData)
          rv.doorData = this.generateDoorData();

        if (options.returnStatistics)
          rv.statistics = this.generateStatistics();
      }

      return rv;
    },

    xy: function(x, y) {
      return x + y * options.mapWidth;
    },

    fill: function(tile, area) {
      if (typeof area == 'undefined') {
        area = { sx: 0, sy: 0, ex: options.mapWidth - 1, ey: options.mapHeight - 1 };
      }

      var xy = this.xy;

      for (var x = area.sx; x <= area.ex; x++) {
        for (var y = area.sy; y <= area.ey; y++) {
          this.map[xy(x,y)] = tile;
        }
      }
    }
  };

  return carver.create();
}
