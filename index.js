//Declaring Buttons
const audio = document.getElementById("audioPlayer");
const playbtn = document.getElementById("play");
const rebtn = document.getElementById("rewind");
const forbtn = document.getElementById("forward");
const share =  document.getElementById("share");
const repeat = document.getElementById("repeat");
const shuffle = document.getElementById("shuffle");
const progress = document.getElementById("progress");
const progressContainer = document.getElementById("progress-container");
const curr = document.getElementById("currentTime");
const dur = document.getElementById("duration");
const art = document.getElementById("artwork");
const icon = playbtn.querySelector("i");
let ffInterval, rwInterval, ffTimeout, rwTimeout;
let isFastForwarding = false;
let isRewinding = false;
let suppressNextClick = false;
let flashTimeout;
let repeatMode = "all";
let isShuffle = false;
let shuffleQueue = [];
let shuffleIndex = 0;
let lastSync = 0;
const vid = document.getElementById("vid");
const bgVideos = document.querySelectorAll('.bg-video');
let videoResetTimeout = null;
const knob = document.getElementById("knob");
const fader = document.getElementById("fade2");
const card = document.querySelector(".card");
let draggingKnob = false;
const faderHeight = 400;
//Declaring Tracks

const tracks = [
    {
        name: "Dark Energy Instrummental",
        src: "music/CASSIANO.mp3",
        artist: "Jeremy",
        album: "Spaced Out (Unreleased)",
        cover: "gifs/ocean at night.gif",
        background: "footage/alt.mp4",
    },
    {
        name: "WolfGang Schluter Combo Instrummental",
        src: "music/WOLFGANG.mp3",
        artist: "Jeremy",
        album: "Kaisar (Unreleased)",
        cover: "gifs/mountains.gif",
        background: "footage/mountains.mp4",
    },
    {
        name: "109",
        src: "music/109.mp3",
        artist: "Jeremy",
        album: "Sega Genesis",
        cover: "gifs/universe.gif",
        background: "footage/109 vsc.mp4",
    },
    {
        name: "Join Us Instrummental",
        src: "music/216.mp3",
        artist: "Jeremy",
        album: "After Graduation",
        cover: "gifs/universe3.gif",
        background: "footage/Join Us Less Effects.mp4",
    },
    {
        name: "No Worries",
        src: "music/219.mp3",
        artist: "Jeremy",
        album: "After Graduation",
        cover: "gifs/universe2.gif",
        background: "footage/No Worries Just Vid.mp4",
    }
];

let currentTrack = 0;

//Load Track
function loadTrack(index, direction = 'next') {
    const track = tracks[index];
    
    audio.src = track.src;
    audio.load();
    clearTimeout(videoResetTimeout);

    document.getElementById("song").textContent = track.name || "None";
    document.getElementById("artist").textContent = track.artist || "None";
    document.getElementById("album").textContent = track.album || "None";
    //Slide Animation
    art.style.opacity = 0;
    artwork.style.transform = 'translateX(-50px) scale(0.95)';

    setTimeout(() => {
        art.src = track.cover;
        // When image is updated, trigger smooth fade-in + slide-in + scale-up
        art.style.transform = 'translateX(0) scale(1)';
        artwork.style.opacity = 1;
    }, 200);
    audio.volume = 1;

    //Set direction
    if (direction === 'next') {
        artwork.style.transform = 'translateX(50px) scale(0.95)';
    } else if (direction === 'prev') {
        artwork.style.transform = 'translateX(-50px) scale(0.95)'
    }

    vid.currentTime = audio.currentTime;
    vid.play().catch(console.error);
    changeBackgroundVideo(track.background);

}

function changeBackgroundVideo(newSrc) {

    
   setTimeout(() => {
    vid.src = newSrc;
    vid.loop = false;
    vid.muted = true;
    vid.load();

        
        vid.oncanplay = () => {
            if (!audio.paused) {
                vid.play().catch(console.error);
                vid.classList.add("visible");
            } else {
                vid.classList.remove("visible");
            }
        };
    
        vid.onended = null;
        
    });

}



// Play or pause
function play(){
    if(audio.paused){
        clearTimeout(videoResetTimeout);
        audio.play();
        setPlayIcon(true);
        vid.classList.add("visible"); // Show video
        vid.play().catch(console.error);
    } else {
        audio.pause();
        setPlayIcon(false);
        vid.pause();
        vid.classList.remove("visible"); // Hide video
    }
    
}

