const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');

var headerFields = {
        "cc":"Cache-Control",
        "et":"ETag",
        "lm":"Last-Modified",
        "ex":"Expires",
        "va":"Vary"
};

var httpServer = http.createServer(requestHandler);
var lastModified;
var timeStamps = {};

function requestHandler(req, res){
        console.log(req.url);
        console.log(req.headers);
        console.log("-----")


        var responseString = req.headers["x-response-string"] ? req.headers["x-response-string"] : "";
        var urlObject = url.parse(req.url,true);
        var query = urlObject.query;
        var queryParamsResponse = parseResponseString(responseString);
        var path = urlObject.pathname;
        var id = "";
        var accept = req.headers["accept"] ? req.headers["accept"] : req.headers["x-accept"];
        var timeStamp = query["ts"];

        if(query["sc"]){
            res.setHeader("Set-Cookie")
        }

        //console.log(queryParamsResponse);
        
        if(req.headers["x-id"]){
                id = req.headers["x-id"];
                res.setHeader("X-Id",id);
        } else if(req.headers["id"]){
                id = req.headers["id"]; 
                res.setHeader("Id",id);
        }
                

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "x-response-string");
        res.setHeader("Date",new Date(Date.now()).toUTCString());
        
        
        if(path == "/rsc" || path == "/rsc.css" || path == "/rsc.png" || path.startsWith("/rsc/")){

                res.setHeader("X-Forwarded-Header",JSON.stringify(req.headers))

                if(queryParamsResponse["st"]){
                    res.statusCode = queryParamsResponse["st"];
                    res.setHeader("Location","http://"+req.headers["accept"]);
                }

                if(req.method == "PUT" || req.method == "DELETE" || req.method == "PATCH"){
                        res.statusCode = 204;
                        return res.end("");
                }

                else if(req.method == "POST"){
                        res.statusCode = 201;
                        return res.end("");
                }

                if(req.headers["if-none-match"] && req.headers["if-none-match"].replace(/\"/g, "") == "123"){
                        res.statusCode = 304;

                        return res.end("");
                }

                if(req.headers["if-modified-since"]){
                        if(req.headers["if-modified-since"] == lastModified){
                                res.statusCode = 304;
                                return res.end("");
                        }
                }

                
                for (var key in queryParamsResponse) {
                        if (key == "exp"){
                                var expires = new Date(Date.now() + parseInt(queryParamsResponse[key]) * 1000).toUTCString();
                                res.setHeader("Expires",expires);
                        }

                        else if (key == "lm"){
                                lastModified = new Date(Date.now() + parseInt(queryParamsResponse[key]) * 1000).toUTCString();
                                
                                res.setHeader("Last-Modified",lastModified);
                        }

                        else if(key == "t"){
                                continue;
                        }

                        else if(key == "sc"){
                                res.setHeader("Set-Cookie",rand_string(16));
                        }

                        else if(key == "xsf"){
                                res.setHeader("X-Store-Forbidden","This header field is forbidden to store");
                        }
                        else if (headerFields[key]){
                                res.setHeader(headerFields[key],queryParamsResponse[key]);
                        }
                }
        }


        var body = "Id:"+id;

        // Data Format
        if(accept == "application/json"){
               
            res.setHeader("Content-Type",accept);
            var bodyJson = {};
            bodyJson["Id"]  = id;
            
            body = JSON.stringify(bodyJson);
        }

        else if(accept =="application/xml"){
            res.setHeader("Content-Type",accept);
            body = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><id>'+id+'</id>';       
        }
                
        else if(accept =="text/css"){
            res.setHeader("Content-Type",accept);
            body = 'p{font-family: '+id+'}';
        } 

        else if(accept == "image/png"){
            res.setHeader("Content-Type",accept);
            body = fs.readFileSync("./das_logo.png");

        }

        else if(accept == "text/plain"){
                res.setHeader("Content-Type","text/plain");
        } else {
            res.setHeader("Content-Type","text/plain");
        }

        //Language
        if(req.headers["accept-language"]){
            res.setHeader("Content-Language",req.headers["accept-language"]);
        }
             
        return res.end(body);

        
}

function parseResponseString(responseString){
    //TODO parsing with spaces
    var responseStringArray = responseString.split(";");
    var responseHeaderFields = {};
    for (var i = 0; i < responseStringArray.length; i++) {
        var headerFieldArray = responseStringArray[i].split(":");
        if(headerFieldArray.length == 2){
            responseHeaderFields[headerFieldArray[0]] = headerFieldArray[1];
        }
    }

    return responseHeaderFields;
}

function rand_string(n) {
    if (n <= 0) {
        return '';
    }
    var rs = '';
    try {
        rs = crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n);
        /* note: could do this non-blocking, but still might fail */
    }
    catch(ex) {
        /* known exception cause: depletion of entropy info for randomBytes */
        console.error('Exception generating random string: ' + ex);
        /* weaker random fallback */
        rs = '';
        var r = n % 8, q = (n-r)/8, i;
        for(i = 0; i < q; i++) {
            rs += Math.random().toString(16).slice(2);
        }
        if(r > 0){
            rs += Math.random().toString(16).slice(2,i);
        }
    }
    return rs;
}

httpServer.listen(3000,function(){
        console.log('App listening on port 3000!');
});