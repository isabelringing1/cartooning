var then = 0;
var now = 0;
var elapsed = 0;
var numFrames = 0;
var opacity = 1;
var times = [];
var net;
var img_array = [];
var color_inputs = [];
var rainbow = false;
var colors = [
    [110, 64, 170], [110, 64, 170], [178, 60, 178], [178, 60, 178],
    [238, 67, 149], [238, 67, 149], [255, 94, 99],  [255, 94, 99],
    [255, 140, 56], [255, 140, 56], [217, 194, 49], [217, 194, 49],
    [175, 240, 91], [175, 240, 91], [96, 247, 96],  [96, 247, 96],
    [40, 234, 141], [40, 234, 141], [26, 199, 194], [26, 199, 194],
    [47, 150, 224], [47, 150, 224], [84, 101, 214], [84, 101, 214]
  ];
const SKIN = [226, 192, 155];
const WHITE = [254, 254, 254];
const JEANS = [22, 38, 97];
const NONE = [255, 255, 255, 0];
const NONE2 = [255, 0, 0, 0];
const EYE_WIDTH = 480;
const EYE_HEIGHT = 365;
const MOUTH_WIDTH = 480;
const MOUTH_HEIGHT = 320;
const FACE_DIM = 600;
const outfit1 = [
    SKIN, SKIN, SKIN, SKIN,
    SKIN, SKIN, SKIN, SKIN,
    SKIN, SKIN, SKIN, SKIN,
    WHITE, WHITE, JEANS, JEANS,
    JEANS, JEANS,  JEANS, JEANS,
    JEANS, JEANS, SKIN, SKIN
  ];

const parts = [
    ["  Face", [0, 1]],
    ["  Left upper arm", [2, 3]],
    ["  Right upper arm", [4, 5]],
    ["  Left lower arm", [6, 7]],
    ["  Right lower arm", [8, 9]],
    ["  Left hand", [10]],
    ["  Right hand", [11]],
    ["  Torso", [12, 13]],
    ["  Left upper leg", [14, 15]],
    ["  Right upper leg", [16, 17]],
    ["  Left lower leg", [18, 19]],
    ["  Right lower leg", [20, 21]],
    ["  Left foot", [22]],
    ["  Right foot", [23]]
];

const gingy_coords = [
    [150, 60] // head
];

const body_arr = [
    0, 
    5, 
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16
]

async function setup(){
    net = await bodyPix.load({architecture: 'MobileNetV1'});
    console.log("Body Pix Library Initialized");
};

async function labelImages(array){ //make this a for loop, after all images loaded
    const flipHorizontal = false;
    const maskBlurAmount = 0;
    const frames = [];
    var encoder = new Whammy.Video(60);
    var mode = document.getElementById("dropdown1").value;
    var choice = document.getElementById("dropdown").value;
    for (var i = 0; i < array.length; i++){
        const segmentation = await net.segmentPersonParts(array[i], {
            flipHorizontal: false,
            internalResolution: 'high',
            segmentationThreshold: 0.7,
        });
        var poses = [];
        for (var j = 0; j < segmentation.allPoses.length; j++){
            if (segmentation.allPoses[j].score > 0.25){
                poses.push(segmentation.allPoses[j]);
            }
        }
        //console.log(poses)
        if (rainbow){
            var first = colors.shift()
            colors.push(first);
        }
        var coloredPartImage = bodyPix.toColoredPartMask(segmentation, colors);
        // make backgrorund transparent
        coloredPartImage.data = makeTransparent(coloredPartImage.data);
        //add border to image
        //coloredPartImage.data = addBorder(coloredPartImage.data, coloredPartImage.width, coloredPartImage.height);
        var canvas = document.createElement('canvas');
        if (mode == "bodySeg"){
            bodyPix.drawMask(canvas, array[i], coloredPartImage, opacity, maskBlurAmount, flipHorizontal);
        }
        else if (mode == "fullChar"){
            addCharacter(canvas, poses);
        }
        //add face details to image
        if (choice != 'none'){
            addFaceDetails(canvas, poses);
        }
        incrementProgress(i);
        console.log("Processing frame " + i);
        encoder.duration = times[i+1]; //fixes my fps problem
        encoder.add(canvas);
    }
    var url;
    var progress = document.getElementById('progress_bar');
    encoder.compile(false, function(output){
        url = (window.webkitURL || window.URL).createObjectURL(output);
        console.log(url);
        createVideo(url);
    });
}

function incrementProgress(curr){
    var progress = document.getElementById('progress_bar');
    var unit = 100 / numFrames; 
    progress.style.width = unit * curr + "%";
    //progress.style.margin-right = (90 - unit * curr) + "%";
}

