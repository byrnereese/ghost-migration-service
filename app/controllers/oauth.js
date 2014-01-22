var https = require('https'),
    querystring = require('querystring');

var OAuth = function () {
    this.disqus = function (req, resp, params) {
        var self = this;
        self.redirect('https://disqus.com/api/oauth/2.0/authorize/?client_id='+geddy.config.disqus_apikey+
                      '&scope=read,write'+
                      '&response_type=code'+
                      '&redirect_uri='+encodeURIComponent('http://localhost:4000/oauth/disqus/auth'));
    };
    this.disqus_auth = function (req, resp, params) {
        var self = this;
        var User = geddy.model.User;
        var code = params.code;
        //console.log('Processing auth request: ' + code);
        if (typeof code != 'undefined') {
            //console.log("obtaining oauth token for code: " + params.code);
            var post_data = querystring.stringify({
                'redirect_uri' : 'http://localhost:4000/oauth/disqus/auth',
                'grant_type'   : 'authorization_code',
                'client_id'    : geddy.config.disqus_apikey,
                'client_secret': geddy.config.disqus_secret,
                'code'         : params.code
            });
            //console.log('data: "'+post_data+'"');
            var post_options = {
                host: 'disqus.com',
                path: '/api/oauth/2.0/access_token/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };
            // Set up the request
            var post_req = https.request(post_options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    var des = eval('(' + chunk + ')'); // TODO - error detection
                    console.log('disqus_secret='+des.access_token);
                    geddy.model.User.first({id: self.session.get('userId')}, function (err, user) {
                        console.log("user was: ",user);
                        //user.disqus_secret = des.access_token;
                        user.updateProperties({'disqus_secret': des.access_token},{scenario: 'save_disqus_secret'});
                        //user.updateProperties({});
                        console.log("user is now: ",user);
                        user.save(function (err, data) {
                            if (err) {
                                params.errors = err;
                                console.log("An error occurred saving the user: ", err);
                                self.redirect('http://localhost:4000/users/'+user.id+'/edit?err='+err);
                            }
                            else {
                                console.log("Successfully saved user: ", user);
                                self.redirect('http://localhost:4000/users/'+user.id+'/edit#disqus_authed');
                            }
                        });
                    }); // end res.on('data') - what do you do if there is no response?
                });
            });
            // post the data
            post_req.write(post_data);
            post_req.end();

        } else {
            self.redirect('http://localhost:4000/begin');
        }
    };

    this.aws = function (req, resp, params) {
        var self = this;
        self.redirect('https://www.amazon.com/ap/oa?client_id='+geddy.config.aws_apikey+
                      '&scope=profile'+
                      '&response_type=code'+
                      '&redirect_uri='+encodeURIComponent('http://localhost:4000/oauth/aws/auth'));
    };
    this.aws_auth = function (req, resp, params) {
        var self = this;
        var code = params.code;
        //console.log("obtaining oauth token for code: " + params.code);
        var post_data = querystring.stringify({
            'redirect_uri' : 'http://localhost:4000/oauth/aws/auth',
            'grant_type'   : 'authorization_code',
            'client_id'    : geddy.config.aws_apikey,
            'client_secret': geddy.config.aws_secret,
            'code'         : params.code
        });
        //console.log('data: "'+post_data+'"');
        var post_options = {
            host: 'api.amazon.com',
            path: '/auth/o2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': post_data.length
            }
        };
        // Set up the request
        var post_req = https.request(post_options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                //console.log('Response: ' + chunk);
            });
        });

        // post the data
        post_req.write(post_data);
        post_req.end();
        
    };
};

exports.Oauth = OAuth;


