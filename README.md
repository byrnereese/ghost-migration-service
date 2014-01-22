The Ghost migration service is a private service to help bloggers migrate from their existing blogging platform to the much simpler Ghost blogging platform. The need for this service arises because of certain constraints inherent to the Ghost platform. These constraints are:

* Ghost offers, and will probably never offer a built-in commenting system.
* Ghost does not support file uploads, and even if it one day did, files will almost certainly be hosted by a third party service, like Amazon S3.
* Ghost is a single user blogging platform.

Migration Process
* verify auth to remote blogging service
* verify auth to S3
* verify auth to disqus
* connect to blog, foreach entry:
  - create background task to process entry
    - 


# Resources

* Kue: https://github.com/LearnBoost/kue (background tasks)
* Vogue: http://aboutcode.net/vogue/ (auto-reload css)
* Hummingbird: http://hummingbirdstats.com/ (real time stats about jobs being processed etc)
* Geddy
* Disqus https://github.com/hay/node-disqus
