const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const txt = document.getElementById('txt');
const forceBtn = document.getElementById('forceBtn');
const statusDiv = document.getElementById('status');

// ===============================
// MÚSICA
// ===============================

const music = document.getElementById('music');
music.volume = 0.5;

// ===============================
// DETECTOR
// ===============================

let poseDetector;
const allImages = [];
const sources = [
    'africa 1.png',
    'africa 2.png',
    'africa 3.png',
    'africa 4.png',
    'africa 5.png',
    'africa 6.png',

    'america 1.png',
    'america 2.png',
    'america 3.png',
    'america 4.png',
    'america 5.png',
    'america 6.png',

    'asia 1.png',
    'asia 2.png',
    'asia 3.png',
    'asia 4.png',
    'asia 5.png',
    'asia 6.png',

    'europa 1.png',
    'europa 2.png',
    'europa 3.png',
    'europa 4.png',
    'europa 5.png',
    'europa 6.png',

    'oceanía 1.png',
    'oceanía 2.png',
    'oceanía 3.png',
    'oceanía 4.png',
    'oceanía 5.png',
    'oceanía 6.png',

    'artico 1.png',
    'artico 2.png',
    'artico 3.png',
    'artico 4.png',
    'artico 5.png',
    'artico 6.png'
];
let loadedCount = 0;

// ===============================
// CARGAR IMÁGENES
// ===============================

sources.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        loadedCount++;
    };
    allImages.push(img);
});

// ===============================
// INICIALIZACIÓN
// ===============================

async function init() {
    try {
        await tf.ready();
        poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType:
                    poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING
            }
        );
        if (video.readyState >= 2) {
            iniciarApp();
        } else {
            video.onloadeddata = iniciarApp;
        }
        setTimeout(() => {

            if (statusDiv.style.display !== 'none') {
                txt.innerText =
                    "Esperando permiso del navegador...";
                forceBtn.style.display = "inline-block";
            }
        }, 3000);
    } catch (e) {
        console.error(e);
        txt.innerText =
            "Error al cargar el sistema.";
    }
}

// ===============================
// INICIAR APLICACIÓN
// ===============================

async function iniciarApp() {
    try {
        await video.play();
        try {
            await music.play();
            console.log("Música iniciada");
        } catch (musicError) {
            console.log(
                "El navegador bloqueó el autoplay de la música."
            );
        }
        statusDiv.style.display = 'none';
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        render();
    } catch (err) {
        console.error(err);
        forceBtn.style.display = "inline-block";
    }
}

// ===============================
// BOTÓN
// ===============================

forceBtn.onclick = async () => {
    try {
        await video.play();
        await music.play();
        statusDiv.style.display = 'none';
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        render();
    } catch (err) {
        console.error(err);
        txt.innerText =
            "No se pudo iniciar el vídeo o la música.";
    }
};

// ===============================
// RANDOM CON SEMILLA
// ===============================

function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// ===============================
// RENDER
// ===============================

async function render() {
    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );
    if (
        poseDetector &&
        loadedCount === sources.length
    ) {
        const poses =
            await poseDetector.estimatePoses(video);
        const time = performance.now();

        // ===============================
        // PERSONAS DETECTADAS
        // ===============================

        poses.forEach((pose, pIdx) => {
            if (pose.score > 0.15) {
                const ls =
                    pose.keypoints.find(
                        k => k.name === 'left_shoulder'
                    );

                const rs =
                    pose.keypoints.find(
                        k => k.name === 'right_shoulder'
                    );

                let size = canvas.width * 0.04;
                if (ls && rs) {
                    size =
                        Math.hypot(
                            ls.x - rs.x,
                            ls.y - rs.y
                        ) * 0.8;
                }

                // ===============================
                // KEYPOINTS
                // ===============================

                pose.keypoints.forEach(
                    (kp, kIdx) => {
                        if (kp.score > 0.3) {
                            const seed =
                                kIdx + (pIdx * 17);
                            const img =
                                allImages[
                                    Math.floor(
                                        seededRandom(seed) *
                                        allImages.length
                                    )
                                ];
                            const driftX =
                                Math.sin(
                                    time / 300 + seed
                                ) * 10;
                            const driftY =
                                Math.cos(
                                    time / 250 + seed
                                ) * 10;
                            const rotation =
                                Math.sin(
                                    time / 500 + seed
                                ) * 0.01;

                            // ===============================
                            // DIBUJAR IMAGEN
                            // ===============================

                            ctx.save();
                            ctx.translate(
                                kp.x + driftX,
                                kp.y + driftY
                            );
                            ctx.rotate(rotation);
                            ctx.drawImage(
                                img,
                                -size / 2,
                                -size / 2,
                                size,
                                size
                            );
                            ctx.restore();
                        }
                    }
                );
            }
        });
    }

    requestAnimationFrame(render);
}
init();