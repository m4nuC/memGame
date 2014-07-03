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
            debug: true
        }
    </script>
    <div id="main" class="main">
        <div id="game-board" class="game-board">
        </div>
        <div id="game-ui" class="game-ui">
            <div class="logo"><img src="{{ asset('/statics/imgs/logo.png'); }}"></div>
            <div class="info">
                <p class="instructions">Click on the cards to try to find a color pair.</p>

                <p class="score">Score<br><span id="score-count">0</p>
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



