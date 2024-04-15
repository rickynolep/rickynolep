document.addEventListener('DOMContentLoaded', function() {
    var video = document.getElementById('opening-video');
    video.addEventListener('loadeddata', function() {
        setTimeout(function() {
            video.style.opacity = '0';
        }, 1200);
    });
});
