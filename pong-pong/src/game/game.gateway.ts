import { WebSocketGateway, WebSocketServer, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayerData, Players, Data, ResetData } from './player.data';

@WebSocketGateway()
export class GameGateway
// implements OnGatewayConnection, OnGatewayDisconnect 
{
	private players: Players[] = [];

	private oneGame: Players = new Players();

	private leftReady: boolean = false;
	private RightReady: boolean = false;

	// added
	private resetFlag: boolean = false;
	private resetp1: boolean = false;
	private resetp2: boolean = false;

	@WebSocketServer() server: Server;

	private initPlayer(player: PlayerData, clientId: string) {
		player.socket = clientId;
		player.score = 0;
		player.paddleY = 0;
	}

	private initResetData(resetData: ResetData, leftScore: number, rightScore: number) {
		resetData.ballX = 400 * 0.8;
		resetData.ballY = 200 * 0.8;
		resetData.paddle1Y = 200 - (200 * 0.2);
		resetData.paddle2Y = 200 - (200 * 0.2);
		resetData.leftScore = leftScore;
		resetData.rightScore = rightScore;
	}


	@SubscribeMessage('keypress')
	handleEnter(
		@ConnectedSocket() client: Socket,
		@MessageBody() message: string,
	) {
		console.log(message);
	}

	// controller -> 모든 데이터 종합
	// service -> 모든 실행 함수를 갖고 있음
	// gateway -> 소켓 핸들링


	handleConnection(client: Socket) {
		console.log('Client connected:', client.id);

		const playerData: PlayerData = new PlayerData();
		this.initPlayer(playerData, client.id);
		if (!this.oneGame.player1) { // check
			this.oneGame.player1 = playerData;
		}
		else {
			this.oneGame.player2 = playerData;
			this.players.push(this.oneGame);
			this.server.to(this.oneGame.player1.socket).emit('start', false);
			this.server.to(this.oneGame.player2.socket).emit('start', true);
		}

		// key number가 필요 없을 듯.
		// 화살표 아래 버튼 눌렀을 때
		client.on('keydown', (data: { clientId: string, key: number, startFlag: boolean }) => {
			const { clientId, key, startFlag } = data;
			console.log('is key downed? ', data);
			if (!data.startFlag) {
				if (this.oneGame.player1.socket === data.clientId) {
					this.oneGame.player1.paddleY = -30;
				}
				else {
					this.oneGame.player2.paddleY = -30;
				}
			}
			else {
				if (this.oneGame.player1.socket === data.clientId) {
					this.leftReady = true;
				}
				else {
					this.RightReady = true;
				}
				if (this.leftReady && this.RightReady) {
					this.server.to(this.oneGame.player1.socket).emit('ready', true);
					this.server.to(this.oneGame.player2.socket).emit('ready', true);
				}
			}

			let left: Data = new Data();
			let right: Data = new Data();
			console.log(this.players.length);
			if (this.players.length === 1) {
				console.log(this.oneGame.player1.socket, ' ', this.oneGame.player2.socket);

				left.p1Paddle = this.oneGame.player1.paddleY;
				left.p2Paddle = this.oneGame.player2.paddleY;

				right.p1Paddle = this.oneGame.player2.paddleY;
				right.p2Paddle = this.oneGame.player1.paddleY;

				this.server.to(this.oneGame.player1.socket).emit('message', left);
				this.server.to(this.oneGame.player2.socket).emit('message', right);
				this.oneGame.player1.paddleY = 0;
				this.oneGame.player2.paddleY = 0;
			}
		})

		// 화살표 위 버튼 눌렀을 때
		client.on('keyup', (data: { clientId: string, key: number }) => {
			const { clientId, key } = data;
			console.log('is key up? ', data);
			if (this.oneGame.player1.socket === data.clientId) {
				this.oneGame.player1.paddleY = 30;
			}
			else {
				this.oneGame.player2.paddleY = 30;
			}
			let left: Data = new Data();
			let right: Data = new Data();
			console.log(this.players.length);
			if (this.players.length === 1) {
				console.log(this.oneGame.player1.socket, ' ', this.oneGame.player2.socket);

				left.p1Paddle = this.oneGame.player1.paddleY;
				left.p2Paddle = this.oneGame.player2.paddleY;

				right.p1Paddle = this.oneGame.player2.paddleY;
				right.p2Paddle = this.oneGame.player1.paddleY;

				this.server.to(this.oneGame.player1.socket).emit('message', left);
				this.server.to(this.oneGame.player2.socket).emit('message', right);
				this.oneGame.player1.paddleY = 0;
				this.oneGame.player2.paddleY = 0;
			}
		})

		client.on('resetGame', (data: { clientId: string, winner: boolean }) => {
			const { clientId, winner } = data;
			if (clientId === this.oneGame.player1.socket) {
				this.resetp1 = true;
			}
			else {
				this.resetp2 = true;
			}
			if (this.resetp1 && this.resetp2) {
				this.resetFlag = true;
			}
			if (this.resetFlag) {
				console.log('whos in?', clientId, ' ', 'winner:', winner);
				if (this.oneGame.player1.socket === data.clientId) {
					if (winner)
						this.oneGame.player2.score++;
					else
						this.oneGame.player1.score++;
				}
				else if (this.oneGame.player2.socket === data.clientId) {
					if (winner)
						this.oneGame.player2.score++;
					else
						this.oneGame.player1.score++;
				}

				let leftData: ResetData = new ResetData();
				let rightData: ResetData = new ResetData();
				this.initResetData(leftData, this.oneGame.player1.score, this.oneGame.player2.score);
				this.initResetData(rightData, this.oneGame.player2.score, this.oneGame.player1.score);
				console.log(leftData);
				console.log(rightData);
				this.server.to(this.oneGame.player1.socket).emit('resetGame', leftData);
				this.server.to(this.oneGame.player2.socket).emit('resetGame', rightData);
				this.resetp1 = false;
				this.resetp2 = false;
				this.resetFlag = false;
			}
		})
	}
}