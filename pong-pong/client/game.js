document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    /*
    * Socket Variable
    */
    const playerSocket = io();

    /*
    * Game variables
    */

    // Game init

    // left player일 경우 false, right player일 경우 true
    // Canvas Ratio
    // const widthRatio = 0.8; // 가로 비율 (0~1 사이 값)
    // const heightRatio = 0.8; // 세로 비율 (0~1 사이 값)

    // 윈도우의 크기에 따라 Canvas의 너비와 높이 계산
    let canvasWidth;
    let canvasHeight;
    // Canvas를 body에 추가
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
        console.log(data);
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


    window.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          console.log('Enter key pressed');
          playerSocket.emit('gameReady');
        } else if (event.key === 'ArrowDown') {
          console.log('Up arrow key pressed');
          playerSocket.emit('upKey');
        } else if (event.key === 'ArrowUp') {
          console.log('Down arrow key pressed');
          playerSocket.emit('downKey');
        }
      });

    // window.addEventListener('keypress', (key) => {
    //     if (key.keyCode === 13) {
    //         console.log('enter')
    //         playerSocket.emit('gameReady');
    //     }
    // });

    // window.addEventListener('keypress', (key) => {
    //     if (key.keyCode === 40) {
    //         console.log('up')
    //         playerSocket.emit('upKey');
    //     }
    // });

    // window.addEventListener('keypress', (key) => {
    //     if (key.keyCode === 38) {
    //         console.log('down')
    //         playerSocket.emit('downKey');
    //     }
    // });



    playerSocket.on('ballMove', (player) => {
        draw(player);
        console.log('is drawing?');
        console.log(player);
    })

    function draw(player) {
        console.log('draw func in');
        console.log(player);
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

        // if (player.leftPaddleY >= canvasHeight - paddleHeight) {
        //     player.leftPaddleY = canvasHeight - paddleHeight;
        // }
        // if (player.leftPaddleY <= 0) {
        //     player.leftPaddleY = 0;
        // }

        // if (player.rightPaddleY >= canvasHeight - paddleHeight) {
        //     player.rightPaddleY = canvasHeight - paddleHeight;
        // }
        // if (player.rightPaddleY <= 0) {
        //     player.rightPaddleY = 0;
        // }
        console.log(paddleWidth, ' ', paddleHeight);
        context.fillStyle = 'white';
        context.fillRect(player.leftPaddleX, player.leftPaddleY, paddleWidth, paddleHeight);

        context.fillStyle = 'white';
        context.fillRect(player.rightPaddleX, player.rightPaddleY, paddleWidth, paddleHeight);

    }

});