window.artxgj = window.artxgj || {};
artxgj.db = artxgj.db || {};
artxgj.db.constants = {
    createTable : "CREATE TABLE IF NOT EXISTS ",
    createIndex : "CREATE UNIQUE INDEX IF NOT EXISTS ",
    createTrigger : "CREATE TRIGGER IF NOT EXISTS ",
    MB : 1024 * 1024,
    KB : 1024
};


artxgj.db.instance = function (specs, dbInitCallback) {

    /*
        specs object members:
            name - database short name
            version - version number
            displayName - database display name
            size - database size in


        throws exception object containing a 'message' member
     */

    var db = null,
        dbNs = artxgj.db,
        error;

    if (!window.openDatabase) {
        error = 'Browser does not support SQL Storage.';
    }
    else {
        try {
            var size = specs.size || 5 * dbNs.constants.MB;
            console.log("db size is " + size);

            db = openDatabase(specs.name, specs.version, specs.displayName, size );

        } catch (e) {
            error = e.message || 'Unknown Exception Type';
        }
    }

    if (error) {
        throw {message : error};
    }

    if (dbInitCallback && typeof dbInitCallback === 'function') {
        dbInitCallback(db);
    }

    return db;
};

