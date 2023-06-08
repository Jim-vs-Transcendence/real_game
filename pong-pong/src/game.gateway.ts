import { WebSocketGateway, WebSocketServer, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { gameDataDto } from './gameDto/gameData.dto';
import { Room } from './data/playerData'

/* 
 * service : gateway에서 호출되어 게임 내부 로직 변경 (현재 게이트웨이에 있는 private 함수들)
 * gateway : 클라이언트에서 받은 소켓 정보를 service 함수를 호출하여 핸들링
 * 
 * 문제는 gateway에서 rooms 배열을 가지고 있는데, timeout 함수 호출 시 해당 room을 지워야 함.
 * 그러면 gateway에서 room을 찾아 지워주는 함수를 만들고, service에서 gateway함수를 호출하여 해당 room 삭제 되게
 * -> 서비스에서 constructor로 게이트웨이를 가지고 있으니까 해당 요소를 불러서 삭제하도록 하면 될 듯?
 */



@WebSocketGateway()
export class GameGateway
// implements OnGatewayConnection, OnGatewayDisconnect 
{
	// Canvas Info
	private readonly fps: number = 1000 / 30;
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

	@WebSocketServer() server: Server;

	private initPlayer(player: gameDataDto, socketId: string) {
		player.socketId = socketId;
		player.canvasWidth = this.canvasWidth;
		player.canvasHeight = this.canvasHeight;
		player.canvasColor = this.canvasColor;

		player.ballX = this.initBallX;
		player.ballY = this.initBallY;
		player.ballRadius = this.ballRadius;
		player.ballSpeed = 15;

		player.paddleWidth = this.paddleWidth;
		player.paddleHeight = this.paddleHeight;
		player.leftPaddleX = this.initLeftPaddleX;
		player.rightPaddleX = this.initRightPaddleX;
		player.leftPaddleY = this.initPaddleY;
		player.rightPaddleY = this.initPaddleY;

		player.leftScore = 0;
		player.rightScore = 0;
	}

	// test function will be call back to main page
	// 서비스로 가는데, 지우는 건 gateway가 해줘야 됨
	private test(room) {
		const idx: number = this.rooms.indexOf(room);
		// 전적 추가
		// 재시작 여부 판단 로직 추가
		if (idx !== -1) {
			this.rooms.splice(idx, 1);
		}
		console.log('wait success');
	}

	private resetGame(room: Room): void {
		room.rightPlayer.leftScore = room.leftPlayer.rightScore;
		room.rightPlayer.rightScore = room.leftPlayer.leftScore;
		if (room.leftPlayer.leftScore >= 3 || room.leftPlayer.rightScore >= 3) {
			clearInterval(room.dataFrame);
			room.isEnd = true;

			// 시간초가 지나면 메인 페이지 이동, 시간초 보다 restart가 빠르면 재시작
			room.endTimer = setTimeout(this.test, 10000, room);

			if (room.leftPlayer.leftScore >= 3) {
				this.server.to(room.leftPlayer.socketId).emit('endGame', true);
				this.server.to(room.rightPlayer.socketId).emit('endGame', false);
			}
			else {
				this.server.to(room.leftPlayer.socketId).emit('endGame', false);
				this.server.to(room.rightPlayer.socketId).emit('endGame', true);
			}

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

	private async gamePlay(room: Room) {
		await this.sendGameData.bind(this)(room);
	}

	private sendGameData(room: Room) {
		if (room.leftPlayer.ballX <= 0) {
			room.leftPlayer.rightScore++;
			this.resetGame(room);

		}
		if (room.leftPlayer.ballX >= this.canvasWidth - this.ballRadius * 2) {
			room.leftPlayer.leftScore++;
			this.resetGame(room);
		}
		if (!room.isEnd) {
			if (room.leftPlayer.ballY <= this.ballRadius) {
				room.leftPlayer.ballMoveY = false;
				room.rightPlayer.ballMoveY = false;
			}
			if (room.leftPlayer.ballY >= this.canvasHeight - this.ballRadius) {
				room.leftPlayer.ballMoveY = true;
				room.rightPlayer.ballMoveY = true;
			}

			if (room.leftPlayer.ballMoveY === true) {
				room.leftPlayer.ballY -= room.leftPlayer.ballSpeed;
				room.rightPlayer.ballY -= room.leftPlayer.ballSpeed;
			}
			else if (room.leftPlayer.ballMoveY === false) {
				room.leftPlayer.ballY += room.leftPlayer.ballSpeed;
				room.rightPlayer.ballY += room.leftPlayer.ballSpeed;
			}
			if (room.leftPlayer.ballMoveX === true) {
				room.leftPlayer.ballX -= room.leftPlayer.ballSpeed;
				room.rightPlayer.ballX += room.leftPlayer.ballSpeed;
			}
			else if (room.leftPlayer.ballMoveX === false) {
				room.leftPlayer.ballX += room.leftPlayer.ballSpeed;
				room.rightPlayer.ballX -= room.leftPlayer.ballSpeed;
			}

			if (room.leftPlayer.ballX - (this.ballRadius * 2) <= this.initLeftPaddleX && room.leftPlayer.ballX >= this.initLeftPaddleX - this.paddleWidth) {
				if (room.leftPlayer.ballY <= room.leftPlayer.leftPaddleY + this.paddleHeight && room.leftPlayer.ballY >= room.leftPlayer.leftPaddleY) {
					room.leftPlayer.ballX = this.initLeftPaddleX + this.ballRadius * 2;
					room.leftPlayer.ballMoveX = false;
					room.rightPlayer.ballX = this.initRightPaddleX - this.ballRadius * 2;
					room.rightPlayer.ballMoveX = true;

				}
			}

			if (room.leftPlayer.ballX - (this.ballRadius * 2) <= this.initRightPaddleX && room.leftPlayer.ballX >= this.initRightPaddleX - this.paddleWidth) {
				if (room.leftPlayer.ballY <= room.leftPlayer.rightPaddleY + this.paddleHeight && room.leftPlayer.ballY >= room.leftPlayer.rightPaddleY) {
					room.leftPlayer.ballX = this.initRightPaddleX - this.ballRadius * 2;
					room.leftPlayer.ballMoveX = true;
					room.rightPlayer.ballX = this.initLeftPaddleX + this.ballRadius * 2;
					room.rightPlayer.ballMoveX = false;
				}
			}
			console.log(room.leftPlayer);
			this.server.to(room.leftPlayer.socketId).emit('ballMove', room.leftPlayer);
			this.server.to(room.rightPlayer.socketId).emit('ballMove', room.rightPlayer);
		}
	}

	private findRoom(roomName: string): Room {
		let room: Room = this.rooms.find((room: Room) =>
			room.roomName === roomName);
		return room;
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
			this.server.to(room.leftPlayer.socketId).emit('roomName', room.roomName);
			this.server.to(room.rightPlayer.socketId).emit('roomName', room.roomName);
		}
	}

	// Enter Key pressed : game ready
	@SubscribeMessage('gameReady')
	handleEnter(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		console.log(roomName);
		let room = this.findRoom(roomName);
		if (room) {
			if (room.leftPlayer && client.id === room.leftPlayer.socketId) {
				room.leftReady = true;
			}
			else if (room.rightPlayer && client.id === room.rightPlayer.socketId) {
				room.rightReady = true;
			}
			if (room.leftReady && room.rightReady) {
				// game start
				room.leftPlayer.ballMoveX = false;
				room.leftPlayer.ballMoveY = false;
				room.rightPlayer.ballMoveX = false;
				room.rightPlayer.ballMoveY = false;
				room.isEnd = false;
				room.dataFrame = setInterval(() => this.gamePlay(room), this.fps);
			}
		}
		else {
			console.log('no room');
		}
	}

	// Up Key pressed : Paddle up
	@SubscribeMessage('upKey')
	handlePaddleUp(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		let room = this.findRoom(roomName);
		if (room) {
			if (room.leftPlayer && client.id === room.leftPlayer.socketId) {
				room.leftPlayer.leftPaddleY += 30;
				if (room.leftPlayer.leftPaddleY >= this.canvasHeight - this.paddleHeight)
					room.leftPlayer.leftPaddleY = this.canvasHeight - this.paddleHeight;
				room.rightPlayer.rightPaddleY = room.leftPlayer.leftPaddleY;
			}
			else if (room.rightPlayer && client.id === room.rightPlayer.socketId) {
				room.rightPlayer.leftPaddleY += 30;
				if (room.rightPlayer.leftPaddleY >= this.canvasHeight - this.paddleHeight)
					room.rightPlayer.leftPaddleY = this.canvasHeight - this.paddleHeight;
				room.leftPlayer.rightPaddleY = room.rightPlayer.leftPaddleY;
			}
		}
		else {
			console.log('No such room');
		}
	}

	// Down Key pressed : Paddle down
	@SubscribeMessage('downKey')
	handlePaddleDown(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		let room = this.findRoom(roomName);
		if (room) {
			if (room.leftPlayer && client.id === room.leftPlayer.socketId) {
				room.leftPlayer.leftPaddleY -= 30;
				if (room.leftPlayer.leftPaddleY <= 0)
					room.leftPlayer.leftPaddleY = 0;
				room.rightPlayer.rightPaddleY = room.leftPlayer.leftPaddleY;
			}
			else if (room.rightPlayer && client.id === room.rightPlayer.socketId) {
				room.rightPlayer.leftPaddleY -= 30;
				if (room.rightPlayer.leftPaddleY <= 0)
					room.rightPlayer.leftPaddleY = 0;
				room.leftPlayer.rightPaddleY = room.rightPlayer.leftPaddleY;
			}
		}
	}


	@SubscribeMessage('leftTest')
	waitTester(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		console.log(roomName);
		let room = this.findRoom(roomName);
		if (room) {
			console.log(room.endTimer);
			clearTimeout(room.endTimer);

		}
	}
}
