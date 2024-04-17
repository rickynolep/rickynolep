document.addEventListener('DOMContentLoaded', function() {
    var video = document.getElementById('opening-video');
    video.addEventListener('loadeddata', function() {
        setTimeout(function() {
            video.style.opacity = '0';
        }, 1200);
    });

    var kemonomimiSpan = document.querySelector('.animated-underline');
    var iconPlaceholder = document.querySelector('.icon-placeholder');
    var roundedRectangle = document.querySelector('.rounded-rectangle');

    kemonomimiSpan.addEventListener('click', function() {
        // Fade out the icon placeholder
        iconPlaceholder.style.animation = 'fadeOut 0.5s forwards';

        // Resize the rounded rectangle
        roundedRectangle.style.width = 'fit-content';
        roundedRectangle.style.height = 'fit-content';

        // Display the text
        var popup = document.getElementById('popup');
        popup.style.display = 'block';
    });
});
