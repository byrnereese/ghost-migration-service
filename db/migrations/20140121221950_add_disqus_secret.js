var ZerpDerp = function () {
  this.up = function (next) {
      this.addColumn('users', 'disqus_secret', 'string',
                     function (err, data) {});
      next();
  };

  this.down = function (next) {
      this.removeColumn('users', 'disqus_secret',
                        function (err, data) {});
      next();
  };
};

exports.AddDisqusSecret = AddDisqusSecret;
