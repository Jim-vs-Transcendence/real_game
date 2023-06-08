import { Injectable } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { Room } from './data/playerData';
import { gameDataDto } from './gameDto/gameData.dto';

@Injectable()
export class AppService {
    private myGameGateway: GameGateway;

    constructor(
        gameGateway: GameGateway
    ) { this.myGameGateway = gameGateway }

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

    public initPlayer(player: gameDataDto, socketId: string) {
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
    public test(room) {
        const idx: number = this.myGameGateway.rooms.indexOf(room);
        // 전적 추가
        // 재시작 여부 판단 로직 추가
        if (idx !== -1) {
            this.myGameGateway.rooms.splice(idx, 1);
        }
        console.log('wait success');
    }

    public resetGame(room: Room): void {
        room.rightPlayer.leftScore = room.leftPlayer.rightScore;
        room.rightPlayer.rightScore = room.leftPlayer.leftScore;
        if (room.leftPlayer.leftScore >= 3 || room.leftPlayer.rightScore >= 3) {
            clearInterval(room.dataFrame);
            room.isEnd = true;

            // 시간초가 지나면 메인 페이지 이동, 시간초 보다 restart가 빠르면 재시작
            room.endTimer = setTimeout(this.test, 10000, room);

            if (room.leftPlayer.leftScore >= 3) {
                this.myGameGateway.server.to(room.leftPlayer.socketId).emit('endGame', true);
                this.myGameGateway.server.to(room.rightPlayer.socketId).emit('endGame', false);
            }
            else {
                this.myGameGateway.server.to(room.leftPlayer.socketId).emit('endGame', false);
                this.myGameGateway.server.to(room.rightPlayer.socketId).emit('endGame', true);
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

    public sendGameData(room: Room) {
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
            this.myGameGateway.server.to(room.leftPlayer.socketId).emit('ballMove', room.leftPlayer);
            this.myGameGateway.server.to(room.rightPlayer.socketId).emit('ballMove', room.rightPlayer);
        }
    }

    public getReady(room: Room, clientId: string) {
        if (room.leftPlayer && clientId === room.leftPlayer.socketId) {
            room.leftReady = true;
        }
        else if (room.rightPlayer && clientId === room.rightPlayer.socketId) {
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


    public paddleUp(room: Room, clientId: string) {
        if (room.leftPlayer && clientId === room.leftPlayer.socketId) {
            room.leftPlayer.leftPaddleY -= 30;
            if (room.leftPlayer.leftPaddleY <= 0)
                room.leftPlayer.leftPaddleY = 0;
            room.rightPlayer.rightPaddleY = room.leftPlayer.leftPaddleY;
        }
        else if (room.rightPlayer && clientId === room.rightPlayer.socketId) {
            room.rightPlayer.leftPaddleY -= 30;
            if (room.rightPlayer.leftPaddleY <= 0)
                room.rightPlayer.leftPaddleY = 0;
            room.leftPlayer.rightPaddleY = room.rightPlayer.leftPaddleY;
        }
    }

    public paddleDown(room: Room, clientId: string) {
        if (room.leftPlayer && clientId === room.leftPlayer.socketId) {
            room.leftPlayer.leftPaddleY += 30;
            if (room.leftPlayer.leftPaddleY >= this.canvasHeight - this.paddleHeight)
                room.leftPlayer.leftPaddleY = this.canvasHeight - this.paddleHeight;
            room.rightPlayer.rightPaddleY = room.leftPlayer.leftPaddleY;
        }
        else if (room.rightPlayer && clientId === room.rightPlayer.socketId) {
            room.rightPlayer.leftPaddleY += 30;
            if (room.rightPlayer.leftPaddleY >= this.canvasHeight - this.paddleHeight)
                room.rightPlayer.leftPaddleY = this.canvasHeight - this.paddleHeight;
            room.leftPlayer.rightPaddleY = room.rightPlayer.leftPaddleY;
        }
    }
}
