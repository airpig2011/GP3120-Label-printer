/**
 * Copyright 2015-2016 
 * @author chendajie
 * @version 2016-01-01
 */
var vendorId = 0x0471;
var productId = 0x0055;

var pageWidth = 128;  // pixels (must be multiple of 8)
var pageHeight = 128; // pixels

var $ = function(id) { return document.getElementById(id); };
var $$ = function(selector) { return document.querySelector(selector); };

var dataEnd = [0x0d,0x0a]
var startDoc1 = "";
var selfTest = "SELFTEST";
var startDoc2 = startDoc1.split(" ");


var logoImg = new Image();
logoImg.src = "chrome_logo.png";

/* 
 * when click the print button start to find usb device by vendor id and product id.  
 */
function sendCmd() {
    chrome.usb.findDevices( {"vendorId": vendorId, "productId": productId}, onDeviceFound);
}

/* 
 * Send command to printer if find device.
 * Add command on buildPackage to change print style.
 */
var onDeviceFound = function(devices) {
    
    if (devices && devices.length>0) {
    
        device = devices[0];
        console.log("Device found: " + device.handle);
        
        /* read image */
        var ictx = $("previewCanvas").getContext('2d');
        var img = ictx.getImageData(0, 0, pageHeight, pageWidth);
        preview();
        /* end read image */
        
        toGreyScale(img);
        ditherImg(img);
        /* build package */
        var data1 = buildPackage(
                    CmdSIZE(30,20),
                    CmdGAP(3,0),
                    
                    CmdREFERENCE(0,0),
                    CmdSPEED("4.0"),
                    CmdDENSITY(8),
                    CmdSET_PEEL("OFF"),
                    CmdSET_CUTTER("OFF"),
                    CmdSET_PARTIAL_CUTTER("OFF"),
                    CmdSET_TEAR("ON"),
                    CmdDIRECTION(0),
                    CmdSHIFT(0),
                    CmdOFFSET(0),
                    
                    CmdCLS(),
                    CmdBITMAP(96,0,img.width, img.height,1,img),
                  
                    //CmdBARCODE(16,19,"128M",110,1,0,3,9,123123123),
                    //CmdBARCODE(16,19,"128M",110,1,0,3,9,"666666"),
                    CmdPRINT(1,1)
                    );

        var data = new ArrayBuffer(data1.length);
        var dataView = new Uint8Array(data, 0, data1.lengt);

        dataView.set(data1,0);  

        /* build the info of usb */
        var info = {
            "direction": "out",
            "endpoint": 2, // 2 is the Bulk OUT Endpoint. You may use chrome.usb.listInterfaces to figure which address to use for Outputing data.
            "data": data
        };
        /* send info to usb */
        chrome.usb.claimInterface(device, 0, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
            chrome.usb.bulkTransfer(device, info, function(transferResult) {
                console.log("Send data", transferResult);
                chrome.usb.releaseInterface(device, 0, function() {
                  if (chrome.runtime.lastError)
                      console.error(chrome.runtime.lastError);
                  });
            });
        });
    } else {
        console.log("Device not found");
    }
}

var buildPackage = function(){
  
    /* calcu the totoal size of the data */
    var totalDataSize = 0;
    for(var i=0; i<arguments.length; i++){
        totalDataSize += arguments[i].length;
    }
    
    var offset = 0;
    var data = new ArrayBuffer(totalDataSize);
    var dataView = new Uint8Array(data, 0, totalDataSize);

    /* Set beginning data */
    for(var i=0; i<arguments.length; i++){
        dataView.set(arguments[i], offset);
        offset += arguments[i].length;
    }

    return dataView;
}

/*
 * build command for printer
 */
var CmdSIZE = function(Width, Height){
  
    var dataStr = "SIZE " +""+Width+" mm,"+Height+" mm";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}

