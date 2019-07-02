window.artxgj = window.artxgj || {};
artxgj.h5run = artxgj.h5run || {};

artxgj.h5run.db = {

    createSchema : function (db) {

        var constants = artxgj.db.constants;

        var tblRun = constants.createTable +
        "run(\
        id integer,\
        dts integer,\
        timezone integer,\
        distance real,\
        duration integer,\
        weightPreRun real,\
        weightPostRun real,\
        notes text\
        );";

        var tblBreadcrumb = constants.createTable +
        "breadcrumb(\
        id integer not null primary key autoincrement,\
        runid integer not null CONSTRAINT fk_run_id references run(id) on delete cascade,\
        latitude real,\
        longitude real,\
        accuracy real,\
        altitude real,\
        altitudeaccuracy real,\
        heading real,\
        speed real,\
        distance real,\
        duration integer,\
        gpsTimestamp integer,\
        programTimestamp integer\
        );";

        var tblErrordebug = constants.createTable +
        "errordebug(\
        id integer not null primary key autoincrement,\
        runid integer not null CONSTRAINT fk_run_id references run(id) on delete cascade,\
        type integer,\
        code integer,\
        message text,\
        dts  integer\
        );";


        var trigInsRun = constants.createTrigger +
        "insert_run AFTER INSERT ON run\
        FOR EACH ROW\
        BEGIN\
            SELECT CASE\
                WHEN (new.id IS NULL)\
                THEN RAISE(ABORT, 'insert on table \"run\" requires an id')\
            END;\
        END;";

        var trigdDelRun = constants.createTrigger +
        "delete_run BEFORE DELETE ON run\
        FOR EACH ROW\
        BEGIN\
            DELETE FROM breadcrumb where breadcrumb.runid = old.id;\
            DELETE FROM errordebug where errordebug.runid = old.id;\
        END;";


        var trigInsBreadcrumb = constants.createTrigger +
        "insert_breadcrumb BEFORE INSERT ON breadcrumb\
        FOR EACH ROW BEGIN\
            SELECT CASE\
               WHEN ((new.runid IS NOT NULL)\
                     AND ((SELECT id FROM run WHERE id = NEW.runid) IS NULL))\
               THEN RAISE(ABORT, 'insert on table \"breadcrumb\" violates foreign key constraint \"fk_run_id\"')\
            END;\
        END;";

        var trigUpdBreadcrumb = constants.createTrigger +
        "update_breadcrumb BEFORE UPDATE ON breadcrumb\
        FOR EACH ROW BEGIN\
            SELECT CASE\
               WHEN ((new.runid IS NOT NULL)\
                     AND ((SELECT id FROM run WHERE id = NEW.runid) IS NULL))\
               THEN RAISE(ABORT, 'update on table \"breadcrumb\" violates foreign key constraint \"fk_run_id\"')\
            END;\
        END;";

        var trigInsErrordebug = constants.createTrigger +
        "insert_errordebug BEFORE INSERT ON errordebug\
        FOR EACH ROW BEGIN\
            SELECT CASE\
               WHEN ((new.runid IS NOT NULL)\
                     AND ((SELECT id FROM run WHERE id = NEW.runid) IS NULL))\
               THEN RAISE(ABORT, 'insert on table \"errordebug\" violates foreign key constraint \"fk_run_id\"')\
            END;\
        END;";

        var trigUpdErrordebug = constants.createTrigger +
        "update_errordebug BEFORE UPDATE ON errordebug\
            FOR EACH ROW BEGIN\
                SELECT CASE\
                   WHEN ((new.runid IS NOT NULL)\
                         AND ((SELECT id FROM run WHERE id = NEW.runid) IS NULL))\
                   THEN RAISE(ABORT, 'update on table \"errordebug\" violates foreign key constraint \"fk_run_id\"')\
                END;\
            END;";

        var idxRun = constants.createIndex + "idx_run_id ON run (id);",
            idxBreadcrumb = constants.createIndex + "idx_breadcrumb_id_runid ON breadcrumb (id, runid);",
            idxErrordebug = constants.createIndex + "idx_errordebug_id_runid ON errordebug (id, runid);";

        function SQLStatementCallback(transaction, resultSet) {
        }

        function SQLStatementErrorCallback(transaction, error) {
            console.log("SQLStatementErrorCallback");
            console.dir(error);
            return false;
        }

        function dbInitError(error) {
            console.log("dbInitError");
            console.dir(error);

        }

        function dbInitTransaction (transaction) {
            transaction.executeSql(tblRun, [], SQLStatementCallback, SQLStatementErrorCallback);

            transaction.executeSql(tblBreadcrumb, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(tblErrordebug, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigdDelRun, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigInsRun, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigInsBreadcrumb, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigUpdBreadcrumb, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigInsErrordebug, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(trigUpdErrordebug, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(idxRun, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(idxBreadcrumb, [], SQLStatementCallback, SQLStatementErrorCallback);
            transaction.executeSql(idxErrordebug, [], SQLStatementCallback, SQLStatementErrorCallback);
        }


        db.transaction(dbInitTransaction, dbInitError);
    },

    instance : function () {
        return artxgj.db.instance({ name : 'h5run.db',
                             version : '1.0',
                             displayName : 'h5 Runs database'},
                             this.createSchema);

    }
};


artxgj.h5run.db.transactionErrorCallback = function (error) {
    console.log("SQL Transaction Error: ");
    console.dir(error);
};

artxgj.h5run.db.transactionSuccessCallback = function () {
};




artxgj.h5run.RunLocationManager = function (db, interval) {

	var firstPosition = true;
	var runLocation;
	var persistInterval = interval || 0;
	var prevTimestamp;

	function _update(position) {
		var gpsTimestamp = position.timestamp.valueOf();  // Google did not follow the standard and implemented timestamp as a Date object

 		if (firstPosition) {
			firstPosition = false;

			// for now, use timestamp as id (hack); do research on how to use callback with  autoincrement and inserting autoincremented id into a table with 1-many relationship) [async]

			runLocation = artxgj.h5run.RunLocation(db, gpsTimestamp);
			prevTimestamp = gpsTimestamp - persistInterval;
		}

 		if ( position.last ||  ((gpsTimestamp - prevTimestamp) >= persistInterval) ) {
 	 		runLocation.persist(position, position.movestats.distance, position.movestats.duration);
 	 		prevTimestamp = gpsTimestamp;
 		}
	}


	function _stop() {
		firstPosition = true;  // reset
	}


	function _remove(runId) {
	}


	return {
	    update : function (position) {
					_update(position);
				 },

		stop : function () {
					_stop();
			   },
		remove : function (runId) {
				 },
		logError : function () {
				   }
	};
};


artxgj.h5run.db.tbRun = function (db) {

    var nsDB = artxgj.h5run.db,
        resultsSuccessCallback,
        crudParmsSaved,
        sqlInsertRun = "INSERT into run(id, dts, timezone, distance, duration) values(?, ?,?,?,?)",
        sqlUpdateRun = "UPDATE run set distance=?, duration=? WHERE id=?";


    function saveCRUDParms(crudParms) {
        crudParmsSaved = crudParms;
        console.log("save crud parms");
        console.dir(crudParmsSaved);
    }


    function foundList(tx, rs) {
        var rsSave = [];
        var i, row,
            length = rs.rows.length;

        if (!resultsSuccessCallback || typeof resultsSuccessCallback !== 'function') {
            return;
        }

        console.log("tbRun rs size = " + length);
        for (i = 0; i < length; i++) {
            row = rs.rows.item(i);
            resultsSuccessCallback({id:row.id, distance: row.distance, duration:row.duration});
        }
    }


    function errorList(error) {
        console.log("readList DB Error: " + error.msg);
    }


    function addBreadCrumb(data) {
        var tbBreadCrumb = nsDB.tbBreadCrumb(db);
        console.log("pass crud parms to tbBreadCrumb");
         console.dir(data);

        tbBreadCrumb.create(crudParmsSaved);
    }

    function createdRow(tx, rs) {
        addBreadCrumb(crudParmsSaved);
    }


    function createFailed(tx, error) {
        console.log("tbRun createFailed");
        console.dir(error);
    }


    function updatedRow(tx, rs) {
        addBreadCrumb(crudParmsSaved);
    }


    function updateFailed(tx, error) {
        console.log("tbRun updateFailed");
        console.dir(error);

    }

    return {
        readList : function (resultsCallback) {
            
            resultsSuccessCallback = resultsCallback;
            db.transaction(
                    function(tx){
                        tx.executeSql("select id, distance, duration from run order by id desc", [],
                                       foundList, errorList);
                    },
                    nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);
        },

        remove : function (id) {

            db.transaction(
                    function(tx) {
                        tx.executeSql("delete from run where id = ?", [id],
                                      function (tx, rs) { }, // succeeded, do nothing}
                                      function (err) {
                                        console.log("delete sql error " + runId + " " + err.message);
                                       });
                    },
                    nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);
        },

        create : function (data) {
                /*
                 *  data object:
                 *     runId
                 *     position
                 *     distance
                 *     duration
                 *     timezone
                 */

                saveCRUDParms(data);
                db.transaction(
                        function(tx) {
                            tx.executeSql(sqlInsertRun,
                                          [data.runId, data.position.timestamp, data.timezone, data.distance, data.duration],
                                          createdRow, createFailed);
                        },
                        nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);
                
            },

        update : function (data) {
            /*
             *  data object:
             *     runId
             *     position
             *     distance,
             *     duration
             */

            saveCRUDParms(data);
            db.transaction(function(tx) {
                tx.executeSql(sqlUpdateRun, [data.distance, data.duration, data.runId],updatedRow, updateFailed);
            }, nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);

        }
    };
};



artxgj.h5run.db.tbBreadCrumb = function (db) {
    var nsDB = artxgj.h5run.db,
        resultsSuccessCallback,
        resultsErrorCallback,
        sqlInsertBreadcrumb = "INSERT into breadcrumb (runid, distance, duration, latitude, longitude, accuracy,altitude, altitudeaccuracy, heading, speed, gpsTimestamp) values (?,?,?,?,?,?,?,?,?,?,?)";


    function deserialize(row) {
        movestats = {};
        coords = {};
        coords.latitude = row.latitude;
        coords.longitude = row.longitude;
        coords.accuracy = row.accuracy;
        coords.altitude = row.altitude;
        coords.altitudeAccuracy = row.altitudeaccuracy;
        coords.speed = row.speed;
        coords.heading = row.heading;
        movestats.distance = row.distance;
        movestats.duration = row.duration;

        return artxgj.h5run.Position({coords: coords, timestamp : row.gpsTimestamp, movestats : movestats});
    }


    function foundList(tx, rs) {
        var i, position, length = rs.rows.length;
        var loopSpeed;

        if (!resultsSuccessCallback || typeof resultsSuccessCallback !== 'function') {
            return;
        }

        console.log("breadcrumb rs size is " + length);
        loopSpeed = new Date();
        
        for (i = 0; i < length -1; i++) {
            resultsSuccessCallback(deserialize(rs.rows.item(i)));
        }
        console.log("loopSpeed = " + (new Date() - loopSpeed));
        position = deserialize(rs.rows.item(length-1));
        position.last = true;
        resultsSuccessCallback(position);
    }



    function foundListUnrolled(tx, rs) {
        var i, position, unrollSize = rs.rows.length -1;
        var loopSpeed;

        if (!resultsSuccessCallback || typeof resultsSuccessCallback !== 'function') {
            return;
        }

        console.log("Ola! foundListUnrolled breadcrumb rs size is " + rs.rows.length);

        var iterations = (unrollSize) % 8;  // last one will be set with a .last member
        var i=0;
        loopSpeed = new Date();

        while (iterations) {
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            iterations--;
        }

        iterations = Math.floor(unrollSize/8);
        while (iterations) {
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            resultsSuccessCallback(deserialize(rs.rows.item(i++)));
            iterations--;
        }

        console.log("loopSpeed = " + (new Date() - loopSpeed));
        position = deserialize(rs.rows.item(i));
        position.last = true;
        resultsSuccessCallback(position);
    }


    function errorList(tx, error) {
        console.log("readList DB Error: " + error.msg);
        errorCallback(artxgj.h5run.PositionError());
        return false;  // NOTE: re-read documentation if this is needed at all; for now false got rid of the message found in the console
    }


    function createdRow(tx, rs) {
        console.log("breadcrumb row created");
    }


    function createFailed(tx, error) {
        console.log("failed to create breadcrumb");
        console.dir(error);
    }

    return {

        create : function (data) {
            /*
             *  data object:
             *     runId
             *     position
             *     distance,
             *     duration
             */

            console.log("tblBreadCrumb.create's data parm");
            console.dir(data);
            var coords = data.position.coords;

            db.transaction(function(tx) {
                tx.executeSql(sqlInsertBreadcrumb,
                   [data.runId, data.distance, data.duration, coords.latitude, coords.longitude, coords.accuracy, coords.altitude === null ? 0 : coords.altitude, coords.altitudeAccuracy === null ? 0 : coords.altitudeAccuracy, coords.heading === null? 0 : coords.heading, coords.speed === null ? 0 : coords.speed, position.timestamp.valueOf()],
                   createdRow, createFailed);
                }, nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);

        },

        readList : function (runId, resultsCallback, errorCallback) {

            resultsSuccessCallback = resultsCallback;
            resultsErrorCallback = errorCallback;

            db.transaction(
                    function(tx){
                        tx.executeSql("select id, latitude, longitude, accuracy, altitude, altitudeaccuracy, heading, speed, distance, duration, gpsTimestamp from breadcrumb where runid = ? order by id asc",
                              [runId], foundListUnrolled, errorList);
                    },
                    nsDB.transactionErrorCallback, nsDB.transactionSuccessCallback);

        },

        update : function () {
            // TBD
        }

    };
};



artxgj.h5run.RunLocation = function (db, runId) {
	// id must be unique

	var errorInsertRun = false;
	var sqlInsertRun = "INSERT into run(id, dts, timezone, distance, duration) values(?, ?,?,?,?)";
	var sqlUpdateRun = "UPDATE run set distance=?, duration=? WHERE id=?";
	var sqlInsertBreadcrumb = "INSERT into breadcrumb (runid, distance, duration, latitude, longitude, accuracy,altitude, altitudeaccuracy, heading, speed, gpsTimestamp) values (?,?,?,?,?,?,?,?,?,?,?)";
	var _persist = insertRun;

	function successfulTransaction() {
		console.log("successfulTransaction");
	}

	function failedTransaction(error) {
		console.log("failedTransaction: error code = " + error.code + "; " + error.message);
	}


	function insertBreadcrumb(tx, position, distance, duration) {

		function successfulInsertBreadcrumb(tx ,rs) {
			console.log("successfulInsertBreadcrumb ... errorInsertRun = " + errorInsertRun);
		}

		function failedInsertBreadcrumb(tx, err) {
			console.log("failedInsertBreadcrumb: error code= " + err.code + "; " + err.message);
		}

		var coords = position.coords;

		tx.executeSql(sqlInsertBreadcrumb,
					  [runId, distance, duration, coords.latitude, coords.longitude, coords.accuracy, coords.altitude === null ? 0 : coords.altitude, coords.altitudeAccuracy === null ? 0 : coords.altitudeAccuracy, coords.heading === null? 0 : coords.heading, coords.speed === null ? 0 : coords.speed, position.timestamp.valueOf()],
					  successfulInsertBreadcrumb, failedInsertBreadcrumb);
	}

	function insertRun(position, distance, duration) {

		function failedInsertRun(tx, err) {
			console.log("failedInsertRun: error code= " + err.code + "; " + err.message);
			errorInsertRun = true;
		}


		function successfulInsertRun(tx, rs) {
			console.log("successfulnsertRun");
			insertBreadcrumb(tx,position, distance, duration);
		}

		db.transaction(function(tx) {
			tx.executeSql(sqlInsertRun, [runId, position.timestamp,-7,distance,duration], successfulInsertRun, failedInsertRun);
		}, failedTransaction, successfulTransaction);

		_persist = updateRun;
	}

	function updateRun(position, distance, duration) {

		function failedUpdateRun(tx, err) {
			console.log("failedUpdateRun: error code= " + err.code + "; " + err.message);
		}

		function successfulUpdateRun(tx, rs) {

			function rollbackSuccess(tx, rs) {
				console.log("rollback successful");
			}

			function rollbackFailed(tx, err) {
				console.log("rollback failed ... " + err.code + "; " + err.message);
			}


			console.log("successfulUpdateRun... errorInsertRun " + errorInsertRun);

			if (!errorInsertRun) {
				insertBreadcrumb(tx,position, distance, duration);
			}
			else {
				console.log("rolling back");
				tx.executeSql("rollback", [], rollbackSuccess, rollbackFailed);
			}
		}

		db.transaction(function(tx) {
			tx.executeSql(sqlUpdateRun, [distance, duration, runId],successfulUpdateRun, failedUpdateRun);
		},failedTransaction, successfulTransaction);
	}

	return {
		persist : function (position, distance, duration) {
				  	_persist(position, distance, duration);
				  }
	};
};