//Next track
function nextTrack() {

    if(isShuffle && shuffleQueue.length > 0) {
        shuffleIndex++;
        if (shuffleIndex >= shuffleQueue.length) {
            shuffleIndex = 0;
            shuffleQueue = [...Array(tracks.length).keys()].filter(i => i !== currentTrack);
            for (let i = shuffleQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]];
            }
        }
        currentTrack = shuffleQueue[shuffleIndex];
    } else {
        currentTrack = (currentTrack + 1) % tracks.length;
    }

    clearTimeout(videoResetTimeout);
    loadTrack(currentTrack, 'next');
    audio.play();
    icon.classList.add("fa-solid", "fa-pause");
    setPlayIcon(true)//updates play button to pause icon
}

//Previous track
function prevTrack() {
    if (audio.currentTime > 10) {
        // Restart current track if more than 10 seconds in
        audio.currentTime = 0;
        audio.play();
    } else {
        if (isShuffle && shuffleQueue.length > 0) {
            shuffleIndex--;
            if (shuffleIndex < 0) {
                shuffleIndex = shuffleQueue.length - 1;
            } 
            currentTrack = shuffleQueue[shuffleIndex];
        } else {
            if (currentTrack === 0) {
                currentTrack = tracks.length - 1;
            } else {
                currentTrack -= 1;
            }
        }

        clearTimeout(videoResetTimeout);
        loadTrack(currentTrack, 'prev');
        audio.play();
        icon.classList.add("fa-solid", "fa-pause");
    }
    setPlayIcon(true)//updates play button to pause icon
}

//Fixes play button still on when clicking the for or re btns

function setPlayIcon(isPlaying) {
    if (isPlaying) {
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
    } else {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
    }
}


//Adds the skipping for the forward and rewind buttons

function startFastForward() {
    ffInterval = setInterval(() => {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 0.5);
        vid.currentTime = audio.currentTime
    }, 100);
}

function startRewind() {
    rwInterval = setInterval(() => {
        audio.currentTime = Math.max(0, audio.currentTime - 0.5);
        vid.currentTime = audio.currentTime
    }, 100);
}

function stopSkipping() {
    clearInterval(ffInterval);
    clearInterval(rwInterval);
    clearTimeout(ffTimeout);
    clearTimeout(rwTimeout);
    isFastForwarding = false;
    isRewinding = false
}

//Glow Effects

function flashButton(button) {
    button.classList.add("button-flash");

    clearTimeout(flashTimeout);

    flashTimeout = setTimeout (() => {
        button.classList.remove("button-flash");
    }, 200);

    const clearFlash = () => {
        clearTimeout(flashTimeout);
        button.classList.remove("button-flash");
        button.removeEventListener("mouseleave", clearFlash);
    };

    button.addEventListener("mouseleave", clearFlash);
}

function addHoldEffect(button) {
    button.addEventListener("mousedown", () => {
        button.classList.add("button-held");
    });

    button.addEventListener("mouseup", () => {
        button.classList.remove("button-held");
    });

    button.addEventListener("mouseleave", () => {
        button.classList.remove("button-held");
    });
}

//Actually adding the skipping to the Fast forward and rewind buttons
//forbtn

forbtn.addEventListener("mousedown", () => {
    flashButton(forbtn);
    suppressNextClick = false;
    ffTimeout = setTimeout(() => {
        suppressNextClick = true;
        isFastForwarding = true;
        startFastForward();
    }, 3000);
});

forbtn.addEventListener ("mouseup", () => {
    stopSkipping();
});

forbtn.addEventListener("mouseleave", stopSkipping);

//rebtn

rebtn.addEventListener("mousedown", () => {
    flashButton(rebtn);
    suppressNextClick = false;
    rwTimeout = setTimeout(() => {
        suppressNextClick = true;
        isRewinding = true;
        startRewind();
    }, 3000);
});

rebtn.addEventListener("mouseup", () => {
    stopSkipping();
});

rebtn.addEventListener("mouseleave", stopSkipping);

// Share Event

function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

share.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href)
        .then(() => showToast())
        .catch(err => console.error("Clipboard error:", err));
});

// Repeat

