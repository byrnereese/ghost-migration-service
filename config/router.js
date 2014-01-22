var router = new geddy.RegExpRouter();

router.get('/').to('Main.index');

router.get('/oauth/disqus').to('Oauth.disqus');
router.get('/oauth/disqus/auth').to('Oauth.disqus_auth');

router.get('/oauth/aws').to('OAuth.aws');
router.get('/oauth/aws/auth').to('OAuth.aws_auth');

router.get('/begin').to('Main.begin');
router.get('/login').to('Main.login');
router.get('/logout').to('Main.logout');

router.post('/auth/local').to('Auth.local');
router.get('/auth/twitter').to('Auth.twitter');
router.get('/auth/twitter/callback').to('Auth.twitterCallback');
router.get('/auth/facebook').to('Auth.facebook');
router.get('/auth/facebook/callback').to('Auth.facebookCallback');
router.get('/auth/yammer').to('Auth.yammer');
router.get('/auth/yammer/callback').to('Auth.yammerCallback');
router.resource('users');

exports.router = router;
