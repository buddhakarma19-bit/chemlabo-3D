// =====================================================
// CHEMLAB 3D
// VERSION COMPLETE
// =====================================================

const container = document.getElementById("scene-container");

const experienceSelect = document.getElementById("experience");
const melangerButton = document.getElementById("melanger");
const resetButton = document.getElementById("resetLab");

const resultat = document.getElementById("resultat");
const botMessage = document.getElementById("botMessage");

const materialA = document.getElementById("materialA");
const materialB = document.getElementById("materialB");

const infoState = document.getElementById("infoState");
const experimentTime = document.getElementById("experimentTime");

const volumeSlider = document.getElementById("volume");
const concentrationSlider = document.getElementById("concentration");
const temperatureSlider = document.getElementById("temperature");

const volumeValue = document.getElementById("volumeValue");
const concentrationValue = document.getElementById("concentrationValue");
const temperatureValue = document.getElementById("temperatureValue");

const infoVolume = document.getElementById("infoVolume");
const infoConcentration = document.getElementById("infoConcentration");
const infoTemperature = document.getElementById("infoTemperature");


// =====================================================
// VARIABLES
// =====================================================

let scene;
let camera;
let renderer;

let raycaster;
let mouse;

let beaker;
let beakerLiquid;

let bottleA;
let bottleB;

let selectedObject = null;

let dragging = false;

let pouredA = false;
let pouredB = false;

let pouringA = false;
let pouringB = false;

let mixing = false;

let reaction = null;
let reactionStart = 0;

let particles = [];
let pourStreams = [];

let volume = 50;
let concentration = 0.5;
let temperature = 25;

let beakerVolume = 0;

let halfLifeReached = false;

let autoReactionTimer = null;


// =====================================================
// COULEURS
// =====================================================

const materialColors = {

    I: 0xf2edc5,

    S2O8: 0xe3f5ff,

    HCl: 0x65b8e8,

    NaOH: 0x6cc8f0,

    CaCO3: 0xe2ddd3,

    Zn: 0x9da7ad,

    CuSO4: 0x276bd1

};


// =====================================================
// EXPERIENCES
// =====================================================

const experiences = {

    iodure_persulfate: {

        A: "I⁻",

        B: "S₂O₈²⁻",

        equation:
            "S₂O₈²⁻ + 2 I⁻ → I₂ + 2 SO₄²⁻",

        name:
            "Oxydation des ions iodure",

        duration:
            12,

        gas:
            false,

        explanation:
            "Les ions persulfate oxydent les ions iodure. Le diiode I₂ apparaît progressivement."
    },


    hcl_naoh: {

        A: "HCl",

        B: "NaOH",

        equation:
            "HCl + NaOH → NaCl + H₂O",

        name:
            "Neutralisation acido-basique",

        duration:
            8,

        gas:
            false,

        explanation:
            "Une réaction de neutralisation entre un acide et une base."
    },


    hcl_caco3: {

        A: "HCl",

        B: "CaCO₃",

        equation:
            "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂",

        name:
            "Acide + carbonate",

        duration:
            7,

        gas:
            true,

        explanation:
            "La réaction produit du dioxyde de carbone. Les bulles représentent le gaz."
    },


    hcl_zn: {

        A: "HCl",

        B: "Zn",

        equation:
            "Zn + 2HCl → ZnCl₂ + H₂",

        name:
            "Acide + zinc",

        duration:
            6,

        gas:
            true,

        explanation:
            "Le zinc réagit avec l'acide chlorhydrique et produit du dihydrogène."
    },


    zn_cuso4: {

        A: "Zn",

        B: "CuSO₄",

        equation:
            "Zn + CuSO₄ → ZnSO₄ + Cu",

        name:
            "Déplacement métallique",

        duration:
            10,

        gas:
            false,

        explanation:
            "Le zinc réagit avec les ions cuivre(II)."
    }

};


// =====================================================
// INITIALISATION
// =====================================================

