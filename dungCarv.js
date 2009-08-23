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

/* MAIN FUNCTION */
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

  /* Main object - dungeon carver */
  
  // To prevent name collisions object is created with object initializer
  // inside anonymous namespace.

  return ({
    /* Constants */
    
    // It is impossible to use const keyword, because it doesn't work in IE.
<<<<<<< HEAD
    // The solution is to use normal variables and pretend they are constants.
=======
    // Everything that can be done is usage of normal variables and pretend
    // that they are constants.
>>>>>>> origin/master

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
    started:         false,
    finished:        false,
    dir:             this.DIR_NONE,
    elem:            null,

    /* Functions */

    // create() function is called after creating object.
    // It calls other functions in order to generate and return
    // dungeon map.

    create: function() {
      this.fill(this.TILE_WALL);
      this.generate();
      return this.returnValue();
    },

    // generate() contains main loop of maze generating routine

    generate: function() {
      while (!this.finished) {
        this.step();
      }
    },

    // step() executes single step in main loop of maze generation
    // routine. It is easier to maintain this procedure when it is
    // stored in other function, called from main loop.

    step: function() {
      // First step. If dungCarv() function was called without
      // data describing entrance coordinates, these coordinates
      // will be chosen randomly.
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

      // Option "randomness" in action - if there is selected element and queue
      // isn't empty, it is possible that another element will be chosen.
      if (this.elem && this.queue.length > 0 && Math.random() < options.randomness) {
        var x = this.elem.x;
        var y = this.elem.y;
        this.elem = this.queue.rnd();
        this.queue.push({x:x,y:y});
      }

      // If there is no selected element, we have to select one.
      // If there are no elements to select left, we finished carving maze.
      if (!this.elem) {
        if (this.queue.length == 0) {
          this.finished = true;
          return;
        } else {
          this.elem = this.queue.rnd();
        }
      }

      // Check for avaible ways to carve. If there are no ways, drop
      // selected element - it is useless now.
      var dirs = this.avaibleDir(this.elem.x, this.elem.y);
      if (dirs.length == 0) {
        this.elem = null;
        return;
      }

      // Option "twistness" in action - if carver can't carve in current
      // directory anymore OR obtained random value is lower than "twistness",
      // there is a need to change carving direction.
      if (dirs.indexOf(this.dir) == -1 || Math.random() < options.twistness)
        this.dir = dirs.rnd();

      // Just move in valid direction.
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

      // There is a new corridor in this place, store it in map array.
      this.set(this.elem.x, this.elem.y, this.TILE_CORRIDOR);

      // Insert new element in queue - carver will back to it later.
      this.queue.push({x:this.elem.x,y:this.elem.y});
    },

    // Simple functions used to manage map array easier.

    set: function(x, y, tile) {
      this.map[this.xy(x, y)] = tile;
    },

    xy: function(x, y) {
      return x + y * options.mapWidth;
    },

    // avaibleDir() checks every direction to determine all directions avaible 
    // for carving (for given point x,y).

    avaibleDir: function(x, y) {
      var d = [];
      if (this.canCarve(x, y - 1, this.DIR_UP)) d.push(this.DIR_UP);
      if (this.canCarve(x + 1, y, this.DIR_RIGHT)) d.push(this.DIR_RIGHT);
      if (this.canCarve(x, y + 1, this.DIR_DOWN)) d.push(this.DIR_DOWN);
      if (this.canCarve(x - 1, y, this.DIR_LEFT)) d.push(this.DIR_LEFT);
      return d;
    },

    // canCarve() returns true when target tile and all tiles around
    // target tile are occupied by wall. Examples (^ shows position of carver
    // before digging next corridor):
    //
    // ### 1. Valid. Carver can carve here.
    // ### 
    // .^. 
    // 
    // ... 2. Invalid. Carving will create loop.
    // ### 
    // .^. 
    // 
    // ### 3. Invalid. There is no wall on target tile.
    // #.# 
    // .^. 
    // 
    // ##. 4. Invalid. Carver refuse to create corridor tiles
    // ###    connected diagonally (due to aesthetical reasons).
    // .^. 
    // 

    canCarve: function(x, y, dir) {
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

    // testTile() is simple function which checks content of tile.
    // It return false:
    // - when tile is outside defined bounds
    // - when tile content is different than every tile in array
    //   passed as argument to testTile()

    testTile: function(x, y, tiles) {
      if (x < this.BOUND_LEFT-1 || x > this.BOUND_RIGHT+1) return false;
      if (y < this.BOUND_TOP-1 || y > this.BOUND_BOTTOM+1) return false;
      return tiles.indexOf(this.map[this.xy(x, y)]) != -1;
    },

    // This function generates object which will be returned to user after
    // creating dungeon.

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

    // Fill area with given tile. If area is not defined, fill whole map.

    fill: function(tile, area) {
      if (typeof area == 'undefined') {
        area = { sx: 0, sy: 0, ex: this.MAP_WIDTH - 1, ey: this.MAP_HEIGHT - 1 };
      }

      var xy = this.xy;

      for (var x = area.sx; x <= area.ex; x++) {
        for (var y = area.sy; y <= area.ey; y++) {
          this.map[xy(x,y)] = tile;
        }
      }
    }

  // end of anonymous namespace...
  }).create();
}
