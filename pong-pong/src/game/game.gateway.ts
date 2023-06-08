import { WebSocketGateway, WebSocketServer, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io';
import { gameDataDto } from './gameDto/gameData.dto';
import { Room } from './data/playerData'
import { GameService } from './game.service';

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
	constructor(private readonly gameService: GameService) { }
	// Canvas Info

	protected rooms: Room[] = [];
	private players: gameDataDto[] = [];

	@WebSocketServer() server: Server;
	gameNamespace: Namespace;

	afterInit(server: Server) {
		this.gameNamespace = server.of('/game');
	}

	public getRooms(): Room[] {
		return this.rooms;
	}

	public findRoom(roomName: string): Room {
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
		this.gameService.initPlayer(player, client.id);
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
			this.gameService.getReady(room, client.id);
		}
		else {
			console.log('no room');
		}
	}

	// Up Key pressed : Paddle up
	@SubscribeMessage('downKey')
	handlePaddleUp(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		let room = this.findRoom(roomName);
		if (room) {
			this.gameService.paddleDown(room, client.id);
		}
		else {
			console.log('No such room');
		}
	}

	// Down Key pressed : Paddle down
	@SubscribeMessage('upKey')
	handlePaddleDown(
		@ConnectedSocket() client: Socket,
		@MessageBody() roomName: string,
	) {
		let room = this.findRoom(roomName);
		if (room) {
			this.gameService.paddleUp(room, client.id);
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