function init() {

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x0b151d);


    camera =
        new THREE.PerspectiveCamera(
            50,
            container.clientWidth /
            container.clientHeight,
            0.1,
            100
        );


    camera.position.set(
        0,
        2.5,
        8
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );


    renderer.setSize(
        container.clientWidth,
        container.clientHeight
    );


    container.appendChild(
        renderer.domElement
    );


    raycaster =
        new THREE.Raycaster();


    mouse =
        new THREE.Vector2();


    // =================================================
    // LIGHTS
    // =================================================

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.2
        );

    scene.add(
        ambient
    );


    const mainLight =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );

    mainLight.position.set(
        4,
        8,
        5
    );

    scene.add(
        mainLight
    );


    const blueLight =
        new THREE.PointLight(
            0x72b7ff,
            1.2,
            20
        );

    blueLight.position.set(
        -4,
        3,
        4
    );

    scene.add(
        blueLight
    );


    createTable();

    createBeaker();

    createBottleA();

    createBottleB();


    // =================================================
    // MOUSE EVENTS
    // =================================================

    renderer.domElement.addEventListener(
        "mousedown",
        mouseDown
    );


    renderer.domElement.addEventListener(
        "mousemove",
        mouseMove
    );


    renderer.domElement.addEventListener(
        "mouseup",
        mouseUp
    );


    renderer.domElement.addEventListener(
        "mouseleave",
        mouseUp
    );


    animate();
}


// =====================================================
// TABLE
// =====================================================

function createTable() {

    const geometry =
        new THREE.BoxGeometry(
            11,
            0.5,
            6
        );


    const material =
        new THREE.MeshStandardMaterial({
            color: 0x394952,
            roughness: 0.7
        });


    const table =
        new THREE.Mesh(
            geometry,
            material
        );


    table.position.y =
        -1.7;


    scene.add(
        table
    );
}


// =====================================================
// BEAKER
// =====================================================

function createBeaker() {

    const glass =
        new THREE.MeshPhysicalMaterial({

            color: 0xdff6ff,

            transparent: true,

            opacity: 0.24,

            roughness: 0.04,

            side: THREE.DoubleSide

        });


    const geometry =
        new THREE.CylinderGeometry(
            1.55,
            1.25,
            2.8,
            64,
            1,
            true
        );


    beaker =
        new THREE.Mesh(
            geometry,
            glass
        );


    beaker.position.set(
        0,
        -0.1,
        0
    );


    scene.add(
        beaker
    );


    const liquidGeometry =
        new THREE.CylinderGeometry(
            1.25,
            1.1,
            0.1,
            64
        );


    const liquidMaterial =
        new THREE.MeshPhysicalMaterial({

            color: 0xddeeff,

            transparent: true,

            opacity: 0.82,

            roughness: 0.05
        });


    beakerLiquid =
        new THREE.Mesh(
            liquidGeometry,
            liquidMaterial
        );


    beakerLiquid.position.y =
        -1.15;


    scene.add(
        beakerLiquid
    );
}


// =====================================================
// CREATE BOTTLE
// =====================================================

function createBottle(
    x,
    color,
    label
) {

    const group =
        new THREE.Group();


    // BODY

    const bodyGeometry =
        new THREE.CylinderGeometry(
            0.55,
            0.62,
            1.45,
            32
        );


    const bodyMaterial =
        new THREE.MeshPhysicalMaterial({

            color: 0xdcebf2,

            transparent: true,

            opacity: 0.55,

            roughness: 0.08
        });


    const body =
        new THREE.Mesh(
            bodyGeometry,
            bodyMaterial
        );


    group.add(
        body
    );


    // LIQUID

    const liquidGeometry =
        new THREE.CylinderGeometry(
            0.46,
            0.50,
            0.78,
            32
        );


    const liquidMaterial =
        new THREE.MeshStandardMaterial({

            color: color,

            transparent: true,

            opacity: 0.82
        });


    const liquid =
        new THREE.Mesh(
            liquidGeometry,
            liquidMaterial
        );


    liquid.position.y =
        -0.20;


    liquid.name =
        "liquid";


    group.add(
        liquid
    );


    // NECK

    const neckGeometry =
        new THREE.CylinderGeometry(
            0.30,
            0.34,
            0.30,
            24
        );


    const neckMaterial =
        new THREE.MeshPhysicalMaterial({

            color: 0xdcebf2,

            transparent: true,

            opacity: 0.55
        });


    const neck =
        new THREE.Mesh(
            neckGeometry,
            neckMaterial
        );


    neck.position.y =
        0.72;


    group.add(
        neck
    );


    // CAP

    const capGeometry =
        new THREE.CylinderGeometry(
            0.28,
            0.28,
            0.32,
            24
        );


    const capMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x555d62
        });


    const cap =
        new THREE.Mesh(
            capGeometry,
            capMaterial
        );


    cap.position.y =
        0.99;


    group.add(
        cap
    );


    // POSITION

    group.position.set(
        x,
        -0.25,
        0
    );


    group.userData.label =
        label;


    group.userData.originalPosition =
        group.position.clone();


    scene.add(
        group
    );


    return group;
}


