document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    /*
    * Socket Variable
    */
    const playerSocket = io();

    let roomName;

    /*
    * Game variables
    */

    let canvasWidth;
    let canvasHeight;

    document.body.appendChild(canvas);

    // Ball Location
    let ballRadius;

    // Paddle
    let paddleWidth;
    let paddleHeight;

    // score
    let scoreTextSize;
    let scoreMargin;

    let score1X;
    let score1Y;

    let score2X;
    let score2Y;


    /*
    * Socket Handling
    */
    playerSocket.on('connected', (data) => {
        // canvasWidth = data.canvasWidth * widthRatio;
        // canvasHeight = data.canvasHeight * heightRatio;
        canvasWidth = data.canvasWidth;
        canvasHeight = data.canvasHeight;
        canvasColor = data.canvasColor;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.backgroundColor = canvasColor;

        ballRadius = data.ballRadius;

        paddleWidth = data.paddleWidth;
        paddleHeight = data.paddleHeight;

        scoreTextSize = canvasHeight * 0.3;
        scoreMargin = canvasWidth * 0.2;

        score1X = canvasWidth / 2 - scoreMargin;
        score1Y = canvasHeight / 2 + (scoreTextSize * 3) / 8;

        score2X = canvasWidth / 2 + scoreMargin;
        score2Y = canvasHeight / 2 + (scoreTextSize * 3) / 8;

        draw(data);
    });

    playerSocket.on('roomName', (data) => {
        roomName = data;
        console.log(roomName);
    })

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            console.log('enter press')
            playerSocket.emit('gameReady', roomName);
        } else if (event.key === 'ArrowDown') {
            console.log('up press')
            playerSocket.emit('upKey', roomName);
        } else if (event.key === 'ArrowUp') {
            console.log('down press')
            playerSocket.emit('downKey', roomName);
        }
    });


    playerSocket.on('ballMove', (player) => {
        console.log(roomName);
        draw(player);
    })

    playerSocket.on('endGame', (flag) => {
        if (flag) {
            context.globalAlpha = 1;
            context.font = `${scoreTextSize * 2}px Arial`;
            context.fillStyle = 'blue';
            context.textAlign = 'center';
            context.fillText('You win', canvasWidth / 2, canvasHeight / 2);
        }
        else {
            context.globalAlpha = 1;
            context.font = `${scoreTextSize * 2}px Arial`;
            context.fillStyle = 'red';
            context.textAlign = 'center';
            context.fillText('You lose', canvasWidth / 2, canvasHeight / 2);
        }
    })

    function draw(player) {
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.beginPath();
        context.arc(player.ballX, player.ballY, ballRadius, 0, Math.PI * 2, false);
        context.fillStyle = 'white';
        context.fill();
        context.closePath();

        context.globalAlpha = 0.5;
        context.font = `${scoreTextSize}px Arial`;
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(player.leftScore, score1X, score1Y);

        context.fillText(player.rightScore, score2X, score2Y);

        context.globalAlpha = 1;

        context.fillStyle = 'white';
        context.fillRect(player.leftPaddleX, player.leftPaddleY, paddleWidth, paddleHeight);

        context.fillStyle = 'white';
        context.fillRect(player.rightPaddleX, player.rightPaddleY, paddleWidth, paddleHeight);

    }

});