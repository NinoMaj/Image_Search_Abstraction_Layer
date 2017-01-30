'use strict';

/*
 * Express Dependencies
 */
let express = require('express'),
    app = express(),
    port = 3000,
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    compression = require('compression'),
    path = require('path'),
    google = require('google');

/*
 * Use Handlebars for templating
 */
let exphbs = require('express-handlebars');
let hbs;

// mongodb://localhost:27017/URLshort
MongoClient.connect('mongodb://NinoMaj:bosswarmLab1@ds135519.mlab.com:35519/img_search', function (err, db) {

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");
    let imagesCollection = db.collection('imagesCollection');

    // For gzip compression
    app.use(compression());

    /*
     * Config for Production and Development
     */
    if (process.env.NODE_ENV === 'production') {
        // Set the default layout and locate layouts and partials
        app.engine('handlebars', exphbs({
            defaultLayout: 'main',
            layoutsDir: 'dist/views/layouts/',
            partialsDir: 'dist/views/partials/'
        }));

        // Locate the views
        app.set('views', __dirname + '/dist/views');

        // Locate the assets
        app.use(express.static(__dirname + '/dist/assets'));

    } else {
        app.engine('handlebars', exphbs({
            // Default Layout and locate layouts and partials
            defaultLayout: 'main',
            layoutsDir: 'views/layouts/',
            partialsDir: 'views/partials/'
        }));

        // Locate the views
        app.set('views', __dirname + '/views');

        // Locate the assets
        app.use(express.static(__dirname + '/assets'));
    }

    // Set Handlebars
    app.set('view engine', 'handlebars');


    /*
     * Routes
     */
    // Index Page
    app.get('/', function (request, response, next) {
        response.render('index');
    });

    app.get('/latest', function (request, response, next) {
        imagesCollection.find({

    }, { term: 1, date: 1, _id: 0 }).sort({date: -1}).limit(10).toArray(function (err, doc) {
            response.send(doc);
        });
    });

    // URL handler route
    app.get('/*', function (request, response, next) {
        let reqPath = request.path.slice(1),
            searchTerm = reqPath.split("%20").join(" "),
            offset = request.query.offset || 10;
        var results = [];

        function showResults() {
            // if (shortURL._id) {
            //     shortURL._id = undefined
            //};
            results = JSON.parse(JSON.stringify(results));
            // response.render('result', {
            //     results: results
            // });
            response.send(results);
            imagesCollection.insertOne({
                term: searchTerm,
                date: new Date()
            })
        };


        console.log('Requested path is: ', reqPath);
        console.log('Search term: ', searchTerm);
        console.log('Offset:', offset);
        google.resultsPerPage = offset;

        google(searchTerm, function (err, res) {
            if (err) console.error(err)
            for (var i = 0; i < res.links.length; ++i) {
                let link = res.links[i],
                    result = {
                        title: link.title,
                        link: link.href,
                        description: link.description
                    }
                results.push(result);
            }
            showResults();
            // I'll show only first page of results, to enable set nextCounter = 0, outside of google fn
            // if (nextCounter < 4) {
            //     nextCounter += 1
            //     if (res.next) res.next()
            // }
        });
    });

    /*
     * Start it up
     */
    app.listen(process.env.PORT || port);
    console.log('Express started on port ' + port);

}); // closing MongoClient