// =====================================================
// BOTTLES
// =====================================================

function createBottleA() {

    bottleA =
        createBottle(
            -3,
            materialColors.I,
            "I⁻"
        );
}


function createBottleB() {

    bottleB =
        createBottle(
            3,
            materialColors.S2O8,
            "S₂O₈²⁻"
        );
}


// =====================================================
// MATERIAL COLOR
// =====================================================

function getMaterialColor(
    name
) {

    if (name === "I⁻")
        return materialColors.I;

    if (name === "S₂O₈²⁻")
        return materialColors.S2O8;

    if (name === "HCl")
        return materialColors.HCl;

    if (name === "NaOH")
        return materialColors.NaOH;

    if (name === "CaCO₃")
        return materialColors.CaCO3;

    if (name === "Zn")
        return materialColors.Zn;

    if (name === "CuSO₄")
        return materialColors.CuSO4;

    return 0xffffff;
}


// =====================================================
// UPDATE BOTTLES
// =====================================================

function updateBottleAppearance() {

    const key =
        experienceSelect.value;

    const exp =
        experiences[key];


    if (!exp)
        return;


    bottleA
        .getObjectByName("liquid")
        .material.color.set(
            getMaterialColor(exp.A)
        );


    bottleB
        .getObjectByName("liquid")
        .material.color.set(
            getMaterialColor(exp.B)
        );
}


// =====================================================
// EXPERIENCE SELECT
// =====================================================

experienceSelect.addEventListener(
    "change",
    function () {

        clearTimeout(
            autoReactionTimer
        );


        resetLab();


        const key =
            experienceSelect.value;


        const exp =
            experiences[key];


        if (!exp)
            return;


        materialA.textContent =
            exp.A;


        materialB.textContent =
            exp.B;


        updateBottleAppearance();


        botMessage.textContent =
            exp.explanation;


        resultat.innerHTML = `

            <h3>🧪 ${exp.name}</h3>

            <p>
                <strong>Équation :</strong>
            </p>

            <p>
                ${exp.equation}
            </p>

            <p>
                Prends les deux flacons,
                puis verse-les dans le bécher.
            </p>

        `;
    }
);


// =====================================================
// MOUSE DOWN
// =====================================================

function mouseDown(
    event
) {

    if (mixing)
        return;


    const rect =
        renderer.domElement
            .getBoundingClientRect();


    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;


    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const intersections =
        raycaster.intersectObjects(
            [bottleA, bottleB],
            true
        );


    if (
        intersections.length === 0
    )
        return;


    selectedObject =
        intersections[0].object;


    while (
        selectedObject.parent &&
        selectedObject !== bottleA &&
        selectedObject !== bottleB
    ) {

        selectedObject =
            selectedObject.parent;
    }


    dragging =
        true;


    infoState.textContent =
        "Manipulation";


    renderer.domElement.style.cursor =
        "grabbing";
}


// =====================================================
// MOUSE MOVE
// =====================================================

function mouseMove(
    event
) {

    if (
        !dragging ||
        !selectedObject
    )
        return;


    const rect =
        renderer.domElement
            .getBoundingClientRect();


    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;


    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;


    const vector =
        new THREE.Vector3(
            mouse.x,
            mouse.y,
            0.5
        );


    vector.unproject(
        camera
    );


    const direction =
        vector
            .sub(camera.position)
            .normalize();


    const distance =
        -camera.position.z /
        direction.z;


    const position =
        camera.position
            .clone()
            .add(
                direction.multiplyScalar(
                    distance
                )
            );


    selectedObject.position.x =
        THREE.MathUtils.clamp(
            position.x,
            -4.5,
            4.5
        );


    selectedObject.position.y =
        THREE.MathUtils.clamp(
            position.y,
            -1.1,
            3
        );


    // Rotation

    if (
        selectedObject.position.x < -0.8
    ) {

        selectedObject.rotation.z =
            THREE.MathUtils.lerp(
                0,
                0.9,
                Math.min(
                    1,
                    Math.abs(
                        selectedObject.position.x + 0.8
                    ) / 2
                )
            );

    } else if (
        selectedObject.position.x > 0.8
    ) {

        selectedObject.rotation.z =
            THREE.MathUtils.lerp(
                0,
                -0.9,
                Math.min(
                    1,
                    Math.abs(
                        selectedObject.position.x - 0.8
                    ) / 2
                )
            );
    }


    checkPour(
        selectedObject
    );
}


