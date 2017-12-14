const http = require('http');
const url = require('url');
const crypto = require('crypto');

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
        var accept = req.headers["accept"];
        var timeStamp = query["ts"];

        
        
        if(req.headers["x-id"]){
                id = req.headers["x-id"];
                res.setHeader("X-Id",id);
        }
                
        
        res.setHeader("Date",new Date(Date.now()).toUTCString());
        
        
        if(path == "/rsc" || path == "/rsc.css"){

                res.setHeader("X-Forwarded-Header",JSON.stringify(req.headers))

                if(queryParamsResponse["st"] >= 500 && queryParamsResponse["st"] <= 505){
                    res.statusCode = queryParamsResponse["st"];
                    return res.end("");
                }

                else if(queryParamsResponse["st"] == 201 ){
                    res.statusCode = 201;
                } 

                else if(queryParamsResponse["st"] >= 400 && queryParamsResponse["st"] <= 415){
                    res.statusCode = queryParamsResponse["st"];
                    return res.end("");
                }

                if(req.method == "PUT" || req.method == "DELETE"){
                        res.statusCode = 204;
                        return res.end("");
                }

                else if(req.method == "POST"){
                        res.statusCode = 201;
                        return res.end("");
                }

                if(req.headers["if-none-match"] && req.headers["if-none-match"] == "123"){
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
                                res.setHeader("Date",expires);
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

        if(accept == "application/json"){
               
                res.setHeader("Content-Type",accept);
                var bodyJson = {};
                bodyJson["Id"]  = id;
                
                body = JSON.stringify(bodyJson);
                //body = '{"Id":"'+id+'"}';
        }

        else if(accept =="application/xml"){
                res.setHeader("Content-Type",accept);
                body = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><id>'+id+'</id>';       
        }
                
        else if(accept =="text/css"){
                res.setHeader("Content-Type",accept);
                body = 'p{font-family: '+id+'}';
        } 

        else {
                res.setHeader("Content-Type","text/plain");
        }
             
        return res.end(body);

        
}

function parseResponseString(responseString){
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