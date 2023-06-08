import { WebSocketGateway, WebSocketServer, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { gameDataDto } from './gameDto/gameData.dto';
import { Room } from './data/playerData'

@WebSocketGateway()
export class GameGateway
// implements OnGatewayConnection, OnGatewayDisconnect 
{

	// private test: gameDataDto = new gameDataDto();

	// Canvas Info
	private readonly canvasWidth: number = 1200;
	private readonly canvasHeight: number = 600;
	private readonly canvasColor: string = 'black' /* |  param */;

	private readonly initBallX: number = this.canvasWidth / 2;
	private readonly initBallY: number = this.canvasHeight / 2;
	private readonly ballRadius: number = Math.min(this.canvasWidth * 0.02, this.canvasHeight * 0.02) /* * ballSize */;

	private readonly paddleWidth: number = this.canvasWidth * 0.02;
	private readonly paddleHeight: number = this.canvasHeight * 0.2;
	private readonly paddleMargin: number = this.canvasWidth * 0.05;

	private readonly initLeftPaddleX: number = this.paddleMargin;
	private readonly initRightPaddleX: number = this.canvasWidth - (this.paddleWidth + this.paddleMargin);
	private readonly initPaddleY: number = this.canvasHeight / 2 - this.paddleHeight / 2;

	private rooms: Room[] = [];
	private players: gameDataDto[] = [];
	private drawFrame: any;

	@WebSocketServer() server: Server;

	private initPlayer(player: gameDataDto, socketId: string) {
		player.socketId = socketId;
		player.canvasWidth = this.canvasWidth;
		player.canvasHeight = this.canvasHeight;
		player.canvasColor = this.canvasColor;

		player.ballX = this.initBallX;
		player.ballY = this.initBallY;
		player.ballRadius = this.ballRadius;
		player.ballSpeed = 3;

		player.paddleWidth = this.paddleWidth;
		player.paddleHeight = this.paddleHeight;
		player.leftPaddleX = this.initLeftPaddleX;
		player.rightPaddleX = this.initRightPaddleX;
		player.leftPaddleY = this.initPaddleY;
		player.rightPaddleY = this.initPaddleY;

		player.leftScore = 0;
		player.rightScore = 0;
	}

	private resetGame(room: Room): void {
		room.rightPlayer.leftScore = room.leftPlayer.rightScore;
		room.rightPlayer.rightScore = room.leftPlayer.leftScore;
		if (room.leftPlayer.leftScore >= 3 || room.leftPlayer.rightScore >= 3) {
			clearInterval(this.drawFrame);
			if (room.leftPlayer.leftScore >= 3) {
				this.server.to(this.rooms[0].leftPlayer.socketId).emit('endGame', true);
				this.server.to(this.rooms[0].rightPlayer.socketId).emit('endGame', false);
			}
			else{
				this.server.to(this.rooms[0].leftPlayer.socketId).emit('endGame', false);
				this.server.to(this.rooms[0].rightPlayer.socketId).emit('endGame', true);
			}
			this.rooms.shift();
		}
		room.leftPlayer.ballX = this.initBallX;
		room.leftPlayer.ballY = this.initBallY;
		room.leftPlayer.leftPaddleY = this.initPaddleY;
		room.leftPlayer.rightPaddleY = this.initPaddleY;
		room.leftPlayer.ballMoveX = false;
		room.leftPlayer.ballMoveY = false;

		room.rightPlayer.ballX = this.initBallX;
		room.rightPlayer.ballY = this.initBallY;
		room.rightPlayer.leftPaddleY = this.initPaddleY;
		room.rightPlayer.rightPaddleY = this.initPaddleY;
		room.rightPlayer.ballMoveX = false;
		room.rightPlayer.ballMoveY = false;
	}

	private async gamePlay() {
		await this.leftGamePlay.bind(this)();
		await this.rightGamePlay.bind(this)();
	}

	private leftGamePlay() {
		if (this.rooms[0].leftPlayer.ballX <= 0) {
			this.rooms[0].leftPlayer.rightScore++;
			this.resetGame(this.rooms[0]);

		}
		if (this.rooms[0].leftPlayer.ballX >= this.canvasWidth - this.ballRadius * 2) {
			this.rooms[0].leftPlayer.leftScore++;
			this.resetGame(this.rooms[0]);
		}

		if (this.rooms[0].leftPlayer.ballY <= this.ballRadius) {
			this.rooms[0].leftPlayer.ballMoveY = false;
		}
		if (this.rooms[0].leftPlayer.ballY >= this.canvasHeight - this.ballRadius) {
			this.rooms[0].leftPlayer.ballMoveY = true;
		}

		if (this.rooms[0].leftPlayer.ballMoveY === true) {
			this.rooms[0].leftPlayer.ballY -= this.rooms[0].leftPlayer.ballSpeed;
		}
		else if (this.rooms[0].leftPlayer.ballMoveY === false) {
			this.rooms[0].leftPlayer.ballY += this.rooms[0].leftPlayer.ballSpeed;
		}
		if (this.rooms[0].leftPlayer.ballMoveX === true) {
			this.rooms[0].leftPlayer.ballX -= this.rooms[0].leftPlayer.ballSpeed;
		}
		else if (this.rooms[0].leftPlayer.ballMoveX === false) {
			this.rooms[0].leftPlayer.ballX += this.rooms[0].leftPlayer.ballSpeed;
		}

		if (this.rooms[0].leftPlayer.ballX - (this.ballRadius * 2) <= this.initLeftPaddleX && this.rooms[0].leftPlayer.ballX >= this.initLeftPaddleX - this.paddleWidth) {
			if (this.rooms[0].leftPlayer.ballY <= this.rooms[0].leftPlayer.leftPaddleY + this.paddleHeight && this.rooms[0].leftPlayer.ballY >= this.rooms[0].leftPlayer.leftPaddleY) {
				this.rooms[0].leftPlayer.ballX = this.initLeftPaddleX + this.ballRadius * 2;
				this.rooms[0].leftPlayer.ballMoveX = false;
			}
		}

		if (this.rooms[0].leftPlayer.ballX - (this.ballRadius * 2) <= this.initRightPaddleX && this.rooms[0].leftPlayer.ballX >= this.initRightPaddleX - this.paddleWidth) {
			if (this.rooms[0].leftPlayer.ballY <= this.rooms[0].leftPlayer.rightPaddleY + this.paddleHeight && this.rooms[0].leftPlayer.ballY >= this.rooms[0].leftPlayer.rightPaddleY) {
				this.rooms[0].leftPlayer.ballX = this.initRightPaddleX - this.ballRadius * 2;
				this.rooms[0].leftPlayer.ballMoveX = true;
			}
		}
		console.log(this.rooms[0].leftPlayer);
		this.server.to(this.rooms[0].leftPlayer.socketId).emit('ballMove', this.rooms[0].leftPlayer);
	}

	private rightGamePlay() {
		// if (this.rooms[0].rightPlayer.ballX <= 0) {
		// 	this.rooms[0].rightPlayer.rightScore++;
		// 	this.resetGame(this.rooms[0].rightPlayer);

		// }
		// if (this.rooms[0].rightPlayer.ballX >= this.canvasWidth - this.ballRadius * 2) {
		// 	this.rooms[0].rightPlayer.leftScore++;
		// 	this.resetGame(this.rooms[0].rightPlayer);
		// } ``

		if (this.rooms[0].rightPlayer.ballY <= this.ballRadius) {
			this.rooms[0].rightPlayer.ballMoveY = false;
		}
		if (this.rooms[0].rightPlayer.ballY >= this.canvasHeight - this.ballRadius) {
			this.rooms[0].rightPlayer.ballMoveY = true;
		}

		if (this.rooms[0].rightPlayer.ballMoveY === true) {
			this.rooms[0].rightPlayer.ballY -= this.rooms[0].rightPlayer.ballSpeed;
		}
		else if (this.rooms[0].rightPlayer.ballMoveY === false) {
			this.rooms[0].rightPlayer.ballY += this.rooms[0].rightPlayer.ballSpeed;
		}
		if (this.rooms[0].rightPlayer.ballMoveX === true) {
			this.rooms[0].rightPlayer.ballX += this.rooms[0].rightPlayer.ballSpeed;
		}
		else if (this.rooms[0].rightPlayer.ballMoveX === false) {
			this.rooms[0].rightPlayer.ballX -= this.rooms[0].rightPlayer.ballSpeed;
		}

		if (this.rooms[0].rightPlayer.ballX - (this.ballRadius * 2) <= this.initLeftPaddleX && this.rooms[0].rightPlayer.ballX >= this.initLeftPaddleX - this.paddleWidth) {
			if (this.rooms[0].rightPlayer.ballY <= this.rooms[0].rightPlayer.leftPaddleY + this.paddleHeight && this.rooms[0].rightPlayer.ballY >= this.rooms[0].rightPlayer.leftPaddleY) {
				this.rooms[0].rightPlayer.ballX = this.initLeftPaddleX + this.ballRadius * 2;
				this.rooms[0].rightPlayer.ballMoveX = true;
			}
		}

		if (this.rooms[0].rightPlayer.ballX - (this.ballRadius * 2) <= this.initRightPaddleX && this.rooms[0].rightPlayer.ballX >= this.initRightPaddleX - this.paddleWidth) {
			if (this.rooms[0].rightPlayer.ballY <= this.rooms[0].rightPlayer.rightPaddleY + this.paddleHeight && this.rooms[0].rightPlayer.ballY >= this.rooms[0].rightPlayer.rightPaddleY) {
				this.rooms[0].rightPlayer.ballX = this.initRightPaddleX - this.ballRadius * 2;
				this.rooms[0].rightPlayer.ballMoveX = false;
			}
		}
		console.log(this.rooms[0].rightPlayer);
		this.server.to(this.rooms[0].rightPlayer.socketId).emit('ballMove', this.rooms[0].rightPlayer);
	}

	

	@SubscribeMessage('connect')
	handleConnection(
		@ConnectedSocket() client: Socket
	) {
		console.log(client.id);
		let player: gameDataDto = new gameDataDto();
		this.initPlayer(player, client.id);
		this.server.to(client.id).emit('connected', player);
		this.players.push(player);

		if (this.players.length >= 2) {
			let room: Room = new Room();
			room.leftPlayer = this.players.shift();
			room.rightPlayer = this.players.shift();
			room.roomName = room.leftPlayer.socketId;
			room.leftPlayer.roomName = room.roomName;
			room.rightPlayer.roomName = room.roomName;
			this.rooms.push(room);
		}
	}

	// Enter Key pressed : game ready
	@SubscribeMessage('gameReady')
	handleEnter(
		@ConnectedSocket() client: Socket,
		// @MessageBody() roomName: string,
	) {
		if (this.rooms[0].leftPlayer && client.id === this.rooms[0].leftPlayer.socketId) {
			this.rooms[0].leftReady = true;
		}
		else if (this.rooms[0].rightPlayer && client.id === this.rooms[0].rightPlayer.socketId) {
			this.rooms[0].rightReady = true;
		}
		if (this.rooms[0].leftReady && this.rooms[0].rightReady) {
			// game start
			this.rooms[0].leftPlayer.ballMoveX = false;
			this.rooms[0].leftPlayer.ballMoveY = false;
			this.rooms[0].rightPlayer.ballMoveX = false;
			this.rooms[0].rightPlayer.ballMoveY = false;
			this.drawFrame = setInterval(() => this.gamePlay(), 1000 / 60);
		}
	}

	// Up Key pressed : Paddle up
	@SubscribeMessage('upKey')
	handlePaddleUp(
		@ConnectedSocket() client: Socket,
		// @MessageBody() roomName: string,
	) {
		if (this.rooms[0].leftPlayer && client.id === this.rooms[0].leftPlayer.socketId) {
			this.rooms[0].leftPlayer.leftPaddleY += 30;
			if (this.rooms[0].leftPlayer.leftPaddleY - this.paddleHeight >= this.canvasHeight)
				this.rooms[0].leftPlayer.leftPaddleY = this.canvasHeight;
			this.rooms[0].rightPlayer.rightPaddleY = this.rooms[0].leftPlayer.leftPaddleY;
		}
		else if (this.rooms[0].rightPlayer && client.id === this.rooms[0].rightPlayer.socketId) {
			this.rooms[0].rightPlayer.leftPaddleY += 30;
			if (this.rooms[0].rightPlayer.leftPaddleY - this.paddleHeight >= this.canvasHeight)
				this.rooms[0].rightPlayer.leftPaddleY = this.canvasHeight;
			this.rooms[0].leftPlayer.rightPaddleY = this.rooms[0].rightPlayer.leftPaddleY;
		}
		// this.server.to(this.rooms[0].leftPlayer.socketId).emit('upKey', this.rooms[0].leftPlayer);
		// this.server.to(this.rooms[0].rightPlayer.socketId).emit('upKey', this.rooms[0].rightPlayer);
	}

	// Down Key pressed : Paddle down
	@SubscribeMessage('downKey')
	handlePaddleDown(
		@ConnectedSocket() client: Socket,
		// @MessageBody() message: string,
	) {
		if (this.rooms[0].leftPlayer && client.id === this.rooms[0].leftPlayer.socketId) {
			this.rooms[0].leftPlayer.leftPaddleY -= 30;
			if (this.rooms[0].leftPlayer.leftPaddleY <= 0)
				this.rooms[0].leftPlayer.leftPaddleY = 0;
			this.rooms[0].rightPlayer.rightPaddleY = this.rooms[0].leftPlayer.leftPaddleY;
		}
		else if (this.rooms[0].rightPlayer && client.id === this.rooms[0].rightPlayer.socketId) {
			this.rooms[0].rightPlayer.leftPaddleY -= 30;
			if (this.rooms[0].rightPlayer.leftPaddleY <= 0)
				this.rooms[0].rightPlayer.leftPaddleY = 0;
			this.rooms[0].leftPlayer.rightPaddleY = this.rooms[0].rightPlayer.leftPaddleY;
		}
	}

}