// =====================================================
// MOUSE UP
// =====================================================

function mouseUp() {

    if (!selectedObject) {

        dragging =
            false;

        return;
    }


    checkPour(
        selectedObject
    );


    if (
        selectedObject === bottleA &&
        !pouredA &&
        !pouringA
    ) {

        returnBottle(
            bottleA
        );
    }


    if (
        selectedObject === bottleB &&
        !pouredB &&
        !pouringB
    ) {

        returnBottle(
            bottleB
        );
    }


    selectedObject =
        null;


    dragging =
        false;


    renderer.domElement.style.cursor =
        "default";
}


// =====================================================
// RETURN BOTTLE
// =====================================================

function returnBottle(
    bottle
) {

    bottle.position.copy(
        bottle.userData.originalPosition
    );


    bottle.rotation.z =
        0;
}


// =====================================================
// CHECK POUR
// =====================================================

function checkPour(
    bottle
) {

    if (
        !bottle ||
        !experienceSelect.value
    )
        return;


    const distance =
        Math.sqrt(
            bottle.position.x ** 2 +
            (bottle.position.y + 0.1) ** 2
        );


    if (
        distance < 1.9 &&
        bottle.position.y > -1.0
    ) {

        if (
            bottle === bottleA &&
            !pouredA &&
            !pouringA
        ) {

            pourBottle(
                bottleA,
                "A"
            );
        }


        if (
            bottle === bottleB &&
            !pouredB &&
            !pouringB
        ) {

            pourBottle(
                bottleB,
                "B"
            );
        }
    }
}


// =====================================================
// POUR BOTTLE
// =====================================================

function pourBottle(
    bottle,
    side
) {

    if (
        side === "A"
    ) {

        pouringA =
            true;

    } else {

        pouringB =
            true;
    }


    // Position au-dessus du bécher

    bottle.position.x =
        side === "A"
            ? -1.35
            : 1.35;


    bottle.position.y =
        1.8;


    bottle.rotation.z =
        side === "A"
            ? -0.95
            : 0.95;


    const stream =
        createPourStream(
            bottle,
            side
        );


    const liquid =
        bottle.getObjectByName(
            "liquid"
        );


    const start =
        performance.now();


    const duration =
        1000;


    function transfer() {

        const elapsed =
            performance.now() -
            start;


        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        // liquide bouteille

        if (liquid) {

            liquid.scale.y =
                1 -
                progress * 0.88;

            liquid.position.y =
                -0.2 -
                progress * 0.18;
        }


        // liquide bécher

        updateBeakerVolume(
            progress
        );


        // stream

        if (stream) {

            stream.scale.y =
                0.5 +
                progress * 0.5;
        }


        if (
            progress < 1
        ) {

            requestAnimationFrame(
                transfer
            );

        } else {

            finishPour(
                bottle,
                side,
                stream
            );
        }
    }


    transfer();
}


// =====================================================
// FIN POUR
// =====================================================

function finishPour(
    bottle,
    side,
    stream
) {

    if (stream) {

        scene.remove(
            stream
        );


        const index =
            pourStreams.indexOf(
                stream
            );


        if (index !== -1) {

            pourStreams.splice(
                index,
                1
            );
        }
    }


    if (
        side === "A"
    ) {

        pouringA =
            false;

        pouredA =
            true;

    } else {

        pouringB =
            false;

        pouredB =
            true;
    }


    bottle.rotation.z =
        0;


    bottle.position.copy(
        bottle.userData.originalPosition
    );


    infoState.textContent =
        side === "A"
            ? "Réactif A ajouté"
            : "Réactif B ajouté";


    updateResult();


    // Auto reaction

    if (
        pouredA &&
        pouredB
    ) {

        autoReactionTimer =
            setTimeout(
                function () {

                    startReaction();

                },
                600
            );
    }
}


