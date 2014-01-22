var kue = require('kue')
  , cheerio = require('cheerio')
  , jobs = kue.createQueue()
  , passport = require('../helpers/passport')
  , cryptPass = passport.cryptPass
  , requireAuth = passport.requireAuth
  , http = require('http');

// Start-up a Kue client
kue.app.listen(4001);

/*
  - add URL to job queue
  - get list of all entries in the site.
  - foreach entry:
    - grab contents of url
      - extract images from post content
      - copy images to s3
      - rewrite urls in post content to new s3 urls
    - create post in ghost using new content
      - grab new url for newly created post
    - if post has comments:
      - create post in disqus
      - grab comments of url
        - foreach comment:
          - add comment to disqus post
*/

function parse_url_parts( url ) {
    console.log('Parsing url: ' + url);
    var parts = url.match(/^(https?):\/\/([^\/:]*)(:\d+)?(\/.*)$/);
    var options = {
        'host': parts[2],
        'port': typeof parts[3] != 'undefined' ? parts[3].substring(1) : parts[1].match(/https/i) ? 443 : 80,
        'path': parts[4]
    };
    return options;
}

function migrate_entry( entry, done ) {
    console.log('Creating job to process ' + entry.title);
    var job = jobs.create('process entry', {
        title: 'Migrate "'+entry.title+'"'
        , api_url: entry.api_url
    }).save();
    job.on('complete', function(){
        done();
        console.log("process entry job complete");
    }).on('failed', function(){
        done('job failed for: ' + entry.title);
        console.log("process entry job failed");
    }).on('progress', function(progress){
        process.stdout.write('\r  process entry job #' + job.id + ' ' + progress + '% complete' + "\n");
    });
}

