import './face-api.js';

var buttonCapture = document.getElementById("buttonCapture");
const canvas = document.getElementById("canvas");
const drawcanvas = document.getElementById("faceapi_canvas");
const video = document.getElementById("video");
var width = 1920; //set width of the video and image
var height = 1080;
var context = canvas.getContext("2d", { willReadFrequently: true });
var drawcontext = drawcanvas.getContext("2d");

var scaledWidth = 1280
canvas.style.width = scaledWidth + "px"
drawcanvas.style.width = scaledWidth + "px"
video.style.width = scaledWidth + "px"
buttonCapture.disabled = true;

const MODEL_URL = './static/models'
await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
startWebcam();


function startWebcam() {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mediaDevices || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
    if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
            audio: false, video: {
                width: { min: 1280, ideal: 1920, max: 1920 },
                height: { min: 720, ideal: 1080 },
                aspectRatio: 1.777777778,
                frameRate: { max: 30 },

            }
        }, handleVideo, videoError)
            .then(function (stream) {
                buttonCapture.disabled = false;
                return video.srcObject = stream;

            }).catch(function (e) {
                console.log(e.name + ": " + e.message);
                buttonCapture.disabled = true;
            });
    }

    function handleVideo(stream) {
        video.src = window.URL.createObjectURL(stream);
    }

    function videoError(e) {
        console.log(e);
    }

    function setHeight() {
        var ratio = video.videoWidth / video.videoHeight;
        height = Math.round(width / ratio);
        canvas.width = width;
        canvas.height = height;
    }

    buttonCapture.addEventListener("mousedown", handleButtonCaptureClick);

    function handleButtonCaptureClick() {
        var timeleft = 3
        drawcanvas.style.display = "none";
        buttonCapture.disabled = true;
        var downloadTimer = setInterval(function () {
            document.querySelector("#countdown").style.display = ' block '
            if (timeleft < 1) {
                document.querySelector("#countdown").style.display = 'none'
                clearInterval(downloadTimer);
            }
            document.querySelector("#countdown").innerHTML = timeleft
            timeleft -= 1;
        }, 800);

        if (canvas.style.display == "none" || canvas.style.display == "" || canvas.style.display == "block") {
            canvas.style.display = "block";
            buttonCapture.disabled = true;

            setHeight();
            setTimeout(function () {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                setTimeout(async function () {
                    let fullFaceDescriptions = await faceapi.detectAllFaces(canvas);
                    if (fullFaceDescriptions.length == 0) {
                        alert("No person detected!");
                    } else if (fullFaceDescriptions.length > 1) {
                       alert("Too many people in the picture!");
                    } else if (fullFaceDescriptions.length == 1) {
                        console.log("Person detected");
                        drawcanvas.style.display = "block";
                        canvas.toBlob(upload, "image/png");
                        startAnalysis();
                    }
                }, 100);
            }, 3700);

        }
    }
}

    function upload(file) {
        // create form and add file
        var formdata = new FormData();
        formdata.append("snap", file);


        fetch('/savePicture', {
            method: "POST",
            body: formdata
        }).then(function (response) {
            return response.blob();
        }).catch(function (error) {
            console.log("Fetch error: " + error);
        });


    }

    function uploadJson(jsn) {
        fetch('/saveJson', {
            headers : {
                'Content-Type' : 'application/json'
            },
            method : 'POST',
            body : JSON.stringify(jsn)
        }).then(function (response){
            return response.json()
        }).catch(function(error) {
            console.log("Fetch error: " + error);
        });
    }

async function startAnalysis() {
    const displaySize = { width: canvas.width, height: canvas.height }

    faceapi.matchDimensions(drawcanvas, displaySize)
    const detection = await faceapi
    .detectSingleFace(canvas).withFaceLandmarks().withFaceExpressions().withAgeAndGender().withFaceDescriptor()
    const resizedResults= faceapi.resizeResults(detection, displaySize)
    console.log(detection)
    // draw detections into the canvas
    faceapi.draw.drawDetections(drawcanvas, resizedResults)

   const text = [
        "age: " + Math.ceil(detection.age) ,
        "gender: " + detection.gender + " (" + Math.ceil(detection.genderProbability * 100) + "%)",
        "expressions: " +
        "\nangry " + Math.ceil(detection.expressions.angry * 100) + "%"+
        "\ndisgusted "  + Math.ceil(detection.expressions.disgusted * 100) + "%" +
        "\nfearful "  + Math.ceil(detection.expressions.fearful * 100) + "%" +
        "\nhappy "  + Math.ceil(detection.expressions.happy * 100) + "%" +
        "\nneutral "  + Math.ceil(detection.expressions.neutral * 100) + "%" +
        "\nsad "  + Math.ceil(detection.expressions.sad * 100) + "%" +
        "\nsurprised "  + Math.ceil(detection.expressions.surprised * 100) + "%"

    ]
    let jsn = {
        "age" : Math.ceil(detection.age) ,
        "gender" : detection.gender,
         "expressions" : {
            "angry": detection.expressions.angry * 100,
            "disgusted": detection.expressions.disgusted * 100,
            "fearful": detection.expressions.fearful * 100,
            "happy": detection.expressions.happy * 100,
            "neutral":detection.expressions.neutral * 100,
            "sad" : detection.expressions.sad * 100,
            "surprised": detection.expressions.surprised * 100
         }
    }

    const anchor = { x: 0, y: 0 }
    // see DrawTextField below
    const drawOptions = {
        anchorPosition: 'TOP_LEFT',
        fontColor: 'rgba(0,0,255, 1)',
        fontSize: 30,
        backgroundColor: 'rgba(255,255,255, 0.1)'
    }
    const drawBox = new faceapi.draw.DrawTextField(text, anchor, drawOptions)
    drawBox.draw(drawcanvas)
    buttonCapture.disabled = false;
    uploadJson(jsn);
}