// =====================================================
// POUR STREAM
// =====================================================

function createPourStream(
    bottle,
    side
) {

    const geometry =
        new THREE.CylinderGeometry(
            0.055,
            0.035,
            1.5,
            12
        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                side === "A"
                    ? materialColors.I
                    : materialColors.S2O8,

            transparent:
                true,

            opacity:
                0.75
        });


    const stream =
        new THREE.Mesh(
            geometry,
            material
        );


    stream.userData.bottle =
        bottle;


    stream.position.set(
        bottle.position.x,
        bottle.position.y - 0.9,
        0
    );


    scene.add(
        stream
    );


    pourStreams.push(
        stream
    );


    return stream;
}


// =====================================================
// UPDATE STREAMS
// =====================================================

function updatePourStreams() {

    pourStreams.forEach(
        stream => {

            const bottle =
                stream.userData.bottle;


            if (!bottle)
                return;


            stream.position.x =
                bottle.position.x;


            stream.position.y =
                bottle.position.y -
                0.8;


            stream.rotation.z =
                bottle.rotation.z;
        }
    );
}


// =====================================================
// BEAKER VOLUME
// =====================================================

function updateBeakerVolume(
    progress
) {

    const target =
        0.48;


    beakerVolume =
        Math.max(
            beakerVolume,
            target * progress
        );


    const height =
        0.1 +
        beakerVolume * 1.1;


    beakerLiquid.scale.y =
        height / 0.1;


    beakerLiquid.position.y =
        -1.25 +
        height / 2;
}


// =====================================================
// RESULT
// =====================================================

function updateResult() {

    const key =
        experienceSelect.value;


    const exp =
        experiences[key];


    if (!exp)
        return;


    if (
        pouredA &&
        pouredB
    ) {

        resultat.innerHTML = `

            <h3>⚗️ Mélange prêt</h3>

            <p>
                Les deux réactifs sont
                maintenant dans le bécher.
            </p>

            <p>
                La transformation va commencer
                automatiquement.
            </p>

        `;
    }
}


// =====================================================
// START REACTION
// =====================================================

function startReaction() {

    if (mixing)
        return;


    const key =
        experienceSelect.value;


    const exp =
        experiences[key];


    if (!exp)
        return;


    if (
        !pouredA ||
        !pouredB
    ) {

        resultat.innerHTML = `

            <h3>⚠️ Manipulation incomplète</h3>

            <p>
                Verse d'abord les deux réactifs
                dans le bécher.
            </p>

        `;

        return;
    }


    clearTimeout(
        autoReactionTimer
    );


    mixing =
        true;


    reaction =
        exp;


    reactionStart =
        performance.now();


    halfLifeReached =
        false;


    infoState.textContent =
        "Réaction en cours";


    resultat.innerHTML = `

        <h3>⚗️ Réaction en cours</h3>

        <p>
            <strong>
                ${exp.equation}
            </strong>
        </p>

        <p>
            Temps :
            <strong id="reactionTimer">
                0.00
            </strong>
            s
        </p>

        <p>
            Avancement :
            <strong id="reactionPercent">
                0
            </strong> %
        </p>

        <p>
            Vitesse relative :
            <strong id="relativeSpeed">
                —
            </strong>
        </p>

        <p>
            t₁/₂ :
            <strong id="halfLifeValue">
                —
            </strong>
        </p>

        <div
            style="
                height:7px;
                background:#263b48;
                border-radius:5px;
                overflow:hidden;
                margin-top:12px;
            "
        >

            <div
                id="reactionProgress"
                style="
                    width:0%;
                    height:100%;
                    background:#42a5f5;
                "
            ></div>

        </div>

    `;
}


// =====================================================
// BOUTON MÉLANGER
// =====================================================

melangerButton.addEventListener(
    "click",
    function () {

        if (!experienceSelect.value) {

            resultat.innerHTML = `

                <h3>⚠️</h3>

                <p>
                    Choisis d'abord une expérience.
                </p>

            `;

            return;
        }


        if (
            !pouredA ||
            !pouredB
        ) {

            resultat.innerHTML = `

                <h3>⚠️ Manipulation incomplète</h3>

                <p>
                    Il faut d'abord verser
                    les deux réactifs.
                </p>

            `;

            return;
        }


        startReaction();
    }
);


