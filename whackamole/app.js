window.addEventListener('load', function() {
    var lastSnakeTimeMS = null;
    var lastSnake    = null;
    var currentSnake = null;
    var timerElement = document.getElementById('timer');

    var batch          = [];
    var lastBatchSent  = null;
    var BATCH_AGE_MAX  = 5000;
    var BATCH_SIZE_MAX = 5;

    var snakeElements = new Array(9);

    function init() {
        _.forEach(document.querySelectorAll('main img'), function(element) {
            var index = parseInt(element.dataset.snakeIndex);
            snakeElements[index - 1] = element;
        });
        chooseRandomSnake();
        timerUpdate();
    }

    function hideAllSnakes() {
        _.forEach(snakeElements, function(element) {
            element.style.visibility = 'hidden';
        });
    }

    function chooseRandomSnake() {
        var index = _.random(1, 9);
        currentSnake = index;
        hideAllSnakes();
        showRandomSnake(index);
    }

    function showRandomSnake(index) {
        snakeElements[index - 1].style.visibility = 'visible';
    }

    function resetTimer() {
        lastSnakeTimeMS = null;
    }

    function getTimerText(time) {
        var x = moment.duration(time);

        var hours   = x.hours();
        var minutes = x.minutes();
        var seconds = x.seconds();
        var ms      = new String(x.milliseconds()).substring(0, 2);

        return `
            ${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} <small>${ms < 10 ? '0' + ms : ms}</small>
        `;
    }

    function computeManhattanDistance(u, v) {
		var x1 = (u - 1) % 3;
		var y1 = Math.floor((u - 1) / 3);
		var x2 = (v - 1) % 3;
		var y2 = Math.floor((v - 1) / 3);
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
	}

    function timerUpdate() {
        var timeStr = lastSnakeTimeMS === null ?
            getTimerText(0) : getTimerText(performance.now() - lastSnakeTimeMS);
        if (lastBatchSent !== null && performance.now() - lastBatchSent >= BATCH_AGE_MAX) {
            postData();
        }
        timerElement.innerHTML = timeStr;
        requestAnimationFrame(timerUpdate);
    }

    function postData() {
        if (batch.length === 0) return;
        lastBatchSent = performance.now();
        axios.post('/update', {data: batch});
        batch = [];
    }

    document.getElementById('gameboard').addEventListener('click', function(e) {
        var elem = e.target;
        if (elem.tagName.toLowerCase() === 'img' && typeof elem.dataset.snakeIndex !== 'undefined') {
            var index = parseInt(elem.dataset.snakeIndex);
            if (index === currentSnake) {
                if (lastSnakeTimeMS !== null) {
                    var data = {
                        duration: performance.now() - lastSnakeTimeMS,
                        path: `${lastSnake}->${currentSnake}`,
                        manhattanDistance: computeManhattanDistance(lastSnake, currentSnake)
                    };
                    if (lastBatchSent === null) {
                        lastBatchSent = performance.now();
                    }
                    batch.push(data);
                    if (batch.length >= BATCH_SIZE_MAX)
                        postData();
                }
                lastSnakeTimeMS = performance.now();
                lastSnake = currentSnake;
                chooseRandomSnake();
            }
        }
        e.preventDefault();
    });

    init();
});
