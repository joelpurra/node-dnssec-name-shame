"use strict";

/*global require: true, module: true */
/*eslint camelcase: "off", no-underscore-dangle: "off" */

const mongo = require("mongodb"),
    Promise = require("bluebird"),
    toObjectID = require("./to-objectid.js");

let api;

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
    const self = this,
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
    const self = this,
        dbOptions = {};

    return self.server.with()
        .then(function(mongoClient) {
            const database = mongoClient.db(self.name, dbOptions);

            return database;
        });
});

Database.prototype.getCollection = function(name) {
    return new Collection(this, name);
};

Collection.prototype.with = Promise.method(function() {
    const self = this;

    return self.database.with()
        .then(function(database) {
            return database.collection(self.name);
        });
});

Collection.prototype.find = Promise.method(function(query, fields, options) {
    const self = this;

    return self.with()
        .then(function(collection) {
            return collection.findOne(query, fields, options);
        });
});

Collection.prototype.findOne = Promise.method(function(query, fields, options) {
    const self = this;

    return self.with()
        .then(function(collection) {
            return collection.findOne(query, fields, options);
        });
});

Collection.prototype.get = Promise.method(function(_id) {
    const self = this,
        objectId = toObjectID(_id);

    return self.findOne(objectId);
});

Collection.prototype.insertOne = Promise.method(function(object) {
    const self = this,
        insertOptions = {
            safe: true,
        };

    return self.with()
        .then(function(collection) {
            return collection.insertOne(object, insertOptions);
        })
        // Only return first item in the array.
        .get(0);
});

Collection.prototype.removeOne = Promise.method(function(_id) {
    const self = this,
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
    const self = this,
        saveOptions = {
            safe: true,
        };

    return self.with()
        .then(function(collection) {
            return collection.save(object, saveOptions);
        });
});

Collection.prototype.getOrInsertOne = Promise.method(function(object) {
    const self = this;

    let getter;

    if (object._id) {
        getter = self.get(object._id);
    } else {
        // Explicit non-result starting the chain.
        getter = Promise.resolve(undefined);
    }

    return getter.then(function(result) {
        if (!result) {
            return self.insertOne(object);
        }

        return result;
    });
});

// eslint-disable-next-line prefer-const
api = {
    Server: Server,
};

module.exports = api;
