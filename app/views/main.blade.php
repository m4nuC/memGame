<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Color Memory Game</title>
    <link rel="stylesheet" href="{{ asset('/statics/styles/main.css'); }}" />
    <!-- Favicon -->
    <link rel="shortcut icon" href="favicon.ico" />
</head>

<body>
    <script type="text/javascript">
        var _GLOBALS = {
            baseURL: "{{ $baseURL }}",
            debug: false
        }
    </script>
    <div id="main" class="main">
        <div id="game-board" class="game-board">
        </div>
        <div id="game-ui" class="game-ui">
            <div class="logo"><img src="{{ asset('/statics/imgs/logo.png'); }}"></div>
            <div class="info">
                <p class="instructions">1) Use directional arrows to select a card.<br>2) Use "Enter" or "left click" to flip a card</p>


                <h1 class="score">Score<br><span id="score-count">0</h1>
                <h2> Top 5 </h2>
                <div id="high-scores" class="high-scores">

                </div>
            </div>
            <div class="controls">
                <button id="restart">Restart</button>
            </div>
        </div>
    </div>
</body>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min.js"></script>
<script src="{{ asset('/scripts/build/game.js'); }}"></script>
</html>



