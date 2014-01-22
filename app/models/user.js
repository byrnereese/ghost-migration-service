var User = function () {
    this.defineProperties({
        username: {type: 'string', required: false},
        password: {type: 'string', required: false},
        familyName: {type: 'string', required: false},
        givenName: {type: 'string', required: false},
        email: {type: 'string', required: false},
        disqus_secret: {type: 'string', required: false}
    });
    /*
    this.validatesPresent('username', {on: ['create','update']});
    this.validatesPresent('password', {on: ['create','update']});
    this.validatesPresent('familyName', {on: ['create','update']});
    this.validatesPresent('givenName', {on: ['create','update']});
    this.validatesPresent('email', {on: ['create','update']});
    this.validatesLength('username', {min: 3});
    this.validatesLength('password', {min: 8});
    */
    this.validatesPresent('disqus_secret', {on: 'save_disqus_secret'});

    this.validatesConfirmed('password', 'confirmPassword');
    
    this.hasMany('Passports');
};

User = geddy.model.register('User', User);