repeat.addEventListener("click", () => {
    if (repeatMode === "all") {
        repeatMode = "one";
        rone.classList.add("show");
        repeat.classList.remove("yellow");
        repeat.classList.add("lightyellow");

        setTimeout(() => {
            rone.classList.remove("show");
        }, 2000);
        audio.loop = true;
    } else if (repeatMode === "one") {
        repeatMode = "none";
        roff.classList.add("show");
        repeat.classList.remove("lightyellow","yellow");

        setTimeout(() => {
            roff.classList.remove("show");
        }, 2000);
        audio.loop = false;
    } else {
        repeatMode = "all";
        rall.classList.add("show");
        repeat.classList.add("yellow")

        setTimeout(() => {
            rall.classList.remove("show");
        }, 2000);
        audio.loop = false;
    }
})

//What happens when a track ends
audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
        restartAudio();
    } else if (repeatMode === "all") {
        nextTrack();
    } else {
        icon.classList.add("fa-play");
    }
})

//Format seconds into M:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor (seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

//Setting duration once metadata is loaded
audio.addEventListener('loadedmetadata', () => {
    dur.textContent = formatTime(audio.duration);
})

//Updates progress bar as audio plays
audio.addEventListener('timeupdate', () => {
    if(audio.duration && !isNaN(audio.duration)){
        const percentage = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${percentage}%`;
        curr.textContent = formatTime(audio.currentTime);
    }
    //Restarts the video when it ends
    if (vid.readyState >= 2 && vid.duration) {
    let correctedTime = audio.currentTime % vid.duration;
    if (Math.abs(vid.currentTime - correctedTime) > 0.3) {
        vid.currentTime = correctedTime
    }
}
});

//Animation delay
setTimeout(() => {
    progress.style.transition = 'width 0.3s ease';
}, 10)

//Seek functionality
progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
})

//Shuffle Button

shuffle.addEventListener("click", () => {
    isShuffle = !isShuffle;

    if (isShuffle) {
        shuffle.classList.add("active");
        showToast("Shuffle On");
        shufflem.classList.add("show");

        shuffleQueue =[...Array(tracks.length).keys()];
        for (let i = shuffleQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffleQueue[i], shuffleQueue[j]] = [shuffleQueue[j], shuffleQueue[i]]
        }
        shuffleIndex = 0;

        setTimeout(() =>{
            shufflem.classList.remove("show");
        }, 2000);
    } else {
        shuffle.classList.remove("active");
        showToast("Shuffle Off");
        shuffleoff.classList.add("show");

        shuffleQueue = [];
        shuffleIndex = 0;

        setTimeout(() => {
            shuffleoff.classList.remove("show");
        }, 2000);
    }
});


// Audioplay events

loadTrack(currentTrack);
playbtn.addEventListener("click", () => {
    flashButton(playbtn);
    play();
});

// Flash affects

forbtn.addEventListener("click", () => {
    if (suppressNextClick) return;
        flashButton(forbtn);
        nextTrack();
    
});
rebtn.addEventListener("click", () => {
    if (suppressNextClick) return;
        flashButton(rebtn);
        prevTrack();
    
});
repeat.addEventListener("click", () => {
    flashButton(repeat);
});
share.addEventListener("click",() => {
    flashButton(share);
})
shuffle.addEventListener("click", () => {
    flashButton(shuffle);
})

//Fader
knob.addEventListener("mousedown", (e) => {
    draggingKnob = true;
    e.preventDefault();
});

document.addEventListener("mouseup", () => {
    draggingKnob = false;
});

document.addEventListener("mousemove", (e) => {
    if (!draggingKnob) return;

    const rect = fader.getBoundingClientRect();
    let y = e.clientY - rect.top;
    y = Math.max(0, Math.min(y, faderHeight));

    knob.style.top = `${y}px`;

    const opacity = 1 - y / faderHeight;
    card.style.opacity = opacity;
    fader.style.opacity = opacity;
});

document.addEventListener("DOMContentLoaded", () => {
    knob.style.top = "30px";
    fader.style.top = "30px";
    card.style.opacity = 1;
    fader.style.opacity = 1;
});

//Is Audio playing or not events

audio.addEventListener("play", () => console.log("Audio is playing"));
audio.addEventListener("error", () => console.log("Audio failed to play"));

// On click event

addHoldEffect(playbtn);
addHoldEffect(forbtn);
addHoldEffect(rebtn);
addHoldEffect(repeat);
addHoldEffect(share);
addHoldEffect(shuffle);

