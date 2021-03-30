var net;
var img_array = [];

async function setup(){
    net = await bodyPix.load({architecture: 'MobileNetV1'});
    console.log("Body Pix Library Initialized");
};

async function labelImages(array){ //make this a for loop, after all images loaded
    const opacity = 0.9;
    const flipHorizontal = false;
    const maskBlurAmount = 0;
    const frames = [];
    var encoder = new Whammy.Video(30);
    for (var i = 0; i < array.length; i++){
        const segmentation = await net.segmentPersonParts(array[i], {
            flipHorizontal: false,
            internalResolution: 'high',
            segmentationThreshold: 0.7,
        });
        const coloredPartImage = bodyPix.toColoredPartMask(segmentation, undefined, {r: 0, g: 0, b: 0, a: 0});
        var canvas = document.createElement('canvas');
        bodyPix.drawMask(canvas, array[i], coloredPartImage, opacity, maskBlurAmount, flipHorizontal);
        //document.body.appendChild(canvas);
        console.log("Processing frame " + i);
        encoder.add(canvas);
    }
    var url;
    encoder.compile(false, function(output){
        url = (window.webkitURL || window.URL).createObjectURL(output);
        console.log(url);
        createVideo(url);
    });
}

function createVideo(url){
    var vid = document.createElement('video');
    vid.src = url;
    vid.id = "output";
    vid.style.width = "20%";
    vid.addEventListener("click", function(){
        vid.play();
    })
    document.body.appendChild(vid);
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
            console.log('Trying to upload the video file: %O', fileInput);

            if ('files' in fileInput) {
                if (fileInput.files.length === 0) {
                    alert("Select a file to upload");
                } else {
                    var $source = $('#videoSource');
                    $source[0].src = URL.createObjectURL(this.files[0]);
                    $source.parent()[0].load();
                    $("#videoSourceWrapper").show();
                    UploadVideo(fileInput.files[0]);
                }
            } else {
                console.log('No found "files" property');
            }
        }
    );

    $("#process").on('click', function(){
        extractFrames()
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
    var numFrames = 0;
    
    function drawFrame(e) {
        console.log("drawing frames")
        numFrames++;
        this.pause();
        ctx.drawImage(this, 0, 0);
        canvas.toBlob(function(blob){
            array.push(blob);
            if (video.currentTime < video.duration) {
                video.play();
            }
            else{
                console.log("calling on end");
                onend();
                console.log(video.currentTime, video.duration)
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
        video.removeEventListener('timeupdate', drawFrame, false);
        var img;        
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
    video.addEventListener('timeupdate', drawFrame, false);
    video.play();
}

