"use strict";

/*global require: true, module: true */
/*eslint camelcase: "off", no-underscore-dangle: "off" */

var mongo = require("mongodb"),
    Promise = require("bluebird"),
    toObjectID = require("./to-objectid.js"),
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

Server.prototype.with = Promise.method(function() {
    var self = this,
        cachedMongoClient = Server.ConnectionPools[self.uri],
        connectOptions = {
            promiseLibrary: Promise,
        };

    if (cachedMongoClient) {
        return cachedMongoClient;
    }

    // TODO: since .connect() returns the database, use it directly instead of treating this as a server connection?
    return mongo.MongoClient.connect(self.uri, connectOptions)
        .tap(function(mongoClient) {
            // TODO: keep the promise instead of the mongoClient?
            Server.ConnectionPools[self.uri] = mongoClient;
            // TODO: mongoClient.close(); ever?
        });
});

Server.prototype.getDatabase = function(name) {
    return new Database(this, name);
};

Database.prototype.with = Promise.method(function() {
    var self = this,
        dbOptions = {};

    return self.server.with()
        .then(function(mongoClient) {
            var database = mongoClient.db(self.name, dbOptions);

            return database;
        });
});

Database.prototype.getCollection = function(name) {
    return new Collection(this, name);
};

Collection.prototype.with = Promise.method(function() {
    var self = this;

    return self.database.with()
        .then(function(database) {
            return database.collection(self.name);
        });
});

Collection.prototype.find = Promise.method(function(query, fields, options) {
    var self = this;

    return self.with()
        .then(function(collection) {
            return collection.findOne(query, fields, options);
        });
});

Collection.prototype.findOne = Promise.method(function(query, fields, options) {
    var self = this;

    return self.with()
        .then(function(collection) {
            return collection.findOne(query, fields, options);
        });
});

Collection.prototype.get = Promise.method(function(_id) {
    var self = this,
        objectId = toObjectID(_id);

    return self.findOne(objectId);
});

Collection.prototype.insertOne = Promise.method(function(object) {
    var self = this,
        insertOptions = {
            safe: true,
        };

    return self.with()
        .then(function(collection) {
            return collection.insertOne(object, insertOptions);
        });
});

Collection.prototype.removeOne = Promise.method(function(_id) {
    var self = this,
        match = {
            _id: toObjectID(_id),
        },
        removeOptions = {
            safe: true,
        };

    return self.with()
        .then(function(collection) {
            return collection.removeOne(match, removeOptions);
        });
});

Collection.prototype.save = Promise.method(function(object) {
    var self = this,
        saveOptions = {
            safe: true,
        };

    return self.with()
        .then(function(collection) {
            return collection.save(object, saveOptions);
        });
});

Collection.prototype.getOrInsertOne = Promise.method(function(object) {
    var self = this;

    return self.with()
        .then(function(collection) {
            return self.get(object._id)
                .then(function(result) {
                    if (!result) {
                        return self.insertOne(object)
                            .get(0);
                    }

                    return result;
                });
        });
});

api = {
    Server: Server,
};

module.exports = api;