function addCharacter(canvas, poses){
    var ctx = canvas.getContext("2d");
    var img = document.getElementById('gingy');
    var arr = gingy_coords;
    for (var i = 0; i < poses.length; i++){
        //const warp = new Warp(img)
        for (var j = 0; j < arr.length; j++){
            //warp.transform((arr[j]) | poses[i][body_arr[j]]); // this doesn't work
            //console.log("warping " + arr[j] + " to " + poses[i][body_arr[j]]);
            //warp.transform(([ x, y ]) => [ x, y + 4 * Math.sin(x / 16) ])

        }
    }
    ctx.drawImage(img, 0, 0);
    document.body.appendChild(canvas);
}

function warp(matrix){
    var canvas = fx.canvas();
    var ctx = canvas.getContext("2d");
    var img = document.getElementById('gingy');
    var texture = canvas.texture(img);
    canvas.draw(texture).update();

    console.log(matrix);
    canvas.matrixWarp(matrix).update();
    document.body.appendChild(canvas);
}

function addFaceDetails(canvas, poses){
    var ctx = canvas.getContext("2d");
    var leye = document.getElementById("l_eye");
    var reye = document.getElementById("r_eye");
    var mouth = document.getElementById("mouth");
    var winky = document.getElementById("winky");
    var heart = document.getElementById("heart");
    var ironman = document.getElementById("ironman");
    var choice = document.getElementById("dropdown").value;
    for (var i = 0; i < poses.length; i++){
        var left_eye = [-1. -1];
        var right_eye = [-1, -1];
        if (poses[i].keypoints[1].score > 0.5 && poses[i].keypoints[2].score > 0.5){
            nose = [poses[i].keypoints[0].position.x, poses[i].keypoints[0].position.y];
            left_eye = [poses[i].keypoints[1].position.x, poses[i].keypoints[1].position.y];
            right_eye = [poses[i].keypoints[2].position.x, poses[i].keypoints[2].position.y];
            dist_btwn =  left_eye[0] - right_eye[0];
            size = dist_btwn / canvas.width * 1.5;
            if (choice == "eyeMouth"){
                ctx.drawImage(leye, left_eye[0] - dist_btwn/2, left_eye[1] - dist_btwn/2, EYE_WIDTH * size, EYE_HEIGHT * size);
                ctx.drawImage(reye, right_eye[0] - dist_btwn/2, right_eye[1] - dist_btwn/2, EYE_WIDTH * size, EYE_HEIGHT * size);
                ctx.drawImage(mouth, (left_eye[0] + right_eye[0]) / 2 - dist_btwn/2, dist_btwn + (left_eye[1] + right_eye[1]) / 2 - dist_btwn/2, MOUTH_WIDTH * size, MOUTH_HEIGHT * size);
            }
            else if (choice == "winky"){
                ctx.drawImage(winky, right_eye[0] - (dist_btwn*1.5), right_eye[1] - (dist_btwn*1.5), FACE_DIM * size * 3, FACE_DIM * size* 3);
            }
            else if (choice == "heart"){
                ctx.drawImage(heart, right_eye[0] - (dist_btwn*1.5), right_eye[1] - (dist_btwn*1.5), FACE_DIM * size * 5, FACE_DIM * size* 5);
            }
            else if (choice == "ironman"){
                ctx.drawImage(ironman, right_eye[0] - (dist_btwn*1.5), right_eye[1] - (dist_btwn*1.5), FACE_DIM * size * 3.5, FACE_DIM * size * 3.5);
            }   
        }
    }
}

function makeTransparent(img){
    for (var pix = 0; pix < img.length; pix+=4){
        color = [img[pix], img[pix+1], img[pix+2], img[pix+3]];
        if (sameArray(color, [255, 255, 255, 255])){   
            img[pix+3] = 0;
        }
    }
    return img;
}

function addBorder(img, w, h){
    //first step: find body part
    var map = Array(img.length).fill(0);
    start = 0;
    console.log(img);
    for (var pix = 0; pix < img.length && start == 0; pix+=4){
        var color = [img[pix], img[pix+1], img[pix+2], img[pix+3]];
        if (!sameArray(color, NONE) && !sameArray(color, NONE2)){
            start = pix;
        }
    }
    console.log(start);
    //second step: breadth first search
    queue = [];
    queue.push(start);
    curr = 0;
    border = [];
    while (queue.length > 0){
        curr = queue.shift();
        //up, right, down, left
        checks = [curr - (w * 4), curr + 4, curr + (w * 4), curr - 4];
        for (var i = 0; i < checks.length; i++){
            p = checks[i];
            if (p > 0 && p < img.length-4){
                p_color = [img[p], img[p+1], img[p+2], img[p+3]];
                if (!sameArray(p_color, NONE) && map[p] == 0){  
                    queue.push(p);
                }
                else{
                    border.push(p);
                }
            }
        }    
        map[curr] = 1;        
    }
    console.log(border)

    for (var i = 0; i < border.length; i++){
        img[border[i]] = 255;
        img[border[i] + 1] = 0;
        img[border[i] + 2] = 0;
    }
    return img;
}