function load_entry_list(un, pw, options, done) {
    http.get(options, function(res) {
        var content = ''
          , bytes = 0;
        res.on("data", function(chunk) {
            content += chunk;
            bytes += chunk.length;
        });
        res.on('end', function() {
            var data = eval( '(' + content + ')' );
            done( data );
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
/*
    var listings = { 
        'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3': {
            meta: {
                next: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&since=3',
                count: 3,
                total: 6
            },
            posts: [
                {
                    id: 1,
                    title: 'Ancient Hidden Khmer City Discovered in Cambodia',
                    url: 'http://www.majordojo.com/2013/06/ancient-hidden-khmer-city-discovered-in-cambodia.php',
                    api_url: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=1'
                }
                ,{
                    id: 2,
                    title: 'The long and ultimately disappointing wait for Inbox',
                    url: 'http://www.majordojo.com/2013/03/the-long-and-ultimately-disappointing-wait-for-inbox.php',
                    api_url: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=2'
                }
                ,{
                    id: 3,
                    title: "Werner Herzog's Note To His Cleaning Lady",
                    url: 'http://www.majordojo.com/2012/05/werner-herzogs-note-to-his-cleaning-lady.php',
                    api_url: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=3'
                }
            ]
        }
        , 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&since=3': {
            meta: {
                count: 2,
                total: 5
            },
            posts: [
                {
                    id: 4,
                    title: 'Test Post 4',
                    url: '_some_url_',
                    api_url: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=4'
                }
                ,{
                    id: 5,
                    title: 'Test Post 5',
                    url: '_some_url_',
                    api_url: 'http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=5'
                }
            ]
        }
    };
    return listings[url];
    */
}

function load_entry(un, pw, options, done) {
    http.get(options, function(res) {
        var content = ''
          , bytes = 0;
        res.on("data", function(chunk) {
            content += chunk;
            bytes += chunk.length;
        });
        res.on('end', function() {
            var data = eval( '(' + content + ')' );
            done( data );
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
/*
    var entries = {
        "http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=1": {
            "id":1,
            "title":"Ancient Hidden Khmer City Discovered in Cambodia",
            "slug":"ancient-hidden-khmer-city-discovered-in-cambodia",
            "content":'<p><div style="float: right; margin: 0 0 20px 20px; width: 200px;"><a rel="lightbox" href="http://www.majordojo.com/taphrom.JPG" title="Ta Phrom"><img alt="Ta Phrom" src="http://www.majordojo.com/assets_c/2013/06/taphrom-thumb-200x266-3587.jpg" width="200" height="266" class="mt-image-right" style="" /></a></div>Archaeologists have discovered an ancient Khmer city that predates Angkor Wat by about 350 years using lasers that were able to map surface features through the canopy of the surrounding trees. The city has either been largely destroyed or buried by nature, so do not expect to see the kinds of amazing ruins like Ta Phrom (pictured to the right), but there remain artifacts that have been untouched by looters for centuries. </p><p>It is so exciting to know that there are still wondrous and amazing places on this Earth still yet to be discovered.</p><iframe width="560" height="315" src="http://www.youtube.com/embed/Ypoqdk2yy5U" frameborder="0" allowfullscreen></iframe>',
            "status":"published",
            "language":"en_US",
            "author_id":1,
            "created_at":946684800000,
            "created_by":1,
            "updated_at":946684800000,
            "updated_by":1,
            "published_at":946684800000,
            "published_by":1,
            "comments":[
                {
                    id: 1,
                    author: 'Byrne Reese',
                    author_url: '',
                    author_email: 'byrne@majordojo.com',
                    content: 'Foo'
                }
            ],
            "tags":[
                {"name":"ancient"},
                {"name":"anthropology"},
                {"name":"archeology"},
                {"name":"cambodia"},
                {"name":"cities"},
                {"name":"khmer"},
                {"name":"video"}
            ]
        }
        ,"http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=2":{
            "id": 2,
            "title":"The long and ultimately disappointing wait for Inbox",
            "slug":"the-long-and-ultimately-disappointing-wait-for-inbox",
            "content":'<p><div style="float: right; width: 200px; margin: 0 0 20px 20px;"><a rel="lightbox" href="http://www.majordojo.com/1671952-inline-inline-mailbox-new.jpg" title="Mailbox Waiting List"><img alt="Mailbox Waiting List" src="http://www.majordojo.com/assets_c/2013/03/1671952-inline-inline-mailbox-new-thumb-200x278-3577.jpg" width="200" height="278" class="mt-image-right" style="float: right; margin: 0 0 20px 20px;" /></a></div>When Inbox was first announced I got excited and jumped at the chance to try it out. So did 500,000 other people apparently, because that is how many people were lined up in front of me waiting to use the product when I first downloaded it and fired it up. </p><p>After several weeks of patiently waiting, and by "patiently waiting" I mean I opened up Mailbox at least 2 or 3 times a day to inspect my place in line, I finally got the green light and gained access. </p><p>All that waiting though served only to raise my expectations around "a whole new inbox." So when I finally first tried Inbox, I was disappointed. But not because it failed to meet my expectations, but because it didn\'t exceed them. </p><p>You see, email does\'t need a new or slicker way to categorize and filter incoming messages. That is a relatively solved problem, or at least everyone who uses email has ultimately adopted a systemology for processing email that works for them -- even if their personal system is imperfect and ultimately leaves them perpetually with 1453 unread messages. </p><p>What I want is a <em>smarter</em> email client. Not a prettier one. I want an email client that:</p><ul><li>Makes mailing list management easier.</li><li>Helps me to unsubscribe to unwanted email.</li><li>Consolidates and organizes social channel notifications. </li><li>Finds and recognizes events that should be on my calendar. </li><li>Processes, saves and makes searchable all of my receipts and order confirmations.</li></ul><p>As well as handling all of the other email I get on a daily basis that generally falls to the bottom of my priority list, but takes up my time or attention nonetheless. </p><p><div style="float: right; width: 200px; margin: 0 0 20px 20px;"><a rel="lightbox" href="http://www.majordojo.com/tem_agenda_ip5.png" title="Tempo.ai Screenshot"><img alt="Tempo.ai Screenshot" src="http://www.majordojo.com/assets_c/2013/03/tem_agenda_ip5-thumb-200x355-3579.png" width="200" height="355" class="mt-image-right" style="float: right; margin: 0 0 20px 20px;" /></a></div>What I want to some extent is the email equivalent of <a href="http://tempo.ai">tempo.ai</a>, a calendaring app that uses natural language processing to enhance my calendar in delightful and surprising ways... like somehow figuring out where my meeting is going to be when I never told it, or making available to me a complete profile of the person I am meeting with even though all I said in my event was, "Lunch with Jack." In these and other ways my calendar is useful again, beyond simply regurgitating back to me a list of upcoming events I entered into it. It is responsive. It is intelligent. </p><p>I keep waiting for a new email client to surprise me, but they don\'t. Email doesn\'t have a UI problem, nor does it have a methodology problem per-se. Email clients have failed in that they haven\'t done anything innovative with the most important part of email: the data. While the rest of the web has embraced things like <a href="http://microformats.org">microformats</a>, feeds, browser extensions like <a href="http://en.wikipedia.org/wiki/Greasemonkey">Greasemonkey</a>, and a plethora of other tools that do interesting things with data, all we seem to be able to do with email is hot link phone numbers and URLs. </p><p>I think we can do better than that. </p>',
            "status":"published",
            "language":"en_US",
            "author_id":1,
            "created_at":946684800000,
            "created_by":1,
            "updated_at":946684800000,
            "updated_by":1,
            "published_at":946684800000,
            "published_by":1,
            "comments":[
                {
                    id: 1,
                    author: 'Byrne Reese',
                    author_url: '',
                    author_email: 'byrne@majordojo.com',
                    content: 'Foo'
                },
                {
                    id: 2,
                    author: 'John Doe',
                    author_url: '',
                    author_email: '',
                    content: 'Foo'
                },
                {
                    id: 3,
                    author: 'Arin Hailey',
                    author_url: '',
                    author_email: 'arin@hairyalien.com',
                    content: 'Foo'
                },
                {
                    id: 4,
                    author: 'Joe Mullen',
                    author_url: '',
                    author_email: 'joe@mullen.net',
                    content: 'Foo'
                },
                {
                    id: 5,
                    author: 'Byrne Reese',
                    author_url: '',
                    author_email: 'byrne@majordojo.com',
                    content: 'Foo'
                }
            ],
            "tags":[
                {"name":"calendaring"},
                {"name":"email"},
                {"name":"mailboxapp"},
                {"name":"product"},
                {"name":"tempo.ai"}
            ]
        }
        ,"http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=3":{
            "id": 3,
            "title":"Werner Herzog's Note To His Cleaning Lady",
            "slug":"werner-herzogs-note-to-his-cleaning-lady",
            "content":'<p>Now we must turn to the horrors of nature. I am afraid this is inevitable. Nature is not something to be coddled and accepted and held to your bosom like a wounded snake. Tell me, what was there before you were born? What do you remember? That is nature. Nature is a void. An emptiness. A vacuum. And speaking of vacuum, I am not sure you\'re using the retractable nozzle correctly or applying the \'full weft\' setting when attending to the lush carpets of the den. I found some dander there.</p></blockquote><p><a href="http://www.sabotagetimes.com/tv-film/werner-herzogs-note-to-his-cleaning-lady/">Brilliant</a>.</p>',
            "status":"published",
            "language":"en_US",
            "author_id":1,
            "created_at":946684800000,
            "created_by":1,
            "updated_at":946684800000,
            "updated_by":1,
            "published_at":946684800000,
            "published_by":1,
            "comments":[],
            "tags":[
                {"name":"funny"},
                {"name":"werner herzog"}
            ]
        }
        ,"http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=4":{
            "id": 4,
            "title":"Test Post 4",
            "slug":"test-post-4",
            "content":'This',
            "status":"published",
            "language":"en_US",
            "author_id":1,
            "created_at":946684800000,
            "created_by":1,
            "updated_at":946684800000,
            "updated_by":1,
            "published_at":946684800000,
            "published_by":1,
            "comments":[],
            "tags":[]
        }
        ,"http://majordojo.com/cgi-bin/mt/plugins/json/api.cgi?blog_id=3&entry_id=5":{
            "id": 5,
            "title":"Test Post 5",
            "slug":"test-post-5",
            "content":'That',
            "status":"published",
            "language":"en_US",
            "author_id":1,
            "created_at":946684800000,
            "created_by":1,
            "updated_at":946684800000,
            "updated_by":1,
            "published_at":946684800000,
            "published_by":1,
            "comments":[],
            "tags":[]
        }
    };
    return entries[url];
    */
};

jobs.process('migrate site', function(job, done){
    // TODO - load_entry_list should probably paginate or something
    var options = parse_url_parts( job.data.api_url );
    load_entry_list( job.data.username, job.data.password, job.data.api_url,
                     function(listing) {
                         var posts       = listing.posts;
                         var list_meta   = listing.meta;
                         console.log('migrating '+list_meta.count+' posts: ' + job.data.url);
                         function next(i) {
                             // pretend we are doing some work
                             console.log('Processing entry #'+(i+1));
                             var entry = posts[i];
                             migrate_entry(entry, function(err){
                                 if (err) return done(err);
                                 // report progress, i/posts complete
                                 job.progress((i+1), list_meta.total);
                                 if (typeof posts[i+1] == 'undefined') {
                                     if (typeof list_meta.next == 'undefined') {
                                         console.log("This is the last entry to add to the queue.");
                                         done();
                                     } else {
                                         // append entry list under next to listingcreate a job to 
                                         // migrate the next page of entries
                                         console.log("About to fetch next: " + list_meta.next);
                                         done();
                                         /*
                                         var next_listing = load_entry_list(list_meta.next,
                                                                            job.data.username,
                                                                            job.data.password);
                                         posts = posts.concat( next_listing.posts );
                                         list_meta = next_listing.meta;
                                         next(i + 1);
                                         */
                                     }
                                 } else {
                                     // todo - to conserve memory, consider blowing away entries 
                                     // from posts[] once processed
                                     next(i + 1);
                                 }
                             });
                         }
                         next(0);
                     });
});

function migrate_comment( comment, done ) {
    console.log('    Migrated comment.');
    done();
}

function migrate_comments( new_post, entry, done ) {
    if (typeof entry.comments == 'undefined' || entry.comments.length == 0) { done(); return; }
    console.log('  Creating job to migrate '+entry.comments.length+' comment(s) to disqus...');
    var job = jobs.create('migrate comments', {
        title: 'Migrate comments from "'+entry.title+'"'
        , comments: entry.comments
    }).save();
    job.on('complete', function(){
        console.log("migrate comments job complete");
        done();
    }).on('failed', function(){
        console.log("migrate comments job failed");
    }).on('progress', function(progress){
        process.stdout.write('\r  migrate comments job #' + job.id + ' ' + progress + '% complete' + "\n");
    });

}

function extract_images( entry ) {
    console.log('  Extracting images from post...');
    var images = [];
    var $ = cheerio.load( entry.content );
    $('img').each( function( i, img ) {
        console.log("    Found " + $(this).attr('src'));
        images.push( $(this).attr('src') );
    });
    return images;
}
function move_image( url, done ) {
    console.log('    Moving image: ' + url);
    var new_url = 'some url on s3';
    done( new_url );
}
function move_images( images, done ) {
    // TODO - this should be a series of background tasks
    // TODO - this should look for more than just images: local objects (.flv), etc
    var map = [];
    if (typeof images == 'undefined' || images.length == 0) { done(map); return; }
    console.log('  Moving images to S3');
    function next(i) {
        var image = images[i];
        move_image(image, function(new_url,err){
            map.push({
                "old_url":image,
                "new_url":new_url
            });
            if (err) return done(map, err);
            // report progress, i/posts complete
            //job.progress((i+1), comment_count);
            if (typeof images[i+1] == 'undefined') {
                done(map);
            } else {
                next(i + 1);
            }
        });
    }
    next(0);
}
function rewrite_entry_content( entry, map, done ) {
    if (map.length == 0) { done(entry.content); return; } // no changes to entry content
    console.log('  Rewriting entry content to use new S3 urls');
    var $ = cheerio.load( entry.content );
    for (var i=0;i<map.length;i++) {
        var old_url = map[i].old_url;
        var new_url = map[i].new_url;
        $('img[src="'+old_url+'"]').attr('src',new_url);
    }
    //console.log("    Entry content is now: " + $.html());
    done( $.html() );
}
function create_ghost_entry( entry, done ) {
    console.log('  Creating post in ghost...');
    var post = {};
    // TODO - considering using different callback name since this is not a kue job cb
    done( post );
}

jobs.process('process entry', function(job, done){
    var options = parse_url_parts( job.data.api_url );
    load_entry( 'un', 'pwd', options, function( entry ) {
        var images = extract_images(entry);
        move_images(images, function(map) {
            rewrite_entry_content( entry, map, function( rewritten_entry_content ) {
                entry.content = rewritten_entry_content;
                create_ghost_entry( entry, function(ghost_post) {
                    console.log("entry: ", entry);
                    migrate_comments( ghost_post, entry, done );
                });
            });
        });
    });
});

jobs.process('migrate comments', function(job, done){
    var comments      = job.data.comments;
    var comment_count = comments.length;
    console.log('  Migrating '+comment_count+' comments.');
    function next(i) {
        // pretend we are doing some work
        console.log('    Processing comment #'+(i+1));
        var comment = comments[i];
        migrate_comment(comment, function(err){
            if (err) return done(err);
            // report progress, i/posts complete
            job.progress((i+1), comment_count);
            if (typeof comments[i+1] == 'undefined') {
                done();
            } else {
                next(i + 1);
            }
        });
    }
    next(0);
});

var Application = function () {
};

exports.Application = Application;



