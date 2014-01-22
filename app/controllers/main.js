var strategies = require('../helpers/passport/strategies')
  , kue = require('kue')
  , jobs = kue.createQueue()
  , authTypes = geddy.mixin(strategies, {local: {name: 'local account'}});;

var Main = function () {

    this.index = function (req, resp, params) {
        var self = this
        , User = geddy.model.User;
        User.first({id: this.session.get('userId')}, function (err, user) {
            var data = {
                user: null
                , authType: null
            };
            if (user) {
                data.user = user;
                data.authType = authTypes[self.session.get('authType')].name;
            }
            self.respond(data, {
                format: 'html'
                , template: 'app/views/main/index'
            });
        });
    };

    this.login = function (req, resp, params) {
        this.respond(params, {
            format: 'html'
            , template: 'app/views/main/login'
        });
    };

    this.logout = function (req, resp, params) {
        this.session.unset('userId');
        this.session.unset('authType');
        this.respond(params, {
            format: 'html'
            , template: 'app/views/main/logout'
        });
    };

    this.begin = function (req, resp, params) {
        console.log("beginning process of migrating site");
        var job = jobs.create('migrate site', {
            title: 'Migrate majordojo.com'
            , api_url: 'http://localhost/~byrne/mt43/json.cgi/entries/list.json?blog_id=3'
            , username: 'byrnereese'
            , password: 'passw0rd'
        }).save();
        
        job.on('complete', function(){
            console.log("migrate site job complete");
        }).on('failed', function(){
            console.log("migrate site job failed");
        }).on('progress', function(progress){
            process.stdout.write('\r  migrate site job #' + job.id + ' ' + progress + '% complete' + "\n");
        });

        this.respond({params: params}, {
            format: 'html'
            , template: 'app/views/main/begin'
        });
    };

};

exports.Main = Main;


