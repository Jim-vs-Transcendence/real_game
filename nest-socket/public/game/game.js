class Player {
	ballX;
	ballY;
	ballMoveX;
	ballMoveY;
	ballSpeed;
	ballRadius;

	// paddle info
	paddleWidth;
	paddleHeight;
	leftPaddleX;
	rightPaddleX;
	leftPaddleY;
	rightPaddleY;

	// score info
	leftScore;
	rightScore;
}

const socket_game = io("http://localhost:3000/game");

// socket_chat.on('message', (Player) => {
// 	console.log(Player);
// 	handleNewMessage(Player);
// });

// socket_game.on('message', (Player) => {
// 	console.log(Player);
// 	handleNewMessage(Player);
// });


socket_game.on('connected', (Player) => {
	console.log('connected?');
	console.log(Player);
	initPlayer(Player);
	draw(Player);
});

socket_game.on('roomName', (name) => {
	setRoomName(name);
	console.log(roomName);
})

socket_game.on('ballMove', (player) => {
	draw(player);
});

socket_game.on('endGame', (flag) => {
	setEndGame(flag);
});