(function () {
    const AUDIO_URL = 'https://agent-699816ae10a2d7797--dashing-kangaroo-196daa.netlify.app/bg-music-math.mp3';
    // The audio is 3 hours 30 minutes long. We pick a random start time up to 3 hours.
    const MAX_START_TIME = 3 * 60 * 60; // 3 hours in seconds

    const audio = new Audio(AUDIO_URL);
    audio.volume = 0.4; // Set a reasonable background volume

    function playRandom() {
        const randomTime = Math.floor(Math.random() * MAX_START_TIME);
        audio.currentTime = randomTime;
        audio.play().catch(e => {
            console.log("Autoplay blocked. Waiting for user interaction to start background music.", e);
            // If autoplay is blocked, wait for the first click/touch on the document
            const startInteraction = () => {
                audio.play();
                document.removeEventListener('click', startInteraction);
                document.removeEventListener('touchstart', startInteraction);
            };
            document.addEventListener('click', startInteraction, { once: true });
            document.addEventListener('touchstart', startInteraction, { once: true });
        });
    }

    // When the audio finishes, play again from a random timestamp
    audio.addEventListener('ended', playRandom);

    // Try to play immediately when the script loads
    // We wait for DOMContentLoaded to ensure the browser has parsed the document,
    // though the script itself might be deferred or placed at the end of the body.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', playRandom);
    } else {
        playRandom();
    }

    // Expose volume controls to the global window object so simulations can duck the volume
    window.setBgMusicVolume = function (vol) {
        audio.volume = Math.max(0, Math.min(1, vol));
    };

    window.toggleBgMusicMute = function () {
        audio.muted = !audio.muted;
        return audio.muted;
    };

    let duckInterval = null;
    window.bgMusicDuck = function (targetVol = 0.05, duration = 300) {
        if (duckInterval) clearInterval(duckInterval);
        const steps = 15;
        const stepTime = duration / steps;
        const startVol = audio.volume;
        const volStep = (targetVol - startVol) / steps;
        let currentStep = 0;

        duckInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, Math.min(1, startVol + volStep * currentStep));
            if (currentStep >= steps) clearInterval(duckInterval);
        }, stepTime);
    };

    window.bgMusicRestore = function (targetVol = 0.2, duration = 800) {
        if (duckInterval) clearInterval(duckInterval);
        const steps = 15;
        const stepTime = duration / steps;
        const startVol = audio.volume;
        const volStep = (targetVol - startVol) / steps;
        let currentStep = 0;

        duckInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(0, Math.min(1, startVol + volStep * currentStep));
            if (currentStep >= steps) clearInterval(duckInterval);
        }, stepTime);
    };

})();
