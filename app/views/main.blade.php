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
    <div id="main" class="main">
        <div id="game-board" class="game-board">
            <div class="cell"></div>
        </div>
        <div id="game-ui" class="game-ui">
            <div class="logo"></div>
            <div class="info"></div>
            <div class="controls">
                <button id="restart">
            </div>
        </div>
    </div>
</body>
<script src="{{ asset('/scripts/build/game.js'); }}"></script>
</html>



