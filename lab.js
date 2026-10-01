// =====================================================
// CHEMLAB 3D
// VERSION COMPLETE
// =====================================================

const container = document.getElementById("scene-container");

function getOptionalElement(id) {
    return document.getElementById(id);
}

function setText(el, value) {
    if (el) el.textContent = value;
}

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

    if (!container || typeof THREE === "undefined") {

        console.error(
            "ChemLab 3D: scene-container or Three.js is missing."
        );

        return;
    }


    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x0b151d
        );


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
        1.8,
        9.6
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });


    renderer.shadowMap.enabled =
        true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


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

    createLabLabels();


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
            12,
            0.42,
            6.4
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
        -1.72;


    table.receiveShadow =
        true;


    scene.add(
        table
    );


    // Rear laboratory wall

    const back =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                12,
                3.2,
                0.18
            ),

            new THREE.MeshStandardMaterial({
                color: 0x13232d,
                roughness: 0.9
            })
        );


    back.position.set(
        0,
        0,
        -2.7
    );


    scene.add(
        back
    );


    // Shelf

    const shelf =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                8.8,
                0.16,
                1.1
            ),

            new THREE.MeshStandardMaterial({
                color: 0x263943,
                roughness: 0.65
            })
        );


    shelf.position.set(
        0,
        1.35,
        -2.05
    );


    scene.add(
        shelf
    );


    const shelfEdge =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                8.9,
                0.08,
                0.08
            ),

            new THREE.MeshStandardMaterial({
                color: 0x72b7ff,
                emissive: 0x143c5a
            })
        );


    shelfEdge.position.set(
        0,
        1.43,
        -1.5
    );


    scene.add(
        shelfEdge
    );


    // =================================================
    // SMALL CHESS DECORATION
    // =================================================

    const chessMaterial =
        new THREE.MeshStandardMaterial({
            color: 0xd6dde2,
            metalness: 0.15,
            roughness: 0.4
        });


    const chessBase =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.28,
                0.12,
                24
            ),
            chessMaterial
        );


    chessBase.position.set(
        4.35,
        -1.48,
        -1.65
    );


    scene.add(
        chessBase
    );


    const chessBody =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.11,
                0.17,
                0.42,
                18
            ),
            chessMaterial
        );


    chessBody.position.set(
        4.35,
        -1.20,
        -1.65
    );


    scene.add(
        chessBody
    );


    const chessHead =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.15,
                18,
                14
            ),
            chessMaterial
        );


    chessHead.position.set(
        4.35,
        -0.86,
        -1.65
    );


    scene.add(
        chessHead
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
            1.38,
            1.16,
            2.55,
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
        0.05,
        0
    );


    scene.add(
        beaker
    );


    // Beaker rim

    const rim =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                1.39,
                0.035,
                10,
                64
            ),

            new THREE.MeshStandardMaterial({
                color: 0xbfe9ff,
                transparent: true,
                opacity: 0.8
            })
        );


    rim.rotation.x =
        Math.PI / 2;


    rim.position.y =
        1.325;


    scene.add(
        rim
    );


    // Beaker base

    const base =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.18,
                1.18,
                0.08,
                48
            ),

            new THREE.MeshStandardMaterial({
                color: 0x9cc9dc,
                transparent: true,
                opacity: 0.45
            })
        );


    base.position.y =
        -1.225;


    scene.add(
        base
    );


    // Liquid

    const liquidGeometry =
        new THREE.CylinderGeometry(
            1.12,
            1.00,
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
            0.48,
            0.55,
            1.30,
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


    body.castShadow =
        true;


    group.add(
        body
    );


    // LIQUID

    const liquidGeometry =
        new THREE.CylinderGeometry(
            0.40,
            0.44,
            0.70,
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
        -0.18;


    liquid.name =
        "liquid";


    liquid.castShadow =
        true;


    group.add(
        liquid
    );


    // NECK

    const neckGeometry =
        new THREE.CylinderGeometry(
            0.26,
            0.30,
            0.28,
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
        0.65;


    group.add(
        neck
    );


    // CAP

    const capGeometry =
        new THREE.CylinderGeometry(
            0.24,
            0.24,
            0.28,
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
        0.91;


    group.add(
        cap
    );


    // POSITION

    group.position.set(
        x,
        -0.25,
        0.15
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
// LABELS
// =====================================================

function createLabLabels() {

    const makeLabel =
        (text, x) => {

            const canvas =
                document.createElement(
                    "canvas"
                );


            canvas.width =
                512;


            canvas.height =
                128;


            const ctx =
                canvas.getContext(
                    "2d"
                );


            ctx.fillStyle =
                "rgba(10,20,28,0.88)";


            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            ctx.strokeStyle =
                "rgba(114,183,255,0.75)";


            ctx.lineWidth =
                5;


            ctx.strokeRect(
                3,
                3,
                canvas.width - 6,
                canvas.height - 6
            );


            ctx.fillStyle =
                "#eef7ff";


            ctx.font =
                "bold 42px Arial";


            ctx.textAlign =
                "center";


            ctx.textBaseline =
                "middle";


            ctx.fillText(
                text,
                canvas.width / 2,
                canvas.height / 2
            );


            const texture =
                new THREE.CanvasTexture(
                    canvas
                );


            const sprite =
                new THREE.Sprite(
                    new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true
                    })
                );


            sprite.scale.set(
                1.55,
                0.39,
                1
            );


            sprite.position.set(
                x,
                0.55,
                -0.65
            );


            scene.add(
                sprite
            );
        };


    makeLabel(
        "RÉACTIF A",
        -3.15
    );


    makeLabel(
        "RÉACTIF B",
        3.15
    );
}


// =====================================================
// BOTTLES
// =====================================================

function createBottleA() {

    bottleA =
        createBottle(
            -3.15,
            materialColors.I,
            "I⁻"
        );
}


function createBottleB() {

    bottleB =
        createBottle(
            3.15,
            materialColors.S2O8,
            "S₂O₈²⁻"
        );
}


// =====================================================
// MATERIAL COLOR
// =====================================================

function getMaterialColor(name) {

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

    return 0xddeeff;
}


// =====================================================
// UPDATE BOTTLES
// =====================================================

function updateBottleAppearance() {

    const key =
        experienceSelect.value;


    const exp =
        experiences[key];


    if (
        !exp ||
        !bottleA ||
        !bottleB
    )
        return;


    const liquidA =
        bottleA.getObjectByName(
            "liquid"
        );


    const liquidB =
        bottleB.getObjectByName(
            "liquid"
        );


    if (liquidA) {

        liquidA.material.color.set(
            getMaterialColor(
                exp.A
            )
        );
    }


    if (liquidB) {

        liquidB.material.color.set(
            getMaterialColor(
                exp.B
            )
        );
    }
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


        if (materialA)
            materialA.textContent =
                exp.A;


        if (materialB)
            materialB.textContent =
                exp.B;


        updateBottleAppearance();


        setText(
            botMessage,
            exp.explanation
        );


        if (resultat) {

            resultat.innerHTML = `

                <h3>🧪 ${exp.name}</h3>

                <p>
                    <strong>
                        Équation :
                    </strong>
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
    }
);


// =====================================================
// MOUSE DOWN
// =====================================================

function mouseDown(event) {

    if (mixing)
        return;


    const rect =
        renderer.domElement.getBoundingClientRect();


    mouse.x =
        (
            (event.clientX - rect.left) /
            rect.width
        ) * 2 - 1;


    mouse.y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) * 2 + 1;


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const intersections =
        raycaster.intersectObjects(
            [
                bottleA,
                bottleB
            ],
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


    setText(
        infoState,
        "Manipulation"
    );


    renderer.domElement.style.cursor =
        "grabbing";
}


// =====================================================
// MOUSE MOVE
// =====================================================

function mouseMove(event) {

    if (
        !dragging ||
        !selectedObject
    )
        return;


    const rect =
        renderer.domElement.getBoundingClientRect();


    mouse.x =
        (
            (event.clientX - rect.left) /
            rect.width
        ) * 2 - 1;


    mouse.y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) * 2 + 1;


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


    // Inclinaison du flacon

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
                        selectedObject.position.x +
                        0.8
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
                        selectedObject.position.x -
                        0.8
                    ) / 2
                )
            );

    } else {

        selectedObject.rotation.z =
            0;
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
// CHECK POUR - FIXED
// =====================================================

function checkPour(
    bottle
) {

    if (
        !bottle ||
        !experienceSelect ||
        !experienceSelect.value
    ) {

        return;
    }


    // Zone de versement large
    // autour du bécher.

    const inPourZone =
        bottle.position.x > -2.5 &&
        bottle.position.x < 2.5 &&
        bottle.position.y > 0.15;


    if (!inPourZone) {

        return;
    }


    if (
        bottle === bottleA &&
        !pouredA &&
        !pouringA
    ) {

        pourBottle(
            bottleA,
            "A"
        );

        return;
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

        return;
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


    bottle.position.x =
        side === "A"
            ? -1.35
            : 1.35;


    bottle.position.y =
        1.72;


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


    const startBeakerVolume =
        beakerVolume;


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


        if (liquid) {

            liquid.scale.y =
                1 -
                progress * 0.88;


            liquid.position.y =
                -0.2 -
                progress * 0.18;
        }


        updateBeakerVolume(
            startBeakerVolume,
            progress
        );


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


        if (
            index !== -1
        ) {

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


    setText(
        infoState,
        side === "A"
            ? "Réactif A ajouté"
            : "Réactif B ajouté"
    );


    updateResult();


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

    const key =
        experienceSelect.value;

    const exp =
        experiences[key];

    if (!exp) return null;


    const materialName =
        side === "A"
            ? exp.A
            : exp.B;


    const color =
        getMaterialColor(
            materialName
        );


    const geometry =
        new THREE.CylinderGeometry(
            0.045,
            0.028,
            1.35,
            12
        );


    const material =
        new THREE.MeshStandardMaterial({

            color: color,

            transparent: true,

            opacity: 0.78
        });


    const stream =
        new THREE.Mesh(
            geometry,
            material
        );


    stream.userData.bottle =
        bottle;


    stream.userData.side =
        side;


    stream.position.set(
        bottle.position.x,
        bottle.position.y - 0.68,
        bottle.position.z
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

    for (
        let i = 0;
        i < pourStreams.length;
        i++
    ) {

        const stream =
            pourStreams[i];


        const bottle =
            stream.userData.bottle;


        if (!bottle)
            continue;


        stream.position.x =
            bottle.position.x;


        stream.position.y =
            bottle.position.y - 0.68;


        stream.position.z =
            bottle.position.z;


        stream.rotation.z =
            bottle.rotation.z;
    }
}


// =====================================================
// BEAKER VOLUME
// =====================================================

function updateBeakerVolume(
    startVolume,
    progress
) {

    const addedVolume =
        0.38;


    beakerVolume =
        THREE.MathUtils.clamp(
            startVolume +
            addedVolume *
            progress,
            0,
            0.86
        );


    const height =
        0.10 +
        beakerVolume *
        2.05;


    beakerLiquid.scale.y =
        height / 0.10;


    beakerLiquid.position.y =
        -1.18 +
        height / 2;
}


// =====================================================
// UPDATE RESULT
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
                La transformation
                va commencer
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
                Verse d'abord les deux
                réactifs dans le bécher.
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


    setText(
        infoState,
        "Réaction en cours"
    );


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


    requestAnimationFrame(
        updateReaction
    );
}


// =====================================================
// UPDATE REACTION
// =====================================================

function updateReaction() {

    if (
        !mixing ||
        !reaction
    ) {

        return;
    }


    const elapsed =
        (
            performance.now() -
            reactionStart
        ) / 1000;


    const duration =
        reaction.duration;


    const progress =
        Math.min(
            elapsed /
            duration,
            1
        );


    // =================================================
    // FACTEUR DE VITESSE
    // =================================================

    const concentrationFactor =
        Math.max(
            0.35,
            concentration
        );


    const temperatureFactor =
        Math.max(
            0.35,
            1 +
            (
                temperature -
                25
            ) *
            0.025
        );


    const relativeSpeed =
        concentrationFactor *
        temperatureFactor;


    // =================================================
    // ELEMENTS
    // =================================================

    const timer =
        document.getElementById(
            "reactionTimer"
        );


    const percent =
        document.getElementById(
            "reactionPercent"
        );


    const speed =
        document.getElementById(
            "relativeSpeed"
        );


    const halfLife =
        document.getElementById(
            "halfLifeValue"
        );


    const progressBar =
        document.getElementById(
            "reactionProgress"
        );


    // =================================================
    // TEMPS
    // =================================================

    setText(
        timer,
        elapsed.toFixed(2)
    );


    // =================================================
    // AVANCEMENT
    // =================================================

    setText(
        percent,
        Math.round(
            progress * 100
        )
    );


    // =================================================
    // VITESSE
    // =================================================

    setText(
        speed,
        relativeSpeed.toFixed(2)
    );


    // =================================================
    // DEMI-VIE
    // =================================================

    if (
        progress >= 0.5 &&
        !halfLifeReached
    ) {

        halfLifeReached =
            true;


        setText(
            halfLife,
            elapsed.toFixed(2) +
            " s"
        );
    }


    if (!halfLifeReached) {

        setText(
            halfLife,
            "—"
        );
    }


    // =================================================
    // PROGRESS BAR
    // =================================================

    if (progressBar) {

        progressBar.style.width =
            (
                progress *
                100
            ) + "%";
    }


    // =================================================
    // INFO PANEL
    // =================================================

    setText(
        experimentTime,
        elapsed.toFixed(2) +
        " s"
    );


    setText(
        infoVolume,
        volume +
        " mL"
    );


    setText(
        infoConcentration,
        concentration.toFixed(2) +
        " mol/L"
    );


    setText(
        infoTemperature,
        temperature +
        " °C"
    );


    // =================================================
    // IODURE + PERSULFATE
    // =================================================

    if (
        experienceSelect.value ===
        "iodure_persulfate"
    ) {

        const startColor =
            new THREE.Color(
                0xdcecff
            );


        const endColor =
            new THREE.Color(
                0x5b301d
            );


        const currentColor =
            startColor.clone().lerp(
                endColor,
                progress
            );


        beakerLiquid
            .material
            .color =
            currentColor;


        beakerLiquid
            .material
            .opacity =
            0.72 +
            progress * 0.12;
    }


    // =================================================
    // GAZ
    // =================================================

    if (
        reaction.gas &&
        Math.random() < 0.12
    ) {

        createBubble();
    }


    // =================================================
    // FIN
    // =================================================

    if (
        progress >= 1
    ) {

        finishReaction();

        return;
    }


    requestAnimationFrame(
        updateReaction
    );
}


// =====================================================
// CREATE BUBBLE
// =====================================================

function createBubble() {

    if (!beaker)
        return;


    const geometry =
        new THREE.SphereGeometry(
            0.035 +
            Math.random() *
            0.035,
            12,
            12
        );


    const material =
        new THREE.MeshPhysicalMaterial({

            color: 0xffffff,

            transparent: true,

            opacity: 0.42,

            roughness: 0.05
        });


    const bubble =
        new THREE.Mesh(
            geometry,
            material
        );


    bubble.position.set(

        (
            Math.random() -
            0.5
        ) * 1.6,

        -1.05,

        (
            Math.random() -
            0.5
        ) * 1.3

    );


    bubble.userData.speed =
        0.008 +
        Math.random() *
        0.018;


    scene.add(
        bubble
    );


    particles.push(
        bubble
    );
}


// =====================================================
// UPDATE BUBBLES
// =====================================================

function updateParticles() {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        const particle =
            particles[i];


        particle.position.y +=
            particle.userData.speed;


        particle.position.x +=
            Math.sin(
                particle.position.y *
                3
            ) * 0.0015;


        if (
            particle.position.y >
            1.15
        ) {

            scene.remove(
                particle
            );


            particles.splice(
                i,
                1
            );
        }
    }


    // Sécurité

    if (
        particles.length >
        100
    ) {

        const old =
            particles.shift();


        scene.remove(
            old
        );
    }
}


// =====================================================
// FIN REACTION
// =====================================================

function finishReaction() {

    mixing =
        false;


    const exp =
        reaction;


    setText(
        infoState,
        "Transformation terminée"
    );


    const timer =
        document.getElementById(
            "reactionTimer"
        );


    const percent =
        document.getElementById(
            "reactionPercent"
        );


    const speed =
        document.getElementById(
            "relativeSpeed"
        );


    setText(
        timer,
        exp.duration.toFixed(2) +
        " s"
    );


    setText(
        percent,
        "100"
    );


    setText(
        speed,
        "0"
    );


    resultat.innerHTML = `

        <h3>
            ✅ Transformation terminée
        </h3>

        <p>
            <strong>
                ${exp.equation}
            </strong>
        </p>

        <p>
            <strong>
                Temps final :
            </strong>

            ${exp.duration.toFixed(2)} s
        </p>

        <p>
            <strong>
                Avancement :
            </strong>

            100 %
        </p>

        <p>
            <strong>
                t₁/₂ :
            </strong>

            ${
                halfLifeReached
                    ? "atteint pendant la transformation"
                    : "—"
            }
        </p>

        <p>
            ${exp.explanation}
        </p>

    `;


    if (botMessage) {

        botMessage.textContent =
            "La transformation est terminée. Observe les résultats.";
    }
}
// =====================================================
// MELANGER BUTTON
// =====================================================

if (melangerButton) {

    melangerButton.addEventListener(
        "click",
        function () {

            if (
                pouredA &&
                pouredB &&
                !mixing
            ) {

                startReaction();

            } else {

                if (resultat) {

                    resultat.innerHTML = `

                        <h3>
                            ⚠️ Mélange impossible
                        </h3>

                        <p>
                            Verse d'abord les deux
                            réactifs dans le bécher.
                        </p>

                    `;
                }
            }
        }
    );
}


// =====================================================
// RESET LAB
// =====================================================

function resetLab() {

    clearTimeout(
        autoReactionTimer
    );


    mixing = false;

    reaction = null;

    pouredA = false;

    pouredB = false;

    pouringA = false;

    pouringB = false;

    beakerVolume = 0;

    halfLifeReached = false;


    // =================================================
    // RESET BOTTLE A
    // =================================================

    if (bottleA) {

        bottleA.position.copy(
            bottleA.userData.originalPosition
        );

        bottleA.rotation.z = 0;


        const liquidA =
            bottleA.getObjectByName(
                "liquid"
            );


        if (liquidA) {

            liquidA.scale.y = 1;

            liquidA.position.y =
                -0.18;
        }
    }


    // =================================================
    // RESET BOTTLE B
    // =================================================

    if (bottleB) {

        bottleB.position.copy(
            bottleB.userData.originalPosition
        );

        bottleB.rotation.z = 0;


        const liquidB =
            bottleB.getObjectByName(
                "liquid"
            );


        if (liquidB) {

            liquidB.scale.y = 1;

            liquidB.position.y =
                -0.18;
        }
    }


    // =================================================
    // RESET BEAKER
    // =================================================

    if (beakerLiquid) {

        beakerLiquid.scale.y =
            1;


        beakerLiquid.position.y =
            -1.15;


        beakerLiquid.material.color.set(
            0xddeeff
        );


        beakerLiquid.material.opacity =
            0.82;
    }


    // =================================================
    // REMOVE POUR STREAMS
    // =================================================

    pourStreams.forEach(
        function (stream) {

            scene.remove(
                stream
            );
        }
    );


    pourStreams = [];


    // =================================================
    // REMOVE BUBBLES
    // =================================================

    particles.forEach(
        function (particle) {

            scene.remove(
                particle
            );
        }
    );


    particles = [];


    // =================================================
    // INFO
    // =================================================

    setText(
        infoState,
        "Prêt"
    );


    setText(
        experimentTime,
        "0.00 s"
    );


    setText(
        infoVolume,
        volume +
        " mL"
    );


    setText(
        infoConcentration,
        concentration.toFixed(2) +
        " mol/L"
    );


    setText(
        infoTemperature,
        temperature +
        " °C"
    );


    // =================================================
    // RESULTAT
    // =================================================

    if (resultat) {

        resultat.innerHTML = `

            <h3>
                🧪 Laboratoire prêt
            </h3>

            <p>
                Prends les deux réactifs
                et verse-les dans le bécher.
            </p>

        `;
    }


    // =================================================
    // BOT
    // =================================================

    const key =
        experienceSelect.value;


    const exp =
        experiences[key];


    if (exp) {

        if (materialA)
            materialA.textContent =
                exp.A;


        if (materialB)
            materialB.textContent =
                exp.B;


        setText(
            botMessage,
            exp.explanation
        );
    }


    updateBottleAppearance();
}


// =====================================================
// RESET BUTTON
// =====================================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetLab
    );
}


// =====================================================
// VOLUME SLIDER
// =====================================================

if (volumeSlider) {

    volumeSlider.addEventListener(
        "input",
        function () {

            volume =
                Number(
                    volumeSlider.value
                );


            if (
                !Number.isFinite(
                    volume
                )
            ) {

                volume = 50;
            }


            setText(
                volumeValue,
                volume +
                " mL"
            );


            setText(
                infoVolume,
                volume +
                " mL"
            );
        }
    );
}


// =====================================================
// CONCENTRATION SLIDER
// =====================================================

if (concentrationSlider) {

    concentrationSlider.addEventListener(
        "input",
        function () {

            concentration =
                Number(
                    concentrationSlider.value
                );


            if (
                !Number.isFinite(
                    concentration
                )
            ) {

                concentration =
                    0.5;
            }


            setText(
                concentrationValue,
                concentration.toFixed(2)
            );


            setText(
                infoConcentration,
                concentration.toFixed(2) +
                " mol/L"
            );
        }
    );
}


// =====================================================
// TEMPERATURE SLIDER
// =====================================================

if (temperatureSlider) {

    temperature =
        Number(
            temperatureSlider.value
        );


    if (
        !Number.isFinite(
            temperature
        )
    ) {

        temperature = 25;
    }


    setText(
        temperatureValue,
        temperature +
        " °C"
    );


    setText(
        infoTemperature,
        temperature +
        " °C"
    );


    temperatureSlider.addEventListener(
        "input",
        function () {

            temperature =
                Number(
                    temperatureSlider.value
                );


            if (
                !Number.isFinite(
                    temperature
                )
            ) {

                temperature = 25;
            }


            setText(
                temperatureValue,
                temperature +
                " °C"
            );


            setText(
                infoTemperature,
                temperature +
                " °C"
            );
        }
    );
}


// =====================================================
// ANIMATION
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    updatePourStreams();

    updateParticles();


    if (renderer && scene && camera) {

        renderer.render(
            scene,
            camera
        );
    }
}


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",
    function () {

        if (
            !container ||
            !camera ||
            !renderer
        ) {

            return;
        }


        const width =
            Math.max(
                container.clientWidth,
                320
            );


        const height =
            Math.max(
                container.clientHeight,
                400
            );


        camera.aspect =
            width /
            height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height
        );
    }
);


// =====================================================
// INITIALISATION
// =====================================================

init();
// =====================================================
// FINAL INITIALISATION
// =====================================================

// اختيار التجربة الأولى تلقائياً
if (experienceSelect) {

    if (!experienceSelect.value) {

        experienceSelect.value =
            "iodure_persulfate";
    }
}


// =====================================================
// UPDATE EXPERIENCE DISPLAY
// =====================================================

function updateExperienceDisplay() {

    const key =
        experienceSelect
            ? experienceSelect.value
            : "iodure_persulfate";


    const exp =
        experiences[key];


    if (!exp) return;


    // أسماء المواد
    if (materialA) {

        materialA.textContent =
            exp.A;
    }


    if (materialB) {

        materialB.textContent =
            exp.B;
    }


    // Bot
    setText(
        botMessage,
        exp.explanation
    );


    // إعادة ضبط المختبر
    resetLab();
}


// =====================================================
// EXPERIENCE SELECT
// =====================================================

if (experienceSelect) {

    experienceSelect.addEventListener(
        "change",
        updateExperienceDisplay
    );
}


// =====================================================
// INITIAL VALUES
// =====================================================

if (volumeSlider) {

    volume =
        Number(
            volumeSlider.value
        );


    if (
        !Number.isFinite(volume)
    ) {

        volume = 50;

        volumeSlider.value =
            volume;
    }
}


if (concentrationSlider) {

    concentration =
        Number(
            concentrationSlider.value
        );


    if (
        !Number.isFinite(
            concentration
        )
    ) {

        concentration = 0.5;

        concentrationSlider.value =
            concentration;
    }
}


if (temperatureSlider) {

    temperature =
        Number(
            temperatureSlider.value
        );


    if (
        !Number.isFinite(
            temperature
        )
    ) {

        temperature = 25;

        temperatureSlider.value =
            temperature;
    }
}


// =====================================================
// INITIAL DISPLAY
// =====================================================

setText(
    volumeValue,
    volume + " mL"
);


setText(
    concentrationValue,
    concentration.toFixed(2)
);


setText(
    temperatureValue,
    temperature + " °C"
);


setText(
    infoVolume,
    volume + " mL"
);


setText(
    infoConcentration,
    concentration.toFixed(2) +
    " mol/L"
);


setText(
    infoTemperature,
    temperature + " °C"
);


setText(
    infoState,
    "Prêt"
);


setText(
    experimentTime,
    "0.00 s"
);


// =====================================================
// INITIAL MATERIALS
// =====================================================

const initialKey =
    experienceSelect
        ? experienceSelect.value
        : "iodure_persulfate";


const initialExperience =
    experiences[initialKey];


if (initialExperience) {

    if (materialA) {

        materialA.textContent =
            initialExperience.A;
    }


    if (materialB) {

        materialB.textContent =
            initialExperience.B;
    }


    setText(
        botMessage,
        initialExperience.explanation
    );
}


// =====================================================
// INITIAL RESULT
// =====================================================

if (resultat) {

    resultat.innerHTML = `

        <h3>
            🧪 Laboratoire prêt
        </h3>

        <p>
            Prends un réactif avec la souris
            et déplace-le vers le bécher.
        </p>

        <p>
            Ensuite, verse le deuxième réactif
            pour démarrer la transformation.
        </p>

    `;
}


// =====================================================
// FINAL BOTTLE UPDATE
// =====================================================

updateBottleAppearance();


// =====================================================
// START ANIMATION
// =====================================================

if (
    typeof animate === "function"
) {

    // animate() est déjà lancé par init()
}


// =====================================================
// DEBUG MESSAGE
// =====================================================

console.log(
    "ChemLab 3D — Laboratoire initialisé avec succès."
);

console.log(
    "Expérience:",
    initialExperience
        ? initialExperience.name
        : "Aucune"
);
