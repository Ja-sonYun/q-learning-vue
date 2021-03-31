const qlearningFirstComponent = Vue.component("qlearning-first", {
name: 'qlearning-first',
template:
'<div>' +
'<div>' +
'<b-field label="Speed (low is faster)"><b-numberinput v-model="fps" min="0" step="10" controls-position="compact"></b-numberinput></b-field>' +
'<b-field label="Learning rate"><b-numberinput v-model="PARAMETER" min="0" step=".05" :max="0.99" controls-position="compact" :disabled="status == \'running\'"></b-numberinput></b-field>' +
'<b-field label="Learning count"><b-numberinput v-model="executeInterval" min="1" controls-position="compact" :disabled="status == \'running\'"></b-numberinput></b-field>' +
'</div><hr>' +
'<div class="buttons">' +
'<b-button @click="start" :type="runningI">{{ runningT }}</b-button>' +
'<b-button @click="reset" type="is-danger">reset</b-button>' +
'<b-button @click="runResult" type="is-success" :disabled="status != \'finish\'">Run Result</b-button>' +
'</div>' +
'<div class="columns is-desktop">' +
'<div class="column">' +
'<pre style="font-size: 15px;">' +
// '+--------+---+\n' +
    // '|        |   |\n' +
    // '|        |   + ↑ -+-----+\n' +
    // '|        |        |     |\n' +
    // '+---- ↑ -+- ↑ ----+     |\n' +
    // '|        |        ←     |\n' +
    // '|        ←        |     |\n' +
    // '+ ↑ -----+--------+-----+\n' +
		'<strong>{{ str }}</strong>' +
    '</pre>' +
	'</div>' +
	'<div class="column">' +
	'<pre>' +
	'<strong>Status :</strong> {{ status }} {{ error_str }}\n' +
	'<strong>Step counts :</strong> {{ executeCount }}\n' +
	'<strong>Learning counts :</strong> {{ reachToGoalCount }} / {{ executeInterval }}\n' +
	'<strong>Current position :</strong> [{{currentPos[0]}}, {{currentPos[1]}}]\n' +
	'</pre>' +
	'</div>' +
	'</div>' +
	'</div>',
	data() {
		return {
			PARAMETER: 0.9,
			status: 'stop',
			executeInterval: 10,
			executeCount: 0,
			reachToGoalCount: 0,
			running: false,
			runningI: 'is-dark',
			runningT: 'move',
			str: 'uninitialize',
			error_str: '',
			draw: [],
			draw_original: [],
			// beforeStart: ['\n',
			// '┏━━━━━━━━┳━━━┓\n',
			// '┃ (A)    ┃(B)┃\n',
			// '┃        ┃   ┗┛↑┗━┳━━━━━┓\n',
			// '┃        ┃        ┃     ┃\n',
			// '┣━━━╴↕╶━━╋━╴↕╶━━━━┩ (C) ┃\n',
			// '┃ (E)    ╿        ↔     ┃\n',
			// '┃        ↔  (D)   ╽     ┃\n',
			// '┗┓↓┏━━━━━┷━━━━━━━━┻━━━━━┛\n',
			// '\n'],
			beforeStart: ['\n',
			'+--------+---+\n',
			'|        |   |  EXIT\n',
			'|        |   +-| |+-----+\n',
			'|        |        |     |\n',
			'+---| |--+-| |----+     |\n',
			'|        |              |\n',
			'|                 |     |\n',
			'+-| |----+--------+-----+\n',
			'   EXIT\n'],
			// beforeStart: ['\n',
			//     '┏━━━━━━━━┓\n',
			//     '┃        ┣┛↑┗━━┓\n',
			//     '┃   ■    ┃     ┃\n',
			//     '┃              ┃\n',
			//     '┗━━━━━━┓↓┏━━━━━┛\n',
			//     '\n'],
			wall: ['┃', '■', '╋', '━', '┓', '┗', '┛', '┏', '┷', '┻', '┳', '╴', '╶', '╽', '╿', '┩', '┣', '|', '+', '-'],
			goal: ['↓', '↑', 'E'],
			door: ['↕', '↔'],
			human: 'O',
			x: 26,
			y: 10,
			startFrom: [22, 4],
			currentPos: [0, 0],
			previousPos: [0, 0],
			rewards: [],
			rewards_str: 'uninitialize',
			rewards_str_stack: [],
			fps: 60,
		}
	},
	methods: {
		initialize() {
			for(var i = 0; i < this.y; i++) {
				var str_array = this.beforeStart[i].split('');
				var tmp = new Array(this.x);
				var tmp2 = new Array(this.x);
				var tmp3 = new Array(this.x);
				for(var j = 0; j < this.x; j++) {
					var tmp4 = new Array(4);
					for(var k = 0; k < 4; k++) {
						tmp4[k] = 0;
					}
					tmp3[j] = tmp4;
					if(str_array[j] != null) {
						tmp[j] = str_array[j];
						tmp2[j] = str_array[j];
					} else {
						tmp[j] = '';
						tmp2[j] = '';
					}
				}
				this.draw.push(tmp);
				this.draw_original.push(tmp2);
				this.rewards.push(tmp3);
			}
			this.currentPos = this.deepCopyArray(this.startFrom);
		},
		renderScreen() {
			this.str = '';
			this.draw[this.currentPos[1]][this.currentPos[0]] = this.human;
			for(var i = 0; i < this.y; i++) {
				for(var j = 0; j < this.x; j++) {
					this.str += this.draw[i][j];
				}
			}
		},
		prepareReRender() {
			this.previousPos = this.deepCopyArray(this.currentPos);
		},
		reRenderScreen() {
			if(this.previousPos[0] != this.currentPos[0] || this.previousPos[1] != this.currentPos[1]) {
				this.draw[this.previousPos[1]][this.previousPos[0]] = this.draw_original[this.previousPos[1]][this.previousPos[0]];
			}
			this.renderScreen();
		},
		renderLog() {
			this.rewards_str = '';
			for(var i = 0; i < this.rewards_str_stack.length; i++) {
				this.rewards_str += this.rewards_str_stack[i] + '\n';
			}
		},
		start() {
			if(!this.running) {
				this.setRunning();
			} else {
				this.setStop();
				return true;
			}

			this.moving();
		},
		setRunning() {
			this.running = true;
			this.runningI = 'is-warning';
			this.runningT = 'stop';
			this.status = 'running';
		},
		setStop() {
			this.running = false;
			this.runningI = 'is-dark';
			this.runningT = 'move';
			this.status = 'stop';
			console.log('Below array is a map.');
			console.log(this.draw);
			console.log('And below array is a learning result');
			console.log(this.rewards);

		},
		runResult() {
			this.status = 'Running Result';
			this.setRunning();
			this.softReset();
			this.resultMove();
		},
		resultMove() {
			if(this.running == false) {
				this.status = 'finish';
				return true;
			}
			setTimeout(() => {
				this.prepareReRender();
				if(!this.moveBasedByRewards()) {
					this.reachToGoalCount += (this.reachToGoalCount == this.executeInterval) ? 0 : 1;
				}
				this.reRenderScreen();
				this.resultMove();
			}, 500);
		},
		moving() {
			if(this.running == false) {
				return true;
			}
			if(this.reachToGoalCount == this.executeInterval+1) {
				return true;
			}
			if(this.reachToGoalCount == this.executeInterval) {
				this.resultMove();
			} else {
				this.executeCount += 1;
				// this.renderingRewards();
				setTimeout(() => {
					this.prepareReRender();
					this.move();
					this.reRenderScreen();
					this.moving();
				}, this.fps);
			}
		},
		moveBasedByRewards() {
			var currentPosRewards = [this.rewards[this.currentPos[1]][this.currentPos[0]][0],
									this.rewards[this.currentPos[1]][this.currentPos[0]][1],
									this.rewards[this.currentPos[1]][this.currentPos[0]][2],
									this.rewards[this.currentPos[1]][this.currentPos[0]][3]]
			var moveTo_max = currentPosRewards.reduce(function(previous, current) {
				return previous > current ? previous : current;
			});
			console.log(this.currentPos + ' ' + currentPosRewards + ' , move to ' + moveTo_max);
			if(moveTo_max == 0) {
				this.setStop();
				if(this.currentPos[0] == this.startFrom[0] && this.currentPos[1] == this.startFrom[1]) {
					this.error_str = 'Failed! Need to increase the interval';
					return true;
				} else {
					this.status = 'finish';
					return false;
				}
			}
			if(this.rewards[this.currentPos[1]][this.currentPos[0]][0] == moveTo_max) {
				this.currentPos[0] -= 1;
			} else if(this.rewards[this.currentPos[1]][this.currentPos[0]][1] == moveTo_max) {
				this.currentPos[1] += 1;
			} else if(this.rewards[this.currentPos[1]][this.currentPos[0]][2] == moveTo_max) {
				this.currentPos[1] -= 1;
			} else if(this.rewards[this.currentPos[1]][this.currentPos[0]][3] == moveTo_max) {
				this.currentPos[0] += 1;
			}

			return true;
		},
		move() {
			var moveTo = Math.floor(Math.random() * 4);
			// 0 => left, 1 => down, 2 => up, 3 => right
			switch(moveTo) {
				case 0: // left
					if(this.isWall(this.draw[this.currentPos[1]][this.currentPos[0]-1])) {
						break;
					}
					this.currentPos[0] -= 1;
					this.calculate(0);
					break;
				case 1: // down
					if(this.isWall(this.draw[this.currentPos[1]+1][this.currentPos[0]])) {
						break;
					}
					this.currentPos[1] += 1;
					this.calculate(1);
					break;
				case 2: // up
					if(this.isWall(this.draw[this.currentPos[1]-1][this.currentPos[0]])) {
						break;
					}
					this.currentPos[1] -= 1;
					this.calculate(2);
					break;
				case 3: // right
					if(this.isWall(this.draw[this.currentPos[1]][this.currentPos[0]+1])) {
						break;
					}
					this.currentPos[0] += 1;
					this.calculate(3);
					break;
			}
		},
		isWall(i) {
			return (this.wall.includes(i)) ? true : false;
		},
		isGoal(i) {
			return (this.goal.includes(i)) ? true : false;
		},
		deepCopyArray(array) {
			var rev = [];
			for(var i = 0; i < array.length; i++) {
				rev.push(array[i]);
			}
			return rev;
		},
		renderingRewards() {
			this.rewards_str = '';
			for(var i = 0; i < this.y; i++) {
				for(var j = 0; j < this.x; j++) {
					if(j >= this.x-2) {
						this.rewards_str += this.rewards[i][j];
					} else {
						this.rewards_str += this.rewards[i][j] + ',';
					}
				}
			}
		},
		softReset() {
			this.draw[this.previousPos[1]][this.previousPos[0]] = this.draw_original[this.previousPos[1]][this.previousPos[0]];
			this.currentPos = this.deepCopyArray(this.startFrom);
			this.previousPos = [0, 0];
			this.renderScreen();
		},
		reset() {
			this.running = false;
			this.runningI = 'is-dark';
			this.status = 'initialized';
			this.runningT = 'move';
			this.executeInterval = 10;
			this.executeCount = 0;
			this.reachToGoalCount = 0;
			this.draw = [];
			this.draw_original = [];
			this.rewards = [];
			this.currentPos = [0, 0];
			this.error_str = '';
			this.previousPos = [0, 0];
			this.fps = 60;
			this.initialize();
			this.renderScreen();
			// this.renderingRewards();
		},
		calculate(direction) {
			var R = 0;
			if(this.isGoal(this.draw_original[this.currentPos[1]][this.currentPos[0]])) {
				this.reachToGoalCount += 1;
				R = 100; // goal
				this.rewards[this.previousPos[1]][this.previousPos[0]][direction] += R;
				console.log('[' + this.previousPos[0] + ',' + this.previousPos[1] + ']['+direction+'] : ' + this.rewards[this.previousPos[1]][this.previousPos[0]][direction] + ' this is at goal');
				this.softReset();
			}
			var Max_Q_array = [this.rewards[this.currentPos[1]][this.currentPos[0]][0],
						this.rewards[this.currentPos[1]][this.currentPos[0]][1],
						this.rewards[this.currentPos[1]][this.currentPos[0]][2],
						this.rewards[this.currentPos[1]][this.currentPos[0]][3]] // Q{ }
			var MaxQ = Max_Q_array.reduce(function(previous, current) {
				return previous > current ? previous : current;
			}); // Max Q

			var Q = R + this.PARAMETER * MaxQ;
			// Q(state, action) = R(state, action) + y * Max[Q...]

			this.rewards[this.previousPos[1]][this.previousPos[0]][direction] = Q;
			// if(Q != 0) {
			//     console.log('[' + this.previousPos[0] + ',' + this.previousPos[1] + ']['+direction+'] : ' + Q);
			// }
		},
	},
	mounted() {
		this.initialize();
		this.renderScreen();
	}

});

// Q(state, action) = R(state, action) + y*Max[Q(next state, all actions)]
//
// draw[previous] = draw[previous] + param * 4 way from draw[currnet]
// ignorable when hit the wall

const qlearning = new Vue({
	el: '#ql',
	components: {
		'qlearning-first': qlearningFirstComponent,
	},
});
