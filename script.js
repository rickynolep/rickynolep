document.addEventListener('DOMContentLoaded', function() {
    var kemonomimiSpan = document.querySelector('.underline');
    var icon = document.querySelector('.iconholder');
    var pill = document.querySelector('.pill');
    var kemonomimi = document.querySelector('.kemonomimi');
    var discord = document.querySelector('.discord');
    var discordtext = document.querySelector('.discordtext');

    // Variables to keep track of active functions and timeouts
    var activeFunction = null;
    var transitionTimeout;

    kemonomimiSpan.addEventListener('click', function() {
        if (activeFunction !== null && activeFunction !== 'kemonomimi') {
            hideActiveFunction();
        }
        showKemonomimi();
    });

    discord.addEventListener('click', function() {
        if (activeFunction !== null && activeFunction !== 'discord') {
            hideActiveFunction();
        }
        showDiscord();
        changeUrl('/rikomunity');
    });

    function showKemonomimi() {
        clearTimeout(transitionTimeout);
        pill.style.width = '380px';
        pill.style.height = '100px';
        icon.classList.add('fade-out');
        setTimeout(function() {
            kemonomimi.style.display = 'block';
        }, 300);
        setTimeout(function() {
            icon.style.display = 'none';
            kemonomimi.style.opacity = '1';
        }, 400);

        transitionTimeout = setTimeout(function() {
            kemonomimi.style.opacity = '0';
            setTimeout(function() {
                pill.style.width = '100px';
                pill.style.height = '30px';
                icon.style.display = 'block';
            }, 200);
            setTimeout(function() {
                icon.classList.remove('fade-out');
            }, 400);
            setTimeout(function() {
                kemonomimi.style.display = 'none';
            }, 200);
        }, 5000);

        activeFunction = 'kemonomimi';
    }

    function showDiscord() {
        clearTimeout(transitionTimeout);
        pill.style.width = '380px';
        pill.style.height = '100px';
        icon.classList.add('fade-out');
        setTimeout(function() {
            discordtext.style.display = 'block';
        }, 300);
        setTimeout(function() {
            icon.style.display = 'none';
            discordtext.style.opacity = '1';
        }, 400);

        transitionTimeout = setTimeout(function() {
            discordtext.style.opacity = '0';
            setTimeout(function() {
                pill.style.width = '100px';
                pill.style.height = '30px';
                icon.style.display = 'block';
            }, 200);
            setTimeout(function() {
                icon.classList.remove('fade-out');
            }, 400);
            setTimeout(function() {
                discordtext.style.display = 'none';
            }, 200);
        }, 5000);

        activeFunction = 'discord';
    }

    function hideActiveFunction() {
        clearTimeout(transitionTimeout);
        if (activeFunction === 'kemonomimi') {
            kemonomimi.style.opacity = '0';
            setTimeout(function() {
                kemonomimi.style.display = 'none';
            }, 200);
        } else if (activeFunction === 'discord') {
            discordtext.style.opacity = '0';
            setTimeout(function() {
                discordtext.style.display = 'none';
            }, 200);
        }
    }

    function changeUrl(path) {
        history.pushState(null, null, path);
    }
});