function sameArray(ar1, ar2){
    if (ar1.length != ar2.length){ return false; }
    for (var i = 0; i < ar1.length; i++){
        if (ar1[i] != ar2[i]){
            return false;
        }
    }
    return true;
}

function addColorMenu(){
    var menu = document.createElement('div');
    menu.id = "menu";
    for (var i = 0; i < parts.length; i++){
        var input = document.createElement('input');
        input.type = "color";
        input.class = "color_choice"
        input.value = rgbToHex(colors[parts[i][1][0]][0], colors[parts[i][1][0]][1], colors[parts[i][1][0]][2]);
        input.id = String(parts[i][1]); //something like '2,3'
        var label = document.createElement('label');
        label.for = String(parts[i][1]);
        label.innerHTML = parts[i][0];
        input.addEventListener('change', function(){
            arr = this.id.split(',');
            for (var j = 0; j < arr.length; j++){
                var rgb = hexToRgb(this.value);
                console.log("changed color at index " + parseInt(arr[j]) + " to " + [rgb.r, rgb.g, rgb.b]);
                colors[parseInt(arr[j])] = [rgb.r, rgb.g, rgb.b];
            }
        });
        color_inputs.push(input);
        menu.appendChild(input);
        menu.appendChild(label);
        menu.appendChild(document.createElement('br'));
        menu.appendChild(document.createElement('br'));
    }
    var original_button = document.createElement('button');
    original_button.innerHTML = "Original"
    original_button.className = "menu_button";
    original_button.addEventListener('click', function(){
        rainbow = false;
        for (var i = 0; i < color_inputs.length; i++){
            color_inputs[i].value = rgbToHex(colors[parts[i][1][0]][0], colors[parts[i][1][0]][1], colors[parts[i][1][0]][2]);
        }
    });

    var black_button = document.createElement('button');
    black_button.innerHTML = "Black"
    black_button.className = "menu_button";
    black_button.addEventListener('click', function(){
        rainbow = false;
        for (var i = 0; i < color_inputs.length; i++){
            color_inputs[i].value = "#000000";
        }
    });
    var button_div = document.createElement('div');
    button_div.id = "button_div"
    var outfit1_button = document.createElement('button');
    outfit1_button.innerHTML = "Outfit 1"
    outfit1_button.className = "menu_button";
    outfit1_button.addEventListener('click', function(){
        rainbow = false;
        for (var i = 0; i < color_inputs.length; i++){
            arr = color_inputs[i].id.split(',');
            color_inputs[i].value = rgbToHex(outfit1[arr[0]][0], outfit1[arr[0]][1], outfit1[arr[0]][2]);
        }
    });
    var rainbow_button = document.createElement('button');
    rainbow_button.innerHTML = "Dynamic Colored"
    rainbow_button.className = "menu_button";
    rainbow_button.addEventListener('click', function(){
        rainbow = true;
        for (var i = 0; i < color_inputs.length; i++){
            color_inputs[i].value = rgbToHex(colors[parts[i][1][0]][0], colors[parts[i][1][0]][1], colors[parts[i][1][0]][2]);
        }
    });

    menu.appendChild(button_div);
    button_div.appendChild(original_button);
    button_div.appendChild(black_button);
    button_div.appendChild(outfit1_button);
    button_div.appendChild(rainbow_button);
    document.getElementById('original').appendChild(menu);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
  
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
  
function createVideo(url){
    var vid = document.createElement('video');
    var results = document.getElementById('results')
    var results_video = document.getElementById('results_video')
    vid.src = url;
    vid.id = "output";
    vid.style.width = "50%";
    vid.addEventListener("click", function(){
        vid.play();
    })
    results.style.display = "flex";
    results_video.appendChild(vid);
}

$(document).ready(function(){
	$("#videoSourceWrapper").hide();
});

document.addEventListener("DOMContentLoaded", function(){
    setup();
    $('#process').hide();    
    $('#uploadVideoFile').on('change',
        function() {
            var fileInput = document.getElementById("uploadVideoFile");
            if ('files' in fileInput) {
                if (fileInput.files.length === 0) {
                    alert("Select a file to upload");
                } else {
                    var $source = $('#videoSource');
                    $source[0].src = URL.createObjectURL(this.files[0]);
                    $source.parent()[0].load();
                    $("#videoSourceWrapper").show();
                    UploadVideo(fileInput.files[0]);
                    addColorMenu();

                    var val = document.getElementById("dropdown1").value;
                    console.log(val)
                    if (val != "bodySeg"){
                        document.getElementById('menu').style.display = "none";
                    }
                }
            } else {
                console.log('No found "files" property');
            }
        }
    );

    $("#process").on('click', function(){
        extractFrames()
    });

    $("#gingy").on('click', function(e){
        console.log("clicked ", event.pageX - this.offsetLeft, " , ", event.pageY - this.offsetTop);
    });

    $("#dropdown1").on('change', function(){
        var val = document.getElementById("dropdown1").value;
        if (document.getElementById('menu')){
            if (val == "bodySeg"){
                document.getElementById('menu').style.display = "block";
            }
            else{
                document.getElementById('menu').style.display = "none";
            }
        }
    });

    $("#download_button").on('click', function(){
        var output = document.getElementById('output');
        if (output){
            downloadURI(output.src, "video");
        }
    });

});

function UploadVideo(file) {
	var loaded = 0;
    var chunkSize = 500000;
    var total = file.size;
    var reader = new FileReader();
    var slice = file.slice(0, chunkSize);
            
    // Reading a chunk to invoke the 'onload' event
    reader.readAsBinaryString(slice); 
    console.log('Started uploading file "' + file.name + '"');
    $('#uploadVideoProgressBar').show();
        
    reader.onload = function (e) {
       //Just simulate API
       w =  $('video').width() / $('body').width();
  		setTimeout(function(){
    		loaded += chunkSize;
            var percentLoaded = Math.min((loaded / total), 100);
            console.log('Uploaded ' + Math.floor(percentLoaded) + '% of file "' + file.name + '"');
            $('#uploadVideoProgressBar').width(percentLoaded * w + "%");

            //Read the next chunk and call 'onload' event again
            if (loaded <= total) {
                slice = file.slice(loaded, loaded + chunkSize);
                reader.readAsBinaryString(slice);
            } else { 
                loaded = total;
                console.log('File "' + file.name + '" uploaded successfully!');
                $('#uploadVideoProgressBar').hide();
                $('#process').show(); 
                document.getElementById("dropdown_div").style.display = "block";    
            }
  		}, 250);
    }
}

function PostChunk(){
    //Send the sliced chunk to the REST API
    $.ajax({
        url: "http://api/url/etc",
        type: "POST",
        data: slice,
        processData: false,
        contentType: false,
        error: (function (errorData) {
            console.log(errorData);
            alert("Video Upload Failed");
        })
    }).done(function (e) { 
        //The chunk is successfully uploaded!
        loaded += chunkSize;
        var percentLoaded = Math.min((loaded / total) * 100, 100);
        console.log('Uploaded ' + Math.floor(percentLoaded) + '% of file "' + file.name + '"');
        $('#uploadVideoProgressBar').width(percentLoaded + "%");

        //Read the next chunk and call 'onload' event again
        if (loaded <= total) {
            slice = file.slice(loaded, loaded + chunkSize);
            isFirstChunk = false;
            reader.readAsBinaryString(slice);
        } else { 
            loaded = total;
            console.log('File "' + file.name + '" uploaded successfully!');
            $('#uploadVideoProgressBar').hide();
            $('#process').show();
            video = document.getElementById('video');
            video.play(); //initialize playhead
            video.pause();
        }
    });
}

function extractFrames(){
    var array = [];
    var canvas = document.createElement('canvas');
    video = document.getElementById('video');
    var ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    function drawFrame(){
        console.log("drawing frames")
        now = Date.now();
        elapsed = now - then;
        then = now;
        times.push(elapsed);
        numFrames++;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(function(blob){
            array.push(blob);
            if (video.currentTime >= video.duration) {
                console.log("calling on end");
                console.log(times)
                onend();
                return;
            }
            else{
                requestAnimationFrame(drawFrame);
            }
        }, 'image/jpeg');
    }

    function saveFrame(blob) {
        console.log("saving")    
        array.push(blob);
        if (array.length == numFrames){
            onend();
        }
    }
    
    function revokeURL(e) {
        URL.revokeObjectURL(this.src);
    }

    function onend() {
        times.push(16);
        var img;        
        img_array = []; //clear it out if it's been used before
        for (var i = 0; i < array.length; i++) {
            img = new Image(video.videoWidth, video.videoHeight);
            img.onload = revokeURL;
            img.src = URL.createObjectURL(array[i]);
            img_array.push(img);  
        }
        URL.revokeObjectURL(this.src);
        labelImages(img_array);
    }
      
    video.muted = true;
    video.play();
    then = Date.now();
    drawFrame();
}

function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
  }