var CmdGAP = function(m, n){
  
    var dataStr = "GAP " +""+m+" mm,"+n+" mm";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdREFERENCE = function(x, y){
  
    var dataStr = "REFERENCE " +""+x+","+y+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSPEED = function(n){
  
    var dataStr = "SPEED " +""+n+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdDENSITY = function(n){
  
    var dataStr = "DENSITY " +""+n+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSET_PEEL = function(OnOrOff){
  
    var dataStr = "SET PEEL " +""+OnOrOff+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSET_CUTTER = function(OnOrOff){
  
    var dataStr = "SET CUTTER " +""+OnOrOff+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSET_PARTIAL_CUTTER = function(OnOrOff){
  
    var dataStr = "SET PARTIAL_CUTTER " +""+OnOrOff+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSET_TEAR = function(OnOrOff){
  
    var dataStr = "SET TEAR " +""+OnOrOff+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdDIRECTION = function(n){
  
    var dataStr = "DIRECTION " +""+n+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdSHIFT = function(n){
  
    var dataStr = "SHIFT " +""+n+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdOFFSET = function(n){
  
    var dataStr = "OFFSET " +""+n+" mm";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdCLS = function(){
  
    var dataStr = "CLS";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdQRCODE = function(X, Y, ECC, Width, mode, rotation, Data){

    var dataStr = "QRCODE "+X+","+Y+","+ECC+","+Width+","+mode+","+rotation+","+"\""+Data+"\"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}

var CmdQRCODE_Mask = function(X, Y, ECC, Width, mode, rotation, model, mask, Data){

    var dataStr = "QRCODE "+X+","+Y+","+ECC+","+Width+","+mode+","+rotation+","+model+","+mask+","+"\""+Data+"\"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
var CmdBARCODE = function(X, Y, Type, height, human, rotation, narrow, wide, code){
  
    var dataStr = "BARCODE "+X+","+Y+","+"\""+Type+"\""+","+height+","+human+","+rotation+","+narrow+","+wide+","+"\""+"!105"+""+code+"\"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}


var CmdBITMAP = function(X, Y, WidthSrc, Height, mode, img){
  
    var Width = WidthSrc/8;
    var dataStr = "BITMAP "+""+X+","+Y+","+Width+","+Height+","+mode+",";
    var offset = 0;

    var dataHex = new Array();
    var strSplit = dataStr.split("");
    for(var x=0; x<strSplit.length; x++){
        dataHex[x] = strSplit[x].charCodeAt();
    }

    var dataBytesPerLine = pageWidth / 8;

    // every row of the image results in 2 rows of pixels to be printed, both
    // with one extra byte in front of it
    var bytesPerRow = (dataBytesPerLine + 1) * 2;

    var bytesForImage = bytesPerRow * pageHeight;
    var totalDataSize = img.width*img.height/8 + dataHex.length+2;

    var bitmapData = image2bitmap(img);

    var data = new ArrayBuffer(totalDataSize);
    var dataView = new Uint8Array(data, 0, totalDataSize);

    dataView.set(dataHex, offset);
    offset += dataHex.length;

    dataView.set(bitmapData, offset);
    offset += bitmapData.length;

    dataView.set(dataEnd, offset);

    return dataView;
}
var CmdPRINT = function(m,n){
  
    var dataStr = "PRINT "+""+m+","+n+"";
    var dataHex = Str2Hexarray(dataStr);
    return dataHex;
}
/* end build command for printer */

function requestPermission(callback) {
    chrome.permissions.request(
        {permissions: [{'usbDevices': [{"vendorId": vendorId, "productId": productId}] }]}
        , function(result) {
            if (result) {
                callback();
            } else {
                console.log('App was not granted the "usbDevices" permission.');
                console.log(chrome.runtime.lastError);
            }
        }
    );
}


var image2bitmap = function(img){
  
    var totalDataSize = img.width * img.height / 8;
    var data = new ArrayBuffer(totalDataSize);
    var dataView = new Uint8Array(data, 0, totalDataSize);
    var offsetTemp = 0;
    for (var h = 0; h<img.height; h++) {
        var off1 = offsetTemp;

        for (var w = 0; w < img.width; w += 8) {
            var cur1 = 0;
            for (var bit = 0; bit < 8; bit++) {
                cur1 = cur1 << 1;
                var i = (h * img.width + w) * 4 + bit * 4;

                var color = (0.2126 * img.data[i] + 0.7152 * img.data[i+1] + 0.0722 * img.data[i+2]);
                if(color == 0){
                    cur1 &= 0xfe;
                }else{
                    cur1 |= 1;
                }
            }
            dataView[off1++] = cur1;
        }
        offsetTemp = off1;
    }
    return dataView;
}

var Str2Hexarray = function(str){
  
    var HexArray = new Array(str.length);
    var strSplit = str.split("");
    for(var x=0; x<str.length; x++){
        HexArray[x] = strSplit[x].charCodeAt();
    }
    HexArray[str.length] = 0x0d;
    HexArray[str.length+1] = 0x0a;
    return HexArray;
}


function toGreyScale(imgData) {
    for (var y = 0; y < imgData.height; y++) {
        for (var x = 0; x < imgData.width; x++) {
            var i = (y * imgData.width + x) * 4;
            var color = (0.2126 * imgData.data[i] + 0.7152 * imgData.data[i+1] + 0.0722 * imgData.data[i+2]);
            if(color >230){
                imgData.data[i] = 255;
                imgData.data[i+1] = 255;
                imgData.data[i+2] = 255; 
            }else{
                imgData.data[i] = 0;
                imgData.data[i+1] = 0;
                imgData.data[i+2] = 0; 
            }
            imgData.data[i+3] = 255;
        }
    }
}

function ditherImg(imgData) {
    var offsets = [1, 2, imgData.width-1, imgData.width, imgData.width+1, 2*imgData.width];
    var imgSize = 4* imgData.width * imgData.height;
    for (var y = 0; y < imgData.height; y++) {
        for (var x = 0; x < imgData.width; x++) {
            var i = (y * imgData.width + x) * 4;
            var color = imgData.data[i];
            var ocolor;
            if (color > 170) {
                ocolor = 255;
            } else if (color > 85) {
                ocolor = 128;
            } else {
                ocolor = 0;
            }
            imgData.data[i] = ocolor;
            imgData.data[i+1] = ocolor;
            imgData.data[i+2] = ocolor;
            var diff = ocolor - color;
            // if diff > 0, ocolor is higher than color, so subtract it from neighbours
            var delta = Math.round(diff / 8);
            for (o in offsets) {
                var j = i + 4*o;
                // should make sure this didn't wrap around
                if (j < imgSize) {
                    var c = imgData.data[j] - delta;
                    if (c < 0) c = 0;
                    if (c > 255) c = 255;
                    imgData.data[j] = c;
                }
            }
        }
    }
}

var dither = function(height, width) {
    var ictx = $("previewCanvas").getContext('2d');
    var octx = $("ditheredCanvas").getContext('2d');
    var img = ictx.getImageData(0, 0, height, width);
    toGreyScale(img);
    ditherImg(img);
    octx.putImageData(img, 0, 0);
};

var preview = function() {
    updateCanvas();
    var ictx = $("previewCanvas").getContext('2d');
    var img = ictx.getImageData(0, 0, pageHeight, pageWidth);
    toGreyScale(img);
    ditherImg(img);
    ictx.putImageData(img, 0, 0);
}

var updateCanvas = function(e) {
    var canvas = $("previewCanvas");
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pageHeight, pageWidth);
    ctx.fillStyle = "#000";
    var img = logoImg;
    var scale = 1;
    if (img.height > pageWidth) {
        scale = pageWidth / img.height;
    }
    var y = 0;
    if (img.height < pageWidth) {
        y = (pageWidth - img.height) / 2;
    }
    ctx.font = "64px sans-serif";
    ctx.font = "48px sans-serif";
    var textX;
    if (img.width * scale > 2*(pageHeight / 5)) {
        textX = (pageHeight) / 2;
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, 0, 0, img.width, img.height, (pageHeight - (scale * img.width)) / 2, y, img.width*scale, img.height*scale);
        ctx.globalAlpha = 1.0;
        ctx.font = "64px sans-serif";
        ctx.font = "48px sans-serif";
    } else {
        textX = img.width * scale + 16;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, y, img.width*scale, img.height*scale);
        ctx.font = "64px sans-serif";
        ctx.font = "48px sans-serif";
    }
};

logoImg.onload = updateCanvas;
var selectImage = function(e) {
    chrome.fileSystem.chooseEntry({'acceptsAllTypes': false,
                                  'accepts': [{'mimeTypes': ['image/*']}],
                                  'type': 'openFile'}, function(fileEntry) {
        if (!fileEntry || !fileEntry.file) return;
        fileEntry.file(function(file) {
            console.log("Success: " + file);
            var reader = new FileReader();
            reader.onload = function(e) {
                logoImg.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }, function(error) {
            console.log("Error: " + error.code);
        });
    });
};

var stream;
var width = 280, height = 0;
var tempCanvas = $('tempCanvas');
var video = $('video');
var startTakePicture = function(e) {
    navigator.webkitGetUserMedia({audio: false, video: true}, function(videoStream) {
        stream = videoStream;
        video.src = webkitURL.createObjectURL(stream);
        video.style.display = 'block';
        video.play();
    }, function(e) {
        console.error(e);
    });
};

var updateCanvasSize = function(e) {
    var curWindow = chrome.app.window.current();
    var canvas = $("previewCanvas");
    pageHeight = parseInt($('pageWidth').value, 10);
    pageWidth = parseInt($('pageHeight').value, 10);
    if (pageWidth % 8 != 0) {
      pageWidth = pageWidth + 8 - pageWidth % 8;
    }
    $('pageWidth').value=pageHeight;
    $('pageHeight').value=pageWidth;
    canvas.setAttribute('width', pageHeight);
    canvas.setAttribute('height', pageWidth);
    updateCanvas();

    curWindow.outerBounds.width = Math.max(1030, pageHeight + 130);
    curWindow.outerBounds.height = pageWidth + 400;
  
    CmdSIZE(pageWidth, pageHeight);
};

/*
 * add event listener
 */
window.addEventListener('DOMContentLoaded', function() {
    $('print').addEventListener('click', sendCmd);
    $('previewBtn').addEventListener('click', preview);
    $('setImage').addEventListener('click', selectImage);
    updateCanvas();
});
