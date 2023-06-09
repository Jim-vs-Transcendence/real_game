<script lang="ts">
	import { onMount } from 'svelte';
	import { afterUpdate } from 'svelte';
	import { onDestroy } from 'svelte';
	// import { io_game } from '$lib/webSocketConnection_game';

	import ioClient from 'socket.io-client';
	const ENDPOINT = 'http://localhost:3000/game';

	const io_game = ioClient(ENDPOINT);

	// class Player {
	// 	ballX;
	// 	ballY;
	// 	ballMoveX;
	// 	ballMoveY;
	// 	ballSpeed;
	// 	ballRadius;

	// 	// paddle info
	// 	paddleWidth;
	// 	paddleHeight;
	// 	leftPaddleX;
	// 	rightPaddleX;
	// 	leftPaddleY;
	// 	rightPaddleY;

	// 	// score info
	// 	leftScore;
	// 	rightScore;
	// }

	// socket_chat.on('message', (Player) => {
	// 	console.log(Player);
	// 	handleNewMessage(Player);
	// });

	// socket_game.on('message', (Player) => {
	// 	console.log(Player);
	// 	handleNewMessage(Player);
	// });

	let canvas: any;
	let context: any;

	let roomName: string;

	// Ball Location
	let ballRadius: number;

	// Paddle
	let paddleWidth: number;
	let paddleHeight: number;

	// score
	let scoreTextSize: number;
	let scoreMargin: number;

	let score1X: number;
	let score2X: number;

	let scoreY: number;

	let cnt: number = 0;

	function setRoomName(name: string) {
		console.log('setting');
		roomName = name;
	}

	function setEndGame(flag: boolean) {
		if (flag) {
			context.globalAlpha = 1;
			context.font = `${scoreTextSize * 2}px Arial`;
			context.fillStyle = 'blue';
			context.textAlign = 'center';
			context.fillText('You win', canvas.width / 2, canvas.height / 2);
		} else {
			context.globalAlpha = 1;
			context.font = `${scoreTextSize * 2}px Arial`;
			context.fillStyle = 'red';
			context.textAlign = 'center';
			context.fillText('You lose', canvas.width / 2, canvas.height / 2);
		}
	}

	function initPlayer(Player: any) {
		console.log('initPlayer');
		canvas.width = Player.canvasWidth;
		canvas.height = Player.canvasHeight;
		canvas.style.backgroundColor = Player.canvasColor;

		ballRadius = Player.ballRadius;

		paddleWidth = Player.paddleWidth;
		paddleHeight = Player.paddleHeight;

		scoreTextSize = canvas.height * 0.3;
		scoreMargin = canvas.width * 0.2;

		score1X = canvas.width / 2 - scoreMargin;
		score2X = canvas.width / 2 + scoreMargin;

		scoreY = canvas.height / 2 + (scoreTextSize * 3) / 8;
	}

	function draw(player: any) {
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
		context.arc(player.ballX, player.ballY, player.ballRadius, 0, Math.PI * 2, false);
		context.fillStyle = 'white';
		context.fill();
		context.closePath();

		context.globalAlpha = 0.5;
		context.font = `${scoreTextSize}px Arial`;
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.fillText(player.leftScore, score1X, scoreY);

		context.fillText(player.rightScore, score2X, scoreY);

		context.globalAlpha = 1;

		context.fillStyle = 'white';
		context.fillRect(
			player.leftPaddleX,
			player.leftPaddleY,
			player.paddleWidth,
			player.paddleHeight
		);

		context.fillStyle = 'white';
		context.fillRect(
			player.rightPaddleX,
			player.rightPaddleY,
			player.paddleWidth,
			player.paddleHeight
		);
	}

	function handleKeyPress(event: any) {
		if (event.key === 'Enter') {
			cnt++;
			console.log('enter press');
			if (cnt === 1) {
				io_game.emit('gameReady', roomName);
			}
		} else if (event.key === 'ArrowDown') {
			console.log('up press');
			io_game.emit('downKey', roomName);
		} else if (event.key === 'ArrowUp') {
			console.log('down press');
			io_game.emit('upKey', roomName);
		} else if (event.key === 'ArrowLeft') {
			console.log('down press');
			io_game.emit('leftTest', roomName);
		}
	}

	onMount(() => {
		canvas = document.createElement('canvas');
		context = canvas.getContext('2d');

		document.body.appendChild(canvas);

		window.addEventListener('keydown', handleKeyPress);

		io_game.on('connected', (Player: any) => {
			console.log('connected?');
			console.log(Player);
			initPlayer(Player);
			draw(Player);
		});
		io_game.on('handShaking', (flag: boolean) => {
			if (flag) {
				io_game.emit('handShaking', true);
			}
		});

		io_game.on('roomName', (name: string) => {
			console.log('room name: ', name);
			setRoomName(name);
			console.log(roomName);
		});

		io_game.on('ballMove', (player: any) => {
			console.log('ball move: ', player);
			draw(player);
		});

		io_game.on('endGame', (flag: boolean) => {
			console.log('end game:', flag ? 'true' : 'false');
			setEndGame(flag);
		});
	});

	// onDestroy(() => {
	// 	io_game.disconnect();
	// 	document.body.removeChild(canvas);
	// 	window.removeEventListener('keydown', handleKeyPress);
	// });

	afterUpdate(() => {
		// Code to handle updates or re-renders, if needed
	});
</script>