// =====================================================
// UPDATE REACTION
// =====================================================

function updateReaction() {

    if (
        !mixing ||
        !reaction
    )
        return;


    const elapsed =
        (
            performance.now() -
            reactionStart
        ) / 1000;


    // Modèle pédagogique

    const temperatureFactor =
        Math.pow(
            2,
            (temperature - 25) / 10
        );


    const concentrationFactor =
        concentration /
        0.5;


    const speedFactor =
        concentrationFactor *
        Math.sqrt(
            temperatureFactor
        );


    const duration =
        reaction.duration /
        Math.max(
            speedFactor,
            0.1
        );


    const progress =
        Math.min(
            elapsed /
            duration,
            1
        );


    experimentTime.textContent =
        elapsed.toFixed(2) +
        " s";


    const timer =
        document.getElementById(
            "reactionTimer"
        );


    if (timer) {

        timer.textContent =
            elapsed.toFixed(2);
    }


    const percent =
        document.getElementById(
            "reactionPercent"
        );


    if (percent) {

        percent.textContent =
            Math.round(
                progress * 100
            );
    }


    const speed =
        document.getElementById(
            "relativeSpeed"
        );


    if (speed) {

        speed.textContent =
            speedFactor.toFixed(2);
    }


    const bar =
        document.getElementById(
            "reactionProgress"
        );


    if (bar) {

        bar.style.width =
            progress * 100 + "%";
    }


    // =================================================
    // I- + S2O8
    // =================================================

    if (
        experienceSelect.value ===
        "iodure_persulfate"
    ) {

        const startColor =
            new THREE.Color(
                0xddeeff
            );


        const iodineColor =
            new THREE.Color(
                0x8f5412
            );


        beakerLiquid.material.color.lerpColors(
            startColor,
            iodineColor,
            progress
        );


        // mouvement

        beakerLiquid.rotation.y +=
            0.02;


        beakerLiquid.rotation.z =
            Math.sin(
                performance.now() * 0.006
            ) * 0.02;


        // t1/2

        if (
            progress >= 0.5 &&
            !halfLifeReached
        ) {

            halfLifeReached =
                true;


            const halfLifeElement =
                document.getElementById(
                    "halfLifeValue"
                );


            if (
                halfLifeElement
            ) {

                halfLifeElement.textContent =
                    elapsed.toFixed(2) +
                    " s";
            }
        }
    }


    // =================================================
    // GAZ
    // =================================================

    if (
        reaction.gas &&
        Math.random() < 0.12
    ) {

        createReactionBubble();
    }


    // =================================================
    // FIN
    // =================================================

    if (
        progress >= 1
    ) {

        finishReaction();
    }
}


// =====================================================
// FIN REACTION
// =====================================================

function finishReaction() {

    mixing =
        false;


    infoState.textContent =
        "Terminé";


    const finalHalfLife =
        reaction.duration /
        2;


    resultat.innerHTML += `

        <p
            style="
                color:#63d99a;
                margin-top:12px;
            "
        >
            ✅ Transformation terminée.
        </p>

        <p>
            Le modèle représente
            l'évolution temporelle
            de la transformation.
        </p>

        <p>
            <strong>
                t₁/₂ ≈
                ${finalHalfLife.toFixed(2)}
                s
            </strong>
        </p>

    `;


    botMessage.textContent =
        "Transformation terminée. Dans ce modèle pédagogique, une concentration plus élevée et une température plus élevée accélèrent la transformation.";
}


// =====================================================
// BUBBLES
// =====================================================

function createReactionBubble() {

    const geometry =
        new THREE.SphereGeometry(
            0.055,
            12,
            12
        );


    const material =
        new THREE.MeshStandardMaterial({

            color:
                0xffffff,

            transparent:
                true,

            opacity:
                0.6
        });


    const bubble =
        new THREE.Mesh(
            geometry,
            material
        );


    bubble.position.set(

        (Math.random() - 0.5) * 1.8,

        -0.8,

        (Math.random() - 0.5) * 0.8

    );


    bubble.userData.speed =
        0.012 +
        Math.random() * 0.02;


    scene.add(
        bubble
    );


    particles.push(
        bubble
    );
}


// =====================================================
// RESET
// =====================================================

