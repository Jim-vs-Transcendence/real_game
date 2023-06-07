export class gameDataDto {
	// client한테 보내줄 데이터
	socketId: string;
	roomName: string;

	// canvas size
	canvasWidth: number;
	canvasHeight: number;
	canvasColor: string;

	// ball info
	ballX: number;
	ballY: number;
	ballMoveX: boolean;
	ballMoveY: boolean;
	ballSpeed: number;
	ballRadius: number;

	// paddle info
	paddleWidth: number;
	paddleHeight: number;
	leftPaddleX: number;
	rightPaddleX: number;
	leftPaddleY: number;
	rightPaddleY: number;

	// score info
	leftScore: number;
	rightScore: number;
}