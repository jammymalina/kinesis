window.addEventListener('load', function() {
    var isRunning = false;
    var timer = 0;
    var lastFrame = 0;
    var timerElement = document.getElementById('timer');

    var snakeElements = new Array(9);
    _.forEach(document.querySelectorAll('main img'), function(element) {
        var index = parseInt(element.dataset.snakeIndex);
        snakeElements[index - 1] = element;
    });


    function hideAllSnakes() {
        _.forEach(snakeElements, function(element) {
            element.style.visibility = 'hidden';
        });
    }

    function resetTimer() {
        timer = 0;
    }

    function getTimerText(time) {
        var x = moment.duration(time);

        var hours   = x.hours();
        var minutes = x.minuts();
        var seconds = x.seconds();
        var ms      = x.ms();
    }

    function timerUpdate() {
        var currentTime = performance.now();
        timer += currentTime - lastFrame;
        lastFrame = currentTime;
        var timeStr = document.getElementById('timer-text').innerHTML = getTimeText(timer);
        if (isRunning)
            requestAnimationFrame(timerUpdate);
    }
});
