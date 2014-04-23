"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var mongo = require('mongodb'),
    Deferred = require('Deferred'),
    toObjectID = require("./toObjectID.js"),
    callWithFirstInArray = require("./callWithFirstInArray.js"),
    api;

function Server(uri) {
    this.uri = uri;

    return this;
}

function Database(server, name) {
    this.server = server;
    this.name = name;

    return this;
}

function Collection(database, name) {
    this.database = database;
    this.name = name;

    return this;
}

Server.ConnectionPools = [];

Server.prototype.with = function() {
    var deferred = new Deferred(),
        cachedMongoClient = Server.ConnectionPools[this.uri];

    if (cachedMongoClient) {
        deferred.resolve(cachedMongoClient);
    } else {
        // TODO: since .connect() returns the database, use it directly instead of treating this as a server connection?
        mongo.MongoClient.connect(this.uri, {
            auto_reconnect: true
        }, function(error, mongoClient) {
            if (error) {
                deferred.reject(error);
            }

            Server.ConnectionPools[this.uri] = mongoClient;

            // TODO: mongoClient.close(); ever?
            deferred.resolve(mongoClient);
        }.bind(this));
    }

    return deferred.promise();
};

Server.prototype.getDatabase = function(name) {
    return new Database(this, name);
};

Database.prototype.with = function() {
    var deferred = new Deferred();

    this.server.with()
        .fail(deferred.reject)
        .done(function(mongoClient) {
            var database = mongoClient.db(this.name, null, {
                native_parser: true
            });

            deferred.resolve(database);
        }.bind(this));

    return deferred.promise();
};

Database.prototype.getCollection = function(name) {
    return new Collection(this, name);
};

Collection.prototype.with = function() {
    var deferred = new Deferred();

    this.database.with()
        .fail(deferred.reject)
        .done(function(database) {
            database.collection(this.name, function(error, collection) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(collection);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.find = function(query, fields, options) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.findOne(query, fields, options, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(result);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.findOne = function(query, fields, options) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.findOne(query, fields, options, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(result);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.get = function(_id) {
    var deferred = new Deferred();

    this.findOne(toObjectID(_id))
        .fail(deferred.reject)
        .done(deferred.resolve);

    return deferred.promise();
};

Collection.prototype.insert = function(object) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.insert(object, {
                safe: true
            }, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(result);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.remove = function(_id) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.remove({
                _id: toObjectID(_id)
            }, {
                safe: true
            }, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(result);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.save = function(object) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.save(object, {
                safe: true
            }, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                deferred.resolve(result);
            });
        }.bind(this));

    return deferred.promise();
};

Collection.prototype.getOrInsert = function(object) {
    var deferred = new Deferred();

    this.with()
        .fail(deferred.reject)
        .done(function(collection) {
            collection.findOne(object._id, function(error, result) {
                if (error) {
                    deferred.reject(error);
                }

                if (!result) {
                    this.insert(object)
                        .fail(deferred.reject)
                        .done(callWithFirstInArray(deferred.resolve));
                } else {
                    deferred.resolve(result);
                }
            });
        }.bind(this));

    return deferred.promise();
};

api = {
    Server: Server
};

module.exports = api;