function resetLab() {

    clearTimeout(
        autoReactionTimer
    );


    mixing =
        false;


    reaction =
        null;


    pouredA =
        false;


    pouredB =
        false;


    pouringA =
        false;


    pouringB =
        false;


    beakerVolume =
        0;


    halfLifeReached =
        false;


    // BOTTLE A

    if (bottleA) {

        bottleA.position.copy(
            bottleA.userData.originalPosition
        );


        bottleA.rotation.z =
            0;


        const liquidA =
            bottleA.getObjectByName(
                "liquid"
            );


        if (liquidA) {

            liquidA.scale.y =
                1;

            liquidA.position.y =
                -0.2;
        }
    }


    // BOTTLE B

    if (bottleB) {

        bottleB.position.copy(
            bottleB.userData.originalPosition
        );


        bottleB.rotation.z =
            0;


        const liquidB =
            bottleB.getObjectByName(
                "liquid"
            );


        if (liquidB) {

            liquidB.scale.y =
                1;

            liquidB.position.y =
                -0.2;
        }
    }


    // BEAKER

    if (beakerLiquid) {

        beakerLiquid.material.color.set(
            0xddeeff
        );


        beakerLiquid.scale.y =
            1;


        beakerLiquid.position.y =
            -1.15;


        beakerLiquid.rotation.set(
            0,
            0,
            0
        );
    }


    // PARTICLES

    particles.forEach(
        particle => {

            scene.remove(
                particle
            );
        }
    );


    particles = [];


    // STREAMS

    pourStreams.forEach(
        stream => {

            scene.remove(
                stream
            );
        }
    );


    pourStreams = [];


    infoState.textContent =
        "Prêt";


    experimentTime.textContent =
        "0.00 s";


    if (materialA)
        materialA.textContent =
            "—";


    if (materialB)
        materialB.textContent =
            "—";


    resultat.innerHTML = `

        <h3>Résultat</h3>

        <p>
            Choisis une expérience.
        </p>

    `;


    botMessage.textContent =
        "Choisis une expérience.";
}


// =====================================================
// RESET BUTTON
// =====================================================

resetButton.addEventListener(
    "click",
    function () {

        resetLab();


        if (
            experienceSelect.value
        ) {

            const exp =
                experiences[
                experienceSelect.value
                ];


            materialA.textContent =
                exp.A;


            materialB.textContent =
                exp.B;


            updateBottleAppearance();


            botMessage.textContent =
                exp.explanation;


            resultat.innerHTML = `

                <h3>🧪 ${exp.name}</h3>

                <p>
                    <strong>Équation :</strong>
                </p>

                <p>
                    ${exp.equation}
                </p>

                <p>
                    Expérience réinitialisée.
                </p>

            `;
        }
    }
);


// =====================================================
// SLIDER VOLUME
// =====================================================

volumeSlider.addEventListener(
    "input",
    function () {

        volume =
            Number(
                volumeSlider.value
            );


        volumeValue.textContent =
            volume;


        infoVolume.textContent =
            volume +
            " mL";
    }
);


// =====================================================
// SLIDER CONCENTRATION
// =====================================================

concentrationSlider.addEventListener(
    "input",
    function () {

        concentration =
            Number(
                concentrationSlider.value
            );


        concentrationValue.textContent =
            concentration.toFixed(2);


        infoConcentration.textContent =
            concentration.toFixed(2) +
            " M";
    }
);


// =====================================================
// SLIDER TEMPERATURE
// =====================================================

temperatureSlider.addEventListener(
    "input",
    function () {

        temperature =
            Number(
                temperatureSlider.value
            );


        temperatureValue.textContent =
            temperature;


        infoTemperature.textContent =
            temperature +
            " °C";
    }
);


// =====================================================
// ANIMATION
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    updateReaction();


    updatePourStreams();


    particles.forEach(
        particle => {

            particle.position.y +=
                particle.userData.speed;
        }
    );


    particles =
        particles.filter(
            particle => {

                if (
                    particle.position.y > 2
                ) {

                    scene.remove(
                        particle
                    );

                    return false;
                }


                return true;
            }
        );


    renderer.render(
        scene,
        camera
    );
}


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",
    function () {

        if (!camera || !renderer)
            return;


        camera.aspect =
            container.clientWidth /
            container.clientHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );
    }
);


// =====================================================
// START
// =====================================================

init();